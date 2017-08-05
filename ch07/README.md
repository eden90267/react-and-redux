# chap07. Redux和Server通信

無論React還是Redux，工作方式都是靠資料驅動。現實中，應用的資料往往儲存在資料庫中，透過一個API Server暴露出來，網頁要獲得資料，就需要與Server進行通信。

這一章會介紹：

- React組件訪問伺服器的方式
- Redux架構下訪問伺服器的方式

React組件訪問Server方式適用於簡單的網頁應用；對於複雜的網頁應用，自然會採用Redux來管理資料，所以在Redux環境中訪問Server是我們介紹的重點。

## React組件訪問Server

在一個極其簡單的網頁應用中，有可能只需要單獨使用React庫，而不使用Redux之類的資料管理框架，這時候React組件自身也可以擔當起和Server通信的責任。

訪問Server本身可以使用任何一種支持網絡訪問的JavaScript庫，最傳統當然是jQuery的`$.ajax`函數，但我們都用上React了，那也就沒有必要使用jQuery，沒必要為了`$.ajax`函數引入一個jQuery庫到網頁裡面來。

一個趨勢是在React應用中使用瀏覽器原生支持的fetch函數來訪問網絡資源，fetch函數返回的結果是一個Promise對象，Promise模式能夠讓需要異步處理的代碼簡潔清晰，這也是fetch函數讓大家廣為接受的原因。

對於不支持fetch的瀏覽器版本，也可以透過fetch的polyfill來增加對fetch的支持。本書中，接下來的例子都用fetch來訪問Server資料資源。

