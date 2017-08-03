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

在TodoList組件中，mapDispatchProps產生的prop中的onToggleTodo接受TodoItem的id作為參數，恰好勝任這個工作，所以，可以在JSX中代碼改成下面這樣：

```js
<TodoItem
  key={item.id}
  id={item.id}
  text={item.text}
  completed={item.completed}
  onToggle={onToggleTodo}
  onRemove={onRemoveTodo}
/>
```

注意，除了onToggle和onRemove的值改變了，還增加了一個新的prop名為id，這是讓每個TodoItem知道自己的id，在回調onToggle和onRemove時可以區分不同的TodoItem實例。

TodoList的代碼簡化了，但TodoItem也要做對應的改變，對應TodoItem的mapDispatchToProps：

```js
const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggleItem: () => ownProps.onToggle(ownProps.id)
})
```

ownProps就是父組件渲染當前組件時傳遞過來的props，透過ownProps.id就能夠得到父組件傳遞過來的名為id的prop值。

上面的mapDispatchToProps函數給TodoItem組件增加了名為onToggleItem的prop，調用onToggle，傳遞當前實例的id作為參數，在TodoItem的JSX中就應該使用onToggleItem，而不是直接使用TodoList提供的onToggle。

第二種方式，乾脆讓TodoList不要給TodoItem傳遞任何函數類型prop，點擊事件完全由TodoItem組件自己搞定：

TodoList組件的JSX：

```js
<TodoItem
  key={item.id}
  id={item.id}
  text={item.text}
  completed={item.completed}
/>
```

在TodoItem組件中，需要自己透過react-redux派發action：

```js
const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggle: () => dispatch(toggleTodo(ownProps.id)),
  onRemove: () => dispatch(removeTodo(ownProps.id))
});
```

對比兩種方式，可以看到無論如何TodoItem都需要使用react-redux，都需要定義產生定製的prop的mapDispatchToProps，都要求TodoList傳入一個id，區別在於actions是由父組件導入還是子組件自己導入。

相比而言，沒有多大必要讓action在TodoList導入然後傳遞一個函數給TodoItem，第二種方式讓TodoItem處理自己的一切事務，更符合高內聚的要求。

將傻瓜組件TodoItem變成一個ES6
class，在constructor和render加上console.log，根據browser上輸出，就能知道TodoItem組件是否經歷了裝載過程和更新過程：

```js
class TodoItem extends Component {
  constructor() {
    super(...arguments);

    console.log('enter TodoItem constructor: ' + this.props.text);
  }

  render() {
    const {completed, onToggle, onRemove, text} = this.props;

    console.log('enter TodoItem render: ' + text);

    return (
      <li
        className="todo-item"
        style={{
          textDecoration: completed ? 'line-through' : 'none'
        }}>
        <input className="toggle" type="checkbox" checked={completed ? "checked" : ""} readOnly onClick={onToggle}/>
        <label className="text">{text}</label>
        <button className="remove" onClick={onRemove}>x</button>
      </li>
    )
  }

}
```

添加三個待辦事項，First、Second和Third，讓First和Third反轉為完成狀態，清空瀏覽器Console。

這時候，點擊“已完成”過濾器，待辦事項就只顯示First和Third，在Console看不到任何輸出，說明這個過程沒有任何TodoItem組件被創建和更新。

再點擊“全部”過濾器，這時在瀏覽器Console中有如下輸出：

```bash
enter TodoItem constructor: Second
enter TodoItem render: Second
```

這個過程涉及TodoList組件的更新，但First和Third兩個TodoItem實例的render函數沒有被調用，說明react-redux的shouldComponentUpdate函數起了作用，避免了沒必要的渲染。使用React
Perf工具，也不再出現浪費的渲染時間。

好奇的是，在“全部”和“未完成”之間切換的時後，似乎只有Second這個TodoItem經歷了裝載過程，React如何知道First和Third這兩個TodoItem不需要渲染？這就是下一節多個React組件性能優化要討論的問題。

## 多個React組件的性能優化

當一個React組件被裝載、更新和卸載時，組件的一系列生命週期函數會被調用。不過，這些生命週期函數針對某一個特定React組件的函數，在一個應用中，從上到下有很多React組件組合起來，他們之間的渲染過程要更加複雜。

我們現在考慮的是多個React組件之間組合的渲染過程。和單個React組件的生命週期一樣，也要考慮三個階段：裝載、更新與卸載。

