# Chap04. 模組化React和Redux應用

這一章，要介紹創建一個複雜一點的應用該如何做，包含以下內容：

- 模組化應用的要點
- 代碼文件的組織方式
- 狀態樹的設計
- 開發輔助工具

## 模組化應用要點

React適合於視圖層面的東西，Redux則適合擔當應用狀態的管理工作。

從架構出發。當我們開始一個新的應用的時候，有幾件事情是一定要考慮清楚的：

- 代碼文件的組織結構
- 確定模組的邊界
- Store的狀態樹設計

這三件事情，是構建一個應用的基礎。如果我們一開始深入思考這三件事，並做出合乎需要的判斷，可以在後面的路上省去很多麻煩。

本章開始，將建造一個“待辦事項” (Todo)應用，逐步完善這個應用。

在這個JavaScript框架層出不窮的時代，Todo應用幾乎就代替了傳統Hello
World應用的作用，每個框架問世的時候都會用一個Todo應用來展示自己的不同，不要小看這樣一個Todo應用，它非常適合用於技術展示。首先，這個應用的複雜度剛剛好；其次，這樣的功能非常利於理解，恰好能夠考驗一個JavaScript框架的表達能力。

磨刀不誤砍柴工，先思考上面提到的三個問題。

## 代碼文件的組織方式

### 按角色組織

MVC框架，通常有這樣一種代碼的組織方式，文件目錄列表如下：

```bash
controllers/
  todoController.js
  filterController.js
models/
  todoModel.js
  filterModel.js
views/
  todo.js
  todoItem.js
  filter.js
```

這種組織代碼的方式，叫做“按角色組織”(Organized by Roles)。

因為MVC這種“按角色組織”代碼文件的影響，在Redux應用的構建中，就有這樣一種代碼組織方法，文件目錄列表如下：

```bash
reducers/
  todoReducer.js
  filterReducer.js
actions/
  todoActions.js
  filterActions.js
components/
  todoList.js
  todoItem.js
  filter.js
containers/
  todoListContainer.js
  todoItemContainer.js
  filterContainer.js
```

- reducers目錄包含所有Redux的reducer
- actions目錄包含所有action構造函數
- components目錄包含所有的傻瓜組件
- containers目錄包含所有的容器組件

在互聯網上，很多教學資料也是按照“按角色組織”的方法管理Redux應用。雖然“按照角色組織”的方式看起來不錯，但實際上非常不利於應用的擴展。

MVC框架的經歷，當你需要對一個功能進行修改，雖然這個功能只是針對某一個具體的應用模組，但是卻牽扯到MVC中的三個角色Controller、Model和View，不管你用的是什麼樣的編輯器，你都得費點勁才能在這三個目錄之間跳轉，或需要滾動文件列表跳過無關的分發器文件才能找到你想要修改的那一個分發器文件。

這真的就是浪費時間。

如果說MVC框架下，因為三個角色之間的交叉關係，也只能默默接受，那麼在Redux框架下，我們已經有機會實行嚴格模組化的思維，就應該好好想一想更好的組織文件的方式。

### 按功能組織

Redux應用適合於“按功能組織”(Organized by
Feature)，也就是把完成同一個應用功能的代碼放在一個目錄下，一個應用功能包含多個角色的代碼。在Redux中，不同的角色就是reducer、actions和views，而應用功能對應的就是用戶介面上的交互模組。

拿Todo應用為例子，這個應用的兩個基本功能就是TodoList和Filter，所以代碼就這樣組織，文件列表如下：

```bash
todoList/
  actions.js
  actionTypes.js
  index.js
  reducer.js
  views/
    component.js
    container.js
filter/
  actions.js
  actionTypes.js
  index.js
  reducer.js
  views/
    component.js
    container.js
```

每個基本功能對應的其實就是一個功能模組，每個功能模組對應一個目錄，這個例子中分別是todoList和filter，每個目錄下包含同樣名字的角色文件：

- actionTypes.js定義action類型
- actions.js定義action構造函數，決定了這個功能模組可以接受的動作
- reducer.js定義這個功能模組如何相應actions.js中定義的動作
- views目錄，包含這個功能模組中所有的React組件，包括傻瓜組件和容器組件
- index.js這個文件把所有的角色導入，然後統一導出

在這種組織方式下，當你要修改某個功能模組代碼的時候，只要關注對應的目錄就行了，所有需要修改的代碼文件都能在這個目錄下找到。

表面上看，“按照角色組織”還是“按照功能組織”只是一個審美的問題。也許你覺得自己已經習慣了MVC世界的“按照角色組織”的方式，也許你已經有一套很厲害的代碼編輯器可以完美解決在不同目錄下尋找代碼文件困難的問題。但是，開發Redux應用你依然應該用“按照功能組織”的方式，看下一條“確定模組的邊界”就明白了。

## 模組接口

>在最理想的情況下，我們應該透過增加代碼就能增加系統的功能，而不是透過對現有代碼的修改來增加功能。 ——Robert C. Martin

這句話闡述了模組化軟件的要求。當然要達到這種“最理想的情況”還是有點難度，但次這個目標直得我們去努力奮鬥，而React和Redux這個輔助工具可以幫助我們在這個目標上邁進一大步。

