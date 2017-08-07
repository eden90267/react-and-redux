# Chap08. 單元測試

>“我發現寫單元測試實際上提高了我的編程速度。” ——Martin Fowler

作為驗證程序質量的重要手段之一，測試是一個很大的主題。不過，這一章重點介紹特定於React和Redux應用的單元測試方法。

- 單元測試原則
- React和Redux單元測試環境
- 單元測試React組件的方法
- 單元測試Redux各個部分的方法

因為React和Redux基於函數式編程的思想，所以應用功能更容易拆分成容易測試的模組，對應產出代碼的可測試性也更高。

## 單元測試的原則

從不同角度，可將測試劃分為如下不同的種類：

- 從人工操作還是寫代碼來操作的角度，可以分為**手工測試**和**自動化測試**
- 從是否需要考慮系統的內部設計角度，可以分為**白盒測試**和**黑盒測試**
- 從測試對象的級別，可以分為**單元測試**、**集成測試**和**端到端測試**
- 從測試驗證的系統特性，又可分為**功能測試**、**性能測試**和**壓力測試**  
  ...

上述的測試種類中，有很多與被測試程序是基於什麼語言、什麼框架沒有任何關係，比如端到端測試。在這裡，我們只探討特定於React和Redux的測試技巧，而體現特殊性的就是單元測試。

單元測試是一種自動化測試，測試代碼和被測的對象非常相關。

單元測試代碼一般都由編寫對應功能代碼的開發者來編寫，開發者提交的單元測試和代碼應該保持一定的覆蓋率，而且必須永遠能夠運行通過。可以說，單元測試是保證代碼質量的第一道防線。

既然說到單元測試，就不得不說測試驅動開發(Test Driven
Development，TDD)，有的開發者對測試驅動開發奉為神器，嚴格實踐先寫單元測試測試用例後寫功能代碼，而且單元測試也保證其他開發者不會因為失誤破壞原有的功能；也有開發者對測試驅動開發不以為然，因為寫單元測試的時間是寫功能代碼的好幾倍，當需求發生改變的時候，除了要維護功能代碼，還要維護測試代碼，苦不堪言。

我們這裡只需要正視一點，那就是單元測試應該是讓開發者的工作更輕鬆更高效，而不是成為開發過程中的包袱。

每個開發團隊會根據自身特點決定是否要求測試驅動開發，也可設定恰當的單元測試覆蓋閾值，不過要注意以下幾點：

首先，即使單元測試覆蓋率達到100%，也不表示程序是沒有bug的，實現高質量的軟件有多方面要求，單元測試只是手段之一，不要對單元測試覆蓋率有特過偏執的要求。

另外，程序架構的可測試性非常重要，開發者不喜歡寫單元測試代碼一個很重要的原因就是發現單元測試“太難寫”，比如為了寫一個單元測試要寫太多的模仿對象Mock，涉及複雜的流程難已全部條件分支。

要克服單元測試“太難寫”的問題，就需要架構能把程序拆分成足夠小到方便測試的部分，只要每個小的部分被驗證能夠正確地各司其職，組合起來能夠完成整體功能，那麼開發者編寫的單元測試就可以專注於測試各個小的部分就行，這就是更高的“可測試性”。

只要運用得宜，React和Redux應用的可測試性非常高，因為對應單元測試寫出來大多就是對純函數的測試。

React盡量不存儲狀態，把狀態存儲到Redux的Store上，也就是讓React組件只是一個根據資料負責渲染的純函數就好，這樣的React組件是非常方便測試的。因為純函數的結果根據輸入完全可以預測，而為了測試一個對象在某個狀態下的行為，還要首先讓這個對象處於那個狀態，測試代碼就會變得很長，讓開發者擔心測試代碼本身就可能因為複雜化而出問題。

既然React組件變成了純函數，那Redux就承擔了複雜的狀態管理，那是否Redux部分的可測試性會變低？並沒有，因為Redux的功能由眾多函數組成，這些函數中少依然是純函數，所以測試依然非常簡單。

