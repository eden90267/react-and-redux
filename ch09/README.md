# Chap09. 擴展Redux

Redux本身提供了很強大的資料流管理功能，但是Redux更強大之處在於它提供了擴展自身功能的可能性。當Redux庫中功能不滿足我們要求的時候，開發者可以擴展增強Redux的功能。實際上，Redux之所以獲得廣泛接受，就是因為社區圍繞Redux創建了很多擴展功能，形成了一個生態系統。

這一章，將介紹兩種擴展Redux的方法：

- 中間件
- Store Enhancer

## 中間件

現在我們來看看Redux中間件的具體工作機制，然後學會自己創造中間件。

在Node Express框架，中間件是一些函數，用於定製對特定請求的處理過程。作為中間件的函數互相是獨立的，可以提供對記錄日誌、返回特定響應報頭、壓縮等等請求的處理操作，中間件這種架構設計使得可以重用通用邏輯，透過組合不同中間件可以完成複雜功能。

Redux與Express是兩種不同的框架，中間件的概念也不完全一樣。但是兩者也有一些共同之處，如果把Redux和Express都看作一個對請求的處理框架的話，那麼Redux中的action對象對應於Express中的客戶端請求，而所有的中間件就組成處理請求的“管道”。

```

---> 中間件 -> 中間件 -> 中間件 ---> Reducer

```

派發給Redux Store的action對象，要被Store上的中間件依次處理。如果把action和當前state交給reducer處理的過程看作是默認存在的中間件，那所有對action的處理都可以由中間件組成。

中間件的特點是：

- 中間件是獨立的函數
- 中間件可以組合使用
- 中間件有一個統一的接口

中間件是獨立函數，指的是中間件不應該有依賴關係，每個中間件應該能夠獨立被一個Redux Store使用，完成某一個特定功能。

正因為每個中間件只完成某一個特定功能，所以為了滿足比較豐富的應用需求，應該能夠在一個Redux Store上組合多個中間件。這些中間件按照指定順序依次處理傳入的action。當然 ，每個中間件都可以中斷對於某個action的“管道”，也就是不用後面的中間件繼續處理了。

不同的中間件之所以能夠組合使用，是因為Redux要求所有中間件必須提供統一的接口，每個中間件的實現邏輯都不一樣，但只有遵守統一的接口才能夠和Redux和其他中間件對話。

我們先從Redux中間件接口出發，來看看中間件如何來定製：

### 中間件接口

在Redux框架中，中間件處理的是action對象，而派發action對象的就是Store上的dispatch函數，之前介紹過透過dispatch派發的action對象會進入reducer。其實這不完全正確，因為在action對象進入reducer之前，會經歷中間件的管道。

在這個中間件管道中，每個中間件都會接收到action對象，在處理完畢之後，就會把action對象交給下一個中間件來處理，只有所有中間件都處理完action對象之後，才輪到reducer來處理action對象，如果某格中間件覺得沒必要繼續處理這個action對象，就不會把action對象交給下一個中間件，杜這個action對象的處理就中止，也就輪不到reducer上場了。

每個中間件必須要定義成一個函數，返回一個接受next參數的函數，而這個接受next參數的函數又返回一個接受action參數的函數。next參數本身也是一個函數，中間件調用這個next函數通知Redux自己的處理工作已經結束。

一個什麼都不做的中間件代碼：

```js
function doNothingMiddleware({dispatch, getState}) {
  return function(next) {
    return function(action) {
      return next(action);
    };
  }
}
```

這個doNothingMiddleware接受一個對象作為參數，對象參數上有兩個欄位dispatch和getState，分別代表的就是Redux Store上的兩個同名函數，不過並不是所有中間件都用得上這兩個函數。

函數doNothingMiddleware返回的函數接受一個next類型的參數，這個next是一個函數。如果調用它，代表這個中間件完成了自己的功能，把控制權交給了下一個中間件，但是這個函數還不是處理action對象的函數，它返回的那個以action為參數的函數才是。

以action為參數的函數對傳入action對象進行處理，因為JavaScript支持閉包，在這個函數裡可以訪問上面兩層函數的參數，所以可以根據需要做很多事情，包括以下功能：

- 調用dispatch派發出一個新action對象
- 調用getState獲得當前Redux Store上的狀態
- 調用next告訴Redux當前中間件工作完畢，讓Redux調用下一個中間件
- 訪問action對象action上的所有資料

具有上面這些功能，一個中間件足夠獲取Store上的所有信息，也具有足夠能力控制資料的流轉。