不同功能模組之間的依賴關係應該簡單且清晰，也就是所謂的保持模組之間的低耦合性；一個模組應該把自己的功能封裝得很好，讓外界不要太依賴與自己內部的結構，這樣不會因為內部的變化而影響外部模組的功能，這就是所謂高內聚性。

React組件本身應該具有低耦合性和高內聚性的特點，不過，在Redux的遊樂場中，React組件扮演的就是一個視圖的角色，還有reducer、actions這些角色參與這個遊戲。對於整個Redux應用而言，整個由模組構成，但是模組不再是React組件，而是由React組件加上相關reducer和actions構成一個小整體。

以我們要實現的Todo應用為例，功能模組就是todoList和filter，這兩個功能模組分別用各自的React組件、reducer和action定義。

可以預期每個模組之間會有依賴關係，比如filter模組想要使用todoList的action構造函數和視圖，一種導入的寫法：

```js
import * as actions from '../todoList/actions';

import container as TodoList from '../todoList/views/container';
```

這種寫法當然能夠完成功能，但是卻非常不合理，因為這讓filter模組依賴於todoList模組的內部結構，而且直接伸手到todoList內部去導入想要的部分。

各功能模組內文件名稱沒硬性要求，有的開發者views目錄會叫做components；容器組件文件名稱叫做container.js，根據開發者也有可能叫做TodoList。

現在既然我們把一個目錄看作一個模組，那麼我們要做的是明確這個模組對外的接口，而這個接口應該實現把內部封裝起來。

請注意我們todoList和filter模組目錄，都有一個index.js文件，這個文件就是我們的模組接口。

比如，在*todoList/index.js*中，代碼如下：

```js
import * as actions from './actions';
import reducer from './reducer';
import view from './views/container';

export {actions, reducer, view};
```

如果filter中的組件想要使用todoList中的功能，應該導入todoList這個目錄，因為導入一個目錄的時候，默認導入的就是這個目錄下的index.js文件，index.js文件中導出的內容，就是這個模組想要公開出來的接口。

>*注意**：  
>雖然每個模組目錄下都會有一個actionTypes.js文件定義action類型，但通常不會把actionTypes中內容作為模組的接口之一導出，因為action類型只有兩個部分依賴，一個是reducer，一個是action構造函數，而且只有當前模組的reducer和action構造函數才會直接使用action類型。模組之外，不會關心這個模組的action類型，如果模組之外要使用這個模組的動作，也只需要直接使用action構造函數就行。

下面就是對應的導入todoList的代碼：

```js
import {actions, reducer, view as TodoList} from '../todoList';
```

當我們想要修改todoList的內部代碼結構，比如把views目錄改名為components目錄，或者把container.js改名為TodoListView.js或其他有意義的名字，所要做的只是修改TodoList目錄下的index.js目錄，而這個文件export出來的內容不會有任何改變，也就是說對導入todoList的代碼不用任何改變。這就是我們確定模組邊界想要達到的目的。

還有一種導出模組接口的方式，是不以命名式export的方式導出模組接口，而是以export default的方式默認導出，就像這樣的代碼：

```js
import * as actions from './actions';
import reducer from './reducer';
import view from './views/container';

export default {actions, reducer, view};
```

如果像上面導出，那麼導入時的代碼會有一點區別，ES6語法中，export default和export兩種導出方式的導入方式也會不同，代碼如下：

```js
import TodoListComponent from '../todoList';

const reducer = TodoListComponent.reducer;
const actions = TodoListComponent.actions;
const TodoList = TodoListComponent.view;
```

本書中，全部使用export的方式，因為從上面的代碼看得出來，使用export
default的方式，在導入的時候不可避免要用多行代碼才能得到actions、reducer和view，而用導入命名式export只用一行就可以搞定。

導入actions的語句和導入view和reducer不一樣：

```js
import * as actions from './actions';
```

我們預期actions.js是按照命名式export，原因是actions.js可能會導出很多action構造函數，命名式導出是為了導入actions方便。對於view和reducer，一個功能模組絕對只有一個根視圖模組，一個功能模組也只應該只有一個導出的reducer，所以它們兩個在各自代碼文件是以默認方式導出的。

## 狀態樹的設計

“代碼文件組織結構”和“確定模組的邊界”更多的只是確定規矩，然後在每個應用中我們只要遵循這個規矩就足夠了，要注意的第三點：“Store上狀態樹的設計”，更像是一門技術，需要動一點腦子。

因為所有的狀態都存在Store上，Store的狀態樹設計，直接決定要寫哪些reducer，還有action怎麼寫，所以是程序邏輯的源頭。

我們認為狀態樹設計要遵循如下幾個原則：

- 一個模組控制一個狀態節點
- 避免冗余資料
- 樹形結構扁平

讓我們逐個解釋這些原則。

### 一個狀態節點只屬於一個模組

與其說是規則，不如說是Redux中模組必須遵守的限制，完全無法無視這個限制。

在Redux應用中，Store上每個state都只能透過reducer來更改，而我們每個模組都有機會導出一個自己的reducer，這個導出的reducer只能最多更改Redux的狀態樹上一個節點下的資料，因為reducer之間對狀態樹上的修改權是互斥的，不可能讓兩個reducer都可以修改同一個狀態樹上的節點。

Redux Store上的全部狀態，在任何時候，對任何模組都是開放的，透過store.getState()總能夠讀取當整個狀態樹的資料，但只能更新自己相關那一部分模組的資料。