使用Redux應用，開發者書寫的大部分代碼都屬於action構造函數、reducer或者selector，其中普通的action構造函數和reducer就是純函數，異步action構造函數有副作用所以並不是純函數，在接下來或介紹如何測試異步action構造函數；選擇器雖然包含緩存的副作用，但是對於同樣輸入也有同樣輸出，測試難度不比測試純函數更高。

接下來，我們就介紹單元測試React和Redux程序的方法。

## 單元測試環境搭建

實現單元測試，需搭建單元測試環境，包括下面幾個方面：

- 單元測試框架
- 單元測試代碼組織
- 輔助工具

### 單元測試框架

構建React和Redux單元測試框架，有很多選擇，最常見是以下兩種：

- 用Mocha測試框架，但是Mocha並沒有斷言庫，所以往往還要配合Chai斷言庫來使用
- 使用React的本家Facebook出品的Jest，Jest自帶斷言庫，相當於Mocha+Chai的功能，不過Jest的語法和Chai並不一致

這兩種方法各有千秋，沒有哪一種具有絕對優勢。

在create-react-app創建的應用中字帶Jest庫，所以本書的代碼庫中單元測試都是基於Jest框架編寫的代碼，在任何一個create-react-app產生的應用代碼目錄下，用命令行執行下列代碼，就會進入單元測試介面。

```bash
npm run test
```

上面的命令在執行完單元測試後不會結束，而是進入待命狀態。

待命狀態下，任何對相關代碼的修改，都會觸發單元測試的運行，而且Jest很智能，只運行修改代碼影響的單元測試。同時也提供了強行運行所有單元測試代碼，選擇只運行滿足過濾條件的單元測試用例等高級功能。

Jest會自動在當前目錄下尋找滿足下列任一條件的JavaScript文件作為單元測試代碼來執行。

- 文件名以*.test.js*為後綴的代碼文件
- 存於*__test__*目錄下的代碼文件

一種方式，是在項目的根目錄上創見一個名為test的目錄，和存放功能代碼的src目錄並列，在test目錄下建立和src對應子目錄結構，每個單元測試文件都以.test.js後綴，就能夠被Jest找到。這種方法可以保持功能代碼src目錄的整潔，缺點就是單元測試中引用功能代碼的路徑會比較長。例如，功能代碼在*src/todo/actions.js*文件中，對應的單元測試代碼放在*test/todo/actions.test.js*文件中，這樣一來，在actions.test.js文件中導入被測試的功能代碼，借需要一個很長的路徑名：

```js
import * as actions from '../../src/todos/actions.js';
```

另一種存放單元測試代碼的策略是在每一個目錄下創建*__test__*子目錄，用於存放對應這個目錄的單元測試。這種方法因為功能代碼和測試代碼放在一起，容易比對，缺點就是散佈在各個目錄下的*__test__*看起來不是很整潔。

具體用何種方式佈局單元測試代碼文件，開發者可自行決定。本書例子中，更注重功能代碼目錄的整潔，所以測試代碼都放在和src並排的test目錄中，文件以*.test.js*後綴結尾。

### 單元測試代碼組織

單元測試代碼組織最小單位是測試用例(test case)，每一個測試用例考驗的是被測試對象在某一個特定場景下是否有正確的行為。在Jest框架下，每個測試用例用一個it函數代表，it函數第一個參數是一個字符串，代表的就是測試用例名稱，第二個參數是一個函數，包含的就是實際的測試用例過程。

```js
it('should return object when invoked', () => {
  // 增加斷言語句
});
```

測試用例用it函數代表，這個函數名it指代的“它”就是被測對象，所以第一個參數的用例名稱就應該描述“它”的預期行為，比較好的測試用例名遵循這樣的模式：“(它)在什麼樣的情況下是什麼行為”，應該盡量在it函數的第一個參數中使用這樣有意義的字符串。

為了測試被測對象在多種情況下的行為，就需要創建多個單元測試用例，因此，接下來的問題就是如何組織多個it函數實例，也就是測試套件(test suite)的構建。

一個測試套件由測試用例和其他測試套件構成，很明顯，測試套件可以嵌套使用，於是測試套件和測試用例形成了一個樹形的組織結構。當執行某個測試套件的時候，按照從上到下從外到里的順序執行所有測試用例。