裝載沒有什麼優化的事情可做，無論如何都要徹底渲染一次的，從React組件往下的所有子組件，都要經歷一遍React組件的裝載生命週期。

卸載只有一個生命週期函數componentWillUnmount，這個函數只是清理componentDidMount添加的事件處理監聽等收尾工作，做的事情比裝載過程要少很多，所以也沒有什麼可優化的空間。


所以值得關注的過程，就只剩下了更新過程。

### React的調和(Reconciliation)過程

在裝載過程中，React透過render方法在內存中產生了一個樹形的結構，樹上每一個節點代表一個React組件或者原生的DOM元素，這個樹形結構就是所謂的Virtual
DOM。React根據這個Virtual DOM來渲染產生瀏覽器中的DOM樹。

裝載過程結束後，用戶就可以對網頁進行交互，用戶操作引發了介面更新，網頁需要更新介面，React依然透過render方法獲得一個新的樹形結構Virtual
DOM，這時候當然不能完全和裝載過程一樣直接用Virtual DOM去產生DOM樹，不然就和原始的字符串模板一個作法。而且，在真實的應用中，大部分網頁內容的更新都是局部的小改動，如果每個改動都是推倒重來，那樣每次都重新完全生成DOM樹，性能肯定不可接受。

實際上，React更新階段很巧妙對比原有的Virtual DOM和新生成的Virtual DOM，找出兩者的不同之處，根據不同來修改DOM樹，這樣只需做最小的必要改動。

React在更新中這個“找不同”的過程，就叫做Reconciliation(調和)。

Facebook推出React之初打出的旗號就是“高性能”，所以React的Reconciliation過程必須快速。但是，找出兩個樹形結構的區別，從計算機科學的角度來說，真的不是一件快速的過程。

按照計算機科學目前的算法研究結果，對比兩個N節點的樹形結構的算法，時間複雜度是O(N<sup>3</sup>)，打個比方，假如兩個樹形結構上各有100節點，那麼找出這兩個樹形結構差別的操作，需要100*100*100次操作，也就是一百萬次量的操作，假如有一千個節點，那麼就是1000*1000*1000次操作，這是一億次的操作當量，這麼巨大數量的操作在強調快速反應的網頁中是不可想像的，所以React不可能採用這樣的算法。

React實際採用的算法需要的時間複雜度是O(N)，因為對比兩個樹形怎麼看都要對比兩個樹形上的節點，似乎也不可能有比O(N)時間複雜度更低的算法。

>**Top**：  
>O(N)時間複雜度的算法並不是說一定會有N次指令操作，O(N<sup>3</sup>)時間複雜度的算法也不是說這個算法一定會執行N的三次方數量的指令操作，時間複雜度只是對一個算法最好和最差情況下需要的指令操作數量級的估量，這邊不仔細介紹其定義，但是讀者應該了解通常一個O(N<sup>3</sup>)時間複雜度的算法意味著不適合於高性能要求的場合。

React採用的算法肯定不是最精確的，但對於React應對的場景來說，絕對是性能和複雜度的最好折衷，讓這個算法發揮作用，還需要開發者一點配合，讓我們來看一看React的取屬性結果差異算法。

其實React的Reconciliation算法並不複雜，當React要對比兩個Virtual
DOM的樹形結構的時候，從根節點開始遞迴往下比對，在樹形結構上，每個節點都可以看做一個這個節點以下部分子樹的根節點。所以其實這個對比算法可以從Virtual DOM上任何一個節點開始執行。

React首先檢查兩個樹形的根節點的類型是否相同，根據相同或不同有不同處理方式。

#### 1. 節點類型不同的情況

如果樹形結構根節點類型不相同，那就意味著改動太大了，也不要費心考慮是不是原來那個樹形的根節點被移動到其他地方去了，直接認為原來那個樹形結構已經沒用，可以扔掉，需要重新建構新的DOM樹，原有的樹形上的React組件會經歷"卸載"的生命週期。

這時候，componentWillUnmount方法會被調用，取而代之的組件則會經歷裝載過程的生命週期，組件的componentWillMount、render和componentDidMount方法依次被調用。

也就是說，對於Virtual DOM樹這是一個"更新"的過程，但是卻可能引發這個樹結構上某些組件的"裝載"和"卸載"過程。

example：

```js
<div>
  <Todos/>
</div>
```

更新

```js
<span>
  <Todos/>
</span>
```

這樣做比較的時候，div跟span的類型就不一樣，那麼這算法就會認為必須要廢掉之前的div節點，包括下面所有的子節點，一切推倒重來，重新建構一個span節點以及子節點。