### 避免冗余資料

冗余資料是一致性的大敵，如果在Store上存儲冗余資料，那麼維持不同部分資料一致就是一大問題。

關連式資料庫，對資料結構的“範式化”，其實就是在去除資料的冗余；而NoSQL運動，提倡的就是資料存儲中“去範式化”，對資料結構的處理與關聯式資料庫正好相反，利用資料冗余來減少讀取資料庫時的資料關聯工作。

導向用戶的應用出於性能考量，傾向於直接使用“去範式化”的應用。但是帶來的問題就是維持資料一致性就會困難。

選擇資料庫的問題上，SQL關聯式資料庫或者NoSQL類型資料庫要根據應用特點，這問題不是我們要討論的。但是要強調的是，前端Redux的Store，一定要避免資料冗余的出現。

並非說Redux不需考慮性能問題，而是相對於性能問題，資料一致性才更加重要。

後面會提到，就算使用“範式化”的無冗余資料結構，借助reselector等工具一樣可以獲得很高的性能。

### 樹形結構扁平

如果樹形結構的層次很深，往往意味著樹形很複雜，一個很複雜的狀態樹是難以管理的。

從代碼的角度出發，深層次樹型狀態結構會讓代碼冗長。

一個樹形由上而下依次有A、B、C、D四個節點，要訪問D，但不敢保證A、B、C三個節點真的存在，為防止運行出錯，代碼就要考慮所有可能：

```js
const d = state.A && state.A.B && state.A.B.C && state.A.B.C.D;
```

相信沒有開發者會願意寫很多類似上面這樣的代碼。

## Todo應用實例

從介面上看應由三個部分組成：

- 待辦事項的列表
- 增加新待辦事項的輸入框和按鈕
- 待辦事項過濾器，可以選擇過濾不同狀態的待辦事項

最後可確定有todos和filter模組，todos包含第一部分和第二部分的功能。

我們遵循“按照功能組織”的原則來設計代碼，各模組之間只能假設其他模組包含index.js文件，要引用模組只能導入index.js，index.js這是模組的邊界。文件結構：

```bash
todos/
  index.js
filter/
  index.js
```

### Todo狀態設計

Todo應用狀態，明顯用一個陣列很合適，所以我們狀態樹上應該有一個表示待辦事項的陣列。

至於每個待辦事項，應該用一個對象代表。這個對象肯定要包含文字，記錄待辦事項的內容，布林欄位紀錄是否完成的狀態。當我們把一個待辦事項標記為“已完成”或“未完成”時，必須要能唯一確定一個待辦事項對象，沒有規則說一個待辦事項的文字必須唯一，所以還需一個欄位來標示一個待辦事項，所以一個待辦事項的對象格式是這樣。

```
{
  id: //  唯一標示
  text: // 待辦事項內容
  completed: // 布林值，標示待辦事項是否已完成
}
```

過濾器選項設定介面有三個選擇：

- 全部待辦事項
- 已完成待辦事項
- 未完成待辦事項

看起來就像是列舉類型的結構，JavaScript只能用類似常量標示符的方式來定義三種狀態：ALL、COMPLETED和UNCOMPLETED。其值最簡單方式就是整數：

```js
const ALL = 0;
const COMPLETED = 1;
const UNCOMPLETED = 2;
```

但這樣會導致debug或log不容易代表什麼意思，所以，開發中一個慣常的方法，就是把這些列舉型的常量定義為字符串：

```js
const ALL = 'ALL';
const COMPLETED = 'completed';
const UNCOMPLETED = 'uncompleted';
```

綜合來看，Todo應用的Store狀態樹大概是這樣：

```js
{
  todos: [
    {
      text: 'First todo',
      completed: false,
      id: 0
    },
    {
      text: 'Second todo',
      completed: false,
      id: 1
    }
  ]
  filter: 'all'
}
```

在應用的入口文件*src/index.js*，一樣用Provider包住最頂層的TodoApp模組，讓store可以被所有組件訪問到：

```js
ReactDOM.render(
  <Provider store={store}>
    <TodoApp/>
  </Provider>,
  document.getElementById('root'));
```

而在頂層模組src/TodoApp.js中，所要做的只是把兩個關鍵視圖顯示出來：

```js
import Reac from 'react';

import {view as Todos} from './todos/';
import {view as Filter} from './filter/';

function TodoApp() {
  return (
    <div>
      <Todos/>
      <Filter/>
    </div>
  )
}

export default TodoApp;
```

### action構造函數

確定好狀態樹的結構後，接下來就可以寫action的構造函數了。

todos和filter目錄下，都要分別創建actionTypes.js和actions.js文件。

_src/todos/actionTypes.js_，我們定義的是todos支持的action類型。支持對待辦事項的增加、反轉和刪除三種action類型：

```js
export const ADD_TODO = 'TODO/ADD';
export const TOGGLE_TODO = 'TODO/TOGGLE';
export const REMOVE_TODO = 'TODO/REMOVE';
```

和index.js中使用命名式導出而不用默認導出一樣，在actionTypes中我們也使用命名式導出，這樣，使用actionTypes的文件可以這樣寫：

```js
import {ADD_TODO, TOGGLE_TODO, REMOVE_TODO} from './actionTypes.js';
```