在Jest中用describe函數描述測試套件，一個測試套件的代碼例子如下：

```js
describe('actions', () => {
  it('should return object when invoked', () => {
  });
  // 可以有更多的it函數調用
});
```

describe函數包含與it函數一樣的參數，兩者主要的區別就是describe可以包含it或者另一個describe函數調用，但是it卻不能。

將多個it放到一個describe中的主要目的是為了重用共同的環境設置。比如一組it中都需要創建一個Redux Store實例作為測試的前提條件，讓每個it中都進行這個操作就是重複代碼，這時候就應該把這些it放在一個describe中，然後利用describe下的beforeEach函數來執行共同的創建Redux Store工作。

describe中有如下特殊函數可以幫助重用代碼：

- beforeAll，在開始測試套件之前執行一次
- afterAll，在結束測試套件中所有測試用例之後執行一次
- beforeEach，每個測試用例在執行之前都執行一次
- afterEach，每個測試用例在執行之後都執行一次

Example：如果describe都有用上特殊函數，並且有兩個it測試用例：

beforeAll -> beforeEach -> it -> afterEach -> beforeEach -> it -> afterEach -> afterAll。

>本書中基於Jest創建單元測試代碼，但是如果使用Mocha，會發現代碼很相似，一樣也是使用describe和it來代表測試套件和測試用例，一樣利用beforeEach和beforeEnd執行通用的代碼。但是Mocha沒有beforeAll和afterAll，取而代之的是before和after函數，這是兩個測試框架的微小區別。

### 輔助工具

特定於React和Redux的單元測試，還需要幾個輔助類：

#### 1. Enzyme

要方便測試React組件，就需要用到Enzyme，有意思的是Enzyme並不是Facebook出品，而是AirBnB貢獻出來的開源項目。

要使用Enzyme，需要安裝對應的npm包：

```bash
npm i ---save-dev enzyme react-addons-test-utils
```

上面的react-addons-test-utils是Facebook提供的單元測試輔助庫，Enzyme依賴這個庫，但是這個庫的本身功能沒有Enzyme那麼強大。

測試React組件，需要將React組件渲染出來看一看結果，不過Enzyme認為並不是所有的測試過程都需要把React組件的DOM樹都渲染出來，尤其對於包含複雜子組件的React組件，如果深入渲染整個DOM樹，那就要渲染所有子組件，可是子組件可能會有其他依賴關係，比如依賴於某個React Context值，為了渲染這樣的子組件需要耗費很多精力準備測試環境，這種情況下，針對目標組件的測試只要讓它渲染頂層組件就好了，不需要測試子組件。

Enzyme支持三種渲染方法：

- shallow，只渲染頂層React，不渲染子組件，適合只測試React組件的渲染行為
- mount，渲染完整的React組件包含子組件，借助模擬的瀏覽器環境完成事件處理功能
- render，渲染完整的React組件，但只產生HTML，不進行事件處理。

例如，對於Filter組件，代碼如下：

