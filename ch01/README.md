# chap01. React 新的前端思維方式

## 初始化一個React項目

React不支持比IE 8更低版本的瀏覽器。

React不依賴Node.js，但開發中用到的諸多工具需要Node.js的支持。

### create-react-app工具

React技術依賴一個很廣大的技術棧，比如：

1. 轉譯JavaScript代碼需要使用Babel
2. 模組打包工具要使用Webpack
3. 定製build過程需要grunt或者gulp

這些技術棧都需要各自的配置文件，還沒開始寫一行React相關代碼，開發人員就已經被各種技術名詞淹沒。

所以Facebook提供了一個快速開發React應用的工具：create-react-app。這工具的主要目的是將開發人員從配置工作中解脫出來，無需過早關注這些技術棧細節，透過創建一個已經完成基本配置的應用，讓開發者快速開始React應用的開發。

```sh
npm install --global create-react-app
```

這樣電腦終究會有create-react-app這樣一個可以執行的命令，這個命令會在當前目錄下創建指定參數名的應用目錄。

```sh
create-react-app first_react_app
```

隨後我們只需要在這個框架的基礎上修改文件就可以開發React應用，避免了大量的手工配置工作：

```sh
cd first_react_app
npm start
```

這個命令會啟動一個開發模式的server，同時瀏覽器也會自動打開一個網頁：http://localhost:3000/。

恭喜你，你的第一個React應用誕生了。

## 增加一個新的React組件

React的首要思想是透過組件(component)來開發應用。所謂組件，指的是能完成某個特定功能的獨立的、可重用的代碼。

React非常適合構建用戶交互組件。

*ClickCounter.js*：

```js
import React, {Component} from 'react';

class ClickCounter extends Component {
    constructor(props) {
        super(props);
        this.onClickButton = this.onClickButton.bind(this);
        this.state = {count: 0};
    }

    onClickButton() {
        this.setState({count: this.state.count + 1});
    }

    render() {
        return (
            <div>
                <button onClick={this.onClickButton}>Click Me</button>
                <div>
                    Click Count: {this.state.count}
                </div>
            </div>
        )
    }
}
export default ClickCounter;
```

App.js：

```js
import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import ClickCounter from './ClickCounter';
import './index.css';

ReactDOM.render(<ClickCounter />, document.getElementById('root'));
registerServiceWorker();
```

import是ES6語法中導入文件模組的方式。

*ClickCounter.js*，我們從react庫引入了React和Component：

```js
import React, {Component} from 'react';
```

Component作為所有組件的基類，提供了很多組件共有的功能，下面這行代碼，使用ES6語法來創建ClickCounter的組件類，ClickCounter的父類就是Component：

```js
class ClickCounter extends Component {
```

使用React.createClass方式創造組件類，是一種過時的方法。

引入React是必要的，否則會報錯：“在使用JSX的範圍內必須要有React。”

也就是說，在使用JSX代碼文件中，即使代碼中並沒有直接使用React，也一定要導入這個React，這是因為**JSX最終會被轉譯成依賴React的表達式**。

### JSX

JSX，是JavaScript的語法擴展(eXtension)，讓我們在JavaScript中可以編寫像HTML一樣的代碼。

但JSX與HTML有其不同之處：

首先，在JSX中使用的“元素”不局限於HTML中的元素，可以是任何一個React組件。

React判斷一個元素是HTML元素還是React組件的原則就是看第一個字母是否大寫，如果在JSX中我們不用ClickCounter而是用clickCounter，就得不到我們要的結果。

JSX中可透過onClick這樣的方式給一個元素添加一個事件處理函數，當然，在HTML中也可以用onclick，但在HTML中直接書寫onclick一直是為人詬病的寫法，網頁應用開發界一直倡導的是用jQuery的方法添加事件處理函數，直接寫onclick會帶來代碼混亂的問題。

那為什麼React的JSX卻要使用onClick這樣的方式來添加事件處理函數呢？

### JSX是進步還是倒退

HTML代表內容、CSS代表樣式、JavaScript定義交互行為，這三種文件分在三種不同的文件裡面，實際上是把不同技術分開管理，而不是邏輯上的“分而治之”。

根據做同一件事的代碼應該有高耦合性的設計原則，既然要實現ClickCounter，那為什麼不把實現這個功能的所有代碼集中在一個文件裡呢？

在JSX使用onClick添加事件處理函數，是否代表網頁應用開發兜了一個大圈，最終回到起點？

不是這樣，JSX的onClick事件處理方式和HTML的onclick有很大的不同。

即使現在，在HTML中直接使用onclick很不專業，原因如下：

- onclick添加的事件處理函數是全局環境下執行的，這污染了全局環境，很容易產生意料外的後果。
- 給很多DOM元素添加onclick事件，可能會影響網頁效能，畢竟，網頁需要的事件處理函數越多，性能就越低。
- 對於使用onclick的DOM元素，如果要動態從DOM樹中刪掉的話，需要把對應的時間處理器註銷，假如忘了註銷，就可能造成記憶體洩漏，這樣的bug很難被發現。