也同樣為了便於debug和輸出到log裡面查看清晰，所有action類型的值都是字符串，字符串還有個好處是可以直接透過===來比較是否相等，其他對象使用===則要求必須引用同一個對象。

>**注意**：  
>嚴格說來，使用Symbol代替字符串表示這樣的列舉值更合適，但有些browser不支持Symbol，所以在這不做深入探討。

action類型字符串值都有一個唯一的前綴，以避免命名衝突。

_src/todos/actions.js_：

```js
import {ADD_TODO, TOGGLE_TODO, REMOVE_TODO} from "./actionTypes";

let nextTodoId = 0;

export const addTodo = (text) => ({
  type: ADD_TODO,
  completed: false,
  id: nextTodoId++,
  text
});

export const toggleTodo = (id) => ({
  type: TOGGLE_TODO,
  id
});

export const removeTodo = (id) => ({
  type: REMOVE_TODO,
  id
});
```

Redux的action構造函數就是創造action對象的函數，返回的action對象中必有一個type字段代表action類型，還可能有其他欄位代表這個動作乘載的資料。

之後章節會改進唯一id的生成方法。

ES6允許簡寫為省去return，直接圓括號把返回的對象包起來就行。

### 組合reducer

在todos和filter目錄下，各有一個reducer.js文件定義兩個功能模組的reducer。

Redux的createStore只接受一個reducer，但可以把多個reducer組合起來，成為一體，然後被createStore函數接受。

_src/Store.js_：

```js
import {createStore, combineReducers} from 'redux';

import {reducer as todoReducer} from './todos';
import {reducer as filterReducer} from './filter';

const reducer = combineReducers({
  todos: todoReducer,
  filter: filterReducer
});

export default createStore(reducer);
```

我們使用Redux提供的一個函數combineReducers來把多個reducer函數合成一個reducer函數。

combineReducers函數接受一個對象作為參數，參數對象的每個欄位名對應了State狀態上的欄位名(上面例子分別是todos和filter)，每個欄位的值都是reducer函數(todoReducer和filterReducer)，combineReducers函數返回一個新的reducer函數，當這個新的reducer函數被執行時，會把傳入的state參數對象拆開處理，todo欄位下的子狀態交給todoReducer，filter欄位下的子狀態交給filterReducer，然後再把這兩個調用的返回結果合併成一個新的state，作為整體reducer函數的返回結果。

現在來看功能模組reducer，會發現state的值不是Redux上那個完整的狀態，而是狀態上對應自己的那一部分。

_src/todos/reducer.js_，state參數對應的是Store上todos欄位的值，默認值是一個陣列，reducer函數往往就是一個以action.type為條件的switch語句構成，代碼模式如下：

```js
import {ADD_TODO, TOGGLE_TODO, REMOVE_TODO} from "./actionTypes";

export default (state = [], action) => {
  switch (action.type) {
    // 針對action.type所有可能值的case語句
  }
};
```

先看ADD_TODO這種action類型的處理：

```js
case ADD_TODO:
  return [
    {
      id: action.id,
      text: action.text,
      completed: action.completed,
    },
    ...state
  ];
```

我們不直接使用熟悉的陣列push或unshift操作，因為push和unshift會改變原來那個陣列，reducer必須是一個純函數，純函數不能有任何副作用，包括不能修改參數代碼。

TOGGLE_TODO這種action類型的處理：

```js
case TOGGLE_TODO:
  return state.map((todoItem) => {
    if (todoItem.id === action.id) {
      return {...todoItem, completed: !todoItem.completed};
    } else {
      return todoItem;
    }
  });
```

像上面的代碼，返回了一個新的對象，所有欄位都和todoItem一樣，只是completed欄位和todoItem中的completed布林類型值相反。

REMOVE_TODO這種action類型的處理：

```js
case REMOVE_TODO:
  return state.filter((todoItem) => (todoItem.id !== action.id));
```

對於刪除操作，我們使用陣列的filter方法，將id匹配的待辦事項過濾掉，產生一個新的陣列。

最後，reducer中的switch語句一定不要漏掉了default的條件：

```js
default: {
  return state;
}
```

因為reducer函數會接收到任意action，包括他不感興趣的action，這樣就會執行default中的語句，應該將state原樣返回。

_src/filter/reducer.js_：

```js
import {SET_FILTER} from "./actionTypes";
import {FilterTypes} from "../constants";

export default (state = FilterTypes.ALL, action) => {
  switch (action.type) {
    case SET_FILTER:
      return action.filterType;
    default:
      return state;
  }
};
```

這個reducer所做的就是把Redux Store上filter欄位的值設為action對象上的filter值。

我們來總結一下Redux的組合reducer功能，利用combineReducers可以把多個只針對局部狀態的“小的”reducer合併為一個操縱整個狀態樹的“大的”reducer，更妙的是，沒有兩個“小的”reducer會發生衝突，因為無論怎麼組合，狀態樹上一個子狀態都只會被一個reducer處理，Redux就是用這種方法隔絕了各個模組。

很明顯，無論我們有多少“小的”reducer，也無論如何組合，都不用在乎他們被調用的順序，因為調用順序和結果沒有關係。

### Todo視圖