很明顯，這是一個巨大的浪費，因為span和div的子節點是一模一樣的Todos組件，但為了避免O(N<sup>3</sup>)的時間複雜度，React必須要選擇一個更簡單更快捷的算法，也就只能採用這種方式。

作為開發者，很顯然一定要避免上面這樣浪費的情景出現。所以，一定要避免作為包裏功能的節點類型被隨意修改。

如果React對比兩個樹形結構的根節點發現類型相同，那麼就覺得可以重用原有節點，進入更新階段，按照下一小節的步驟來處理。

#### 2. 節點類型相同的狀況

如果兩個樹形結構的根節點類型相同，React就認為原來的根節點只需要更新過程，不會將其卸載，也不會引發根節點的重新裝載。

這時，有必要更區分一下節點的類型，節點的類型可分為兩類：一類是DOM元素類型，對應的就是HTML直接支持的元素類型，比如div、span和p；另一類是React組件，也就是利用React庫定製的類型。

對於DOM元素類型，React會保留節點對應的DOM元素，只對樹形結構根節點上的屬性和內容作比對，然後只更新修改的部分。

比如原本節點用JSX表示是這樣：

```js
<div style={{color: 'red', fontSize: 15}} className="welcome">
  Hello World
</div>
```

改變之後的JSX表示是這樣：

```js
<div style={{color: 'green', fontSize: 15}} className="farewell">
  Good Bye
</div>
```

React可以對比發現這些屬性和內容的變化，在操作DOM樹上節點的時候，只去修改這些發生變化的部分，讓DOM操作盡可能少。

如果屬性結構的根節點不是DOM元素類型，那就只可能是React組件類型，那麼React做的工作類似，只是React此時並不知道如何更新DOM樹，因為這些邏輯還在React組件之中，React能做的只是根據新節點的props去更新原來根節點的組件實例，引發這個組件實例的更新過程，也就是按照順序引發下列函數：

- shouldComponentUpdate
- componentWillReceiveProps
- componentWillUpdate
- render
- componentDidUpdate

在這過程中，如果shouldComponentUpdate函數返回false，那麼更新過程就此打住，不再繼續。所以為了保持最大性能，每個React組件類必須要重視shouldComponentUpdate，如果發現沒有必要重新渲染，那就可以直接返回false。

在處理完根節點的對比之後，React的算法會對根節點的每個子節點重複一樣的動作，這時候每個子節點就成為它所覆蓋部分的根節點，處理方式和它的父節點完全一樣。

#### 3. 多個子組件的情況

當一個組件包含多個子組件的情況，React處理方式也非常簡單直接。

拿Todo應用中的待辦事項列表作為例子，假如最初的組件型態用JSX表示是這樣：

```js
<ul>
  <TodoItem text="First" completed={false}/>
  <TodoItem text="Second" completed={false}/>
</ul>
```

更新之後，用JSX表示：

```js
<ul>
  <TodoItem text="First" completed={false}/>
  <TodoItem text="Second" completed={false}/>
  <TodoItem text="Third" completed={false}/>
</ul>
```

那麼React會發現多出一個TodoItem，會創建一個新的TodoItem組件實例，這個TodoItem組件實例需要經歷裝載過程，對於前兩個TodoItem實例，React會引發他們的更新過程，但是只要TodoItem的shouldComponentUpdate函數實現恰當，檢查props之後就返回false，就可以避免實質的更新操作。

接下來看另一個例子，在序列前面增加一個TodoItem實例，就會暴露出一個問題：

```js
<ul>
  <TodoItem text="Zero" completed={false}/>
  <TodoItem text="First" completed={false}/>
  <TodoItem text="Second" completed={false}/>
</ul>
```

從直觀來看，只要Zero的新代辦事項創造新的TodoItem並放在第一位，剩下兩個內容為First和Second的TodoItem實例經歷更新過程，但是因為props沒有改變，所以shouldComponentUpdate可以幫助這兩個組件不做實質的更新動作。

可是實際情況不是這樣。如果要讓React按照上面我們構想的方式來做，就必須要找出兩個子組件序列的不同之處，現有的計算出兩個序列差異的算法時間是O(N<sup>2</sup>)，雖然沒有樹形結構比較的O(N<sup>3</sup>)時間複雜度那麼誇張，但是也不適合一個對性能要求很高的場景，所以React選擇看起來很傻的一個辦法，不是尋找兩個序列的精確差別，而是直接挨個比較每個子組件。

