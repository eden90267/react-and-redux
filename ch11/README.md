# Chap11. 多頁面應用

應用往往會包含很多功能，這些功能無法一個視覺層面上的頁面展示，所以應用往往都是“多頁面應用”。用戶會在頁面之間來回切換，開發者要做的就是保證用戶的操作順暢。最好的解決方法就是邏輯上是“多頁面應用”，但是頁面之間切換並不引起頁面刷新，實際上是“單頁應用”。

本章將介紹以下內容：

- 頁面應用的目標
- 實現多頁面路由的React-Router庫
- 多頁面的代碼分片

## 單頁運用

傳統的多頁面實現方式，那就是每次頁面切換都是一次網頁的刷新，每次切換頁面都遵照以下步驟：

1. 瀏覽器的地址欄發生變化指向新的URL，於是瀏覽器發起一個新的HTTP請求到Server獲取頁面的HTML
2. 瀏覽器獲取HTML內容後，解析HTML內容
3. 瀏覽器根據解析的HTML內容確定還需要下載哪些其他資源，包括JavaScript和CSS資源
4. 瀏覽器會根據HTML和其他資源渲染頁面內容，然後等待用戶的其他操作

然後，當用戶點擊網頁內某個鏈結引起URL改變，又會重複上面步驟。

上述方法雖然正統，但存在很大的浪費，每個頁面切換都要刷新一次頁面。而且，對於同一個應用，不同頁面之間往往有共同點，比如共同的頂欄和側欄，當在頁面切換的時候，最終結果只是局部的內容變化，卻要刷新整個網頁，實在沒必要。

業界有很多提高多頁面應用的方案，讓用戶能夠感覺是在不同“頁面”之間切換，但是實際上頁面沒有刷新，只是局部更新，這種看起來多頁面但是其實只有一個頁面的應用，被稱為“單頁應用”，雖名為“單頁”，但其實目的是製造視覺上的“多頁”。

本章中，我們來探討如何用React和Redux實現單頁應用。

首先確定單頁應用要達到的目標：

- 不同頁面之間切換不會造成網頁的刷新
- 頁面內容和URL保持一致

第一點是單頁應用的基本要求。第二點“頁面內容和URL保持一致”分兩個方面：第一方面是只當頁面切換的時候，URL會對應改變，這透過瀏覽器的History API可以實現在不刷新網頁的情況下修改URL；另一方面，用戶在地址欄直接輸入某個正確URL時，網頁上要顯示對應的正確內容，這一點非常重要。

當用戶在單頁應用上瀏覽時，可以把這頁的URL複製保存下來，回頭重新打開這個URL，看到的內容應該是當初保存這個URL時的內容，而不只是這個網頁應用的默認頁面，這也就是所謂的“可收藏”(Bookmarkable)應用。

如果一個應用有上述的表現，那就是一個合格的單頁應用。不過，要做到這一點，Server必須要能夠響應所有正確的URL請求，畢竟，只有Server對URL請求回應HTML，我們的JavaScript代碼才有可能發揮作用。

到目前為止，本書中的例子React應用代碼都是在瀏覽器中執行的，Server返回的HTML實際上沒有任何可視的內容，作用只是引入JavaScript代碼，以及創建一個空div作為React應用的大展拳腳的競技場而已。這樣一來，對於任何一個URL，只需要返回一個同樣的HTML頁面就可以了，反正一切應用邏輯都在瀏覽器執行的JavaScript代碼中。

create-react-app創建的React應用天生具有上述的Server功能，當訪問一個public目錄下存在的資源時」，就返回這個資源，否則都返回默認資源index.html，所以開發者什麼都不用做，就已經具備了一個支持單頁應用的Server端。

接下來，我們構建一個簡單的單頁應用，我們需要用上React-Router。

## React-Router

React-Router庫可以幫助我們創建React單頁應用，因為要處理多個頁面，所以首先要了解幾個概念。

每個URL都包含**域名部分**和**路徑(Path)部分**，因為應用可能被部署到任何一個域名上，所以決定一個URL顯示什麼內容的只有路徑部分，和域名以及端口沒有關係，根據路徑找到對應應用內容的過程，也就是React-Router的重要功能——**路由**(Routing)。

>本章應用實例基於React-Router v3.0.0的API，預計React-Router v4版的API會有巨大變化，可以認為和之前的版本是完全不同的一個庫。可先在package.json指定react-router的版本為3.0.0。

### 路由

React-Router庫提供兩個組件來完成路由功能，一個是Router，一個是Route。前者Router在整個應用中只需要一個實例，代表整個路由器。後者Route則代表每一個路徑對應頁面的路由規則，一個應用中應該會有多個Route實例。

