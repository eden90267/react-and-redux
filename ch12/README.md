# Chap12. 同構

其實，React作為一個產生用戶介面的JavaScript庫，Redux作為一個管理應用資料的框架，兩者也可以在Server端運行。

理想種況下，一個React組件或者說功能組件既能夠在瀏覽器端渲染也可以在伺服器端渲染產生HTML，這種方式叫做"同構"(Isomorphic)，也就是同一份代碼可以在不同環境下運行：

本章將介紹：

- 伺服器端渲染和瀏覽器端渲染的對比
- 如何構建渲染動態內容的Server
- 如何實現React和Redux的同構應用

## 伺服器端渲染 vs 瀏覽器端渲染

伺服器端渲染發展：

1. Server存放靜態HTML文件讓瀏覽器透過HTTP訪問
2. CGI出現，讓HTML可以動態生成，也就是來自瀏覽器的HTTP請求，Server透過訪問存儲器或訪問別的API服務之類的方式獲得資料，然後根據資料渲染產生HTML返回給瀏覽器，瀏覽器只要把HTML渲染出來，就是用戶想要看的結果。這是"伺服器端渲染"，並且統治網頁應用很長一段時間。
3. AJAX，可在不刷新網頁的情況下透過局部更新提高用戶體驗
4. Web 2.0的浪潮

技術沒有止步於AJAX，最初使用AJAX應用大多依然透過Server渲染產生一個包含可渲染內容的HTML網頁，只有局部的更新使用AJAX完成，於是，有的開發者已經開始思考，是不是可以乾脆不用Server端返回有內容的HTML，是不是可以讓應用功能完全用JavaScript在瀏覽器端產生HTML呢?

2009年，Twitter網站就進行這樣的嘗試，Server返回HTML只包含幾個無內容的元素作為頁面框架，但是，網頁中引用的JavaScript文件會直接訪問API
Server來獲取資料，獲取的資料再透過模板庫產生HTML字符串，把HTML字符串插入到頁面框架中，就產生了用戶最終看到的介面，這就是"瀏覽器端渲染"的方式。

反思當年Twitter的嘗試，並不算十分成功，因為模板庫的效率並不是很高，加上用戶需要等待API請求成功之後才能看到第一條有意義的內容。所以非但沒有提高用戶體驗，反而讓用戶感覺更慢了，最終Twitter放棄了這種純靠瀏覽器渲染的方式，直到今天，Twitter網站依然是伺服器端渲染配合瀏覽器端渲染的工作方式。

不過，整個行業並沒有被這點挫折嚇倒，更多的支持完全"瀏覽器端渲染"的方案提了出來。

傳統上，一個瀏覽器端渲染的方案，一般要包含這幾個部分：

- 一個應用框架，包含路由和應用結構功能，例如Backbone.js就是這樣的MVC框架，當然React這樣遵循單向資料流的框架配合React-Router也可以勝任
- 一個模板庫，比如mustache，透過模板庫開發者可以定義模板，模板以資料為輸入，輸出的就是HTML字符串，可以插入到網頁中，React可以替換模板庫的功能
- 伺服器端的API支持，因為應用代碼完全佈署在頁面JavaScript，獲取資料不能像伺服器渲染那樣有直接訪問資料庫的選擇，只能要求有一個提供資料的API伺服器，通常就是一個RESTful API。

傳統模板庫就是生硬的字符串轉換操作，無論如何優化都會有它的極限，而且模板的輸出依然是字符串，將HTML字符串插入網頁的過程，也就是DOM樹的操作，性能也無法優化。在前面的章節我們介紹過React的Virtual DOM工作原理，配合生命週期函數的應用，性能不是字符串替換的模板庫能夠比擬的。

React可以將網頁內容(HTML)、動態行為(JavaScript)和樣式(CSS)全部封裝在一個組件中，把瀏覽器端渲染的應用發揮到了極致。

雖然完全的瀏覽器端渲染很有市場，但是這種方式有一個難以擺脫的陰影，那就是首頁性能。

為了便於量化網頁性能，我們定義兩個指標：

- TTFP(Time To First
  Paint)：指的是從網頁HTTP請求發出，到用戶可以看到第一個有意義的內容渲染出來的時間差
- TTI(Time To Interactive)：指的是從網頁HTTP請求發出，到用戶可以對網頁內容進行交互的時間

TTFP這個時間差當然越短越好，也就是說應用要盡早顯示有意義的內容給用戶，不要讓用戶只對著一個空白屏幕發呆；TTI肯定要比TTFP要長一些，因為沒有內容哪裡會有交互，當渲染出內容之後，還要JavaScript代碼給DOM元素添加事件處理函數才會有交互結果，這個過程需要一些時間。

在一個完全靠瀏覽器渲染的應用中，當用戶在瀏覽器中打開一個頁面的時候，最壞的情況下沒有任何緩存，需要等待三個HTTP請求才能到達TTFP的時間點。

- 向伺服器獲取HTML，雖然這個HTML只是一個無內容的空架子，但是皮之不存毛將焉附，這個HTML就是皮，在其中運行的JavaScript就是毛，所以這個請求是不可省略的
- 獲取JavaScript文件，大部分情況下，如果這是瀏覽器第二次訪問這個網站，就可以直接讀取緩存，不會發出真正的HTTP請求
- 訪問API
  Server獲取資料，得到的資料將由JavaScript加工產生之後用來填充DOM樹，如果應用的是React，那就是透過修改組件的狀態或者屬性來驅動渲染