在上面的新TodoItem實例插入在第一位的例子中，React會首先認為把text為First的TodoItem組件實例的text改成了Zero，text為Second的TodoItem組件實例的text改成First，最後面多出了一個TodoItem組件實例，text內容為Second。這樣操作的後果就是，現存的兩個TodoItem實例的text屬性被改變了，強迫它們完成一個更新過程，創造出來的新的TodoItem實例用來顯示Second。

理想情況下只需要增加一個TodoItem組件，實際上引發了兩個TodoItem實例的更新，而且，假設有100個TodoItem實例，那就會引發100個TodoItem實例的更新，這明顯就是一個浪費。

看起來很傻，但電腦不是人類，一個簡單的算法就只能用這種方式處理問題。

當然，React並不是沒有意識到這個問題，所以React提供了方法來克服這種浪費，不過需要開發人員寫代碼提供一點小小的幫助，這就是key的作用。

### key的用法

React不會使用一個O(N<sup>2</sup>)時間複雜度的算法去找出前後兩列子組件的差別，默認情況下，在React的眼裡，確定每一個組件序列中的唯一標識就是他的位置，所以它也完全不懂哪些子組件實際上並沒有改變，為了讓React更加“聰明”，就需要開發者提供一點幫助。

在代碼中明確告訴React每個組件的唯一標示，就可以幫助React在處理這個問題時聰明的多，告訴React每個組件“身份證號”的途徑就是key屬性。

假設待辦事項列表JSX：

```js
<ul>
  <TodoItem key={1} text="First" completed={false}/>
  <TodoItem key={2} text="Second" completed={false}/>
</ul>
```

每個TodoItem增加了名為key的prop，而且每個key是這個TodoItem實例的唯一id，當新的待辦事項列表變成如下那樣，React的處理方式也會不一樣：

```js
<ul>
  <TodoItem key={0} text="Zero" completed={false}/>
  <TodoItem key={1} text="First" completed={false}/>
  <TodoItem key={2} text="Second" completed={false}/>
</ul>
```

React根據key值，可以知道現在的第二和第三個TodoItem實例其實就是之前的第一和第二個實例，所以React就會把新創建的TodoItem實例插在第一位，對於原有兩個TodoItem實例只用原有的props來啟動更新過程，這樣shouldComponentUpdate就會發生作用，避免無謂的更新操作。

React會提醒開發者不要忘記使用key，同類型子組件出現多個實例時如果沒有key的話，React在運行時會給出警告(瀏覽器的Console)。

```
Warning: Each child in an array or iterator should have a unique "key" prop. Check the render method of `TodoList`. See https://fb.me/react-warning-keys for more information.
    in Connect(TodoItem) (at todoList.js:12)
    in TodoList (created by Connect(TodoList))
    in Connect(TodoList) (at todos.js:10)
    in div (at todos.js:8)
    in Unknown (at TodoApp.js:9)
    in div (at TodoApp.js:8)
    in TodoApp (at index.js:12)
    in Provider (at index.js:11)
```

在一列子組件中，每個子組件的key值必須唯一，不然就沒有幫助React區分各個組件的身份。而且key值不僅只唯一，這個key值還需要是穩定不變的。

如果透過陣列來產生一組子組件，一個常見錯誤就是用索引值作為key：

```js
<ul>
{
  todos.map((item, index) => (
    <TodoItem
      key={index}
      text={item.text}
      completed={item.completed}
    />
  ))
}
</ul>
```

這麼做非常危險！這樣錯誤的使用key反而會讓React不給出錯誤提示了。

用陣列索引值作為key，不是穩定不變的。這樣就讓React徹底亂套了。

需要注意，雖然key是一個prop，但是接受key的組件並不能讀取到key的值，因為key和ref是React保留的兩個特殊prop，並沒有預期讓組件直接訪問。

## 用reselect提高資料獲取性能

前面例子中，都是透過優化渲染過程來提高性能，既然React和Redux都是透過資料驅動渲染過程，那麼除了優化渲染過程，獲取資料的過程也是一個需要考慮的優化點。

*views/todoList.js*文件，mapStateToProps調用selectVisibleTodos函數從Redux
Store提供的state中產生渲染需要的資料：

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

