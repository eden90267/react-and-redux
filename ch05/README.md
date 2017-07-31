# Chap05. React組件的性能優化

重點關注React組件的渲染性能優化。應用由組件構成，要提供應用性能，必須先提高組件性能。

## 單個React組件的性能優化

雖然每一次頁面更新都是對組件的重新渲染，但並不是將之前渲染的內容全部拋棄重來，React能計算出對DOM樹的最少修改。借助Virtual
DOM，就是React默認情況下渲染都很迅速的秘訣。

不過，計算和比較Virtual DOM依然是一個複雜的計算過程。如果能在開始計算Virtual
DOM之前就可以判斷渲染結果不會有變化，那樣可以乾脆不要進行Virtual DOM計算和比較，速度就會更快。

第四章的Todo應用，存在影響性能的設計，沒充分發揮React的性能優勢，透過React
Perf工具可發現這個問題。

### 發現浪費的渲染時間

Chrome瀏覽器使用React Perf擴展：

1. 添加兩個待辦事項，First、Second
2. 打開開發者工具，切換到Perf，確保wasted選項被勾選
3. 點擊Perf工具左側的Start按鈕，開始性能測量
4. 勾選Todo應用First那一項，讓它變完成狀態
5. 點擊Perf工具左側的Stop按鈕，結束性能測量，介面上會顯示測量結果(才沒...待解決...)

在React Perf工具中，可看見發現浪費的渲染過程，如果有組件計算Virtual
DOM之後發現和之前的Virtual DOM相同，那就認為是一次浪費。這裡說的是計算Virtual DOM的浪費。

上面例子，產生浪費是Owner
TodoLust，Component是TodoItem，意思就是父組件TodoList渲染一個子組件TodoItem是浪費的。

這個操作過程中，First和Second兩個TodoItem，First被標記為完成狀態，對應的介面有改變，所以沒有浪費；而Second沒有介面改變，所以浪費是渲染Second造成的。

### 性能優化的時機

Perf介面中可以在Inclusive wasted time看到浪費掉的時間：0.05毫秒。這是一段毫不起眼的時間，用戶完全感覺不到。

如果說要優化代碼避免這樣的時間浪費，讀者可能覺得沒必要。而且，前輩有提醒過我們，不要過早進行所謂的性能優化：

>“過早的優化是萬惡之源。” ——高德納

這句話意思是說，除非性能出了問題，否則就不要花時間去優化性能。

但是目前是一個TodoItem組件的浪費時間，而這個組件數量是可變的，假設TodoList有1000個待辦事項，那每一次用戶只能反轉一個TodoItem組件的完成狀態，那剩下的999個TodoItem實際上是渲染浪費的，那就浪費掉50毫秒的時間，這已經是用戶感知到的延遲時間，如果TodoItem有更複雜的功能，產生的DOM結構就更複雜，浪費時間更多。

難道前輩說的話是錯誤的，其實是被斷章取義了，全文：

>“我們應該忘記忽略很小的性能優化，可以說97%的情況下，過早的優化是萬惡之源，而我們應該關心對性能影響最關鍵的另外那3%的代碼” ——高德納

不要浪費精力在對整體性能提高不大的代碼上，而對性能關鍵影響的部分，優化不嫌早。因為，對性能影響最關鍵的部分，往往涉及解決方案的核心，決定整體的架構，將來要改變的時候牽扯更大。

合併多字串，要用+操作符，還是所有字串放在一個陣列後用join方法合併？不同JavaScript引擎和不同數量的字符串，性能可能不同，但這不大可能對整個應用造成關鍵性能影響，這就是高德納所說的97%；而選擇用什麼樣的方式定義組件的接口，如何定義state到prop的轉變，使用什麼樣的算法來比對Virutal DOM，這些決定對性能和架構影響是巨大，就是關鍵的3%。

所謂“過早的優化”，指的是沒有任何量化證據情況下開發者對性能優化的猜測，沒有可測量的性能指標，就完全不知道當前性能瓶頸在何處，完成優化後也無法知道性能優化是否到了預期的結果。在自己工作中一定要有量化的性能指標。React
Perf已經對wasted time這個指標給出了精確到毫秒小數點後兩位的量化結果。

對於實際數量是動態的組件，一點點的浪費會因為實例數量增多而累積成很長的時間。開發者永遠要考慮到極端狀況。

接下來，就來進一步改進這個Todo應用，其中會引入React組件的建構模式，記住這些模式，自然就會避免渲染的浪費時間。這也許會被認為是“過早的優化”，但是已經成為模式的優化方式，有利於代碼的可讀性。高德納認為地過早的優化是萬惡之源，是因為這些優化往往讓代碼過於複雜而且難維護，但如果早期的優化能夠讓代碼結構更加合理容易維護，何樂而不為？

### React-Redux的shouldComponentUpdate實現

shouldComponentUpdate可能是React生命週期函數中除了render函數之外最重要的一個函數了。render函數決定“組件渲染出什麼”，shouldComponentUpdate函數則決定“什麼時候不需要渲染“。

React的父類Component提供了shouldComponentUpdate的簡單實現，默認就是返回true。默認每次更新都要調用所有生命週期函數，包括調用render函數，根據render函數的返回結果計算Virtual DOM。

畢竟React並不知道各組件細節，把組件重新渲染一遍就算浪費，至少是兜底的保險方法，絕對不會出錯。

但要有更好性能，有必要定義好我們組件的shouldComponentUpdate函數，讓他在必要的時候返回false，告訴React不用繼續更新，就會節省大量的運算資源。每個React組件的內在邏輯都有自己的特點，需要根據組件邏輯來定製shouldComponentUpdate函數的行為。

在於TodoItem是一個無狀態函數，所以使用React默認的shouldComponentUpdate函數實現。TodoList在重複渲染時，會引發所有TodoItem子組件的更新過程，因為shouldComponentUpdate是返回true，React將會調用更新過程的所有生命週期函數，產生Virtual
DOM，最後透過Virtual DOM比對發現沒有變化，其實根本不用修改DOM。

看起來，要做的就是給TodoItem增加定製的shouldComponentUpdate函數，這樣就會讓TodoItem代碼從一個獨立的函數變成ES6 class。

```js
shouldComponentUpdate(nextProps, nextState) {
  return (nextProps.completed !== this.props.completed) || (nextProps.text !== this.props.text);
}
```

因為對TodoItem組件而言，影響渲染內容的prop只有completed和text，確保這兩個沒變化，shouldComponentUpdate函數就可以返回false。

如果每個React組件都要定製自己的shouldComponentUpdate函數，從寫代碼的角度看也是件麻煩事。但如果使用react-redux庫，一切會變得簡單。

回顧一下，使用react-redux庫，我們把一個功能的React組件分成兩部分：

- 傻瓜組件：只管負責視圖部分，處理的是“組件看起來怎樣”的事情。往往用一個函數的無狀態組件就足夠表示。
- 容器組件：負責邏輯的部分，處理的是“組件如何工作”的事情，這個容器組件有狀態，而且保持和Redux
  Store上狀態的同步，但是react-redux的connect函數把這個部分同步的邏輯封裝起來了，我們甚至在代碼中根本看不見這個類的樣子，往往直接導出connect返回函數的執行結果就行。

使用react-redux，一個典型的React組件代碼文件最後一個語句代碼：

```js
export default connect(mapStateToProps, mapDispatchToProps)(Foo);
```

可以看到，往往都沒有必要把產生的容器組件賦值給一個變量操作符，直接把connect的結果export導出就可以了。