總共有三個HTTP請求，在三個不可預料的網絡請求之後，才可以渲染第一個有意義內容，即使第二個HTTP請求利用了緩存，那也需要兩個HTTP來回的時間。

>**Top**：  
>實際上，按照Progressive Web App的規格，可以透過Manifest和Service
>Worker技術進一步優化，避免第一次獲取HTML的請求和第三個訪問API的請求，但是這種技術超出了本書討論的範圍，而且這些技術也並不適合用於所有網頁應用，在這裡只討論一般狀況。

對於一個伺服器端渲染，因為獲取HTTP請求就會返回有內容的HTML，所以在一個HTTP的週期之後就會提供給瀏覽器有意義的內容，所以首次渲染時間TTFP會優於完全依賴於瀏覽器端渲染的頁面。

>**Top**：  
>除了更短的TTFP，伺服器端渲染還有一個好處就是利於搜尋引擎優化，雖然某些搜尋引擎已經能夠索引瀏覽器端渲染的網頁，但是畢竟不是所有搜尋引擎都能做到這一點，讓搜尋引擎能夠索引到應用頁面的最直接方法就是提供完整HTML。

上面的性能對比當然只是理論上的分析，實際中，採用伺服器端是否獲得更好的TTFP有多方面因素。

首先，伺服器端獲取資料快還是瀏覽器端獲取資料快?雖然伺服器端渲染減少了一個瀏覽器和伺服器之間的HTTP訪問週期，也就是獲取資料的過程，但是在網頁伺服器上一樣有獲取資料的過程，如果在網頁伺服器上訪問資料存儲或者API伺服器的延遲要比瀏覽器端更短，那麼才能體現伺服器端渲染的優勢。當然，大多數情況下，在網頁伺服器上獲取資料的確更快，開發者只需要確認這一點就行。

其次，伺服器端產生的HTML過大是否會影響性能?因為伺服器渲染讓網頁伺服器返回包含內容的HTML，那樣首頁下載的HTML要比純瀏覽器端渲染要大，這樣下載HTML的時間也會增長，這樣導致伺服器渲染未被能獲得更好的性能。特定於React應用，伺服器端渲染需要在網頁中包含"脫水資料"，除了HTML之外還要包含輸入給React重新繪製的資料，這樣導致頁面的大小比最傳統的伺服器端渲染產生的頁面還要大，更要考慮頁面大小對性能的影響。

最後，伺服器端渲染的運算消耗是否是伺服器能夠承擔得起的?在瀏覽器渲染的方案下，伺服器只提供靜態資源，無論HTML還是JavaScript，提供靜態資源對伺服器壓力較小，甚至可以交給CDN來承擔，這樣伺服器基本無壓力，產生網頁HTML的運算壓力被分攤到了訪問用戶的瀏覽器中；如果使用伺服器端渲染，那麼網頁請求都要產生HTML頁面，這樣伺服器的運算壓力也就增大了。對應React，使用伺服器端渲染可能對伺服器運算壓力很大，因為Facebook已經明確說React並不是給伺服器端渲染設計的，Facebook本身也沒有在實際產品中應用React的伺服器端渲染。

總結一下，我們既列舉了伺服器端渲染優點，也分析了伺服器渲染潛在的風險。那麼，應不應該使用React伺服器端渲染呢?

沒人能給一個明確的答案。至今業內很多人覺得React的"同構"沒有多大意義，但也有很多有志之士開發了很多伺服器端渲染的實例。所以，在這裡只是介紹"同構"的方法，每個應用都有每個應用的特點，開發者需要根據應用特點作出判斷。

如果應用TTFP沒有那麼高的要求，也不希望對React頁面進行搜尋引擎優化，那就真沒有必要使用"同構"來增加應用複雜度。

如果希望應用的性能百尺竿頭更進一步，而且伺服器端運算資源充足，那麼可以試一試伺服器端渲染。

React被發明出來就是為了滿足瀏覽器端渲染的需要，我們前面章節例子也只考慮了React在瀏覽器端運行的情況，現在我們考慮如何在伺服器端使用React。

## 構建渲染動態內容伺服器

雖然Facebook聲稱React並不是給伺服器端渲染設計的，但是React真的很適合來做同構，因為React用聲明的方式定義了用戶介面如何渲染，就是這個我們反覆強調的公式描述的：

```
UI=render(state)
```

React組件描述了render過程，往裡面塞進去state就能夠得到用戶介面UI，這個過程既可以在瀏覽器端進行，也可以在伺服器端進行，一份代碼足矣，不像其他伺服器端渲染，需要分別開發伺服器端渲染的代碼和瀏覽器端代碼。

現在我們就來看一看怎樣用React實現同構，不過我們要搭建起伺服器端渲染的框架。

因為React是JavaScript語言所寫，應用也是JavaScript代碼，那麼伺服器端要重用一樣的代碼當然也要支持JavaScript的運行，那就毫無懸念地應該選擇Node.js作為伺服器端的運行框架。

Node.js只是一個JavaScript的運行環境，提供的API非常底層，所以我們還需要一個基於Node.js的應用框架來方便構建伺服器，這裡選擇最成熟的Express框架。

我們基於第11章中最後構建的單頁應用來實踐同構，不過同構是一個比較複雜過程，我們先實現一個小目標，那就是用Node.js和Express來代替create-react-app提供的啟動腳本。

### 設置Node.js和Express

```bash
create-react-app express_server
cd express_server
npm install --save-dev --save-exact react-scripts@0.9.0
```