```js
const Filter = () => {
  <p className="filters">
    <Link filter={FilterTypes.ALL}>{FilterTypes.ALL}</Link>
    <Link filter={FilterTypes.COMPLETED}>{FilterTypes.COMPLETED}</Link>
    <Link filter={FilterTypes.UNCOMPLETED}>{FilterTypes.UNCOMPLETED}</Link>
  </p>
}
````

在測試Filter組件的時候，如果只專注於Filter的功能，只要保證這個渲染結果包含三個Filter組件就足夠，沒有必要把Link組件的內容渲染出來，因為那是Link組件的單元測試應該做的事情，Enzyme這種“淺層渲染”的方法叫shallow。

如果想要渲染完整的DOM樹，甚至想要看看Link中的點擊是否獲得預期結果，可以選擇Enzyme的方法mount，mount不光產生DOM樹，還會加上所有組件的事件處理函數，可以模擬一個瀏覽器中的所有行為。

如果只想檢查React組件渲染的完整HTML，不需要交互功能，可使用Enzyme提供的render函數。

#### 2. sinon.js

React和Redux已經盡量讓單元測試面對的是純函數，但是還是不能避免有些被測試的對象依賴於一些其他因素。比如，對於異步action對象，就會依賴於對API Server的網路請求，毫無疑問在單元測試中不能真正地訪問一個API Server，所以需要模擬網絡訪問的結果。

開源社區存在很多模擬網絡請求的單元測試補助工具，不過對於“模擬”這件事，不應該只是侷限於網洛請求，這裡我們使用一個全能的模擬工具sinon.js。

sinon.js功能強大，可以改變指定對象的行為，甚至改變測試環境的時鐘設置。

```bash
npm i --save-dev sinon
```

#### 3. redux-mock-store

雖然Redux簡單易用，但是會在某些情況下並不需要完整的Redux功能，一個模擬的Redux Store使用起來更加方便。比如對於測試一個異步action構造函數時，異步action構造函數會往Store中連續派發action對象，從測試角度並不需要action對象被派發到reducer中，只要能夠檢查action對象被派發就足夠了，這樣就能夠用上redux-mock-store。

```js
npm i --save-dev redux-mock-store
```

## 單元測試實例

單元測試的要義是一次只測試系統的一個功能點，現在來看React與Redux應用中各個功能點如何測試：

### action構造函數測試

_todo_with_selector/test/todos/action.test.js_：

```js
describe('todos/actions', () => {
  describe('addTodo', () => {
    // 在這裡添加it測試用例
  });
});
```

接下來針對addTodo測試用例，首先需要驗證addTodo函數執行返回的結果是預期的對象：

```js
it('should create an action to add todo', () => {
  const text = 'first todo';
  const action = addTodo(text);

  expect(action.text).toBe(text);
  expect(action.completed).toBe(false);
  expect(action.type).toBe(actionTypes.ADD_TODO);
});
```

多次調用addTodo函數返回的對象具有一樣的內容，只有id值是不同的，因為每個新創建的待辦事項都要有唯一的id，對應的單元測試代碼：

```js
it('should have different id for different actions', () => {
  const text = 'first todo';
  const action1 = addTodo(text);

  const action2 = addTodo(text);
  expect(action1.id !== action2.id).toBe(true);
});
```

從上面代碼可看出單元測試的基本套路如下：

1. 預設參數
2. 調用純函數
3. 用expect驗證純函數的返回結果

### 異步action構造函數測試

異步action構造函數因為存在副作用，所以單元測試會比普通action構造函數複雜。

一個異步action對象就是一個函數，被派發到redux-thunk中間件時會被執行，產生副作用，以*weather_redux/src/weather/actions.js*異步action對象構造器fetchWeather為例，產生的異步動作被派發之後，會連續派發另外兩個action對象代表fetch開始和結束，單元測試要做的就是驗證這樣的行為。

被測試對象fetchWeather發揮作用需要使用redux-thunk中間件，所以需要一個Redux Store，在fetchWeather函數中還需要調用dispatch函數，而dispatch函數也來自於一個Redux store。但是我們並沒有必要創建一個完整功能的Redux Store，使用redux-mock-store更加合適，因為在單元測試環境下，dispatch函數最好不要做實際的派發動作，只要能夠把被派發的對象記錄下來，留在驗證階段讀取就可以了。

使用redux-mock-store的代碼如下：

```js
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