當然，上面的例子，doNothingMiddle中間件什麼都沒有做，只是簡單地調用next並把action交給下一個中間件。

讀者可能會有一個問題，為什麼中間件的接口定義需要這麼多層的函數？為什麼不乾脆把接口設計成一個函數接受兩個參數store和next，然後返回一個對action處理的函數？

```js
function doNothingMiddleware({dispatch, getState}, next) {
  return function(action) {
    return next(action);
  }
}
```

如果按照上面這種方法定義中間件接口，似乎更容易理解，但是Redux並沒有這麼設計，因為Redux是根據函數式編程的思想來設計的，函數式編程的一個重要思想就是讓每個函數的功能盡量少，然後透過函數的嵌套組合來實現複雜功能，在Redux中我們會看到很多這樣的現象。

前面章節中，我們使用過redux-thunk中間件來實現異步action對象，現在讓我們來揭開redux-thunk的神秘面紗，其實redux-thunk極其簡單：

```js
function createThunkMiddleware(extraArgument) {
  return ({dispatch, getState}) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }
    return next(action);
  }
}

const thunk = createThunkMiddleware();
export default thunk;
```

在這裡，使用了ES6的箭頭方式表示函數，連續的=>符號表示的是返回函數的函數，比如下面的代碼寫法，實際效果和doNothingMiddleware一樣：

```js
({dispatch, getState}) => next => action => next(action);
```

我們看redux-thunk這一串函數中最裡層的函數，也就是實際處理每個action對象的函數。首先檢查參數action的類型，如果是函數類型，就執行這個action函數，把dispatch和getState作為參數傳遞進去，否則就調用next讓下一個中間件繼續處理action，這個處理過程和redux-thunk文檔中描述的功能一致。

值得一提，每個中間件最裡層處理action參數的函數返回值都會影響Store上dispatch函數的返回值。但是，每個中間件中這個函數返回值可能都不一樣，像上面的redux-thunk，有可能返回的是下一個中間件返回的結果，也可能返回的是action參數作為函數執行的結果，同時在一個應用中使用的中間件也可能發生變化。所以，dispatch函數調用的返回結果完全是不可控的，我們在代碼中最好不要依賴於dispatch函數的返回值。

### 使用中間件

使用中間件有兩種方法，兩種方法都離不開Redux提供的applyMiddleware函數。

第一種方法是用Redux提供的applyMiddleware來包裝createStore產生一個新的創建Store的函數，以使用redux-thunk中間件為例：

```js
import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

const configureStore = applyMiddleware(thunkMiddleware)(createStore);
const store = configureStore(reducer, initialState);
```

為了使用thunkMiddleware，將thunkMiddleware作為參數傳遞給applyMiddleware，產生一個新的函數，新產生的函數實際上是一個Store Enhancer(很快就會介紹到Store Enhancer，在這裡只需要理解Store Enhancer是一種能夠增強Store功能的函數就行)，這個Store Enhancer函數又將Redux的createStore作為參數，產生了一個加強版的創造store的函數，習慣上將這個增強的createStore命名為configureStore，利用configureStore創造的Store將具有thunkMiddleware中間件的功能。

對於沒有使用其他Store Enhancer的場景，上述的方法還可以一用，但是實際中應用基本都會需要其他Store Enhancer的補助，比如便於Redux開發的Redux Devtools增強器，在有其他增強器出現的情況下，再用這種方法就顯得很不方便，所以上面介紹的第一種方法現在很少使用了，取而代之的是第二種方法。

第二種方法也就是把applyMiddleware的結果當作Store Enhancer，和其他Enhancer混合之後作為createStore參數傳入。

以同時redux-thunk和Redux Devtools增強器為例：

```js
import {createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk';

const win = window;

const reducer = combineReducers({
  // ...
});

const middlewares = [thunkMiddleware];
const storeEnhancers = compose(
  applyMiddleware(...middlewares),
  (win ** win.devToolsExtension) ? win.devToolsExtension() : f => f
);
const store = createStore(reducer, storeEnhancers);
```

可以看到，applyMiddleware函數的執行結果，和其他的Store Enhancer處於同級的位置，Redux提供一個compose函數，可以把多個Store Enhancer串接起來成為一個函數，因為createStore只能接受一個Store Enhancer的參數。

createStore最多可以接受三個參數，第一個參數是reducer，第二個參數如果是對象，就會被認為是創建Store時的初始狀態，這樣第三個參數如果存在就是增強器。但如果第二個參數是函數類型，那就認為沒有初始狀態，直接把第三個參數當作增強器處理。