對於一個功能模組，定義action類型、action構造函數和reducer基本上各用一個文件就行，約定成俗分別放在模組目錄下(actionTypes.js、actions.js和reducer.js文件中)。但是，一個模組涉及的視圖文件往往包含多個，因為對於充當視圖的React組件，我們往往會讓一個React組件的功能精良、小，導致視圖分布在多個文件之中。

既然有多個文件，那麼也沒太大必要保持統一的文件名，反正模組導出的只是一個view欄位，在模組內部只要文件名能夠表達視圖的含義就行。

#### 1. todos視圖

_src/todos/views/todos.js_：

```js
import React from 'react';
import AddTodo from './addTodo';
import TodoList from './todoList';

export default () => (
  <div className="todos">
    <AddTodo/>
    <TodoList/>
  </div>
);
```

就是把AddTodo組件和TodoList兩個組件擺放在一個div中，用一個函數表示成無狀態組件就可以了。

在todos的頂層div添加了className屬性，值為字符串todos，最後產生的DOM元素上就會有CSS類todos。這個類是為了將來定製樣式而使用的，不影響功能。

>**注意**：
>JSX中指定元素的類名用的是className屬性，說到底JSX最終要轉譯為JavaScript代碼，而JavaScript中class是一個保留字，所以JavaScript透過操作DOM元素的className屬性來訪問元素的類。

對於AddTodo組件，涉及處理用戶的輸入。當用戶點擊“增加”按鈕或者在輸入欄input中直接回車鍵的時候，要讓JavaScript讀取到input這個DOM元素的value值，React為了支持這種方法，提供一個叫ref的功能。

在*src/todos/views/addTodo.js*中，我們先來看其中render函數對ref的用法：

```js
render() {
  return (
    <div className="add-todo">
      <form onSubmit={this.onSubmit}>
        <input className="new-todo" ref={this.refInput}/>
        <button className="add-btn" type="submit">
        添加
        </button>
      </form>
    </div>
  );
}
```

當一個包含ref屬性的組件完成裝載(mount)過程的時候，會看一看ref屬性是不是一個函數，如果是，就會調用這個函數，參數就是這個組件代表的DOM元素。注意，是一個DOM元素，不是Virtual
DOM元素，透過這種方法，我們的代碼可以訪問到實際的DOM元素。

input元素的ref屬性是AddTodo組件的一個成員函數refinput，當input元素完成裝載後，refInput就會被調用：

```js
refInput: node => {
  this.input = node;
}
```

refInput把這個node記錄在成員變涼input中。

於是，當組件完成mount後，就可透過this.input來訪問那個input元素。這是一個DOM元素，可使用任何DOM
API訪問元素內容，this.input.value就可以直接讀取當前的用戶輸入。

```js
onSubmit: ev => {
  ev.preventDefault();
  
  const input = this.input;
  if (!input.value.trim()) {
    return;
  }
  this.props.onAdd(input.value);
  input.value = '';
}
```

HTML中，一個form表單被提交的default行為會引發網頁跳轉，在React應用中當然不希望網頁跳整發生，所以透過調用參數ev的preventDefault函數取消掉瀏覽器的默認提交行為。

文件中的AddTodo組件是一個內部組件，按說應該是一個傻瓜組件，但是AddTodo不是一個只有一個render函數的組件，AddTodo甚至有一個邏輯比較複雜的onSubmit函數，為什麼不把這部分邏輯提取到外面的容器組件？

其實可以把onSubmit的邏輯提取到mapDispatchToProps中，但是，讓AddTodo組件外面的mapDispatchToProps訪問到AddTodo組件裡面的ref很困難，得不償失。

使用ref實際上就是直接觸及了DOM元素，與我們想遠離DOM是非之地的想法相斥，雖然React提供了這功能，但還是要謹慎使用，如果要用，也盡量讓ref不要跨越組件的邊界。

所以，我們把透過ref訪問input.value放在內部的AddTodo中，但是把調用dispatch派發action對象的邏輯放在mapDispatchToProps中，兩者一個主內一個主外，各司其職，不要混淆。

>**注意**：  
>並不是只有ref一種方法才能夠訪問input元素的value，我們在這裡使用ref主要是展示一下React的這個功能，後面章節會介紹更加可控的方法。

注意，對於AddTodo，沒有任何需要從Redux
Store的狀態延伸的屬性，所以最後一行的connect函數第一個參數mapStateToProps是null，只是用了第二個參數mapDispatchToProps。

在*src/todos/views/addTodo.js*中表示AddTodo標示符代表的組件和*src/todos/views/todos.js*中AddTodo標示符代表的組件不一樣，後者是前者用react-redux包裏之後的容器組件。

```js
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import {addTodo} from '../actions';

class AddTodo extends Component {

  constructor() {
    super(...arguments);
  }

  onSubmit = ev => {
    ev.preventDefault();

    const input = this.input;
    if (!input.value.trim()) {
      return;
    }

    this.props.onAdd(input.value);
    input.value = '';
  };

  refInput = node => {
    this.input = node;
  };


  render() {
    return (
      <div className="add-todo">
        <form onSubmit={this.onSubmit}>
          <input className="new-todo" ref={this.refInput}/>
          <button className="add-btn" type="submit">
            添加
          </button>
        </form>
      </div>
    )
  }

}

AddTodo.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => {
  return {
    onAdd: (text) => {
      dispatch(addTodo(text));
    }
  }
};

export default connect(null, mapDispatchToProps)(AddTodo);
```