const middlewares = [thunk];
const createMockStore = configureStore(middlewares);
```

最後得到的是createMockStore函數，注意createMockStore可以使用Redux中間件，添加了redux-thunk之後可以處理異步action對象。

fetchWeather函數中會調用fetch函數，這個函數的行為是去訪問指定的URL來獲取資源。單元測試應該獨立而且穩定，當然不應該在單元測試中訪問網絡資源，所以需要“篡改”fetch函數的行為，感謝sinon，這樣篡改工作非常簡單：

```js
describe('fetchWeather', () => {
  let stubbedFetch;
  beforeEach(() => {
    stubbedFetch = stub(global, 'fetch');
  });
  afterEach(() => {
    stubbedFetch.restore();
  })
});
```

透過sinon提供的stub函數來“篡改”函數行為，stub第一個參數是一個對象，第二個參數是這個函數的字符串名，返回一個stub對象，透過這個stub上的對象可以指定被“篡改”函數的行為。透過stub函數實際上可以“篡改”任何一個函數的行為，對fetch這樣的全局函數也不例外，因為全局函數相當於在global對象上的一個函數。

需注意的是，每一個單元測試都應該把環境清理乾淨。所以對一個測試套件慣常的做法是在beforeEach中創造stub對象，在afterEach函數中用stub對象的restore方法恢復被“篡改”函數原本的行為。

fetchWeather函數的測試用例代碼如下：

```js
it('should dispatch fetchWeatherSuccess action type on fetch success', () => {
  const mockResponse = Promise.resolve({
    status: 200,
    json: () => Promise.resolve({
      weatherinfo: {}
    })
  });
  stubbedFetch.returns(mockResponse);

  return store.dispatch(actions.fetchWeather(1)).then(() => {
    const dispatchedActions = store.getActions();
    expect(dispatchedActions.length).toBe(2);
    expect(dispatchedActions[0].type).toBe(actionTypes.FETCH_STARTED);
    expect(dispatchedActions[1].type).toBe(actionTypes.FETCH_SUCCESS);
  });
});
```

在上面的測試用例中，利用beforeEach中創造的stub對象stubbedFetch規定fetch函數被調用時返回一個指定的mockResponse，這樣，fetchWeather函數中的fetch函數行為就完全被操縱，畢竟我們並不需要測試fetch函數的行為，所以只需要讓fetch函數返回我們想要的結果就行。

fetchWeather是一個異步action構造函數，測試一個涉及異步的被測函數時，就不能像測試普通函數一樣預期被測函數執行結束就可以驗證結果了。

上面例子中，雖然mockResponse是透過Promise.resolve函數產生的“創造即已經完結的”Promise對象，但是其then指定的函數依然要等到Node.js的下一個時鐘週期才執行，所以也不能在fetchWeather函數執行完之後就認為異步操作就已經完結。

在Jest中測試異步函數有兩種方法，一種是代表測試用例的函數增加一個參數，習慣上這個參數叫做done，Jest發現這個參數存在就會認為這個參數是一個回調函數，只有這個回調函數被執行才算是測試用例結束。

測試用例使用done參數的例子如下：

```js
it('should timeout', (done) => {
});
```

上面例子中，這個it測試用例最終會因為超時而失敗，因為沒有任何代碼去調用done函數。

除了使用done參數，還有另一個方法，就是讓測試用例函數返回一個Promise對象，這樣也等於告訴Jest這個測試用例是一個異步過程，只有當返回的Promise對象完結的時候，這個測試用例才算結束。

注意，fetchWeather的測試用例返回的並不是store.dispatch函數返回的那個Promise對象，而是經過then函數產生的一個新的Promise對象，所以當Jest獲取的Promise對象被認為是完結時，在then函數中的所有斷言語句絕對已經執行完畢了。

斷言部分我們使用了redux-mock-store所創造Store的getActions函數，注意這個函數並不是Redux的功能，但能夠幫助我們讀取到所有派發到Store上的actions，在單元測試中非常適用。

### reducer測試

reducer是純函數，所以測試非常簡單，所要做的就是創造state和action對象，傳遞給reducer函數，驗證結果即可。

*weather_redux/test/weather/reducer.test.js*中，代碼如下：

```js
it('should reutrn loading status', () => {
  const action = actions.fetchWeatherStarted();
  const newState = reducer({}, action);
  expect(newState.status).toBe(Status.LOADING);
});
```

### 無狀態React組件測試

對於一個無狀態的React組件，可以使用Enzyme的shallow方法來渲染，因為shallow方法只渲染一層，所以不會牽涉子組件的React組件渲染，將單元測試專注於被測試的React組件本身。

以*todo_with_selector/test/filter/views/filter.test.js*：

```js
import React from 'react';
import {shallow} from "enzyme";