>**Top**：  
>polyfill指的是“用於實現瀏覽器不支持原生功能的代碼”，譬如fetch函數，對於不支持的瀏覽器，網頁中引入對應fetch的polyfill後，這個polyfill就給全局的window對象上增加一個fetch函數，讓這個網頁中的JavaScript可以直接使用fetch函數了。
>[https://github.com/github/fetch](https://github.com/github/fetch)可以找到fetch polyfill的一個實現。

我們用一個具體實例，來說明如何讓React訪問Server。

我們做一個能夠展示某個城市天氣的React組件。利用互聯網現成API支持我們的應用：[http://www.weather.com.cn/](http://www.weather.com.cn/)。

```bash
$ create-react-app weather_react
$ cd weather_react
```

### 代理功能訪問API

訪問API規格：

| 規格    | 描述                                                |
|:--------|:---------------------------------------------------|
| 主機位址 | http://www.weather.com.cn/                         |
| 訪問方法 | GET                                                |
| 路徑    | data/cityinfo/{城市編號}.html                       |
| 返回結果 | JSON格式，包含城市名稱city、最低氣溫temp1、最高氣溫temp2 |

訪問北京的天氣情況：(http://www.weather.com.cn/data/cityinfo/101010100.html)[http://www.weather.com.cn/data/cityinfo/101010100.html]，能得到類似下面JSON格式結果：

```json
{
  weatherinfo: {
    city: "北京",
    cityid: "101010100",
    temp1: "-2℃",
    temp2: "16℃",
    weather: "晴",
    img1: "n0.gif",
    img2: "d0.gif",
    ptime: "18:00"
  }
}
```

但我們網頁應用不能夠直接訪問中國天氣網這個API，因為從本地網頁訪問weather.com.cn域名下的網絡資源屬於跨域訪問，而中國天氣網API不支持跨域訪問，所以我們的應用如下使用fetch訪問，肯定無法獲得我們預期的JSON結果：

```js
fetch(http://www.weather.com.cn/data/cityinfo/101010100.html)
```

解決跨域訪問API的一個方式就是透過代理(Proxy)，讓我們的網頁應用訪問所屬域名下的一個Server API接口，這個Server接口做的工作就是把這個請求轉發給另一個域名下的API，拿到結果後再轉交給發起請求的瀏覽器網頁應用，只是一個“代理”工作。

對於跨域訪問API的限制是針對瀏覽器的行為，Server對任何域名下的API的訪問不受限制，所以這樣的代理工作可以成功實現對跨域資源的訪問。

在本地開發的時候，網頁應用的域名是localhost，對應的Server域名也是localhost，所以要在localhost服務器上建立一個代理。好在create-react-app創造的應用已經具備了代理功能，所以不用花費時間來開發一個代理服務。

在weather_react應用的根目錄package.json添加如下這行：

```json
"proxy": "http://www.weather.com.cn/"
```

這一行配置告訴weather_react應用，當接收到不是要求本地資源的HTTP請求時，這個HTTP請求的協議和域名部分替換為(http://www.weather.com.cn/)[http://www.weather.com.cn/]轉手發出去，並將收到的結果返還給瀏覽器，這樣就實現了代理功能。

例如，假如Server收到一個網頁發來的(http://localhost/data/cityinfo/101010100.html)[http://localhost/data/cityinfo/101010100.html]的請求，就會發送一個請求到[http://www.weather.com.cn/data/cityinfo/101010100.html](http://www.weather.com.cn/data/cityinfo/101010100.html)並把這個請求結果返回給網頁。

這樣，我們就準備好了一個API。

>**Top**：  
>create-react-app生成應用的proxy功能只是方便開發，在實際的生產環境中，使用這個proxy功能就不合適了，應該要開發出自己的代理伺服器來滿足生產環境的需要。

### React組件訪問Server的生命週期

這個Weather組件將要顯示指定程式的天氣情況，這個組件封裝了兩個功能：

- 透過Server API獲得天氣情況資料
- 展示天氣情況資料

現在面臨的首要問題是如何關聯異步的網絡請求和同步的React組件渲染。

React組件的裝載過程和更新過程中的生命週期函數是同步執行的，沒有任何一個機會等待一個異步操作。

所以，可行的方法只能這樣，分兩步驟完成：

**步驟1.**，在裝載過程中，因為Weather組件並沒有獲得Server結果，就不顯示結果或顯示一個“正在裝載”之類的提示訊息，但Weather這時候要發出對Server的請求。

**步驟2.**，當對Server的請求終於獲得結果的時候，要引發Weather組件的一次更新過程，讓Weather重新繪製自己的內容，這時候就可以根據API返回結果繪製天氣訊息了：

上面過程可看出，為了顯示天氣信息，必須要經歷裝載過程和更新過程，至少要渲染Weather組件兩次。

通常我們在組件的componentDidMount函數中做請求Server的事情，因為當生命週期函數componentDidMount被調用的時候，表明裝載過程已經完成，組件需要渲染的內容已經在DOM樹上出現，對Server的請求可能依賴于已經渲染的內容，在componentDidMount函數中發送對Server請求是一個合適的時機。

另外，componentDidMount函數只在瀏覽器中執行，ch12介紹同構，我們會介紹React在Server端渲染的過程，當React組件在Server端渲染時，肯定不希望它發出無意義的請求，所以componentDidMount是最佳的獲取初始化組件內容請求的時機。

*weather.js*構造函數：

```js
constructor() {
  super(...arguments);
  this.state = {weather: null};
}
```

因為Weather組件要自我驅動更新過程，所以Weather必定是一個有狀態的組件，狀態中包含天氣情況信息。狀態上的weather欄位，是一個和Server API返回的JSON數據中weatherinfo欄位一樣。

render函數：

```js
render() {
  if (!this.state.weather) {
    return <div>暫無資料</div>;
  }

  const {city, weather, temp1, temp2} = this.state.weather;
  return (
    <div>
      {city} {weather} 最低氣溫 {temp1} 最高氣溫 {temp2}
    </div>
  );
}
```

透過API獲得資料的工作交給componentDidMount：

```js
componentDidMount() {
  const apiUrl = `/data/cityinfo/${cityCode}.html`;
  fetch(apiUrl).then((res) => {
    if (res.status !== 200) {
      throw new Error(`Fail to get response with status ${res.status}`);
    }
    res.json().then((resJson) => {
      this.setState({weather: resJson.weatcherinfo});
    }).catch((err) => {
      this.setState({weather: null});
    })
  }).catch((err) => {
    this.setState({weather: null});
  })
}
```

fetch的參數apiUrl中只有URL的路徑部分，沒有協議和域名部分，代碼如下：

```js
const apiUrl = `/data/cityinfo/${cityCode}.html`;
```

這樣是為了讓fetch根據當前網頁的域名自動配上協議和域名，這樣好處就是無需關係當前代碼被部署在什麼域名下。

componentDidMount這段程式碼看起來相當繁雜。不過沒有辦法，要考慮到每一個環節都有可能出問題，所以都需要判斷是否成功。

然而fetch有一個特性一直被為人詬病，那就是fetch認為只要Server返回一個合法的HTTP響應就算成功，就會調用then提供的回調函數，即使這個HTTP響應的狀態碼是表示出錯的400或500。所以我們在then中，要做的第一件事就是檢查傳入參數response的state欄位，只有status是代表成功的200的時候才繼續，否則以錯誤處理。

當response.status為200時，也不能直接讀取response中的內容，因為fetch在接收到HTTP響應的的報頭部分就會調用then，不會等到整個HTTP響應完成。所以這個時候也不保證能讀到整個HTTP報文的JSON格式資料。所以，response.body函數執行並不是返回JSON內容，而是返回一個新的Promise，又要接著用then和catch來處理成功或失敗的情況。如果返回HTTP報文內容是一個完整的JSON格式資料就會成功，如果返回結果不是一個JSON格式，比如是一堆HTML代碼，那就會失敗。

歷經各種檢查最後獲得JSON格式的結果，再透過Weather組件的setState函數把weatherinfo欄位賦值到weather狀態上去，失敗weather就設為null。

處理輸入輸出看起來的確很麻煩，但是必須要遵照套路把所有可能出錯的情況都考慮到，對任何輸入輸出操作只要記住一點：**不要相信任何返回結果**。

至此，Weather功能完成了。

### React組件訪問Server的優缺點

上面例子，我們可感受到用React組件自己負責訪問Server的操作非常直接簡單，容易理解。對於像Weather這樣的簡單組件，代碼也非常清晰。

但是，把狀態存放在組件中其實並不是一個很好的選擇，尤其是當組件變得廣大複雜了之後。

Redux是用來幫助管理應用狀態的，應該盡量把狀態存放在Redux Store的狀態中，而不是在React組件中。同樣，訪問Server的操作應該經由Redux來完成。

接下來，我們來看一看用Redux來訪問Server如何做到。

## Redux訪問Server

為展示更豐富的功能，我們擴展前面的展示天氣信息應用的功能，讓用戶可以在若干個城市之中選擇，選中某個城市，就展示某個城市的天氣情況，這次我們用Redux來管理訪問Server的操作。

```bash
$ create-react-app weather_redux
```

這個應用創建Store的部分將使用一個叫做redux-thunk的Redux中間件。

### redux-thunk中間件

使用Redux訪問Server，同樣要解決的是異步問題。

Redux的單向資料流是同步操作，驅動Redux流程的是action對象，每一個action對象被派發到Store上之後，同步地分配給所有的reducer函數，每個reducer都是純函數，純函數不產生任何副作用，自然是完成資料操作之後立刻同步返回，reducer返回的結果又被同步地拿去更新Store上的狀態資料，更新狀態資料的操作會立刻被同步給監聽Store狀態改變的函數，從而引發作為視圖的React組件更新過程。

這個過程從頭到尾，Redux馬不停蹄地一路同步執行，根本沒有執行異步操作的機會，那麼應該在哪裡插入訪問Server的異步操作？

Redux創立之初就意識到這種問題，所以提供了thunk這種解決方法，但是thunk並沒有作為Redux的一部分一起發佈，而是存在一個獨立的redux-thunk發布包中，我們安裝對應的npm包。

```bash
npm i --save redux-thunk
```

實際上，redux-thunk的實現極其簡單，只有幾行代碼，將它作為一個獨立的npm發布而不是放在Redux框架中，更多的只是為了保持Redux框架的中立性，因為redux-thunk只是Redux中異步操作的解決方法之一，還有很多種方法。

thunk這個命名是什麼涵義？thunk是一個計算機編程的術語，表示補助調用另一個子程序的子程序，聽起來有點繞，看看下面例子就會體會：

假如有一個JavaScript函數f如下定義：

```js
const f = (x) => {
  return x() * 5;
}
```

f把輸入參數x當作一個子程序來執行，結果加上5就是f的執行結果，那麼我們試著調用一次f：

```js
const g = () => {
  return 3 + 4;
}
f(g); // (3+4) * 5 = 37
```

上面代碼中函數g就是一個thunk，這樣使用看起來有點奇怪，但有個好處是g的執行只有在f實際執行時才執行，可以起到延遲執行的作用，我們繼續看redux-thunk的用法來理解其含義。

按照redux-thunk的想法，在Redux的單向數據流中，在action對象被reducer函數處理之前，是插入異步功能的時機。

在Redux架構下，一個action對象在透過store.dispatch派發，在調用reducer函數之前，會先經過一個中間件的環節，這就是產生異步操作的機會，實際上redux-thunk提供的就是一個Redux中間件，我們需要在創建Store時用上這個中間件。

```

action ---> middlewares ---> Reducer -----
                             ^            |
                             |            |
                             |            |
                              -- State <--
```

第四章，我們已經接觸過中間件：redux-immutable-state-invariant這個中間件幫助開發者發現reducer李不應該出現的錯誤，現在要再加一個redux-thunk中間件來支持異步action對象。

_Store.js_：

```js
import thunkMiddleware from 'redux-thunk';

const middleware = [thunkMiddleware];
```

之前我們用一個名為middlewares的陣列來存儲所有中間件，現在只需要往這個陣列裡加一個元素就可以了，之後，如果需要用到更多的中間件，只需要導入中間件放在middlewares陣列中即可。

### 異步action對象

當我們想要讓Redux幫忙處理一個異步操作的時候，代碼一樣也要派發一個action對象，畢竟Redux單向資料流就是由action對象驅動的。但是這個引發異步操作的action對象比較特殊，我們叫它們“異步action對象”。

前面例子中的action構造函數返回的都是一個普通的對象，這個對象包含若干個欄位，其中必不可少的欄位是type，但是，“異步action對象”不是一個普通JavaScript對象，而是一個函數。

如果沒有redux-thunk中間件的存在，這樣一個函數類型的action對象被派發出去會一路發送到各個reducer函數，reducer函數從這些實際上是函數的action對象上是無法獲得type字段的，所以也做不了什麼實質的處理。

不過，有了redux-thunk中間件之後，這些action對象根本沒有機會觸及到reducer函數，有中間件一層就被redux-thunk截獲。

redux-thunk的工作是檢查action對象是不是函數，如果不是函數就放行，完成普通action對象的生命週期，而如果發現action對象是函數，那就執行這個函數，並把Store的dispatch函數和getState函數作為參數傳遞到函數中去，處理過程到此為止，不會讓這個異步action對象繼續往前派發到reducer函數。

舉一個並不涉及網絡API訪問的異步操作例子，在Counter組件中存在一個普通的同步增加計數的action構造函數increment，代碼如下：

```js
const icrement = () => ({
  type: ActionTypes.INCREMENT,
});
```

派發increment執行返回的action對象，Redux會同步更新Store狀態和視圖，但是我們現在想要創建一個功能，能夠發出一個“讓Counter組件在一秒之後計數加一”的指令，這就需要定義一個新的異步action構造函數：

```js
const incrementAsync = () => {
  return (dispatch) => {
    setTimeout(() => {
      dispatch(increment());
    }, 1000);
  };
};
```

異步action構造函數incrementAsync返回的是一個新的函數，這樣一個函數被dispatch函數派發之後，會被redux-thunk中間件執行，於是setTimeout函數就會發生作用，在一秒之後利用參數dispatch函數派發出同步action構造函數increment的結果。

這就是異步action的工作原理，這個例子雖然簡單，但是可以看得出來，異步action最終還是要產生同步action派發才能對Redux系統產生影響。

redux-thunk要做的工作也就不過如此，但因為引入了一次函數執行，而且這個函數還能夠訪問到dispatch和getState，就給異步操作帶來了可能。

action對象函數中完全可以透過fetch發起一個對Server的異步請求，當得到Server結果之後，透過參數dispatch，把成功或者失敗的結果當作action對象再派發出去。這一次派發的是普通的action對象，就不會被redux-thunk截獲，而是直接被派發到reducer，最終驅動Store上狀態的改變。

### 異步操作的模式

有了redux-thunk的幫助，我們可以用異步action對象來完成異步的訪問Server功能了，但在此之前，我們先想一想如何設計action類型和視圖。

一個訪問Server的action，至少要涉及三個action類型：

- 表示異步操作已經開始的action類型，在這例子裡，表示一個請求天氣信息的API請求已經發送給Server的狀態
- 表示異步操作成功的action類型，請求天氣信息的API調用獲得了正確結果，就會引發這種類型的action
- 表示異步操作失敗的action類型，請求天氣信息的API調用任何一個環節出了錯誤，無論是網絡錯誤、本地代理Server錯誤或者是遠程Server返回的結果錯誤，都會引發這個類型的action。

當這三種類型的action對象被派發時，會讓React組件進入各自不同的三種狀態：

- 異步操作正在進行中
- 異步操作已經成功完成
- 異步操作已經失敗

網絡和遠程Server都是外部實體，是靠不住的，不同環境會有不同的狀態轉換的感知，有必要在視圖上體現三種狀態的區別。

我們需要定義三種action類型，還要定義三種對應的狀態類型。

我們為Weather組件創建一個放置所有代碼的目錄weather，對外接口的文件是*src/weather/index.js*，把這功能模塊的內容導出：

```js
import * as actions from './actions.js';
import reducer from './reducer.js';
import view from './view.js';

export {actions, reducer, view};
```

在*src/weather/actionTypes.js*定義異步操作需要的三種action類型：

```js
export const FETCH_STARTED = 'WEATHER/FETCH_STARTED';
export const FETCH_SUCCESS = 'WEATHER/FETCH_SUCCESS';
export const FETCH_FAILURE = 'WEATHER/FETCH_FAILURE';
```

在*src/weather/status.js*文件定義對應的三種異步操作狀態：

```js
export const LOADING = 'loading';
export const SUCCESS = 'success';
export const FAILURE = 'failure';
```

action類型只能用於action對象中，狀態則是用來表示視圖。為了語意清晰，還是把兩者分開定義。

接下來我們看*src/weather/actions.js*中action構造函數如何定義：

```js
import {FETCH_STARTED, FETCH_SUCCESS, FETCH_FAILURE} from "./actionTypes";

export const fetchWeatherStarted = () => ({
  type: FETCH_STARTED
});

export const fetchWeatherSuccess = (result) => ({
  type: FETCH_SUCCESS,
  result
});

export const fetchWeatherFailure = (error) => ({
  type: FETCH_FAILURE,
  error
});
```

三個普通的action構造函數fetchWeatherStarted、fetchWeatherSuccess和fetchWeatherFailure沒有什麼特別之處，只是各自返回一個有特定type欄位的普通對象，它們的作用是驅動reducer函數去改變Redux Store上weather欄位的狀態。

關鍵是隨後的異步action構造函數fetchWeather：

```js
export const fetchWeather = (cityCode) => {
  return (dispatch) => {
    const apiUrl = `/data/cityinfo/${cityCode}.html`;

    dispatch(fetchWeatherStarted());

    fetch(apiUrl).then((response) => {
      if (response.status !== 200) {
        throw new Error(`Fail to get response with status ${response.status}`);
      }
      response.json().then((responseJson) => {
        dispatch(fetchWeatherSuccess(responseJson.weatherinfo));
      }).catch((error) => {
        throw new Error(`Invalid json response: ${error}`);
      })
    }).catch((error) => {
      dispatch(fetchWeatherFailure(error));
    });
  };
};
```

異步action構造函數的模式就是函數體內返回一個新的函數，這個新的函數可以有兩個參數dispatch和getState，分別代表Redux唯一的Store上的成員函數dispatch和getState。這兩個參數的傳入是redux-thunk中間件的工作，至於redux-thunk如何實現這個功能，我們在後面關於中間件的章節會詳細介紹。

在這裡，我們只要知道異步action構造函數的代碼基本上都是這樣的套路，代碼如下：

```js
export const sampleAsyncAction = () => {
  return (dispatch, getState) => {
    // 在這個函數裡可以調用異步函數，自行決定在合適的時機透過dispatch參數派發出新的action對象。
  }
}
```

在我們的例子中，異步action對象返回的新函數首先派發fetchWeatherStarted產生的action對象。這個action對象是一個普通的action對象，所以會同步地走完單向資料劉，一直走到reducer函數中，引發視圖的改變。同步派發這個action對象的目的是將視圖置於“有異步action還未結束”的狀態，完成這個提示之後，接下來才開始真正的異步操作。

這裏使用fetch來做訪問Server的操作，和前面介紹的weather_react應用中的代碼幾乎一樣，區別只是this.setState改變組件狀態的語句不見了，取而代之的是透過dispatch來派發普通的action對象。也就是說，訪問Server的異步action，最後無論成敗，都要透過派發action對象改變Redux Store上的狀態完結。

在fetch引發的異步操作完成之前，Redux正常工作，不會停留在fetch函數執行上，如果有其他任何action對象被派發，Redux照常處理。

來看一看*src/weather/reducer.js*中的reducer函數：

```js
import * as Status from "./status";
import {FETCH_FAILURE, FETCH_STARTED, FETCH_SUCCESS} from "./actionTypes";

export default (state = {status: Status.LOADING}, action) => {
  switch (action.type) {
    case FETCH_STARTED:
      return {status: Status.LOADING};
    case FETCH_SUCCESS:
      return {...state, status: Status.SUCCESS, ...action.result};
    case FETCH_FAILURE:
      return {status: Status.FAILURE};
    default:
      return state;
  }
};
```

在reducer函數中，完成了上面提到的三種action類型到三種狀態類型的映射，增加一個status欄位，代表的就是視圖三種狀態之一。

這裡沒有任何處理異步action對象的邏輯，因為異步action對象在中間件層就被redux-thunk攔截住了，根本沒有機會走到reducer函數中來。

最後看看*src/weather/view.js*中的視圖，也就是React組件部分，首先是無狀態組件函數：

```js
import * as Status from "./status";

const Weather = ({status, cityName, weather, lowestTemp, highestTemp}) => {
  switch (status) {
    case Status.LOADING:
      return <div>天氣信息請求中...</div>;
    case Status.SUCCESS:
      return (
        <div>
          {cityName} {weather} 最低氣溫 {lowestTemp} 最高氣溫 {highestTemp}
        </div>
      );
    case Status.FAILURE:
      return <div>天氣信息裝載失敗</div>;
    default:
      throw new Error(`unexpected status ${status}`);
  }
};
```

和weather_react中的例子不同，因為現在狀態都是存儲在Redux Store上，所以這裡Weather是一個無狀態組件，所有的props都是透過Redux store狀態獲得。

對應的mapStateToProps函數代碼如下：

```js
const mapStateToProps = (state) => {
  const weatherData = state.weather;

  return {
    status: weatherData.status,
    cityName: weatherData.city,
    weather: weatherData.weather,
    lowestTemp: weatherData.temp1,
    highestTemp: weatherData.temp2,
  };
};
```

為了驅動Weather組件的action，我們另外創建一個城市選擇器控件CitySelector，CitySelector很簡單，也不是這個應用功能的重點，我們只需要它提供一個作為視圖的React組件就可以。

CitySelector組件中，定義四個城市的代碼：

```js
const CITY_CODES = {
  '北京': 101010100,
  '上海': 101020100,
  '廣州': 101280101,
  '深圳': 101280601
};
```

CitySelector組件的render函數根據CITY_CODES的定義畫出四個城市的選擇器，代碼如下：

```js
class CitySelector extends Component {

  render() {
    return (
      <select onChange={this.onChange}>
        {
          Object.key(CITY_CODES).map(
            cityName => <option key={cityName} value={CITY_CODES[cityName]}>{cityName}</option>
          )
        }
      </select>
    );
  }

}
```

其中使用到的onChange函數使用onSelectCity來派發出action：

```js
onChange = (ev) => {
  const cityCode = ev.target.value;
  this.props.onSelectCity(cityCode);
};
```

為了讓網頁初始化的時候能夠獲得天氣信息，在componentDidMount派發了對應第一個城市的fetchWeather action對象：

```js
componentDidMount() {
  const defaultCity = Object.keys(CITY_CODES)[0];
  this.props.onSelectCity(CITY_CODES[defaultCity]);
}
```

完成代碼後，我們在網頁中就可以看到最終成果。