作為從Redux
Store上獲取資料的重要一環，mapStateToProps函數一定要快，從代碼看來，運算本身並沒有什麼可優化空間，要獲取當前應該顯示的待辦事項，就是要根據Redux
Store狀態樹上的todos和filter兩個欄位上的值計算出來。不過這個計算過程要遍歷todos欄位上的陣列，當陣列比較大時，對於todoList組件的每一次重新渲染都重新計算一遍，就會顯得負擔過重。

### 兩階段選擇過程

既然這個selectVisibleTodos函數計算不可少，那如何優化？

實際上，並不是每一次對TodoList組件的重新渲染都必須要執行selectVisibleTodos中的計算過程，如果Redux
Store狀態樹上代表所有待辦事項的todos欄位沒有變化，而且代表當前過濾器的filter欄位也沒有變化，那實在沒必要重新遍歷整個todos陣列來計算新的結果，如果上一個計算結果被緩存起來的話，那就可以重用緩存資料。

這就是reselect庫的工作原理：只要相關狀態沒改變，那就直接使用上一次的緩存結果。

reselect庫被用來創造“選擇器”，所謂選擇器，就是接受一個state作為參數的函數，這個選擇器函數返回的資料就是我們某個mapStateToProps需要的結果。

在前面章節，我們已經強調過React組件的渲染函數應該是一個純函數，Redux中的reducer函數也應該是一個純函數，mapStateToProps函數也應該是一個純函數，純函數讓問題清晰而且簡化，不過，現在這個“選擇器”函數不是純函數，它是一種有“記憶力”的函數，運行選擇器函數會有副作用，副作用就是能夠根據以往的運行“記憶”返回“記憶”中的結果。

reselect認為一個選擇器的工作可以分為兩個部分，把一個計算過程分為兩個步驟：

- **步驟1.**

    從輸入參數state抽取第一層結果，將這第一層結果和之前抽取的第一層結果作比較，如果發現完全相同，就沒有必要進行第二部分運算了，選擇器直接把之前第二部分的運算結果返回就可以了。注意，這一部分做的“比較”，就是JavaScript的===操作符比較，如果第一層是對象的話，只有是同一對象才會被認為是相同。

- **步驟2.**

    根據第一層結果計算出選擇器需要返回的最終成果

每次選擇器被調用時，步驟一都會被執行，但步驟一的結果用來判斷是否可以使用緩存的結果，所以不是每次都會調用步驟二的運算。

選擇器就是利用這種緩存結果的方式，避免了沒有必要的資源浪費。

步驟一運算因為每次選擇器都要使用，所以一定要快，運算要非常簡單，最好就是一個映射運算，通常就只是從state參數中得到某欄位的引用就足夠，把剩下的重活累活都交給步驟二去做。

在TodoList這例子中，todos和filter的值直接決定應該顯示什麼樣的待辦事項，所以，很顯然步驟一是獲取todos和filter的值，步驟二就是根據這兩個值進行計算。

```bash
npm i --save reselect
```

_src/todos/selector.js_：

```js
import {createSelector} from 'reselect';
import {FilterTypes} from "../constants";

const getFilter = (state) => state.filter;
const getTodos = (state) => state.todos;

export const selectVisibleTodos = createSelector(
  [getFilter, getTodos],
  (filter, todos) => {
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
  }
);
```

reselect提供了創造選擇器的createSelector函數，這是一個高階函數，也就是接受函數為參數來產生一個新函數的函數。

第一個參數是一個函數陣列，每個元素代表選擇器步驟一需要做的映射計算：

```js
const getFilter = (state) => state.filter;
const getTodos = (state) => state.todos;
```

步驟一要盡量簡單快捷，所以往往一個Lambda表達式就已足夠。

createSelector函數的第二個參數代表步驟二的計算過程，參數為第一個參數的輸出結果，裡面的邏輯和之前TodoList中的邏輯沒有什麼兩樣，只是這第二個函數不是每次都會調用到。

TodoList模組改用新定義選擇器來獲取待辦事項資料：

```js
import {selectVisibleTodos} from "../selector";

const mapStateToProps = (state) => {
  return {
    todos: selectVisibleTodos(state)
  };
};
```

Redux要求每一個reducer不能修改state狀態，如果要返回一個新的狀態，就必須返回一個新的對象。如此一來，Redux
Store狀態樹上某個節點如果沒有改變，那麼我們就有信心這個節點下資料沒有改變，應用在reselect中，步驟一的運算就可以確定直接緩存運算結果。

雖然reselect的createSelector創造的選擇器並不是純函數，但是createSelector接受的所有函數都是純函數，雖然選擇器有“記憶”這個副作用，但是只要輸入參數state沒有變化，產生的結果也就沒有變化，表現的卻類似于純函數。