create-react-app就算進行了"彈出"操作，這樣我們終於獲得任意定製webpack的自由，不過應用啟動腳本npm
start依然是create-react-app生成的，啟動之後雖然也是基於Node.js的伺服器端在運行，但是只是簡單地對請求返回public目錄下的index.html，無法訂製伺服器端內容，所以只能自己動手創造新的啟動腳本。

Node.js我們快速開發一個網絡應用必須要借助Node.js之上的框架Express，還有在Express中我們要使用ejs模板工具，首先安裝npm包：

```bash
yarn add express ejs
```

然後，在項目根目錄下創造一個server目錄，這個目錄用於存放所有只在伺服器端運行的代碼，我們先要定義伺服器端入口文件*server/index.js*：

```js
const isProductionMode = (process.env.NODE_ENV === 'production');
const app = isProductionMode ? require('./app.prod.js') : require('./app.dev.js');

if (!isProductionMode) {
  process.env.NODE_ENV = 'development';
}

const PORT = process.env.PORT || 9000;

app.listen(PORT, function () {
  console.log(`running in ${isProductionMode ? 'production' : 'development'} mode`);
  console.log(`listening on port: ${PORT}`);
});
```

為了避免和原有`npm start`啟動腳本衝突，程序監聽的端口不是3000而是9000。

相對而言，"產品模式"下的代碼簡單一些，我們先來看*server/app.prod.js*：

```js
const express = require('express');
const path = require('path');
const app = express();
const assetManifest = require(path.resolve(__dirname, '../build/asset-manifest.json'));

app.use(express.static(path.resolve(__dirname, '../build')));
app.get('*', (req, res) => {
  return res.render('index', {
    title: 'Sample React App',
    PUBLIC_URL: '/',
    assetManifest
  });
});

app.set('view engine', 'ejs'); // 使用ejs作為渲染模板
app.set('views', path.resolve(__dirname, 'views'));// 模板文件目錄

module.exports = app;
```

要運行產品模式，必須先透過`npm run
build`命令編譯產生所有的瀏覽器端JavaScript打包文件，這些打包文件都已經做過優化處理，而且文件名中包含8個字符的Hash值，所以要想確定這些打包文件實際的文件名，需要去讀取轉譯過程中產生的描述文件，描述文件存放在項目目錄下的*build/asset-manifest.json*中，這個文件內容是JSON形式，大概如下：

```json
{
  "404.js": "static/js/404.248d2b3f.chunk.js",
  "404.js.map": "static/js/404.248d2b3f.chunk.js.map",
  "about.js": "static/js/about.39aaf2d1.chunk.js",
  "about.js.map": "static/js/about.39aaf2d1.chunk.js.map",
  "common.js": "static/js/common.4b635ff4.js",
  "common.js.map": "static/js/common.4b635ff4.js.map",
  "counter.js": "static/js/counter.4b439ada.chunk.js",
  "counter.js.map": "static/js/counter.4b439ada.chunk.js.map",
  "home.js": "static/js/home.3fa26940.chunk.js",
  "home.js.map": "static/js/home.3fa26940.chunk.js.map",
  "main.js": "static/js/main.d91c4c20.js",
  "main.js.map": "static/js/main.d91c4c20.js.map"
}
```

上面只是一個例子，每個文件名中的8位Hash值隨文件內容改變而改變，任何一點代碼邏輯修改都會導致文件名的不同。

需要獲得頁面應該引用的JavaScript文件，只需讀取*build/asset-manifest.json*文件中*main.js*和*common.js*對應的路徑就行，其他的分片文件比如*home.js*和*404.js*，打包文件*main.js*會按需去動態加載，也就是require.ensure函數調用的時候去加載，無須我們擔心。

在*app.prod.js*中，對於所有HTTP請求，先去static目錄下匹配靜態資源。如果找不到，就會用app.get指定的一個默認路徑處理，"*"默認路徑處理方式就是用ejs模板返回一個定製的HTML網頁。

在server/views/index.ejs文件中是模板文件：

```ejs
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="shortcut icon" href="<%= PUBLIC_URL %>favicon.ico">
    <title><%= title %></title>
</head>
<body>
<div id="root"></div>
<script src="<%= PUBLIC_URL + assetManifest['common.js'] %>"></script>
<script src="<%= PUBLIC_URL + assetManifest['main.js'] %>"></script>
</body>
</html>
```

目前，這個模板文件只渲染一個div作為瀏覽器端React的舞台，另外引入*common.js*和*main.js*對應的實際JavaScript路徑，產生的內容和`npm
start`沒有差別，這只是一個階段性的小目標，後面我們會讓這個模板包含真正的伺服器端渲染內容。

最後我們在package.json中的scripts增加一個指令：

```json
"start_prod": "NODE_ENV=production node server/index.js"
```