值得一提的是，使用這種方法應用中間件的時候，壹定要把applyMiddleware的結果作為compose的第一個參數，也就是要放在所有其他Store Enhancer之前應用。這是因為增強器的順序也就是他們處理action對象的順序，applyMiddleware配合redux-thunk或其他中間件要處理異步action對象。如果不是優先把他們擺在前面的話，異步action對象在被它們處理之前就會被其他Store Enhancer處理，無法理解異步對象的增強器就會出錯。

以下做法Redux Devtools遇到異步對象就會無法工作：

```js
const storeEnhancers = compose(
  (win ** win.devToolsExtension) ? win.devToolsExtension() : f => f,
  applyMiddleware(...middlewares)
);
```

## Promise中間件

理解中間件最好的辦法就是自己開發一個中間件，上一章中提到過，替換redux-thunk中間件來實現異步action對象還有一個辦法是利用Promise，Promise更加適合於輸入輸出操作，而且fetch函數返回的結果就是一個Promise對象，接下來我們就來實現一個用於處理Promise類型action對象的中間件：

一個最簡單實現Promise中間件實現方式是這樣：

```js
function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

export default function promiseMiddleware({dispatch}) {
  return function(next) {
    return function(action) {
      return isPromise(action) ? action.then(dispatch) : next(action);
    }
  }
}
```

邏輯很簡單，類似於redux-thunk判斷action對象是否是函數，在這裡判斷action對象是不是一個Promise。如果不是，那就放行透過next讓其他中間件繼續處理。如果是，那就讓這個Promise類型的action對象在完成時調用dispatch函數把完成的結果派發出去。

這個實現很簡單，但卻十分不實用。

我們在第七章Weather應用中說到過，做一個完備的異步操作，要考慮三個狀態，分別是“異步操作進行中”、“異步操作成功完成”和“異步操作失敗”。上面的Promise只考慮第二種狀態“異步操作成功完成”，這是不完整的，使用這樣的中間件，並不比redux-thunk省事。

我們需要重新思考一下如何使用Promise。

對於redux-thunk，實現異步就是要在中間件層執行一個指定子程序，而redux-thunk就是用action對象是不是函數類型來判斷是否調用子程序。嚴格來說，我們完全可以寫一個中間件，透過判斷action對象上的async或者什麼其他欄位，代碼如下：

```js
const thunk = ({dispatch, getState}) => next => action => {
  if (typeof action.async === 'function') {
    return action.async(dispatch, getState);
  }
  return next(action);
};
```

然後只要約定異步action對象依然是普通JavaScript對象，只是多一個名為async的函數類型欄位。

如果能夠這樣理解action對象，那麼我們也沒有必要要求Promise中間件處理異步action對象是Promise對象了，只需要action對象某個欄位是Promise欄位就行，而action對象可以擁有其他欄位來包含更多信息。

改進版本Promise中間件：

```js
export default function promiseMiddleware({dispatch}) {
  return next => action => {
    const {types, promise, ...rest} = action;
    if (!isPromise(promise) || !(types && types.length === 3)) {
      return next(action);
    }
    
    const [PENDING, DONE, FAIL] = types;
    dispatch({...rest, type: PENDING});
    return action.promise.then(
      (result) => dispatch({...rest, result, type: DONE}),
      (error) => dispatch({...rest, error, type: FAIL})
    );
  }
}
```

這個中間件處理的異步對象必須包含一個Promise欄位和一個types欄位，前者是一個Promise對象，後者則必須是一個大小為3的陣列，依次分別代表異步操作的進行中、成功結束和失敗三種action類型。具體是什麼值，應該在對應功能組件的*actionTypes.js*文件中定義：

一個被Promise中間件處理的異步action對象的例子是這樣：

```js
{
  promise: fetch(apiUrl),
  types: ['pending', 'success', 'failure']
}
```

如果傳入的action對象不滿足這種格式，就直接透過next交給其他中間件處理。

這裡也有一個約定，所有表示異步操作成功的action對象由result與error欄位紀錄成功結果與失敗原因。

我們利用Weather應用來改寫，_actions.js_：

```js
export const fetchWeather = (cityCode) => {
  const apiUrl = `/data/cityinfo/${cityCode}.html`;
  return {
    promise: fetch(apiUrl).then(response => {
      if (response.status !== 200) {
        throw new Error(`Fail to get response with status ${response.status}`);
      }

      return response.json().then(responseJson => responseJson.weatherinfo);
    }),
    types: [FETCH_STARTED, FETCH_SUCCESS, FETCH_FAILURE]
  };
};
```