接下來看看待辦事項列表組件，定義在*src/todos/view/todoList.js*中，在渲染TodoList時，我們的todos屬性是一個陣列，而陣列元素的個數是不確定的，這就涉及如何渲染數量不確定組件的問題，TodoList作為無狀態組件代碼如下：

```js
const TodoList = ({todos, onToggleTodo, onRemoveTodo}) => {
  return (
    <ul className="todo-list">
      {
        todos.map(item => (
          <TodoItem
            key={item.id}
            text={item.text}
            completed={item.completed}
            onToggle={() => onToggleTodo(item.id)}
            onRemove={() => onRemoveTodo(item.id)}
          />
        ))
      }
    </ul>
  );
};
```

這段代碼中的TodoList真的就只是一個無狀態的傻瓜組件了，對於傳遞進來的todos屬性，預期是一個陣列，透過一個陣列的map函數轉化為TodoItem組件的陣列。

很自然會想用循環來產生同樣數量的TodoItem組件實例，但是，並不能在JSX中使用for或者while這樣的循環語句。因為，JSX可以使用任何形式的JavaScript表達式，只要JavaScript表達式出現在符號{}之間，但是也只能是JavaScript"表達式"，for或while產生的是"語句"而不是表達式。

歸根到底，JSX最終會被babel轉移成一個嵌套的函數調用，在這函數調用中自然無法插入一個語句進去，所以當我們想要在JSX中根據陣列產生動態數量的組件實例，就應該使用陣列的map方法。

還有一點很重要，關於動態數量的子組件，每個子組件都必須要帶上一個key屬性，這個key屬性的值一定要是能夠唯一標示這個子組件的值。

TodoList的mapStateToProps方法須根據Store上的filter狀態決定todos狀態上取那些元素來顯示，這個過程涉及對filter的switch判斷。為防止mapStateToProps方法過長，我們將這個邏輯提取到selectVisibleTodos函數中：

```js
const selectVisibleTodos = (todos, filter) => {
  switch (filter) {
    case FilterTypes.ALL:
      return todos;
    case FilterTypes.COMPLETED:
      return todos.filter(item => item.completed);
    case FilterTypes.UNCOMPLETED:
      return todos.filter(item => !item.completed);
    default:
      throw new Error('unsupported filter');
  }
};

const mapStateToProps = (state) => {
  return {
    todos: selectVisibleTodos(state.todos, state.filter)
  };
};
```

最後，我們看TodoList的mapDispatchToProps文件：

```js
const mapDispatchToProps = (dispatch) => {
  return {
    onToggleTodo: (id) => {
      dispatch(toggleTodo(id));
    },
    onRemoveTodo: (id) => {
      dispatch(removeTodo(id));
    }
  }
};
```

在TodoList空間中，看mapDispatchToProps函數產生的兩個新屬性onToggleTodo和onRemoveTodo的代碼遵循一樣的模式，都是把接收到的參數作為參數傳遞給一個action構造函數，然後用dispatch方法把產生的action對象派發出去，這看起來是重複代碼。

實際上，Redux已經提供一個bindActionCreators方法來消除這樣的重複代碼，顯而易見很多mapDispatchToProps要做的事情只是把action構造函數和prop關聯起來，所以直接以prop名為欄位名，以action構造函數為對應欄位值，把這樣的對象傳遞給bindActionCreators就可以了

```js
const mapDispatchToProps = (dispatch) => bindActionCreators({
  onToggleTodo: toggleTodo,
  onRemoveTodo: removeTodo
}, dispatch);
```

更進一步，可以直接讓mapDispatchToProps是一個prop到action構造函數的映射，這樣連bindActionCreators函數都不用：

```js
const mapDispatchToProps = {
  onToggleTodo: toggleTodo,
  onRemoveTodo: removeTodo
};
```

上面定義的mapDispatchToProps傳給connect函數，產生的效果和之前的寫法完全一樣。

我們再來看定義TodoItem的*src/todos/views/todoItem.js*文件：

```js
import React, {PropTypes} from 'react';

const TodoItem = ({onToggle, onRemove, completed, text}) => (
  <li
    className="todo-item"
    style={{
      textDecoration: completed ? 'line-through' : 'node'
    }}>
    <input className="toggle" type="checkbox" checked={completed ? "checked" : ""} readOnly onClick={onToggle}/>
    <label className="text">{text}</label>
    <button className="remove" onClick={onRemove}>x</button>
  </li>
);

TodoItem.propTypes = {
  onToggle: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired
};

export default TodoItem;
```

這裡TodoItem就是一個無狀態的組件。

#### 2. filter視圖

對於過濾器，我們有三個功能類似的鏈接，很自然就會想到把鏈接相關的功能提取出來，放在一個Link的組件中。

_src/filter/views/filter.js_：

```js
import React from 'react';

import Link from './link';
import {FilterTypes} from "../../constants";

const Filters = () => {
  return (
    <p className="filters">
      <Link filter={FilterTypes.ALL}>{FilterTypes.ALL}</Link>
      <Link filter={FilterTypes.COMPLETED}>{FilterTypes.COMPLETED}</Link>
      <Link filter={FilterTypes.UNCOMPLETED}>{FilterTypes.UNCOMPLETED}</Link>
    </p>
  );
};

export default Filters;
```