就可以在命令行透過`npm run start_prod`來啟動"產品模式"的應用了，這次的應用連接是在[http://localhost:9000]()，但是每次這樣修改代碼後，都要先運行`npm run build`編譯產生打包文件，實在很麻煩，所以大部分時間開發者還是要在"開發模式"下運行程序，為了達到便於開發目的，相對應的代碼server/app.dev.js就要麻煩很多。

### 熱加載

在create-react-app產生應用的npm start指令下，每次對任何代碼的修改，都會讓瀏覽器中頁面自動刷新，這樣當然會讓我們省去了手動刷新的麻煩，但是，有時候開發者並不想要這樣，比如，我們發現了一個Bug，一個最普通不過的Debug過程就是，修改一點代碼，看看問題修復沒有，沒有就再修改一點代碼，看看修復沒有...直到問題消失。不過，有的Bug很詭異，要在同一網頁裝載完成後做很多次操作之後才能複現，如果每改一點代碼網頁就刷新一次，開發者又要重複多次操作來看看是否修復了這個Bug，如果沒有重來，又要手工重複多次操作...這樣頁面刷新就會顯得很煩。

試想，既然在React中遵守`UI=render(state)`這樣的公式，在代碼更新之後，如果只更新render的邏輯，而不去碰state，那該有多好！那樣當發現render在某種state下暴露出bug，只需保持state不變，反覆替換render就可以驗證bug是否被修復。

對於上面的Debug的過程，如果每次代碼更改的時候，不要去刷新網頁，而是讓網頁中的React組件渲染代碼換成新的就行。因為在Redux框架下，我們把狀態存在了Store上而不是在React組件中，所以這種替換完全可行。這種方式，叫做**熱加載**(Hot Load)。

目前create-react-app不支持熱自動加載，但次我們現在自建伺服器端，也就不受影響可以自己實現熱自動加載了。

為了實現熱自動加載，我們需要兩個Express中間件，一個叫webpack-dev-middleware，用於動態運行webpack生成打包文件，另一個叫webpack-hot-middleware，這個用於處理來自瀏覽器端的熱加載請求，還需要一個babel裝載起react-hot-loader，用於處理React組件的熱自動加載。

```bash
yarn add -D webpack-dev-middleware webpack-hot-middleware react-hot-loader
```

然後我們要修改*config/webpack.config.dev.js*，我們的開發模式伺服器依然以這個文件作為webpack的配置：

默認的開發模式沒有產生靜態資源說明文件，但是我們的頁面模板文件需要說明文件來獲取JavaScript打包文件路徑，所以，首先在文件頂部導入ManifestPlugin，然後在plugins的部分添加ManifestPlugin實例，參數指定了產生asset-manifest.json，這和npm build腳本產生的資源說明文件是一致的：

```js
const ManifestPlugin = require('webpack-manifest-plugin');

plugins: [
  // ...
  new ManifestPlugin({
    fileName: 'asset-manifest.json'
  }),
]
```

然後，在entry部分刪掉或者注釋掉原有的webpackHotDevClient，因為我們不想要網頁自動刷新了，用另一個webpack-hot-middleware/client來取代它：

```js
// require.resolve('react-dev-utils/webpackHotDevClient'),
'webpack-hot-middleware/client',
```

在loaders部分，增加react-hot應用：

```js
{
  test: /\.js$/,
  include: paths.appSrc,
  loader: 'react-hot'
},
```

為了讓熱加載有效，還需要保證webpack.HotModuleReplacementPlugin存在於plugins中，默認配置已經有這插件，所以無需修改。

最後，我們增加新的*server/app.dev.js*：

```js
const express = require('express');
const path = require('path');

const webpack = require('webpack');
const webpackConfig = require('../config/webpack.config.dev');
const compiler = webpack(webpackConfig);
const webpackDevMiddleware = require('webpack-dev-middleware')(
  compiler,
  {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  }
);
```

為了讓express伺服器支持開發者的工作，需要使用新安裝的兩個中間件，而這兩個中間件都需要webpack作為支持，我們在JavaScript代碼中創建webpack實例，指定配置文件就是config目錄下的*webpack.config.dev.js*，和`npm start`使用的配置文件相同，習慣上，webpack實例的變量名被稱為compiler。

在Express伺服器啟動的時候，webpack-dev-middleware根據webpack來編譯生成打包文件，之後每次相關文件修改的時候，就會對應更新打包文件。因為更新過程只需要重新編譯更新的文件，這個速度會比啟動時的完全編譯過程快很多，當項目文件量很大的時候尤其突出，這就是在開發模式中使用webpack-dev-middleware的意義。

而且，webpack-dev-middleware並沒有將產生的打包文件存放在真實的文件系統中，而是存放在內存中的虛擬文件系統，所以要獲取資源描述文件不能像產品環境那樣直接require就行，而是要讀取webpack-dev-middleware實例中的虛擬文件系統，對應的函數定義如下：

```js
function getAssetManifest() {
  const content = webpackDevMiddleware.fileSystem.readFileSync(__dirname + '/../build/asset-manifest.json');
  return JSON.parse(content);
}
```

雖然webpack-dev-middleware中間件能夠完成實時更新打包文件，但是這只發生在伺服器端，只有當瀏覽器刷新重新向伺服器請求資源時才能得到更新的打包文件，而webpack-hot-middleware就更進一步，無需網頁刷新，能夠把代碼更新“推送”到網頁之中。

使用兩個Express中間件的代碼如下：

```js
const app = express();
app.use(express.static(path.resolve(__dirname, '../build')));
app.use(webpackDevMiddleware);
app.use(require('webpack-hot-middleware')(compiler, {
  log: console.log,
  path: '/__webpack_hmr',
  heartbeat: 10 * 1000
}));
```

webpack-hot-middleware的工作原理是讓網頁建立一個websocket鏈接到伺服器，伺服器支持websocket的路徑由path參數指定，我們例子中就是*/__webpack_hmr*。每次有代碼文件發生改變，就會有消息推送到網頁中，網頁就會發出請求獲取更新的內容。

最後，和“產品模式”的*server/app.prod.js*一樣，需要用app.get指定一個默認的路由處理方式，對於所有非靜態資源都返回一個ejs模板的渲染結果：

```js
app.get('*', (req, res) => {
  const assetManifest = getAssetManifest();
  return res.render('index', {
    title: 'Sample React App',
    PUBLIC_URL: '/',
    assetManifest
  });
});
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

module.exports = app;
```

在package.json中的script增加：

```json
"start:isomorphic": "NODE_ENV=development node server/index.js"
```

然後，我們就可以在命令行用`npm start:isomorphic`命令啟動開發模式應用。

將src/pages/Home.js文件的`<div>Home</div>`改成`<div>主頁</div>`，可以發現，在瀏覽器無須刷新網頁，對應頁面自動發生變化。

瀏覽器console，可以看到整個自動更新的過程。

```
[HMR] bundle rebuilding
[HMR] bundle rebuilt in 316ms
[HMR] Checking for updates on the server...
[HMR] Updated modules:
[HMR]  - ./src/pages/Home.js
[HMR] App is up to date.
Warning: [react-router] You cannot change <Router routes>; it will be ignored
```

HMR代表的就是Hot-Module-Reload，從日誌中可以看到修改Home.js文件的更新被瀏覽器端發現並做了自動更新。

不過，也發現了一個錯誤警告：

```
Warning: [react-router] You cannot change <Router routes>; it will be ignored
```

這個警告是因為React-Router在熱加載時的報警，這並不會產生什麼實質危害，但是這警告出現也讓人討厭，我們可修改*src/Routers.js*，把路由規則從Router的子組件中抽取出來作為獨立變量，就可解決這個問題：

```js
const routes = (
  <Route path="/" component={App}>
    <IndexRoute getComponent={getHomePage}/>
    <Route path="home" getComponent={getHomePage}/>
    <Route path="counter" getComponent={getCounterPage}/>
    <Route path="about" getComponent={getAboutPage}/>
    <Route path="*" getComponent={getNotFoundPage}/>
  </Route>
);
class Routes extends  Component {
  render() {
    return (
      <Router history={history} createElement={createElement}>
        {routes}
      </Router>
    );
  }
}
```

改完之後，這個錯誤提示就消失了。

現在我們已經有了伺服器端渲染的開發模式和產品模式，接下來我們要實現真正的同構。

## React同構

為了實現同構，需要實現這些功能：

- 在伺服器端根據React組件產生HTML
- 資料脫水和注水
- 伺服器端管理Redux Store
- 支持伺服器和瀏覽器獲取相同資料源

這是一個複雜的過程，讓我們一一道來。

### React伺服器渲染HTML

React在伺服器端渲染使用函數和瀏覽器端不一樣，在瀏覽器端的函數是render，接受兩個參數，第一個是一個React組件，第二個是這個組件需要裝載的DOM節點位置。代碼模式是這樣：

```js
import ReactDOM from 'react-dom';
ReactDOM.render(<RootComponent />, document.getElementById('root'));
```

當render函數被調用的時候，必須保證id為root的DOM元素作為容器真的存在，render函數的工作就是啟動RootComponent的裝載過程，最後產生的DOM元素就存在root容器之中。

在瀏覽器端，最終的產出是DOM元素，而在伺服器端，最終產生的是字符串，因為返回給瀏覽器的就是HTML字符串，所以伺服器端渲染不需要指定容器元素，只有一個返回字符串的函數renderToString，使用這個函數的代碼模式是這樣：

```js
import ReactDOMServer from 'react-dom/server';
const appHtml = ReactDOMServer.renderToString(<RootComponent />);
```

renderToString函數的返回結果就是一個HTML字符串，至於這個字符串如何處理，要由開發者來決定，當然，在這個例子中，為了和瀏覽器一致，我們會把返回的字串嵌在id為root的元素中。

當然，只是把renderToString返回的字符串在瀏覽器中渲染出來，用戶看到的只是純靜態的HTML而已，並不具有任何動態的交互功能。要讓渲染的HTML"活"起來，還需要瀏覽器端執行JavaScript代碼。因為React將HTML、樣式和JavaScript封裝在一個組件中的特點，所以讓React組件渲染出的HTML"活"起來的代碼就存在於React組件之中，也就是說，如果應用React伺服器端渲染，一樣要利用React瀏覽器端渲染。

過程是這樣，伺服器端渲染產生的React組件HTML被下載到瀏覽器網頁之中，瀏覽器網頁需要使用render函數重新渲染一遍React組件。這個過程看起來會比較浪費，不過在瀏覽器端的render函數結束之前，用戶就已經可以看見伺服器端渲染的結果了，所以用戶感知的性能提高了。

為了避免不必要的DOM操作，伺服器端在渲染React組件時會計算所生成HTML的校驗和，並存放在根節點的屬性data-react-checksum中。在瀏覽器渲染過程中，在重新計算出預期的DOM樹之後，也會計算一遍校驗和，和伺服器計算的校驗和做一個對比。如果發現兩者相同，就沒有必要做DOM操作了，如果不同，那就應用瀏覽器端產生的DOM樹，覆蓋掉伺服器產生的HTML。

很明顯，如果伺服器端渲染和瀏覽器端渲染產生的內容不一樣，用戶會先看到伺服器端渲染的內容，隨後瀏覽器端會重新渲染內容。用戶就會看到一次閃爍，這樣給用戶的體驗很不好。所以，實現同構很重要的一條，就是一定要保證伺服器端和瀏覽器端渲染的結果要一模一樣。

如果我們能夠保證伺服器端和瀏覽器端使用的React組件代碼是一致的，那導致渲染結果不一致的唯一可能就是提供給React組件的資料不一致。

為了讓兩端資料一致，就要涉及"脫水"和"注水"的概念。

### 脫水和注水

伺服器端渲染產出了HTML，但是在交給瀏覽器的網頁不光要有HTML，還需要有"脫水資料"，也就是在伺服器渲染過程中給React組件的輸入資料，這樣，當瀏覽器端渲染時，可以直接根據"脫水資料"來渲染React組件，這種過程叫做"注水"。使用脫水數據可以避免沒有必要的API伺服器請求，更重要的是，保證了兩端渲染的結果一致，這樣不會產生網頁內容的閃動。

脫水資料的傳遞方式一般是在網頁中內嵌一段JavaScript，內容就是把傳遞給React組件的資料賦值給某個變數，這樣瀏覽器就可以直接透過這個變數獲取脫水資料。

使用EJS作為伺服器端模板，渲染脫水資料的代碼模式基本這樣，其中appHTML是React的renderToString返回的HTML字符串，而dehydrateState就是脫水資料的JSON字符串表示形式，賦值給了全局變數DEHYDRATED_STATE，在瀏覽器端，可以直接讀取到這個變數。

```ejs
<div id="root"><%- appHtml %></div>
<script>
  var DEHYDRATED_STATE = <%- dehydratedState %>
</script>
```

需要注意的是，使用脫水資料要防止跨站腳本攻擊(XSS Attack)，因為脫水資料有可能包含用戶輸入的成分，而用戶的輸入誰也保不準包含什麼，例如dehydrateState包含用戶可以控制的字符串，那就可能被利用，產生下面的網頁輸出：

```html
<script>
  var DEHYDRATED_STATE = "...</script><script>doBedThing()</script>";
</script>
```

既然我們使用Redux來管理應用資料，那麼脫水資料的就應該是來自Redux的Store，借助於react-redux的Provider幫助，可以很容易地讓所有React都從一個store獲得資料，然後我們在調用伺服器端渲染的函數renderToString之後調用store的getState函數，得到的結果就可以作為"脫水資料"：

```js
const appHtml = ReactDOMServer.renderToString(
  <Provider store={store}>
    <RouterContext {...renderProps}/>
  </Provider>
);

const dehydratedState = store.getState();
```

脫水資料一定不能太大，因為脫水資料要占用網頁的大小，如果脫水資料過大，可能會影響性能，讓伺服器端渲染失去意義。

由此，我們再次看出讓Redux Store上的不要存冗餘資料的必要性，只要我們保證Store上狀態沒有冗餘，在產生脫水資料的時候就輕鬆太多，不然很難分辨哪些資料不必要放在脫水資料中。

### 伺服器端Redux Store

在伺服器端使用Redux，必須要對每個請求都創造一個新的Store，所以一個Store就足夠了，但是在伺服器端會接受到很多瀏覽器端的請求，畢竟我們的伺服器不會設計成只滿足一個用戶在線使用，既然特定每個請求的資料存在Store裡，當然對每個請求都要重新構建一個store實例。

所以，我們要修改一下*src/Store.js*的實現，把構建Store的代碼放在一個函數中。

```js
import {createStore, applyMiddleware, combineReducers, compose} from 'redux';
import {routerReducer} from 'react-router-redux';

import resetEnhancer from './enhancer/reset';

const configureStore = () => {
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

  const store = createStore(reducer, {}, storeEnhancers);
  store._reducers = originalReducers;
  
  return store;
};

export {configureStore};
```

因為*src/Store.js*導出的不再是一個Store實例而是一個configStore函數，對應導入這個文件的代碼也要對應改變。

### 支持伺服器和瀏覽器獲取共同資料源

脫水資料只在瀏覽器訪問的首頁發揮作用，之後，用戶可以操作網頁跳轉，這時候網頁需要自己獲得資料提供給React組件。

舉個例子，我們希望Counter頁面顯示的計數初始值由伺服器端確定，而不是一個代碼中固定的數字。用戶首先直接訪問[http://localhost:9000/home]()頁面，然後又透過點擊頂欄的"Counter"鏈接[http://localhost:9000/counter]()頁面，因為這是一個單頁應用，Counter頁面的HTML是完全由瀏覽器端渲染的，所以沒有伺服器的脫水資料，所有瀏覽器需要一個API請求來獲取初始值。同樣，用戶可能在Counter頁面點擊瀏覽器刷新按鈕，或者在另一個窗口直接輸入Counter頁面的地址，這時網頁的HTML是伺服器端渲染產生的，這樣伺服器也須要有能夠獲取初始值的能力。

很明顯，最簡單的作法，就是有一個API伺服器提供接口讓伺服器和瀏覽器都能夠訪問，這樣無論是什麼樣的場景，伺服器和瀏覽器獲得資料都是一樣的。

API伺服器作為獨立的伺服器可能並不在網頁伺服器同一個域名下，這樣如果要瀏覽器端訪問，就要在API伺服器配置跨域訪問策略，有的時候，API伺服器並不在一個產品的控制範圍內，無法配置跨域策略，這樣，就需要網頁伺服器同域名下搭起一個代理，把請求轉發到API伺服器。

在我們例子中，我們在server/app.dev.js中增加一個路由規則，模擬一個API伺服器，提供一個計數初始值的接口：

```js
app.use('/api/count', (req, res) => {
  res.json({count: 100});
});
```

到現在為止，我們的理論準備工作差不多了，接下來就要實踐同構。

### 伺服器端路由

因為瀏覽器端使用了React-Router作為路由，沒有理由不在伺服器端使用一致的方法，不過在伺服器端使用React-Router的方式和瀏覽器端不一樣，在瀏覽器端，整個Router作為一個React組件傳遞一個ReactDOM的render函數，Router可以自動和URL同步，但是對於伺服器端的過程，URL對應到路由規則的過程需要用match函數：

```js
import {match, RouterContext} from 'react-router';

match({routes, location: requestUrl}, function(err, redirect, renderProps) {
  if (err) {
    return res.status(500).send(err.message);
  }
  if (redirect) {
    return res.redirect(redirect.pathname + redirect.search);
  }
  if (!renderProps) {
    return res.status(404).send('Not Found');
  }
  const appHtml = ReactDOMServer.renderToString(
    <RouterContext {...renderProps}/>
  );
});
```

match函數接受一個對象和一個回調函數作為參數，對象參數中的routes就是Route構成的路由規則樹，這裡根本用不上Router類，所以也用不上Router的history屬性，這就是和瀏覽器端渲染的最大區別。match是透過對象參數中的location欄位來確定路徑的，不是靠和瀏覽器地址欄關聯的history。

當match函數根據location和routes匹配完成後，就會調用第二個回調函數參數，根據回調函數第一個參數err和第二個參數redirect可以判斷匹配是否錯誤或者是一個重定向。一切順利的話，第一和第二參數都是空，有用的就是第三個參數renderProps，這個renderProps包含路由的所有信息，把它用擴展操作符展開作為屬性傳遞給RouterContext組件，渲染的結果就是伺服器端渲染產生的HTML字符串。

如果應用沒有使用代碼分片，瀏覽器的路由部分就無需任何改變，不過在我們的例子中已經應用了代碼分片，所以應用了伺服器端渲染之後，瀏覽器端渲染也要做對應修改，使用match函數來完成匹配，否則，伺服器端和瀏覽器中產生的HTML會不一致，這種不一致不是脫水資料問題導致，而是產生兩端的代碼不一致導致的。

```js
match({history, routes}, (err, redirectLocation, renderProps) => {
  ReactDOM.render(
    <Router {...renderProps} />,
    domElement
  );
});
```

可以注意到，到瀏覽器端match函數確定當前路徑的參數又是用history，不像伺服器那樣使用URL字符串。

## 同構實例

CounterPage的定義要發生變化，之前CounterPage導出一個initialState固定的值，現在我們希望伺服器和瀏覽器共用一個資料源，這個資料源就是之前我們定義的API接口，所以將initialState改為initState函數，這個函數返回一個Promise實例，在下面的代碼中可以看到，使用Promise可以大大簡化代碼的結構。

*src/pages/CounterPage.js*文件中，initState函數根據環境變量HOST_NAME決定API地址，沒有HOST_NAME那就是用一個指向本地開發環境的域名，這是一個常用的技巧。

```js
const END_POINT = process.env.HOST_NAME || 'localhost:9000';
const initState = () => {
  return fetch(`http://${END_POINT}/api/count`).then(response => {
    if (response.staus !== 200) {
      throw new Error(`Fail to fetch count`);
    }
    return response.jspn();
  }).then(responseJson => {
    return responseJson.count;
  })
};