上面說的這些問題，JSX都不存在。

首先，onClick掛載的每個函數，都可以控制在組件範圍內，不會污染全局空間。

我們在JSX中看到一個組件使用onClick，但並沒有產生直接使用onclick的HTML，而是使用**event delegation**的方式處理點擊事件，無論有多少個onClick出現，其實最後都只在DOM樹中添加一個事件處理函數，掛在最底層的DOM節點上。所有的點擊事件都會被這個事件處理函數捕獲，然後根據具體組件分配給特定函數，使用事件委託的性能當然要比每個onClick都掛載一個事件處理函數要高。

因為React控制組件的生命週期，在unmount的時候自然能夠清除相關的所有事件處理函數，內存泄露也不再是個問題。

除了在組件定義交互行為，我們還可以在React組件中定義樣式：

```js
render() {
    const counterStyle = {
        margin: '16px'
    };
    return (
        <div style={counterStyle}>
            <button onClick={this.onClickButton}>Click Me</button>
            <div>
                Click Count: <span id="clickCount">{this.state.count}</span>
            </div>
        </div>
    );
}
```

你看，React的組件可以把JavaScript、HTML和CSS的功能在一個文件中，**實現真正的組件封裝**。

## 分解React應用

是時候了解一下React依賴於一個很大很複雜的技術棧了。

*package.json*：

```json
"scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject"
}
```

start命令實際上是調用react-scripts這個命令，react-scripts是create-react-app添加的一個npm包。所有配置文件都藏在node_modules/react-scripts目錄下，我們可以進去這個目錄一探究竟，但是也可以使用eject方法來看清楚背後的原理。

build可創建生產環境優化代碼。

test用於單元測試。

還有一個eject命令很有意思。

這個eject(彈射)命令做的事情，就是把潛藏在react-scripts中的一系列技術棧配置都“彈射”到應用的頂層，然後我們就可以研究這些配置細節了，而且可以更靈活地定製應用的配置。

>eject的命令是不可逆的。所以，當你執行eject之前，最好做一下備份。

完成彈射操作：

```sh
npm run eject
```

這個命令會改變一些文件，也會添加一些文件。

當前目錄會增加兩個目錄，一個是script，另一個是config，同時，package.json文件中的scripts部分也發生了變化：

```json
"scripts": {
    "start": "node scripts/start.js",
    "build": "node scripts/build.js",
    "test": "node scripts/test.js --env=jsdom"
},
```

從此之後，start腳本將使用scripts目錄下的start.js，而不是node_modules目錄下的react-scripts，彈射成功，再也回不去了。

在config目錄下的*webpack.config.dev.js*文件，定製的就是npm start所做的構造過程，其中有一段關於babel的定義：

```js
// Process JS with Babel.
{
    test: /\.(js|jsx)$/,
    include: paths.appSrc,
    loader: require.resolve('babel-loader'),
    options: {
      
      // This is a feature of `babel-loader` for webpack (not Babel itself).
      // It enables caching results in ./node_modules/.cache/babel-loader/
      // directory for faster rebuilds.
      cacheDirectory: true,
    },
},
```

代碼中paths.appSrc的值就是src，所以這段配置的含義指的是所有以js或者jsx為擴展名的文件，都會由babel所處理。

## React的工作方式

我們用ClickCounter組件思考React工作方式，要了解一樣東西的特點，最好方法就是拿這個東西和另一樣東西做比較。我們就拿React和jQuery來比較。

### jQuery如何工作

假設我們用jQuery來實現ClickCounter的功能，首先我們產生一個網頁的HTML(*index.html*)：

```html
<!DOCTYPE html>
<html lang="en">
<body>
<div>
    <button id="clickMe">click Me</button>
    <div>
        Click Count: <span id="clickCount">0</span>
    </div>
</div>
<script src="//lib.sinaapp.com/js/jquery/1.9.1/jquery-1.9.1.min.js"></script>
<script src="./clickCounter.js"></script>
</body>
</html>
```

*clickCounter.js*：

```js
$(function () {
    $('#clickMe').click(function () {
        var clickCounter = $('#clickCount');
        var count = parseInt(clickCounter.text(), 10);
        clickCounter.text(count + 1);
    })
});
```

在jQuery的解決方案中，首先根據CSS規則找到id為clickCount的按鈕，掛上一個匿名事件處理函數，在事件處理函數中，選中那個需要被修改DOM元素，讀取其中的文本值，加以修改，然後修改這個DOM元素。

選中一些DOM元素，然後對這些元素作一些操作，這是一種最容易理解的開發模式。jQuery的發明人John Resig就是發現了網頁應用開發者的這個編程模式，才創造出了jQuery，一問世就得到普遍認可，因為這種模式直觀易懂。但是，對於龐大項目，這種模式會造成代碼結構複雜，難以維護，每個jQuery的使用者都會有這種體會。

