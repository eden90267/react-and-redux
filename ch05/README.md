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

雖然代碼上不可見，但是connect的過程中實際上產生了一個無名的React組件類，這個類定製了shouldComponentUpdate函數的實現，實現邏輯是比對這次傳遞給內層傻瓜組件的props和上一次的props，因為負責"組件看起來怎樣"的傻瓜組件是一個無狀態組件，它的渲染結果完全由傳入的props決定，如果props沒有變化，那就可以認為渲染結果肯定一樣。

例如，我們有一個Foo組件：

```js
import React, {PropTypes} from 'redux';
import {connect} from 'react-redux';

const Foo = ({text}) => (
  <div>{text}</div>
);

const mapStateToProps = (state) => (
  text: state.text
);
export default connect(mapStateToProps)(Foo);
```

這組件簡單的不能再簡單，就是把Redux
Store的狀態樹上的text欄位顯示出來。內部的傻瓜組件Foo只有一個props屬性text，透過react-redux的connect方法，這個文件導出的是封裝後的容器組件。

這例子中，導出的容器組件的shouldComponentUpdate所做的事情，就是判斷這次渲染text值和上一次text值是否相同，相同就沒必要重新渲染了，可返回false，否則返回true。

這樣，我們編寫的Foo依然是無狀態組件，但是當要渲染Foo組件實例時，只要Redux
Store上的對應state沒有改變，Foo就不會經歷無意義的Virtual DOM產生和比對過程，也就避免了浪費。

同樣的方法也可以應用在TodoItem組件上。不過，因為TodoItem沒有直接從Redux
Store上讀取狀態，但我們依然可以使用react-redux方法，只是connect函數的調用不需要任何參數，要做的只是將定義TodoItem組件的代碼最後一行改成如下代碼：

```js
export default connect()(TodoItem);
```

上面例子中，connect函數調用沒有mapStateToProps和mapDispatchToProps函數，使用connect包裏TodoItem唯一目的是為了shouldComponentUpdate函數。

使用React Perf重複檢查性能，發現沒有真正解決問題，依然存在渲染浪費的問題。

只是產生浪費的組件發生了變化，TodoList渲染Connect(TodoItem)是浪費，根源是Connect(TodoItem)渲染TodoItem浪費。

react-redux提供的shouldComponentUpdate默認實現，對比prop和上一次渲染所用的prop方面是採用"淺層比較"(shallow
compare)，簡單來說就是用JavaScript的`===`操作符來進行比較，如果prop的類型是字串或數字的基本型態沒問題，但如果prop的類型是複雜對象，那麼"淺層比較"的方式只看這兩個prop是不是同一對象的引用，如果不是，哪怕對象的內容完全依樣，也被認為是不同的兩個prop。

比如，JSX中使用組件Foo的時候給名為style的prop賦值：

```js
<Foo style={{color: 'red'}} />
```

像上面這樣使用方法，Foo組件利用react-redux提供的shouldComponentUpdate函數實現，每一次渲染都會認為style這個prop發生了變化，因為每次都會產生新的對象給style，在"淺層比較"中，只比較第一層，不會去比較對象裡面是不是相等。

react-redux利用"淺層比較"並不是做得不夠好，因為一個對象到底有多少層無法預料，如果做遞迴對每個欄位進行"深層比較"，不只代碼複雜，也可能造成性能問題。

如果需要做深層比較，那就是某個特定組件的行為，需要開發者自己根據組件的情況去編寫。要謹記，不要簡單用遞迴比較所有層次的欄位，因為傳遞進來的prop是什麼結構無法預料。

總之，要想讓react-redux認為前後的對象類型prop是相同的，就必須保證prop是指向同一個JavaScript對象

```js
const fooStyle = {color: 'red'}; // 確保這個初始化只執行一次，不要放在render中

<Foo style={fooStyle} />
```

同樣的情況也存在於函數類型的prop，react-redux無從知道兩個不同的函數是不是做一樣的事情，要想讓它認為兩個prop是相同的，就必須讓這兩個prop指向同樣一個函數，如果每次傳給prop的都是一個新創建的函數，那肯定就沒法讓prop指向同一個函數了。

看TodoList傳遞給TodoItem的onToggle和onRemove的prop是如何寫的：

```js
onToggle={() => onToggleTodo(item.id)}

onRemove={() => onRemoveTodo(item.id)}
```

這裡賦值給onClick的是一個匿名的函數，而且是在賦值的時候產生的。也就是說，每次渲染一個TodoItem的時候，都會產生一個新的函數，這就是問題所在。

react-redux只認函數類型prop是不是指向同一個函數對象，每次都新產生的函數怎麼可能通過這個檢驗呢。

怎麼辦? 辦法就是不要讓TodoList每次都傳遞新的函數給TodoItem。

在Todo應用這個例子中，TodoItem組件實例的數量是不確定的，而每個TodoItem的點擊事件又依賴於TodoItem的id，所以處理起來有點麻煩，這裡有兩個方式：

第一種方式，TodoList保證傳遞給TodoItem的onToggle永遠只指向同一個函數對象，這樣是為了應對TodoItem的shouldComponentUpdate檢查，但是因為TodoItem可能有多個實例，所以這個函數要用某種方法區分什麼TodoItem回調這個函數，區分的方法只能透過函數參數。