export {page, reducer, initState, stateKey};
```

處理完CounterPage，接下來就要準備伺服器端的路由邏輯。

因為實際的渲染工作和路由關係緊密，所以要把這兩個功能都集中在文件*server/routes.Server.js*中，讓*server/app.dev.js*和*server/app.prod.js*只需要提供assetManifest，把req和res參數傳遞給renderPage函數，代碼如下：

```js
const renderPage = require('./routes.Server').renderPage;

app.get('*', (req, res) => {
  if (!assetManifest) {
    assetManifest = getAssetManifest();
  }

  return renderPage(req, res, assetManifest);
});
```

所以，主要的功能其實是在*server/routes.Server.js*文件中，我們來看看這個文件。

在伺服器端渲染，沒有必要使用分片，自然也不需動態加載模組，所有頁面都是直接導入，比如導入Home頁面的代碼就是這樣：

```js
import Home from '../src/pages/Home.js';
```

對於App、Home、About和NotFound頁面用上面方法import就可以，但是CounterPage導入有一點特殊，不僅要導入視圖，還要導入這個頁面對應的reducer、stateKey和初始狀態initState，代碼如下：

```js
import {page as CounterPage, reducer, stateKey, initState} from '../src/pages/CounterPage.js';
```

路由規則，因為不需要分片下載，所以非常簡單，可直接用一個routes變量代表，代碼如下：

```js
const routes = (
  <Route path="/" component={App}>
    <IndexRoute path="home" component={Home}/>
    <Route path="home" component={Home}/>
    <Route path="counter" component={CounterPage}/>
    <Route path="about" component={About}/>
    <Route path="*" component={NotFound}/>
  </Route>
);
```

最關鍵的就是renderPage函數，這個函數承擔了來自瀏覽器請求的路由和渲染工作。

伺服器端路由使用React-Router提供的match函數，如果匹配路由成功，那就調用另一個函數renderMatchedPage渲染頁面結果：

```js
export const renderPage = (req, res, assetManifest) => {
  match({routes, location: req.url}, function (err, redirect, renderProps) {
    // 檢查error和redirect，如果存在就讓res結束
    return renderMatchedPage(req, res, renderProps, assetManifest);
  });
};
```

當renderMatchedPage函數被調用時，代表已經匹配中了某個路由，接下來要做的工作就是獲得相關資料把這頁面渲染出來。

之前已經說過，為了保證伺服器對每個請求的獨立處理，必須每個請求都建一個Store，所以renderMatchedPage函數做的第一件事就是創建一個Store，然後獲取初始化Store狀態的Promise對象，代碼如下：

```js
function renderMatchedPage(req, res, renderProps, assetManifest) {
  const store = configureStore();
  // 獲取匹配Page的initState函數
  const statePromise = initState ? initState() : Promise.resolve(null);
```

在這應用中，只有CounterPage才提供initState，如果匹配的頁面不提供initState，那就使用Promise.resolve產生一個Promise對象，這對象不提供任何資料。但是，在沒有initState的情況下也能給statePromise變量一個PromiseB對象，從而使得後續處理代碼不用關心如何獲取資料。

當statePromise的then函數被調用時，代表頁面所需的文件已經準備好，這時候首先要設置Store上的狀態，同時也要更新Store上的reducer，透過我們定義的reset enhancer可以完成：

```js
statePromise.then((result) => {
  if (stateKey) {
    const state = store.getState();
    store.reset(combineReducers({
      ...store._reducers,
      [stateKey]: reducer
    }), {
      ...state,
      [stateKey]: result
    });
  }
});
```

至此，Store已經準備好了，接下來就透過React提供的伺服器端渲染函數renderToString產生對應的HTML字符串，存放在appHtml變數中：

```js
const appHtml = ReactDOMServer.renderToString(
  <Provider store={store}>
    <RouterContext {...renderProps}/>
  </Provider>
);
```

返回給瀏覽器的HTML中只包含appHtml還不夠，還需要包含“脫水資料”，所以在這渲染完HTML之後，要立即把Store上的狀態提取出來作為“脫水資料”，因為伺服器端React組件用的是同樣的狀態，所以瀏覽器端用這樣“脫水資料”渲染出來的結果絕對是一樣的。

獲取“脫水資料”的代碼如下：

```js
const dehydratedState = store.getState();
```

到這裡，React組件產生的HTML準備好了，“脫水資料”也準備好了，接下來就透過Express提供的res.render渲染結果就可以了：

```js
res.render('index', {
  title: 'Sample React App',
  PUBLIC_URL: '/',
  assetManifest,
  appHtml,
  dehydratedState: safeJSONstringify(dehydratedState)
});
```

這裏，“脫水資料”dehydratedState透過函數safeJSONstringify被轉化為字串，這樣在ejs模板文件中直接渲染這個字符串就行。注意，這裏不能直接使用JSON.stringify轉化為字串，因為“脫水資料”可能包含不安全的字符，需要避免跨站腳本攻擊的漏洞。

safeJSONstringify函數的代碼如下：

```js
function safeJSONstringify(obj) {
  return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}
```

最後，我們來看一看ejs模板文件*server/views/index.ejs*，伺服器端渲染產生的appHtml字符串和脫水資料dehydratedState在這裡被渲染到返回給瀏覽器的HTML中：

```ejs
<body>
<div id="root"><%- appHtml %></div>
<script>
    var DEHYDRATED_STATE = <%- dehydratedState %>
</script>
<script src="<%= PUBLIC_URL + assetManifest['common.js'] %>"></script>
<script src="<%= PUBLIC_URL + assetManifest['main.js'] %>"></script>
</body>
```

其中dehydratedState是被渲染到內嵌的script中，賦值給一個DEHYDRATED_STATE變量，這個變量在瀏覽器端可以被訪問到，利用這個變數就可以對React組件“注水”，讓他們重生，接下來我們看看瀏覽器端如何實現“注水”。

和伺服器一樣，入口函數*src/index.js*把渲染的工作完全交給Routes.js，所做的只是提供裝載React組件的DOM元素。

```js
import {renderRoutes} from './Routes';

renderRoutes(document.getElementById('root'));
```

在*src/Routes.js*文件中是更新的瀏覽器端路由和渲染功能，主要的改變在getCounterPage函數中：

```js
const getCounterPage = (nextState, callback) => {
  require.ensure([], function (require) {
    const {page, reducer, stateKey, initState} = require('./pages/CounterPage');

    const dehydratedState = (win && win.DEHYDRATED_STATE);
    const state = store.getState();
    const mergedState = {...dehydratedState, ...state};
    const statePromise = mergedState[stateKey]
      ? Promise.resolve(mergedState[stateKey])
      : initState();
```

和伺服器端類似，首先要獲取一個statePromise，優先從“脫水資料”中獲得初始狀態，只有沒有脫水初始狀態的時候，才使用initState函數去異步獲取初始化資料。

當statePromise完成，一樣可使用reset功能設置Store的狀態和reducer，代碼如下：

```js
statePromise.then((result) => {
  store.reset(combineReducers({
    ...store._reducers,
    [stateKey]: reducer
  }), {
    ...state,
    [stateKey]: result
  });

  callback(null, page);
});
```

因為使用了伺服器端渲染，同時瀏覽器端使用React-Router的代碼分片功能，所以瀏覽器端也需要用match函數來實現路由：

```js
export const renderRoutes = (domElement) => {
  match({history, routes}, (err, redirectLocation, renderProps) => {
    ReactDOM.render(
      <Provider store={store}>
        <Router {...renderProps}/>
      </Provider>,
      domElement
    );
  });
};
```

至此，一個同構應用完成了。

## 本章小節

在這一章中，我們首先對比了伺服器端渲染和瀏覽器端渲染各自的優缺點，React本身很適合創建同構的應用，因為一個功能模組全部由JavaScript實現，既可以在伺服器端運行，也可以在瀏覽器端運行。

為了實現伺服器端渲染，對create-react-app產生的應用配製作一系列修改，要使用express作為伺服器框架。

為了實現同構，伺服器端除了提供渲染出的HTML字符串，還要提供脫水資料，才能保持兩端渲染的內容一致。

和瀏覽器不同，伺服器要對每個請求都創建一個Store實例，這樣才能保證各個請求互不干擾。