這個filter是無狀態函數，列出三個過濾器，把實際工作交給了Link組件。

_src/filter/views/link.js_：

```js
const Link = ({active, children, onClick}) => {
  if (active) {
    return <b className="filter selected">{children}</b>
  } else {
    return (
      <a href="#" className="filter not-selected" onClick={(ev) => {
        ev.preventDefault();
        onClick();
      }}>
        {children}
      </a>
    );
  }
};
```

我們使用了一個特殊屬性children，對於任何一個React組件都可訪問這樣一個屬性，代表的是被包裏住的子組件。在render函數中把children屬性渲染出來，是慣常的組合React組件的方法。

Link的mapStateToProps和mapDispatchToProps函數都很簡單：

```js
const mapStateToProps = (state, ownProps) => {
  return {
    active: state.filter === ownProps.filter
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: () => {
    dispatch(setFilter(ownProps.filter));
  }
});
```

### 樣式

_src/todos/views/style.css_：

```css
.todos {
    width: 500px;
    font-size: 30px;
}

.add-todo {
    position: relative;
}

.add-todo .new-todo {
    display: block;
    margin: 0 0 0 50px;
    font-size: 30px;
    -webkit-font-smoothing: antialiased;
    -moz-font-smoothing: antialiased;
    font-smoothing: antialiased;
}

.add-todo .add-btn {
    font-size: 30px;
    position: absolute;
    top: 0;
    right: 0;
}

.todo-list {
    list-style: none;
    margin: 0;
    padding: 0;

    font-size: 30px;
}


.todo-item {
    position: relative;
    height: 60px;
    line-height: 50px;
    vertical-align: middle;
}

.todo-item .toggle {
    height: 40px;
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    top: 0;
    bottom: 0;
}

.todo-item .toggle:after {
    margin: 10px 0 0 0;
    content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-10 -18 100 135"><circle cx="50" cy="50" r="50" fill="none" stroke="#ededed" stroke-width="3"/></svg>');
}

.todo-item .toggle:checked:after {
    content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-10 -18 100 135"><circle cx="50" cy="50" r="50" fill="none" stroke="#bddad5" stroke-width="3"/><path fill="#5dc2af" d="M72 25L42 71 27 56l-4 4 20 20 34-52z"/></svg>');
}

.todo-item .text {
    margin: 0 0 0 50px;
    height: 40px;
}

.todo-item .remove {
    border: 0;
    background: 0;
    display: none;
    position: absolute;
    top: 0;
    right: 10px;
    bottom: 0;
    width: 40px;
    height: 40px;
    font-size: 30px;
    color: #cc9a9a;
    margin-bottom: 11px;
    transition: color 0.2s ease-out;
    -webkit-appearance: none;
    appearance: none;
}

.todo-item:hover .remove {
    display: block
}

.todo-item .remove:hover {
    color: #af5b5e;
}
```

_src/filters/views/style.css_：

```css

```

為讓定義的樣式產生效果，在Todos組件的最頂層視圖文件*src/todos/views/todos.js*添加下列代碼：

```js
import './style.css';
```

在React應用中，通常使用webpack來完成對JavaScript的打包，不過webpack不只能夠處理JavaScript，它能夠處理CSS、SCSS甚至圖片文件，因為在webpack眼裡，一切文件都是"模組"，透過文件的import或require函數調用就可以找到文件之間的使用關係，只要被import就會被納入最終打包的文件中，即使import的是一個CSS文件。

把CSS文件用import語句導入，webpack默認的處理方式是將CSS文件的內容嵌入最終的打包文件bundle.js中，這毫無疑問會讓打包文件變得更大，但是應用所有的邏輯都被包含在這個文件中了，便於部署。

如果不希望將CSS和JavaScript混在一起，也可在webpack透過配置完成，在webpack的loader中使用extract-text-webpack-plugin，就可以讓CSS文件在build時被放在獨立的CSS文件中，第11章會介紹定制webpack配置的方法。

選擇CSS和JavaScript一起還是分開打包，和代碼沒有任何躥系，這就是React的妙處。代碼中只需要描述"想要什麼"，至於最終"怎麼做"，可透過配置webpack獲得多重選擇。

如果使用SCSS語法，可以簡化上面的樣式代碼，但是creat-react-app產生的應用默認不支持SCSS，有興趣可透過eject方法編輯webpack配置，應用上SCSS加載器。

### 不使用ref

代碼透過React的ref功能來訪問DOM中元素，這種功能的需求往往來自提交表單的操作，在提交表單的時候，需要讀取當前表單中input元素的值。

毫無疑問，ref的用法非常脆弱，因為React的產生就是為了避免直接操作DOM元素，因為直接訪問DOM元素很容易產生失控的情況，現在為了讀取某個DOM元素的值，透過ref取得對元素的直接引用，不得不說，幹的並不漂亮。

有沒有更好的辦法?

有，可利用組件狀態來同步紀錄DOM元素的值，這種方法可以控制住組件不使用ref。

addTodo.js：

```js
onInputChange = ev => {
  this.setState({
    value: ev.target.value
  });
};

render() {
  return (
    <div className="add-todo">
      <form onSubmit={this.onSubmit}>
        <input className="new-todo" onChange={this.onInputChange} value={this.state.value}/>
        <button className="add-btn" type="submit">
          添加
        </button>
      </form>
    </div>
  )
}
```

