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

Add 'react-hot-loader/patch' to entry array (anywhere before paths.appIndexJs).

```js
entry: [
   'react-hot-loader/patch',
   require.resolve('react-dev-utils/webpackHotDevClient'),
   require.resolve('./polyfills'),
   paths.appIndexJs
],
```

Add 'react-hot-loader/babel' to Babel loader configuration.

```js
{
  test: /\.(js|jsx)$/,
  include: paths.appSrc,
  loader: require.resolve('babel'),
  query: {
    cacheDirectory: findCacheDir({
      name: 'react-scripts'
    }),
    plugins: [
      'react-hot-loader/babel'
    ]
  }
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