我們要做的單頁應用很簡單，只包含三個頁面，第一個是代表主頁的Home，對應路徑是home，第二個是代表說明頁的About，對應的路徑是about，當地址欄為不被支持的路徑，我們也應該提示用戶資源不存在，第三個頁面就是NotFound。

*src/pages*目錄分別創建*Home.js*、*About.js*和*NotFound.js*，每個文件都包含一個React組件，內容幾乎相同，只是顯示的文字不同。

*src/pages/Home.js*定義的Home組件代碼如下：

```js
const Home = () => {
  return (
    <div>Home</div>
  )
};
```

可以看到，Home雖然概念上是一個“頁面”，但是實現上是一個React組件，功能沒有特別之處。React-Router庫認為每個頁面就是一個React組件，當然這個組件可以包含很多子組件來構成一個複雜的頁面。

準備好三個頁面後，我們就可以開始定義路由規則了。

_src/Routes.js_：

```js
import React from 'react';
import {Router, Route, browserHistory} from 'react-router';

import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';

const history = browserHistory;
const Routes = () => (
  <Router history={history}>
    <Route path="home" component={Home}/>
    <Route path="about" component={About}/>
    <Route path="*" component={NotFound}/>
  </Router>
);

export default Routes;
```

這個文件導出一個函數，函數返回一個Router組件實例，所以這個文件導出的其實也是一個React組件，正因為React組件提供了一個很好的介面功能封裝，連路由功能也可以用組件形式表達。

Router實例的history屬性值被賦為browserHistory，這樣路由的改變就和browser URL的歷史產生了關聯，在後面章節我們可以了解到history屬性還可以是其他值。

注意，路徑為*通配符的這個Route實例必須放在最後。因為React-Router按照Route在代碼中的先後順序決定匹配的順序。

應用路口*src/index.js*：

```js
import React from 'react';
import ReactDOM from 'react-dom';

import Routes from './Routes';

ReactDOM.render(
  <Routes/>,
  document.getElementById('root')
);
```

在render函數中，渲染最頂層組件是從*src/Routes.js*中導入的Routes組件。這樣，應用中的所有組件都居於Router的保護傘之下。每個組件能否被顯示，都由Router來決定。

現在，我們透過yarn start啟動這個單頁應用，在瀏覽器中可以直接訪問不同URL看到不同介面。

這說明React-Router路由發揮了作用。然而目前這個應用很不完整，我們甚至無法驗證不同也面之間切換是不是真的沒有網頁刷新，所以，我們需要在網頁中增加一些鏈接。

### 路由鏈接和嵌套

在單頁應用中增加一個頂欄，包含所有頁面的鏈接，這樣只要所有網頁都包含這個頂欄，那就可以方便地在不同頁面之間切換了。

但我們不能用HTML的鏈接，因為HTML的鏈接在用戶點擊的時候，默認行為是頁面跳轉，這樣不是一個“單頁應用”應有的行為。

React-Router提供了一個名為Link的組件來支持路由鏈接，Link的作用是產生HTML的鏈接元素，但是對這個鏈接元素的點擊操作不引起網頁跳轉，而是被Link截獲操作，把目標路徑發送給Router路由器，這樣Router就知道可以讓哪個Route下的組件顯示了。

頂欄作為一個功能組件，沒有複雜功能，我們在src/components/TopMenu/index.js中直接定義它的視圖：

```js
import React from 'react';
import {Link} from 'react-router';

const liStyle = {
  display: 'inline-block',
  margin: '10px 20px'
};

const view = () => {
  return (
    <div>
      <ul>
        <li style={liStyle}><Link to="/home">Home</Link></li>
        <li style={liStyle}><Link to="/about">About</Link></li>
      </ul>
    </div>
  );
};

export {view};
```

Link組件的to屬性指向一個路徑，對應的路徑在*src/Routes.js*中應該有定義，在這裡兩個Link分別指向了home和about，注意路徑前面有一個“/”符號，代表從根路徑開始匹配。

React-Router的Route提供了嵌套功能，可以很方便地解決上面的問題。

在*src/pages/App.js*中我們定義個新的React組件App，這個組件包含TopMenu組件，同時會渲染出Home、About或者NotFound頁面。

```js
import React from 'react';
import {view as TopMenu} from '../components/TopMenu/index';

const App = ({children}) => {
  return (
    <div>
      <TopMenu/>
      <div>{children}</div>
    </div>
  )
};
export default App;
```

上面的代碼看不見Home、About或者NotFound，因為它們都會作為App的子組件，children代表的就是App的子組件，所以App的工作其實就是給其他頁面增加一個TopMenu組件。

在*src/Routes.js*中，我們導入App，利用一個Route組件將根路徑映射到App組件上。

```js
const Routes = () => (
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="home" component={Home}/>
      <Route path="about" component={About}/>
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>
);
```

