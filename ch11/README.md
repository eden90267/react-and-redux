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