然後看onSubmit函數的改變：

```js
onSubmit = ev => {
  ev.preventDefault();

  const {value} = this.state;
  if (!value.trim()) {
    return;
  }

  this.props.onAdd(value);
  this.setState({
    value: ''
  });
};
```

在產品開發中，應該盡量避免ref的使用，而換用這種狀態綁定的方法來獲取元素的值。

## 開發輔助工具

>工欲善其事，必先利其器。 ——《論語．衛靈公》

將來還會遇到更複雜的運用，是時候引入一些開發輔助工具了，必要的工具能夠大大提高我們的工作效率。

### chrome擴展包

- React Devtools：可檢視React組件的樹形結構
- Redux Devtools：可檢視Redux數據流，可以將Store狀態跳耀到任何一個歷史狀態，也就是所謂的時間旅行
- React Perf：可以發現React組件渲染的性能問題

### redux-immutable-state-invariant輔助包

我們曾經反覆強調過，每一個reducer函數都必須是一個純函數，不能修改傳入的參數state和action，否則會讓應用重新陷入不可預料的境地。

禁止reducer函數修改參數，這是一個規則，規則總會被無心違反，要如何避免？

有一個redux-immutable-state-invariant包，提供了一個Redux的中間件，能夠讓Redux在每次派發動作之後做一個檢查。如果發現某個reducer違反了作為一個純函數的規定擅自修改了參數state，就會給一個大大的錯誤警告，讓開發者意識到錯誤並修正。

中間件是可以增強Redux的Store實例功能的一種方法。

在產品環境中不啟用redux-immutable-state-invariant。

### 工具應用

對React Devtools來說，啟用只是安裝一個Chrome擴展包的事，但對於其餘幾個工作，我們代碼要做一些修改才能配合瀏覽器使用。

因為Store是Redux應用的核心，所以所有的代碼修改都集中在*src/Store.js*中

首先需要從Redux引入多個函數：

```js
import {createStore, combineReducers, applyMiddleware, compose} from 'redux';
```

為了使用React Perf插件，需要添加如下代碼：

```js
import Perf from 'react-addons-perf';

const win = window;

win.Perf = Perf;
```

在這裡把window賦值給模組級別變量win，是為了幫助代碼縮小器(minifer)，在webpack中縮小代碼的插件叫做UglifyJsPlugin，能夠將局部變數名改成很短的變數名，這樣功能不受影響但是代碼的大小大大縮減。

不過，和所有的代碼縮小器一樣，UglifyJsPlugin不改去改變全局變量名，因為改了就會影響程序的功能。所以當多次引用window這樣的全局變量時，最好在模組開始將window賦值給一個變量，比如win，然後在代碼其他部分只使用win，這樣最終經過UglifyJsPlugin產生的縮小代碼就只包含一個無法縮小的window變量。

我們給win上的Perf賦值了從react-addons-perf上導入的內容，這是為了幫助React
Perf擴展包的使用，做了這個代碼修改以後，React Perf上的Start按鈕和Stop按鈕才會起作用。

為了應用redux-immutable-statepinvariant中間件和Redux
Devtools，需要使用Redux的Store Enhancer功能，代碼如下：

```js
const reducer = combineReducers({
  todos: todoReducer,
  filter: filterReducer
});

const middlewares = [];
if (process.env.NODE_ENV !== 'production') {
  middlewares.push(require('redux-immutable-state-invariant').default());
}

const storeEnhancers = compose(
  applyMiddleware(...middlewares),
  (win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f,
);

export default createStore(reducer, {}, storeEnhancers);
```

代碼修改的關鍵在於給createStore函數增加了第三個參數storeEnhaners，這個參數代表Store
Enhancer的意思，能夠讓createStore函數產生的Store對象具有更多更強的功能。

因為Store
Enhancer可能有多個，在我們例子中就有兩個，所以Redux提供了一個compose函數，用於把多個Store
Enhancer組合在一起，我們分別來看這兩個Store Enhancer是什麼。

第一個Store
Enhancer是一個函數applyMiddleware的執行結果，這個函數接受一個陣列作為參數，每個元素都是一個Redux的中間件。雖然目前我們只應用了一個中間件，但是考慮到將來會擴展更多，所以我們用陣列變量middlewares來儲存所有的中間件，將來要擴展新的中間件只需要往這個陣列中push新的元素就可以了。

import導入模組，但在這裡卻用了Node傳統風格的require，因為import語句不能夠存在於條件語句之中，只能出現在模組語句的頂層位置。

第二個Store Enhancer就是Redux Devtools，因為Redux
Devtools的工作原理是截獲所有應用中Redux Store的動作和狀態變化，所以必須透過Store
Enhancer在Redux Store中加入鉤子。

如果瀏覽器中安裝了Redux
Devtools，在全局window對象上就有一個devToolsExtension代表Redux
Devtools。但是，我們也要讓沒有安裝這個擴展包的瀏覽器也能正常使用我們的應用，所以要根據window.devToolsExtension是否存在做一個判斷，有就用，沒有就插入一個什麼都不做的函數。

```js
(win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f
```

當所有代碼修改完畢，重啟Todo應用，就可以用上React和Redux的工具了。