只要Redux
Store狀態樹上的filter和todos欄位不變，無論怎樣觸發TodoList的渲染，都不會引發沒有必要的遍歷todos字段的運算，性能自然更快。

雖然reselect庫以re開頭，但邏輯上與React/Redux沒有直接關係。實際上，在任何需要這種有記憶的計算場合都可以使用reselect，不過，對於React和Redux組合的應用，reselect無疑能夠提供絕佳的支持。

### 範式化狀態樹

第四章介紹過，Redux
Store的狀態樹應該設計的盡量扁平，在使用reselect之後，我們可進一步認為，狀態樹的設計應該盡量範式化(Normalized)。

所謂範式化，就是遵照關聯式資料庫的設計原則，減少冗余資料。也就是資料結構設計就是讓資料只存一份，資料冗余造成的後果就是難以保證資料一致性。

與範式化相對，還存在“反範式化”的資料庫設計，這在NoSQL領域是一個慣常的設計風格。反範式化是利用資料冗余來換取讀寫效率，因為關連式資料庫的強項雖然是保持一致，但應用需要的資料形式往往是多個表join之後的結果。多個表往往耗時且在分散式系統中難以應用。

這裏純粹用資料庫的兩種設計理念來類比Redux Store狀態樹的設計策略。

假設我們給Todo應用增加一個Type的概念，可把某個TodoItem歸為某一個Type，而且一個Type有特有的名稱和顏色信息，介面上，用戶可以看到TodoItem顯示為自己所屬Type對應的顏色，TodoItem和Type當然是多對多關係。

如何設計代表TodoItem的狀態樹結構？

使用反範式化的設計，那麼狀態樹上的資料最好是能夠不用計算拿來就能用，在Redux
Store狀態樹的todos欄位保存的是所有待辦事項資料的陣列，對於每個陣列元素，反範式化設計對象：

```js
{
  id: 1,
  text: '待辦事項1',
  completed: false,
  type: {
    name: '緊急',
    color: 'red'
  }
}
```

如果要達到資料扁平化，應該是增加兩個欄位，分別是typeName和typeColor。

這種狀態設計的好處就是在渲染TodoItem組件時，從Redux
Store上獲得的狀態可以直接使用name和color資料。但他的缺點是當需要改變種類型的名稱和顏色時，不得不遍歷所有TodoItem資料來完成改變。反範式化資料結構特點就是讀取容易，修改麻煩。

範式化的資料結構設計：

```js
{
  id: 1,
  text: '待辦事項1',
  completed: false,
  typeId: 1
}
```

然後在Redux Store上和todos平級的跟結點位置創建一個types欄位，內容是陣列，每個陣列元素代表一個類型：

```js
{
  id: 1,
  name: '緊急',
  color: 'red'
}
```

當TodoItem組件要渲染內容時，從Redux Store狀態樹上todos欄位下獲取的資料是不夠的，為了獲得對應的總類名稱和顏色，需要做一個類似關聯式資料庫的join操作，到狀態樹的type欄位下去尋找對應的typeId的種類資料。

這樣過程當然要花費時間，但改變資料就變得容易。

對於反範式化與範式化的優劣，不難看出範式化方式更合理。雖然join需要花費計算時間，但是應用了reselect之後，大部分情況都會命中緩存，實際上也就沒花費很多計算時間了。

## 本章小結

本章中，我們瞭解利用react-redux提供的shouldComponentUpdate實現來提高組件渲染功能的方法，一個要訣就是避免傳遞給其他組件的prop值是一個不同的對象，不然會造成無謂的重複渲染。

透過了解React的Reconciliation過程，我們了解了React為什麼能夠在O(N)時間複雜度下完成Virtual
DOM的比較，但是為了讓React高效無誤地完成工作，需要開發者做一些配合。首先，不能隨意修改一個作為容器的HTML節點的類型。其次，對於動態數量的同類型子組件，一定要使用key這個prop。

React的Reconciliation算法缺點是無法發現某個子樹移動位置的情況，如果某個子樹移動了位置，那React就會重新創建這個子樹。當然，通常應用中不會出現這種情況。

最後，我們學習了利用reselect庫來實現高效的資料獲取。因為reselect的緩存功能，開發者不用顧忌範式化的狀態樹會存在效能問題，Redux
Store的狀態樹應該按照範式化原則來設計，減少資料冗餘，這樣利於保持資料一致。