對比redux-thunk中間件和這個Promise中間件可以發現區別，如果應用redux-thunk，實際發起異步操作的語句是在中間件中調用的；而如果應用Promise中間件，異步操作是在中間件之外引發的，因為只有異步操作發生了才會有Promise對象，而Promise中間件只是處理這個對象而已。

讀者可能會發現，Promise中間件要求“異步操作成功”和“異步操作失敗”兩個action對象必須用result和error欄位紀錄結果，這樣缺乏靈活性，的確是的。有一個改進方法是不用types傳入actions類型，而是用例如actionCreators名字的欄位傳入三個action構造函數，這樣就能夠更靈活地產生action對象，代價就是每個模組需要定義那三個action構造函數。

### 中間件開發原則

開發一個Redux中間件，首先要明確這個中間件的目的，因為中間件可以組合使用，所以不要讓一個中間件的內容太過臃腫，盡量讓一個中間件只完成一個功能，透過中間件的組合來完成豐富的功能。

上述例子中，都只使用一個中間件的情況，實際中applyMiddleware函數可以接受任一個參數的中間件，每個透過dispatch函數派發的動作組件按照在applyMiddleware中的先後順序傳遞給各個中間件，比如可以把redux-thunk和我們寫的Promise中間件組合使用：

```js
applyMiddleware(thunkMiddleware, promiseMiddleware);
```

這樣，每個派發的action對象會先交給thunkMiddleware，如果不是函數類型的action對象，就會順延交給promiseMiddleware，在這裡，兩個中間件所處理的action對象不是一個類別，所以先後順序並不重要。

每個中間件必須是獨立存在的，但是要考慮到其他中間件的存在。

所謂獨立存在，指的是中間件不依賴於其他中間件的順序，也就是不應該要求其他中間件必須出現在它前面或後面，否則事情會複雜化。

所謂考慮到其他中間件的存在，指的是每個中間件都要假設應用可能包含多個中間件，尊重其他件可能存在的事實。當發現傳入的action對象不是自己感興趣的類型，或者對action對象已經完成必要處理的時候，要透過調用next(action)將action對象交回給中間件管道，讓下一個中間件有機會來完成自己的工作，千萬不能不明不白地丟棄一個action對象，這樣處理“管道”就斷了。

對於異步動作中間件，等於是要“吞噬”掉某些類型的action對象，這樣的action對象不會交還給管道。不過，中間件會異步產生新的action對象，這時候不能透過next函數將action對象還給管道了，因為next不會讓action被所有中間件處理，而是從當前中間件之後的“管道”位置開始被處理。

一個中間件如果產生新的action對象，正確的方式是使用dispatch函數派發，而不是使用next函數。

## Store Enhancer

中間件可以用來增強Redux Store的dispatch方法，但也侷限於dispatch方法，也就是從dispatch函數調用到action對象被reducer處理這個過程中的操作，如果想要對Redux Store進行更深層次的增強定製，就需要使用Store Enhancer。

前面章節我們看到，applyMiddleware函數的返回值被作為增強器傳入createStore，所以其實中間件功能就是利用增強器來實現的，畢竟定製dispatch只是Store Enhancer所能帶來的改進可能之一，利用Store Enhancer可以增強Redux Store的**各個方面**。

### 增強器接口

Redux提供的創建Store函數叫createStore，這個函數除了可以接受reducer和初始狀態(preloadedState)參數，還可以接受一個Store Enhancer作為參數，Store Enhancer是一個函數，這個函數接受一個createStore模樣的函數為參數，返回一個新的createStore函數。

一個什麼都不做的Store Enhancer長得像這樣：

```js
const doNothingEnhancer = (createStore) => (reducer, preloadedState, enhancer) => {
  const store = createStore(reducer, preloadedState, enhancer);
  return store;
}
```

最底層的函數體可拿到一個createStore函數對象，還有應該傳遞給這個createStore函數對象的三個參數。所以，基本的套路就是利用所給的參數創造出一個store對象，然後定製store對象，最後把store對象返回去就可以。

>**Top**：  
>在實際執行過程中，這裡的createStore參數未必是Redux默認的createStore函數，因為多個增強器也可以組合使用，所以這裡接收到的createStore參數可能是已經被另一個增強器改造過的函數。當然，每個增強器都應該互相獨立，只要遵循統一接口，各個增強器可以完全不管其他增強器的存在。