現在，假如在瀏覽器中訪問[http://localhost:3000/home]()，那麼React-Router在做路徑匹配時，會根據路徑“/home”的“/”前綴先找到component為App的Route，然後根據剩下來的“home”找到component為Home的Route，總共有兩個Route，那應該渲染哪一個？

React-Router會渲染外層Route相關的組件，但是會把內層Route的組件作為children屬性傳遞給外層組件。所以，在渲染App組件時，渲染children屬性也就把Home組件渲染出來了，最終的效果是在TopMenu和Home組件都顯示在頁面上。

透過點擊TopMenu組件上的連接，用戶可以在不同頁面之間切換，可以注意到頁面之間的切換不會帶來網頁刷新。

建立Route組件之間的父子關係，這種方式，就是路由的嵌套。

嵌套路由的一個好處是每一層Route只決定到這一層的路徑，而不是整個路徑，所以非常靈活。例如，修改App的Route屬性path：

```js
<Route path="/root" component={App}>
```

那麼，訪問Home路徑就變成：[http://localhost:3000/root/home]()，而關於Home、About和NotFount的Route卻不用做任何修改，因為每個Route都只匹配自己這一層的路徑，當App已經匹配root部分之後，Home只需要匹配home部分。

### 默認鏈接

到目前為止，這應用還有一個缺陷，就是當路徑部分為空時，React-Router只匹配中了App組件而已，App組件只是一個包含TopMenu的亮子，裡面什麼也沒有。

當路徑為空的時候，應用也應該顯示有意義的內容，通常對應主頁內容。

React-Router提供了另外一個組件IndexRoute，就和傳統上index.html是一個路徑目錄下的默認頁面一樣，IndexRoute代表一個Route下的默認路由。

```js
<Router history={history}>
  <Route path="/" component={App}>
    <IndexRoute component={Home}/>
    <Route path="home" component={Home}/>
    <Route path="about" component={About}/>
    <Route path="*" component={NotFound}/>
  </Route>
</Router>
```

### 集成Redux

為了實現路由功能，有React-Router就足夠，和Redux並沒有什麼關係。但是我們依然希望用Redux來管理**應用中的狀態**，所以要把Redux添加到應用中去。

首先src/Store.js添加創建Redux Store的代碼：

```js
import {createStore, compose} from 'redux';

const reducer = f => f;
const win = window;
const storeEnhancers = compose(
  (win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f,
);

const initialState = {};
export default createStore(reducer, initialState, storeEnhancers);
```

上面定義的Store只是一個例子，並沒有添加實際的reducer和初始狀態，主要是使用了Redux Devtools。

使用React-Redux庫的Provider組件，作為資料的提供者，Provider必須居於接受資料的React組件之上。換句話說，要想讓Provider提供的store能夠被所有組件訪問到，必須讓Provider處於組件樹結構的頂層，而React-Router庫的Router組件，也有同樣的需要那麼，兩者都希望自己處於頂端，如何處理？

一種方法是讓Router成為Provider的子組件，例如在應用的入口函數*src/index.js*中代碼修改成下面這樣：

```js
ReactDOM.render(
  <Provider store={store}>
    <Routes/>
  </Provider>
  ,
  document.getElementById('root')
);
```

Router可以是Provider的子組件，但是，不能夠讓Provider成為Router的子組件，因為Router的子組件只能是Route或者IndexRoute，否則運行會報錯。

另一方法，是使用Router的createElement屬性，透過給createElement傳遞一個函數，可以定製創建每個Route的過程，這個函數第一個參數Component代表Route對應的組件，第二個參數代表傳入組件的屬性參數。

加上Provider的createElement可以這樣定義：

```js
import store from './Store';

const createElement = (Component, props) => {
  return (
    <Provider store={store}>
      <Component {...props}/>
    </Provider>
  )
};

const history = browserHistory;
const Routes = () => (
  <Router history={history} createElement={createElement}>
// ...
```

需要注意的是，Router會對每個Route的構造都調用一遍createElement，也就是每個組件都創造了一個Provider來提供資料，這樣並不會產生性能問題，但如果覺得這樣過於浪費的話，那就使用第一種方法。

第三張我們接觸Redux概念的時候就知道，Redux遵從的一個重要原則就是“唯一資料源”，唯一資料源並不是說所有的資料都要存儲在一個地方，而是說一個特定資料只存在一個地方。以路由為例，所有React-Router，即使結合了Redux，當前路由的信息也是存儲在瀏覽器的URL上，而不是像其他資料一樣存儲在Redux的Store上，這樣做並不違背“唯一資料源”的原則，獲取路由信息的唯一資料源就是當前URL。

不過，如果不是所有應用狀態都存在Store上，就會有很大的缺點，就是當利用Redux Devtools做調試時，無法重現網頁之間的切換，因為當前路由作為應用狀態根本沒有在Store狀態上體現，而Redux Devtools操縱的只有狀態。

為克服這個缺點，我們可利用react-router-redux庫來同步瀏覽器URL和Redux的狀態。顯然，這違反了“唯一資料源”的規則，但是只要兩者絕對保持同步，就不會帶來問題。

react-router-redux庫的工作原理是在Redux Store的狀態樹上routing欄位中保存當前路由信息，因為修改Redux狀態只能透過reducer，所以先要修改*src/Store.js*，增加routing欄位的規約函數routerReducer。

```js
import {createStore, combineReducers, compose} from 'redux';
import {routerReducer} from 'react-router-redux';

const reducer = combineReducers({
  routing: routerReducer
});
// ...
```

reducer需要由action對象驅動，我們在*src/Routes.js*文件中要修改傳給Router的history變量，讓history能夠協同URL和Store上的狀態：

```js
import {syncHistoryWithStore} from 'react-router-redux';

const history = syncHistoryWithStore(browserHistory, store);
```

react-router-redux庫提供的syncHistoryWithStore方法將React-Router提供的browserHistory和store關聯起來，當瀏覽器的URL變化的時候，會向store派發action對象，同時監聽store的狀態變化，當狀態樹下routing欄位發生變化，反過來更新瀏覽器的URL。

在Redux Devtools介面上，每當頁面發生切換，可以看到有一個type為@@router/LOCATION_CHANGE的action對象被派發出來，透過跳轉到不同的action對象，透過跳轉到不同的action對象，瀏覽器的URL和介面也會對應變化。

## 代碼分片

借助React-Router我們可以將需要多頁面的應用構建成“單頁應用”，在Server端對任何頁面請求都返回同樣一個HTML，然後由一個打包好的JavaScript處理所有路由等應用邏輯，在create-react-app創造的應用中，由webpack產生的唯一打包JavaScript文件被命名bundle.js。

對於小型應用，按照上面的方式就足夠了，但是，對於大型應用，把所有應用邏輯打包在一個bundle.js文件中的做法就顯得不大合適了，因為會影響用戶感知的性能。

在大型應用中，因為功能很多，若把所有頁面的JavaScript打包到一個bundle.js中，那麼用戶訪問任何一個網頁，都需要下載整個網站應用的功能。雖然瀏覽器的緩存機制可以避免下次訪問時下載重複資源，但是給用戶的第一印象卻打了折扣。

用戶用不到的功能與部分新功能更新都得要下載整個bundle.js，長時間的下載時間會造成用戶體驗降低。

很明顯，當應用變得越來越大後，就不能把所有JavaScript打包到一個bundle.js中。

為了提高性能，一個簡單有效的方法是對JavaScript進行分片打包，然後按需加載。這樣每一個文件可以被控制的比較小。這樣，訪問某個頁面時，只需要下載必須的JavaScript代碼就行，不用下載整個應用邏輯。

那麼，按照什麼原則來對代碼進行分片？

最自然的方式當然就是根據頁面來劃分，每個頁面對應一個，每個頁面也只需要加載那一片分片就行。不過，現實中各個網頁之間肯定有交叉的部分。比如，A頁面和B頁面雖然不同，但是卻都使用了一個共同的組件X，而且對於React應用來說，每個頁面都依賴於React庫，所以至少都有共同的React庫部分代碼，這些共同的代碼沒有必要在各個分片裡重複，需要抽取出來放在一個共享的打包文件中。

最終，理想情況下，當一個網頁被加載，它會獲取一個應用本身的bundle.js文件，一個包含頁面間共同內容的common.js文件，還有一個就是特定於於這個頁面內容的JavaScript文件。

為了實現代碼分片，傳統上需要開發者利用配置文件規定哪些代碼被打包到哪個文件，這是一個費力且有可能出錯的事情。感謝webpack，有了webpack的幫助，實現分片非常簡單。因為webpack的工作方式就是根據代碼中import語句和require方法確定模組之間的依賴關係，所以webpack完全可以發掘所有模組文件的依賴圖表：

![](http://i.imgur.com/oqHt8Mo.png)

圖11-5中包含6個文件模組，其中應用啟動代碼直接引用文件1，利用import或require直接或間接被1導入的所有文件都會被打包到bundle.js中，在上面的例子中，1號跟2號文件屬於bundle.js。

不過，還有的文件並不過啟動代碼直接或間接導入，比如上面例子中的3、4、5、6號文件。其中6號包含頁面A的邏輯，4號包含頁面B的邏輯，webpack會將這兩個文件分別放到這兩個頁面各自的打包文件中。

還有5號文件只被頁面B導入，頁面3既被頁面A導入也被頁面B導入，這樣5號文件就會被放在頁面B專屬的打包文件中，但是3號文件因為被兩個頁面共享，會放到一個共享的打包文件中。

其中2號文件既被3號文件也被5號文件導入，但是2號文件已經被打包到啟動打包文件中，所以沒有必要在其他打包文件中重複一份了。

所以，最後總共生成四個打包文件：啟動代碼的bundle.js包含1號和2號文件，所有頁面共享的打包文件common.js包含3號文件，頁面A生成的打包文件PageA.chunk.js包含6號文件，頁面B生成的打包文件PageB.chunk.js包含4號和5號文件。

這樣，當瀏覽器訪問頁面A時，只需要加載PageA.bundle.js、common.js和bundle.js三個文件，和頁面A無關的4號和5號文件則根本不被加載，節省了代碼下載量。

當然，提高網頁性能的另一個重要原則是減少HTTP請求數，雖然代碼分片減少了每個頁面的代碼下載量，卻也增加了引用的JavaScript資源數，但是這只影響用戶訪問的第一個頁面，例如，用戶訪問第一個頁面是A，下載PageA.chunk.js、common.js和bundle.js三個文件，隨後當頁面切換到B，因為瀏覽器的緩存作用，common.js和bundle.js不用重新下載，所以新下載的文件只有PageB.chunk.js，當應用頁面越多，這種優化效果越明顯。

上面只是簡單的例子，對於更廣大更複雜的應用，依賴關係更加複雜，肯定無法用人工配置的方式完成分片打包的管理。但是利用webpack，開發這要做的只是管理好import語句和require方法就足夠，webpack自然能夠管理複雜的依賴關係，接下來我們就來實踐webpack的代碼分片。

### 彈射和配置webpack

為了實現代碼分片，我們需要直接操作webpack的配置文件，所以不能再使用create-react-app的默認配置，我們要讓應用從create-react-app製造的"安全艙"裡彈射出來：

```bash
npm run eject
```

"彈射"是不可逆的操作。為了配置webpack我們別無選擇，只能確認。

命令完成後，會發現應用目錄下多了scripts和config兩個目錄，分別包含腳本和配置文件，同時應用目錄下的package.json文件也發生了變化，包含了更多的內容，至此，"彈射"完成，但是功能和"彈射"之前別無二致，要改進功能還需要手工修改一些文件。

有兩個webpack配置，分別代表開發環境和產品環境，我們首先處理開發模式也就是npm start命令啟動的模式下的webpack配置。

_config/webpack.config.dev.js_，找到給module.exports賦值的語句，再給module.exports賦值的對象中，找到output這個欄位，在其中添加上關於chunkFilebname的一行，然後找到plugins欄位，這是一個陣列，在裡面添加一個元素增加CommonsChunkPlugin，代碼修改如下：

```js
module.exports = {
  // ...
  output: {
    // ...
    chunkFilename: 'static/js/[name].chunk.js',
    // ...
  },
  plugins: [
    // ...
    new webpack.optimize.CommonsChunkPlugin({name: 'common', filename: 'static/js/common.js'})
  ]
}
```

增加的output配置，是告訴webpack給每個分片都產生一個文件，文件名包含模組名稱和後綴".chunk.js"，使用這樣的後綴只是一個通用習慣，並不強制要求，如果改成".page.js"之類也不影響功能。

增加在plugins中的配置是告訴webpack把所有分片中共同的代碼提取出來，放在名為common.js的文件中，也就是圖11-5中存儲的所有分片共同代碼的common.js。

生成的文件都帶上路徑*static/js*，只是為了保持和原有bundle.js文件所在目錄一致。其實這個目錄也可以是任意一個位置。

上面修改只針對開發模式，還要修改產品模式的webpack配置保持一致。

config/webpack.config.prod.js，output已經有正確的chunkFileName配置了，所以只要在plugins中添加下面這行就好：

```js
new webpack.optimize.CommonsChunkPlugin({name: 'common', filename: 'static/js/common.[chunkhash:8].js'})
```

產品環境的配置和開發環境有些不同，多出了`[chunkhash:8]`的部分，這是為了讓瀏覽器緩存在文件內容改變時失去效果。

因為產品環境下打包的文件部署出去之後預期會被瀏覽器長時間緩存，所以不能使用固定的文件名，否則後續部署的代碼更新無法被瀏覽器發現。所以每個文件名都會包含一個8位的根據文件內容產生的Hash效果，這樣當文件內容發生改變時，文件名也就發生了變化，對應的URL也就發生變化，瀏覽器就會去下載最新的JavaScript打包資源。

### 動態加載分片

針對webpack的配置只是告訴webpack分片打包，但是webpack沒有"頁面"的概念，還是需要修改JavaScript代碼來確定怎樣按照頁面分片。

繼續我們的應用實例，我們希望Home、About和NotFound頁面都是按需加載的，這三個頁面都應該有自己的分片，它們的內容也就不應該包含在主體的bundle.js文件中。

因為webpack的工作方式是根據代碼中的import語句和require函數來找到所有的文件模組，所以，要讓這三個頁面不出現在bundle.js文件中，我們就不能再直接使用import命令來導入它們。

>**Top**：  
>對ES語法有一個提議是增加import函數從而實現動態的import，注意動態import是函數形式，代碼類似`import('./pages/Home.js')`，和不帶括號的靜態的import語句不同。目前這個動態import的提議處於ES的Stage3階段，本書的例子沒有使用這種語法，讀者可嘗試使用動態import修改本書的例子取代`require.ensure`。

在*src/Routes.js*中，我們首先注釋或者刪掉針對Home、About和NotFound的import語句：

```js
import App from "./pages/App";
// import Home from './pages/Home';
// import About from './pages/About';
// import NotFound from './pages/NotFound';
```

然後，我們在*src/Routes.js*中要利用Route的getComponent屬性異步加載React組件：

```js
const getHomePage = (location, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/Home.js').default);
  }, 'home');
};
const getAboutPage = (location, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/About.js').default);
  }, 'about');
};
const getNotFoundPage = (location, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/NotFound.js').default);
  }, '404');
};
```

Route的getComponent函數有兩個參數，第一個參數nextState代表匹配到當前Route的信息，不過這裡我們用不上這參數；第二個參數是一個回調函數，回調函數遵從Node.js回調函數風格，第一個參數代表是否有錯誤，第二個參數代表裝載成功的組件，正因為這個回調函數的存在，使得異步加載組件成為可能，我們會在異步加載了對應組件之後再調用這個回調函數。

在這裡，異步加載模組的方法使用require.ensure，ensure是require對象的一個屬性，實際是一個函數。當webpack做靜態代碼分析時，除了特殊處理import和require，也會特殊處理require.ensure，當遇到require.ensure函數調用，就知道需要產生一個動態加載打包文件。

require.ensure函數有三個參數，第一個參數是一個陣列，第二個參數是一個函數，第三個參數是分片模組名。require.ensure所做的事情就是確保第二個函數參數被調用時，第一個參數陣列中所有模組都已經被裝載了。對於我們的應用，頁面模板沒有特殊的依賴關係，所以第一個參數保持一個空陣列就好，要做的只是在第二個參數中透過require語句來裝載對應的頁面文件。

至於require.ensure函數的第三個參數，代表的是模組名，對應的就是上面在webpack配置文件中添加的chunkFilename參數的`[name]`值，如果第三個參數沒有的話，webpack會給每個模組分配一個數字代表的唯一ID作為chunk的名字，為了讓分片文件名清晰，我們在代碼別指定模組名，那麼我們預期最終會有三個分片文件產生，名字分別是：home.chunk.js、about.chunk.js和404.chunk.js。

在Routes參數中使用getComponent而不是component屬性來使用異步加載頁面的函數。

```js
const Routes = () => (
  <Router history={history} createElement={createElement}>
    <Route path="/" component={App}>
      <IndexRoute getComponent={getHomePage}/>
      <Route path="home" getComponent={getHomePage}/>
      <Route path="about" getComponent={getAboutPage}/>
      <Route path="*" getComponent={getNotFoundPage}/>
    </Route>
  </Router>
);
```

所以，完成動態加載分片要兩個方面。

- 使用require.ensure讓webpack產生分片打包文件
- 使用React-Router的getComponent異步加載頁面分片文件

這個神奇的過程，關鍵在於webpack會對require.ensure函數做特殊處理。而且React-Router透過getComponent函數支持異步加載組件。

讀者看到上面的代碼可能有疑問，給每個頁面的getComponent函數：getHomePage、getAboutPage和getNotFoundPage，這三個函數中的代碼幾乎相同，唯一的區別就是頁面組件的文件位置和模組名。出於避免重複代碼的目的，為什麼不把這三個函數的共同部分提取成一個函數，把差別體現的函數參數中呢？

```js
const getPageComponent = (pagePath, chunkName) => (nextState, callback) => {
  require.ensure([], function(require) {
    callback(null, require(pagePath).default);
  }, chunkName);
}

<Route path="home" getComponent={getPageComponent('./pages/Home.js', 'home')}/>
```

然而，並不能這樣做，因為webpack打包過程是對代碼做靜態掃描的過程，也就是說，webpack工作的時候，我們縮寫的代碼並沒有執行，webpack看到的import和require的參數如果不是字符串而是一個需要運算的表達式，webpack就無從知道表達式運算結果是什麼。

如果require的參數是字符串，那webpack就可以明確知道對應的文件模組位置，一切順利；如果require的參數是一個變數，那麼webpack就無法在靜態掃描狀態下確定哪些文件應該放在對應分片中，分片也就失效了。

現在，我們刷新網頁，訪問[http://localhost:3000]()，瀏覽器的網絡工具中可以看到下載了三個文件：common.js、bundle.js和home.chunk.js，其中home.chunk.js就是特定於Home的分片文件，當我們透過點擊頂欄的About鏈接時，可以看到只有一個新下載的文件about.chunk.js。

### 動態更新Store的reducer和狀態

在第四章，我們學習過將應用分解為若干功能模組，每個功能模組除了包含React組件，還可以有自己的reducer和被這個reducer修改的Store上的狀態。

當實現動態加載分片時，功能模組會被webpack分配到不同的分片文件中，包含在功能模組中的reducer代碼也會被分配到不同的分片文件。這樣，應用的bundle.js文件中就沒有這些reducer函數的定義，每個應用都有一個唯一的Redux Store，當應用啟動創建Store時，並不知道這個應用中的reducer函數如何定義。所以，當切換到某個頁面的時候，除了要加載對應的React組件，還要加載對應的reducer，否則功能模組無法正常工作。

功能模組依賴於Store上的狀態，所以當頁面切換時，除了要更新reducer，Store上的狀態樹也可能需要做對應改變，才能支持新加載的功能組件。

感謝Redux的結構，讓我們把應用邏輯分散在視圖和reducer，而這兩者並不負責狀態存儲，狀態存儲在一個全局狀態樹上，才使得這種動態加載變得容易。

我們在第8章中介紹過Store Enhancer，並且創造reset增強器，可以在store上添加一個名為reset的函數，這個函數可以替換當前store上的狀態和reducer，現在我們就要把reset增強器應用到我們的例子中去。

為演示更新reducer和狀態的功能，我們在代碼中增加一個具有reducer功能模組，第三章我們實現過一個計數器功能，在這裡我們稍微修改，以第四章功能模組的定義方式放在*src/components/Counter*目錄下。

在*src/components/Counter/index.js*文件中定義功能模組的接口：

```js
import * as actions from './actions';
import reducer from './reducer';
import view, {stateKey} from './view';

export {actions, reducer, view, stateKey};
```

現在多導出一個stateKey，代表的是這個功能模組需要佔據的Redux全局狀態樹的子樹欄位名，具體值是字符串counter，在view.js中定義，因為視圖中的mapStateToProps函數往往需要直接訪問這個stateKey值。

在*src/components/Counter/actionTypes.js*文件中定義action類型對象：

```js
export const INCREMENT = 'counter/increment';
export const DECREMENT = 'counter/decrement';
```

在*src/components/Counter/actions.js*文件中定義action構造函數：

```js
import * as ActionTypes from './actionTypes';

export const increment = () => ({
  type: ActionTypes.INCREMENT
});

export const decrement = () => ({
  type: ActionTypes.DECREMENT
});
```

在*src/components/Counter/reducer.js*中定義reducer：

```js
import {INCREMENT, DECREMENT} from "./actionTypes";

export default (state = {}, action) => {
  switch (action.type) {
    case INCREMENT:
      return state + 1;
    case DECREMENT:
      return state - 1;
    default:
      return state;
  }
};
```

最後，在src/components/Counter/view.js定義視圖，對於Counter無狀態組件的定義：

```js
import React, { PropTypes } from 'react';

const buttonStyle = {
  margin: '10px'
};

export const stateKey = 'counter';

function Counter({onIncrement, onDecrement, value}) {
  return (
    <div>
      <button style={buttonStyle} onClick={onIncrement}>+</button>
      <button style={buttonStyle} onClick={onDecrement}>-</button>
      <span>Count: {value}</span>
    </div>
  );
}
```

這個Counter組件會直接從Store的counter欄位讀取當前的計數值，所以需要定義對應的mapStateToProps和mapDispatchToProps函數：

```js
const mapStateToProps = (state) => ({
  value: state[stateKey] || 0
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  onIncrement: increment,
  onDecrement: decrement
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

可看到mapStateToProps函數需要直接訪問stateKey，所以stateKey雖然在index.js文件導出，但通常要在視圖文件中定義值。

在*src/components/*目錄下定義的都是功能模組，我們將功能模組和頁面嚴格區分開，為展示Counter模組，我們先在*src/pages/CounterPage.js*文件中增加對應的頁面定義：

```js
import React from 'react';
import {view as Counter} from '../components/Counter';

const CounterPage = () => {
  return (
    <div>
      <div>Counter</div>
      <Counter caption="any"/>
    </div>
  );
};

export default CounterPage;
```

頁面中只顯示一個caption為any的計數器，除此之外和其他頁面定義沒什麼兩樣。

最後，在*src/Routes.js*中增加對CounterPage的Route規則：

```js
const getCounterPage = (location, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/CounterPage.js').default);
  }, 'counter');
};

// ...
<Route path="home" getComponent={getHomePage}/>
<Route path="counter" getComponent={getCounterPage}/>
<Route path="about" getComponent={getAboutPage}/>
```

最後，在*src/components/TopMenu/index.js*頂欄中增加對counter路徑的鏈接：

```js
<li style={liStyle}><Link to="/counter">Counter</Link></li>
```

現在，我們可以啟動應用，在瀏覽器上可看到頂欄新添加了Counter鏈接，可點擊此鏈接，顯示計數器頁面。

不過，在計數器頁面中點擊“+”和“-”按鈕，計數並不會變化。這很正常，因為上面代碼只處理視圖，卻沒有處理reducer，reducer不會自動把自己添加到Redux中。

在*src/pages/CounterPage.js*文件裡雖然導入了Counter功能組件，但只使用了view，卻沒有使用reducer。然而，在CounterPage.js直接操作Redux Store似乎超出了它的職責範圍。所以我們只是讓CounterPage.js導出內容中增加reducer，由使用它的模組來操作Redux就好，進行這個操作的模組還需要更新Redux的狀態樹，所以CounterPage.js還需要提供頁面的初始狀態initialState，以及需要初始狀態掛靠的狀態樹欄位名stateKey。

最終的CounterPage.js：

```js
import React from 'react';

import {view as Counter, stateKey, reducer} from "../components/Counter";

const page = () => {
  return (
    <div>
      <div>Counter</div>
      <Counter/>
    </div>
  );
};

const initialState = 100;
export {page, reducer, initialState, stateKey};
```

為讓初始計數值有別於默認的0，我們Counter組件的計數為100。

在*src/Store.js*，我們引入第八章中定義的名為reset的Store Enhancer，這樣創造出來的store有一個reset的函數，可以更新reducer和狀態。

```js
import {createStore, applyMiddleware, combineReducers, compose} from 'redux';
import {routerReducer} from 'react-router-redux';

import resetEnhancer from './enhancer/reset';

const originalReducers = {
  routing: routerReducer
};
const reducer = combineReducers(originalReducers);

const win = window;

const middlewares = [];
if (process.env.NODE_ENV !== 'production') {
  middlewares.push(require('redux-immutable-state-invariant').default());
}

const storeEnhancers = compose(
  resetEnhancer,
  applyMiddleware(...middlewares),
  (win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f,
);

const initialState = {};
const store = createStore(reducer, initialState, storeEnhancers);
store._reducers = originalReducers;
export default store;
```

其*/enhancer/reset.js*：

```js
const RESET_ACTION_TYPE = '@@RESET';

const resetReducerCreator = (reducer, resetState) => (state, action) => {
  if (action.type === RESET_ACTION_TYPE) {
    return resetState;
  } else {
    return reducer(state, action);
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
  }
};

export default reset;
```

上面的例子中，store上增加了一個_reducers欄位，這是因為無論如何更改Redux的reducer，都應該包含應用啟動時的reducer，所以我們把最初的reducer儲存下來，在之後每次store的reset函數被調用時，都會用combineReducer來將啟動的reducer含進來。

最後，在src/Routes.js更新一下getCounterPage函數的實現：

```js
import {combineReducers} from 'redux';

const getCounterPage = (nextState, callback) => {
  require.ensure([], function (require) {
    const {page, reducer, stateKey, initialState} = require('./pages/CounterPage');

    const state = store.getState();
    store.reset(combineReducers({
      ...store._reducers,
      counter: reducer
    }), {
      ...state,
      [stateKey]: initialState
    });
    callback(null, page);
  }, 'counter');
};
```

在新的getCounterPage函數中，從CounterPage.js文件中不僅獲得了代表視圖的page，還有reducer，以及代表頁面組件初始狀態的initialState和狀態樹欄位名stateKey。

在調用callback通知Router裝載頁面完成之前，要完成更新Redux的reducer和狀態樹的操作。因為reset增強器的幫助，現在store上有一個reset函數，第一個參數是新的reducer，第二個參數是新的狀態。我們不能破壞應用初始化的規約邏輯，也不想丟棄狀態樹上現有的狀態，所以使用擴展操作符增量添加了新的reducer和狀態，然後調用reset函數。

現在瀏覽器重新切換Counter頁面，計數器初始是100，說明我們狀態設置成功，點擊“+”和“-”按鈕能夠引起計數數值的變化，說明reducer也更新成功，我們實現了完整的動態加載功能模組。

## 本章小節

本章介紹了構建多頁面複雜應用的方法，借助React-Router庫的幫助，可以將應用中的不同路徑映射到React組件。

當應用變得廣大時，需要考慮對應的JavaScript代碼進行分片管理，這樣用戶訪問某個頁面的時候需要下載JavaScript大小就可以控制在一個可以接受的範圍內。

代碼分片帶來的一個問題是如何使用分片中定義的reducer和初始狀態，借助Store Enhancer，我們可以在更新視圖的同時，完成對reducer和狀態樹的更新。