import Filters from "../../../src/filter/views/filters";
import Link from "../../../src/filter/views/link";
import {FilterTypes} from "../../../src/constants";

describe('filters', () => {
  it('should render three link', () => {
    const wrapper = shallow(<Filters/>);

    expect(wrapper.contains(<Link filter={FilterTypes.ALL}>{FilterTypes.ALL}</Link>)).toBe(true);
    expect(wrapper.contains(<Link filter={FilterTypes.COMPLETED}>{FilterTypes.COMPLETED}</Link>)).toBe(true);
    expect(wrapper.contains(<Link filter={FilterTypes.UNCOMPLETED}>{FilterTypes.UNCOMPLETED}</Link>)).toBe(true);
  });
});
```

習慣上，把Enzyme函數渲染的結果命名為wrapper，對wrapper可以使用contains函數判斷是否包含某個子組件。在這裡，shallow並沒有渲染產生子組件Link的DOM元素，所以完全可以用contains來判斷是否包含Link組件。

這種單元測試不深入渲染React子組件，主要的意義是可以簡化測試過程，因為React子組件的完全渲染可能引入其他的依賴關係。

設想一下，有一個Parent組件，只是一個和Redux無關的無狀態組件，Parent包含一個Child組件，但是Child組件透過react-redux連接到了Redux Store上。那麼，如果在測試Parent組件時要渲染Child組件，那就必須創造一個Store對象，還要用Provider創造一個Context。創造這樣的環境，對測試Parent組件本身沒有任何幫助。但是如果使用shallow淺層渲染，只要在渲染過程中知道創造了Child組件，傳遞給Child的prop都對，這就足夠了，至於Child功能是否正確，那就交給Child的單元測試去驗證，不是Parent單元測試的責任。

### 被連接的React組件測試

如果將應用狀態存放在Redux Store上，配合使用react-redux，所有有狀態的React組件都是透過connect函數產生的組件，被稱為“被連接的組件”。

完整測試案例在_todo_with_selector/test/todos/views/todoList.js_。

TodoList這樣一個組件依賴於一個Redux Store實例，而且能夠實實在在地提供內容，所以不再使用redux-mock-store。而是使用一個貨真價實的Redux Store，需要創造一個store：

```js
const store = createStore(
  combineReducers({
    todos: todosReducer,
    filter: filterReducer
  }), {
    todos: [],
    filter: FilterTypes.ALL
  }
);
```

為了將這個Store放在React Context，還需要創造Provider，使用Enzyme的mount方法渲染的是Provider包裏起來的TodoList組件，代碼如下：

```js
const subject = (
  <Provider store={store}>
    <TodoList/>
  </Provider>
);
const wrapper = mount(subject);
```

最終，透過調用store.dispatch函數派發action，然後就可以驗證wrapper對象上的渲染元素是否發生預期改變：

```js
store.dispatch(actions.addTodo('write more test'));
expect(wrapper.find('.text').text()).toEqual('write more test');
```

這個單元測試中，我們想要模擬一次完整的action對象處理週期。為了檢查新增代辦事項的DOM中text，就需要用mount函數而不是shallow函數。

上面創造Provider的過程看起來有一點麻煩，主要是因為TodoList組件還包含了TodoItem組件也是連接到Store組件，如果被測試組件並不包含任何其他鏈結到Store的子組件，那就可以直接在組件中用名為store的prop。

例如，對於TodoItem組件的單元測試，就可以在JSX中直接這樣寫，不用Provider：

```js
const subject = <TodoItem store={store} {...otherProps}/>;
const wrapper = mount(subject);
```

## 本章小節

本章介紹了單元測試的概念，說明了React和Redux應用可測試性強的原因，主要就是因為React和Redux功能可以分解成很多小的函數，這些函數很多還是純函數，容易測試。

選擇單元測試框架，可以使用Mocha+Chai組合，或者使用Jest。

回顧單元測試例子，可以看出來React和Redux的單元測試往往都非常直觀，幾乎可以認為是多餘的。的確，重要的不是代碼容易測試，而是程序的結構非常簡單，簡單到單元測試都顯的沒有必要的地步。