實現一個Store Enhancer，功夫全在於如何定製產生的store對象。

一個store對象中包含下列接口：

- dispatch
- subscribe
- getState
- replaceReducer

每一個接口都可以被修改，當然，無論如何修改，最後往往還是要調用原有對應的函數。

例如，如果我們想要增強器給每個dispatch函數的調用都輸出一個日誌，那麼就實現一個logEnhancer，代碼如下：

```js
const logEnhancer = (createStore) => (reducer, preloadedState, enhancer) => {
  const store = createStore(reducer, preloadedState, enhancer);
  
  const originalDispatch = store.dispatch;
  store.dispatch = (action) => {
    console.log('dispatch action: ', action);
    originalDispatch(action);
  }
  
  return store;
};
```

增強器通常都使用這樣的模式，將store上某個函數的引用存下來，給這個函數一個新的實現，但是在完成增強功能之後，還是要調用原有的函數，保持原有的功能。

增強器還可以給Store對象增加新的函數，下面舉一個這樣的例子。

### 增強器實例reset

在實際的React應用中，有一個場景，一個頁面完成初始化，Redux Store已經創建完畢，甚至用戶都已經做了一些交互動作。這時候頁面要在不刷新的情況下切入另一個介面，這個界面擁有全新的功能模組，也就是說有全新的reducer、action構造函數和React組件。但我們想保持原有的Store對象。

按照前面模組化的思想，狀態都在Redux Store上，所以替換功能模組的問題根本上就是替換reducer和Redux Store上狀態的問題。

Redux的store上有一個replaceReducer函數，可以幫助我們完成替換reducer的工作，但store只有getState，沒有replaceState。Redux這樣設計就是杜絕對state的直接修改，我們都知道改變一個Redux Store狀態只能透過reducer，而驅動reducer就要派發一個action對象。

一個應用可能包含許多功能模組，即使每個模組都提供了修改屬於自己store狀態的action對象，那麼這個替換過程也要給所有功能模組派發一個action對象，這樣既複雜又不通用，無法實現。

所以，我們要創建一個增強器，給創造出來的store對象一個新的函數reset，透過這個函數就完成替換reducer和狀態的功能：

```js
const RESET_ACTION_TYPE = '@@RESET';

const resetReducerCreator = (resetReducer, resetState) => (state, action) => {
  if (action.type === RESET_ACTION_TYPE){
    return resetState;
  } else {
    return resetReducer(state, action);
  }
};

const reset = (createStore) => (reducer, preloadedState, enhancer) => {
  const store = createStore(reducer, preloadedState, enhancer);
  
  const reset = (resetReducer, resetState) => {
    const newReducer = resetReducerCreator(resetReducer, resetState);
    store.replaceReducer(newReducer);
    store.dispatch({type: RESET_ACTION_TYPE, state: resetState});
  };
  
  return {
    ...store,
    reset
  };
};

export default reset;
```

即使是Store Enhancer，也無法打破Redux內在的一些限制，比如對state，增強器也不可能直接去修改state的值，依然只能透過派發一個action對象去完成。在這裡定義一個特殊的action類型RESET_ACTION_TYPE，表示要重置整個store上的值，為了能夠處理這個action類型，我們也要在reducer上做一些定製。

在reset函數中，先透過replaceReducer函數替換store原有的reducer，然後透過store的dispatch函數派發一個type為RESET_ACTION_TYPE的action對象。這個action對象可沒有預期讓任何應用的功能模組捕獲到，完全是這個增強器自己消耗。

透過replaceReducer替換的新reducer在所有功能模組reducer之前被執行，所有透過了中間件管道的action對象先被resetReducerCreator函數的返回函數處理。在這函數中，如果發現action對象的type為RESET_ACTION_TYPE，那就直接返回resetState作為整個Store的新狀態，其他的action對象則交給其他reducer來處理。

## 本章小節

這一章，我們了解了擴展Redux功能的兩種方法：中間件和Store Enhancer。

中間件用於擴展dispatch函數的功能，多個中間件實際構成了一個處理action對象的管道，action對象被這個管道中所有中間件依次處理過之後，才有機會被reducer處理。在這個過程裡中間件就可以擴展對action對象處理的功能，比如異步action對象，我們利用Promise的特性實現了一個新的處理異步action對象的中間件。

Store Enhancer的功能比中間件更加強大，它可以完全定製一個store對象的所有接口，我們透過一個增強器實例演示了重置store上reducer和狀態的功能。