### React的理念

React開發ClickCounter組件並沒有像jQuery那樣做“選中一些DOM元素然後做一些事情”的動作。

開發者只要著重”我想要顯示什麼“，而不用操心”怎樣去做“。

這種新的思維方式，對於一個簡單的例子也要編寫不少代碼，但是對於一個大型項目，這種方式編寫的代碼會更容易管理，因為整個React應用要做的就是渲染，**開發者關注的是渲染什麼樣子，而不用關心如何實現增量渲染**。

React的理念，歸結為一個公式，就像下面這樣：

```
UI=render(data)
```

用戶看到的介面(UI)，應該是一個函數(這裡叫render)的執行結果，只接受數據(data)作為參數。這個函數是一個**純函數**。所謂純函數，指的是沒有任何副作用，輸出完全依賴於輸入的函數，兩次函數調用如果輸入相同，得到的結果也絕對相同。如此一來，最終的用戶介面，在render函數確定的情況下完全取決於輸入數據。

對於開發者來說，重要的是區分開**哪些屬於data**，**哪些屬於render**，想要更新用戶介面，要做的就是更新data，用戶界面自然會做出響應。所以React實踐的也是“響應式編程(Reactive Programming)”的思想，這也就是React為什麼叫做React的原因。

### Virtual DOM

既然React應用就是透過重複渲染來實現用戶交互，你可能會有一個疑惑：這樣重複渲染會不會效能太低？在 React的實現方式中，看起來每次render函數被調用，都要把整個組件重新繪製一次，這樣看起來有點浪費。

事實不是這樣，React利用Virtual DOM，讓每次渲染都只重新渲染最少的DOM元素。

DOM是結構化文本的抽象表達形式，特定於Web環境中，這個結構化文本就是HTML文本，HTML中的每個元素都對應DOM中某個節點，這樣，因為HTML元素的逐級包含關係，DOM節點自然就構成了一個樹形結構，稱為DOM樹。

瀏覽器為了渲染HTML格式的網頁，會先將HTML文本解析以構建DOM樹，然後根據DOM樹渲染出用戶看到的介面，當要改變介面內容的時候，就去改變DOM樹的節點。

Web前端開發關於性能優化有一個原則：**盡量減少DOM操作**。雖然DOM操作也只是一些簡單的JavaScript語句，但是DOM操作會引起瀏覽器對網頁進行重新佈局，重新繪製，這就是一個比JavaScript語句執行慢很多的過程。

如果使用mustache或hogan這樣的模板工具，那就是生成HTML字符串塞到網頁中，瀏覽器又要做一次解析產生新的DOM節點，然後替換DOM樹上對應的子樹部分，這個過程肯定效率不高。雖然JSX看起來很像一個模板，但是最終會被Babel解析為一條條構建React組件或者HTML元素的語句，神奇之處在於，React並不是透過這些語句直接構建DOM樹，而是首先構建Virtual DOM。

DOM樹是對HTML的抽象，那Virtual DOM就是對DOM樹的抽象。Virtual DOM不會觸及瀏覽器的部分，只是存在於JavaScript空間的樹形結構，每次自上而下渲染React組件時，會對比這一次產生的Virtual DOM和上一次渲染的Virtual DOM，對比就會發現差別，然後修改真正的DOM樹時就只需要觸及差別中的部分就行。

以ClickCounter為例，React透過Virtual DOM對比發現其實只是id為clickCount的span元素中內容從0變成1而已：

```
<span id="clickCount">{this.state.count}</span>
```

於是執行類似下面的語句，就完成任務：

```
document.getElementById('clickCount').innerHTML = '1';
```

### React工作方式的優點

jQuery直觀易懂，但當項目逐漸變得龐大，用jQuery寫出的代碼往往互相糾纏，難以維護。

```
event  ->  DOM
event  ->  DOM
event  ->  DOM
event  ->  DOM
event  ->  DOM
```
(箭頭是錯綜複雜的)

使用React的方式，就可避免構建複雜的程序結構，**無論何種事件**，**引發的都是React組件的重新渲染**，至於如何只修改必要的DOM部分，則完全交給React去操作，開發者並不需要關心。

React利用函數式編程的思維來解決用戶界面渲染的問題，最大優勢是開發者的效率會提高，開發出來的代碼可維護性和可閱讀性也大大增強。

```
event
event
event  -> render -> Virtual DOM -> DOM修改
event
event
```

React等於強制所有組件都按照這種由**數據驅動渲染**的模式來工作，無論應用的規模多大，都能讓程序處於可控範圍內。

## 本章小結

React利用聲明式的語法，讓開發者專注於描述用戶介面“顯示成什麼樣子”，而不是重複思考“如何去顯示”，這樣可大大提高開發效率，也讓代碼更加容易維護。

React是透過重複渲染來實現動態更新效果，但是借助Virutal DOM技術，實際上這個過程並不牽涉太多DOM操作，所以渲染效率很高。