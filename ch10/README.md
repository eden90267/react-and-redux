# Chap10. 動畫

在用戶導向的網頁應用中，動畫是很重要的元素，動畫的作用往往並不是應用的核心功能，但是恰當應用動畫，會大大提高用戶體驗。

這章，將介紹以下功能：

- 在網頁中動畫的實現方式
- React提供的動畫輔助工具ReactCSSTransitionGroup
- React-Motion動畫庫

## 動畫的實現方式

在網頁中，實現動畫無外乎兩種方式：

- CSS3方式，也就是利用瀏覽器對CSS3的原生支持實現動畫
- 腳本方式，透過間隔一段時間用JavaScript來修改頁面元素樣式來實現動畫

### CSS3方式

CSS3的方式下，開發者一般在CSS中定義一些包含CSS3 transition語法的規則。在某些特定情況下，讓這些規則發生作用，於是瀏覽器就會將這些規則應用於指定的DOM元素上，產生動畫效果。

這種方式運行效率比腳本方式高，因為瀏覽器原生支持，省去了JavaScript解釋執行負擔，有的瀏覽器(比如Chrome瀏覽器)甚至還可以充分利用GPU加速的優勢，進一步增強了動畫渲染的性能，

不過CSS3的方式並非完美，也有不少缺點。

首先，CSS3 Transition對一個動畫規則的定義是基於**時間**和**速度曲線**(Speed Curve)的規則。換句話說，就是CSS3的動畫過程要描述成“在什麼時間範圍內，以什麼樣的運動節奏完成動畫”。

```css
.sample {
    background: red;
    position: absolute;
    left: 0;
    width: 100px;
    height: 100px;
    transition-property: left;
    transition-duration: 0.5s;
    transition-timing-function: ease;
}
.sample:hover {
    left: 420px;
}
```

上面例子中，samaple類的元素定義了這樣的動畫屬性：“left屬性會在0.5秒內以ease速度曲線完成動畫”。

transition只定義了動畫涉及的**屬性**、**時間**和**速度曲線**，並不定義需要修改的具體值。滑鼠移到sample類的元素，left就擁有新的值420px。這時候transition定義的規則發生作用。用戶看到的就是sample類元素向右移動420個像素的動畫過程。

因為CSS3定義動畫的方式是基於時間和速度曲線，可能不利於動畫的流暢，因為動畫是可能被中途打斷的。上例中，用戶滑鼠移到sample類元素上開始動畫，但在動畫期間，用戶滑鼠可能移出這個sample類元素，這時候CSS3還會以ease速度曲線的節奏回到原本的動作，語意上是“取消操作”的含義，但卻依然以同樣時間和ease節奏來完成“取消操作”的動畫，這並不合理。

時間和速度曲線的不合理是CSS3先天的屬性，更讓開發者頭疼的就是開發CSS3規則的過程，尤其是對transition-duration時間很短的動畫調試，因為CSS3的transition過程總是一閃而逝，捕捉不到中間狀態，只能一遍一遍用肉眼去檢驗動畫效果，用CSS3做複雜動畫的開發者肯定都深有體會。

雖CSS3有這樣的一些缺點，但因為其無與倫比的性能，用來處理一些簡單的動畫還是不錯的選擇。

React提供的ReactCSSTransitionGroup功能，使用的就是CSS3的方式來實現動畫，後面章節會提到。

### 腳本方式

相較CSS3的方式，腳本方式最大的好處就是更強的靈活度，開發者可以任意控制動畫的時間長度，也可以控制每個時間點上元素渲染出來的樣式，可更容易做出豐富的動畫效果。

腳本方式的缺點也很明顯，動畫過程透過JavaScript實現，不是瀏覽器原生支持，消耗的計算資源更多。如果處理不當，動畫可能會出現卡頓滯後現象。

最原始的腳本方式是利用setInterval或setTimeout來實現，每隔一段時間一個指定的函數被執行來修改介面的內容或樣式，從而達到動畫效果。

```js
var animatedElement = document.getElementById('sample');
var left = 0;
var timer;
var ANIMATION_INTERVAL = 16;

timer = setInterval(function () {
  left += 10;
  animatedElement.style.left = left + 'px';
  if (left >= 400) {
    clearInterval(timer);
  }
}, ANIMATION_INTERVAL);
```

為什麼選擇16毫秒？因為每秒渲染60幀(也叫60fps，60 Frame Per Second)會給用戶帶來足夠流暢的視覺體驗。

對於簡單的動畫，setInterval方式勉強還可以合格，但對於稍微複雜的一些的動畫，腳本方式就頂不住了。比如渲染一幀要花去32毫秒時間，那還用16毫秒一個間隔肯定不行。實際上，因為一幀渲染要佔用網頁線程32毫秒，會導致setInterval根本無法以16毫秒間隔調用渲染函數，這就產生了明顯的動畫滯後感，導致原本一秒鐘完成的動畫現在要花兩秒完成，所以這種原始的setInterval方式肯定不適合複雜的動畫的。

出現上面問題的本質原因是setInterval和setTimeout並不能保證在指定時間間隔或者延遲的情況下準時調用指定函數。所以換一個思路，當指定函數調用的時候，根據逝去的時間計算當前這一幀應該顯示成什麼樣子，這樣即使因為瀏覽器渲染主線程忙碌導致一幀渲染時間超過16毫秒，在後續幀渲染時至少內容不會因此滯後，即使達不到60fps效果，也能保證動畫在指定時間內完成。

下面是一個這種方法實現的例子，首先我們實現一個raf函數(request animation frame)：

```js
var lastTimeStamp = new Date().getTime();
function raf(fn) {
  var currTimeStamp = new Date().getTime();
  var delay = Math.max(0, 16 - (currTimeStamp - lastTimeStamp));
  var handle = setTimeout(function () {
    fn(currTimeStamp);
  }, delay);
  lastTimeStamp = currTimeStamp;
  return handle;
}
```

fn函數參數是真正的渲染過程，raf只是協調渲染的節奏。

raf盡量以每隔16毫秒的速度去調用傳染的fn參數，如果發現上一次調用時間和這一次調用時間相差不足16毫秒，就會保持16毫秒一次渲染間隔繼續，如果發現兩次調用時間間隔已經超出16毫秒，就會在下一次時鐘週期立刻調用fn。

我們定義渲染每一幀的函數render，代碼如下：

```js
var left = 0;
var animateElement = document.getElementById('sample');
var startTimestamp = new Date().getTime();
function render(timestamp) {
  left += (timestamp - startTimestamp) / 16;
  animateElement.style.left = left + 'px';
  if (left < 400) {
    raf(render);
  }
}
```

上面的render函數中根據當前時間和開始動畫的時間差來計算sample元素的left屬性，這樣無論render函數何時被調用，總能夠渲染出正確的結果。

最後，我們將render作為參數傳遞給raf，啟動了動畫過程：

```js
raf(render);
```

實際上，現代瀏覽器提供了一個新的函數requestAnimationFrame，採用的就是上面描述的思路，不是以固定16毫秒間隔的時間去調用渲染過程，而是讓腳本透過requestAnimationFrame傳入一個回調函數，表示想要渲染一幀畫面，瀏覽器會決定在合適的時間來調用給定的回調函數，而調用函數的工作是要根據逝去的時間來決定將介面渲染成什麼樣子。

這樣一來，渲染動畫的方式的方式就改成按需要來渲染，而不是每隔16毫秒渲染固定的幀內容。

不是所有的瀏覽器都支持requestAnimationFrame，對於不支持這個函數的瀏覽器，可以使用上面的raf函數的方式模擬requestAnimationFrame的行為。

在後面介紹的react-motion庫，使用的就是requestAnimationFrame這樣的方式。

## ReactCSSTransitionGroup

React提供了一個叫做ReactCSSTransitionGroup的功能幫助實現動畫。

```bash
yarn add react-addons-css-transition-group
```

之後就可以導入這個庫的內容：

```js
import TransitionGroup from 'react-addons-css-transition-group';
```

在JavaScript中，可以把react-addons-css-transition-group庫導入成任何變量名，因為這個庫默認方式導出React組件，這裡命名為TransitionGroup。

TransitionGroup借助CSS3功能實現動畫，讀者可能會問，既然是用CSS3實現動畫，那還需要JavaScript代碼來操作這樣一個TransitionGroup幹嘛？

在React中使用CSS3實現動畫，不得不考慮一下React中組件的生命週期。每個React都會經歷裝載過程、更新過程和卸載過程。對於更新過程，要實現動畫就是改變組件渲染內容中的樣式，可以完全由CSS3實現，不在TransitionGroup能幫忙的範圍內。不過，對於裝載過程和卸載過程就不那麼簡單了。

React裝載過程中展示動畫，一個問題是，什麼時候修改元素的CSS樣式從而觸發動畫？必須是在組件產生DOM元素已經渲染在DOM樹上之後，大約就是在componentDidMount生命週期執行的時候，如果讓每個需要動畫的組件都要實現自己的componentDidMount，那就是重複工作，而用TransitionGroup就可以輕鬆解決這個問題。

對於裝載過程還算簡單，對於卸載過程就更複雜了，假如我們希望React組件在卸載過程中展示動畫，但是卸載就是把組件的dOM元素刪掉，我們的組件又怎麼能夠讓組件元素被刪掉之前還能展示動畫呢？

TransitionGroup的工作就是幫助組件實現裝載過程和卸載過程的動畫，而對於更新過程，並不是TransitionGroup要解決的問題。

### Todo應用動畫

*src/todos/views/todoList.js*文件：

```js
const TodoList = ({todos}) => {
  return (
    <ul className="todo-list">
      <TransitionGroup transitionName="fade" transitionEnterTimeout={500} transitionLeaveTimeout={200}>
      {
        todos.map(item => (
          <TodoItem
            key={item.id}
            id={item.id}
            text={item.text}
            completed={item.completed}
          />
        ))
      }
      </TransitionGroup>
    </ul>
  );
};
```

TransitionGroup中使用了幾種prop，其中transitionName是所有動畫相關prop的核心，因為它的值關聯了TransitionGroup和CSS規則。在這裡，transitionName的值為字符串fade，代表這個TransitionGroup相關的CSS類都要以fade為前綴。

TodoList所在的文件中，還要導入相關畫面CSS規則，代碼如下：

```js
import './todoItem.css'
```

```css
.fade-enter {
    opacity: 0.01;
}

.fade-enter.fade-enter-active {
    opacity: 1;
    transition: opacity 500ms ease-in;
}

.fade-leave {
    opacity: 1;
}

.fade-leave.fade-leave-active {
    opacity: 0.01;
    transition: opacity 200ms ease-in;
}
```

可以看到，相關CSS規則所有的類都是以fade為前綴，和transitionName的值一致，然後每個類都由enter、leave、active這些單詞構成，含義在下一節會詳細介紹。

現在，用瀏覽器訪問改造過的Todo應用，可以看到增加刪除代辦事項會有動畫的效果。

### ReactCSSTransitionGroup規則

從上面Todo的應用不難看出，TransitionGroup並不能代替CSS。恰恰相反，它離不開CSS，其扮演的角色是讓React組件在生命週期的特定階段使用不同的CSS規則，而連接React組件和CSS需要遵守一些規則。

#### 1. 類名規則

配合TransitionGroup中的transitionName屬性，對應的CSS規則中類名遵從統一的規則。再類名由 - 符號把幾個單詞連接起來，除了transitionName的值，還可以有這幾個單詞：enter代表“裝載”開始時的狀態，leave代表“卸載”開始時的狀態，active代表動畫結束時的狀態。

假設transitionName為sample，那麼定製相關React組件的類名就是：

- sample-enter
- sample-enter-active
- sample-leave
- sample-leave-active

其中active後綴類名的作用比較特殊，因為用CSS3的transition功能實現動畫，必須定義“開始狀態”和“結束狀態”，只有存在這兩個狀態，CSS3才知道如何將元素屬性從“開始狀態”在指定的時間按照指定的速度曲線轉化成“結束狀態”，這兩個狀態必須定義在兩個不同的CSS類中，否則CSS3無法區分。例如，首先給一個元素名sample-enter的CSS類，然後再給它一個名為sample-enter-active的CSS類，因為這兩個類分兩次賦予這個元素，CSS3就能發現兩者的區別，以transition的方式動畫顯示這個轉化過程。-active後綴的類代表就是動畫結束的狀態。

在Todo例子中，TransitionGroup任何一個子組件(這個例子中就是TodoItem組件)被裝載時，這個組件會被加上兩個類名，fade-enter和fade-enter-active。這兩個類並不是同時加上去的，React會先讓TodoItem先具有fade-enter類，然後在JavaScript下一個時鐘週期才加上fade-enter-active類，分兩次進行，這樣才會產生描述的樣式的轉化過程，結果就是讓TodoItem組件在500ms內以ease-in的速度曲線將不透明度從0.01變成1，這就是一個淡入的效果。

子組件刪除卸載，這個組件會先後加上兩個類名，fade-leave和fade-leave-active，這會讓TodoItem組件在200毫秒以ease-in德速度曲線將不透明度從1變成0.01，然後才徹底刪除，這就是一個淡出效果。

#### 2. 動畫時間長度

使用TransitionGroup，動畫持續的時間在兩個地方都要指定，第一個是在TransitionGroup中以Timeout為結尾的屬性，比如transitionEnterTimeout和transitionLeaveTimeout，第二個地方是在CSS文件中的transition-duration規則。

這兩處時間應該是一致的，不過我們先搞清楚為什麼要分兩處來指定動畫時間。

以Todo應用的enter過程為例，transitionEnterTimeout值為500是告訴TransitionGroup每個新加入的TodoItem組件的動畫時間持續500毫秒，那樣TransitionGroup會在這個動畫開始之初給TodoItem組件加上fade-enter和fade-enter-active類。500毫秒後，就會把這兩個類刪除掉，然後就是TodoItem正常的顯示方式。

再看CSS中的規則，它只管在500毫秒內以指定節奏完成動畫過程，因為真正的動畫的時間是由CSS規則控制的。

當然，同一個值需要兩處設定，這明顯是重複代碼，這是TransitionGroup的一個缺點。

#### 3. 裝載時機

讀者可能會有個疑問，為什麼用TransitionGroup在todoList.js文件中包住TodoItem組件實例的陣列，而不是讓TransitionGroup在todoItem.js文件中包住單個TodoItem組件呢？

看起來應該能實現同樣效果，但實際上這樣不行。**因為TransitionGroup要發揮作用，必須自身已經完成裝載了**。這很好理解，TransitionGroup也只是一個React組件，功能只有在被裝載之後才能發揮，它自己都沒有被裝載，怎可能發揮效力呢？

假如在todoItem.js中使用TransitionGroup，也就是說把TransitionGroup當成了TodoItem組件的子組件，那麼只有TodoItem完成裝載時才被裝載。如此一來，當一個TodoItem進入裝載過程的時候，它內部的所有子組件還沒有裝載呢，這樣根本不會有動畫效果。

當我們要給一個數量變化的組件集體做動畫的時候，TransitionGroup總是要包住這整個結合，就像TodoList上包住一個map函數產生TodoItem組件實例陣列一樣，這也就是為什麼TransitionGroup命名中帶一個Group的原因。

#### 4. 首次裝載

一個有趣現象，在Todo應用中，TransitionGroup自身被裝載的時候，可能已經包含了若干個TodoItem組件實例，但是這些TodoItem組件實例雖然經歷了裝載過程，卻沒有動畫效果，只有在TransitionGroup被裝載之後新加入的TodoItem組件才有動畫效果。

似乎類fade-enter和fade-enter-active中定義的CSS規則對於隨TransitionGroup一同裝載的TodoItem組件實例無效。這是因為enter過程並不包括TransitionGroup的首次裝載，顧名思義，enter就是“進入”TransitionGroup，TransitionGroup實例裝載完成之後，新加入的TodoItem組件算是進入，但是隨TransitionGroup實例一起裝載的TodoItem組件不算“進入”。

如果我們就想讓隨TransitionGroup實例一起裝載的子組件也有動畫效果？那就要使用appear過程，appear過程代表就是隨TransitionGroup一起“出現”的過程。

TransitionGroup的appear也有對應的transitionAppearTimeout，對應的CSS符合一樣的模式，以-appear和-appear-active為結尾，對應Todo應用中的例子，就是fade-appear和fade-appear-active類。

不過，appear還是有一點特殊，因為通常對於首次裝載沒有必要有動畫，所以默認控制動畫的開關是關閉的。所有的動畫過程，包括active、leave和appear都有對應的TransitionGroup動畫開關屬性，分別是transitionEnter、transitionLeave和transitionAppear，這三個屬性是boolean屬性，前兩個默認是true，第三個是false。

```js
<TransitionGroup transitionName="fade" transitionEnterTimeout={500} transitionLeaveTimeout={200} transitionAppear={true} transitionAppearTimeout={500}>
  {
    todos.map(item => (
      <TodoItem
        key={item.id}
        id={item.id}
        text={item.text}
        completed={item.completed}
      />
    ))
  }
</TransitionGroup>
```

```css
.fade-enter,.fade-appear {
    opacity: 0.01;
}

.fade-enter.fade-enter-active,
.fade-appear.fade-enter-appear{
    opacity: 1;
    transition: opacity 500ms ease-in;
}
```

在流理器中刷新Todo應用網頁，可以看到這時候現成的三個待辦事項也是以漸入方式出現的。當然，每次切換過濾器，TodoItem組件都以動畫方式出現，看起來並不是很好的效果。

通常應用中不需要使用appear過程，這也就是為什麼transitionAppear屬性默認是關閉的。

## React-Motion動畫庫

react-motion是很優秀的動畫庫，它採用的動畫方式和TransitionGroup不同，是採用腳本的方式。

### React-Motion的設計原則

要了解react-motion，先要了解和CSS3方式不同的兩個觀點。

首先，大部分情況下，友好的API比性能更重要。這並不是說性能不重要，而是在大部分情況下，性能並不會因為採用腳本方式不用CSS3方式而引起顯著的性能下降。這時候，只要性能足夠好，一個友好的API會比難以調試的CSS3更讓開發者願意接受，也更利於提高開發效率。

其次，不要以時間和速度曲線來定義動畫過程，缺點在前面的章節已經介紹過，react-motion提出用另外兩個參數來定義動畫，一個是剛度(stiffness)，一個是阻尼(damping)，當然，為了方便開發者使用，react-motion提供了一組預設的這兩個參數的組合。

第六章我們介紹過“以函數為子組件”的模式，在react-motion中就大量使用了這樣的模式，react-motion提供的組件，都預期接受一個函數為子組件。

來看一個例子，這個例子顯示一個倒數計時，從100倒數為0，模式和第六章我們創造的倒數計時組件CountDown如出一徹：

```js
<Motion
  defaultStyle={{x:100}}
  style={
    {x: spring(0, {stiffness: 100, damping: 100})}
  }>
  {value => <div>{Math.ceil(value.x)}</div>}
</Motion>
```

Motion組件的defaultStyle屬性指定了一個初始值，style屬性指定了目標值，然後透過剛性參數100和阻尼100的節奏，把初始值變為目標值，期間不斷調用作為子組件的函數，完成動畫的過程。

第六章的CountDown組件中，我們使用的是setInterval，我們已經知道setInterval方法並不是一個很好的選擇。在Motion中，利用的是requestAnimationFrame函數來觸發子組件函數。

很明顯，Motion其實並不直接參與動畫的繪製，它只是提供參數。具體的繪製過程，由作為子組件的繪製函數來完成，很明顯這種“以函數為子組件”的模式帶來了很大的靈活度。

Motion專注於提供動畫的資料，子組件函數專注於繪製過程，這又是一個“每個組件只專注做一件事情”的例子。

只是有一點看起來可能有點奇怪，雖然Motion兩個屬性都有style字樣，但其實完全可能和style無關。在上面例子中，傳遞到子組件的函數參數並沒有用來當style，而是直接作為內容渲染出來，這一點讀者只要接受style在這裡代表變化的參數這個概念就好了。

### Todo應用動畫

這一次不需使用到CSS文件，首先從react-motion庫導入spring和TransitionMotion：

```js
import {spring, TransitionMotion} from 'react-motion';
```

spring函數用於產生動畫屬性的開始和結束狀態，用於取代CSS3的transition方式；TransitionMotion是一個組件，用於處理裝載過程和卸載過程，對應於前文的TransitionGroup，但兩者使用方式有較大差別。

修改之後的TodoList組件的代碼如下：

```js
const TodoList = ({todos}) => {
  const styles = getStyles(todos);
  return (
    <TransitionMotion willLeave={willLeave} willEnter={willEnter} style={styles}>
      {
        interpolatedStyles =>
          <ul className="todo-list">
            {
              interpolatedStyles.map(config => {
                const {data, style, key} = config;
                const item = data;
                return (
                  <TodoItem
                    style={style}
                    key={key}
                    id={item.id}
                    text={item.text}
                    completed={item.completed}
                  />);
              })
            }
          </ul>
      }
    </TransitionMotion>
  );
};
```

TransitionGroup應該直接包含需要動畫效果的子組件，子組件可以是一組。例如，在Todo應用中，TransitionGroup直接包含多個TodoItem組件，TransitionGroup本身作為ul的子組件；但是，使用TransitionMotion就不可以這樣，因為TransitionMotion只能包含函數作為子組件，而且這個函數只能返回一個元素，不能是一個陣列作為元素。

TransitionMotion要求有一個名為styles的陣列屬性，這個陣列的每個元素代表一個子組件。在Todo應用中，styles中每個元素包含顯示一個子組件的所有樣式和資料內容，這個styles資料的每個元素都是一個對象，包含key和style兩個必有的屬性，還有一個可選的data屬性，獲取styles的函數如下：

```js
const getStyles = (todos) => {
  return todos.map(item => ({
      key: item.id.toString(),
      data: item,
      style: {
        height: spring(60),
        opacity: spring(1)
      }
    })
  );
};
```

其中，key屬性是React要求動態數量的子組件必須包含的屬性，在Todo應用中，我們將其設為待辦事項的id。不過，這個屬性要求是一個字符串類型。

至於style屬性，就是子元素動畫的“目標狀態”，我們利用spring函數指定了每個TodoItem組件的動畫狀態，含義是“以默認的剛性和阻尼設定，把height屬性變成60，把opacity屬性變成1”：

```js
style: {
  height: spring(60),
  opacity: spring(1)
}
```

data屬性內容和動畫無關，是子組件才理解的資料，react-motion對這個資料也並不關心，只是扮演一個搬運工角色，把data傳遞給內層的函數。

注意，styles屬性的每個元素的所有值都可能不同，只是在Todo應用中，每個TodoItem只有key和data不同，style都是相同的。

在這裡我們再次感受到styles命名的尷尬，雖名為styles，卻包含key和data這樣和樣式無關的資料，真正和樣式相關的只有style一個欄位而已。

在style中定義的只是動畫的“目標狀態”，但是要產生畫面的運動，還需要定義動畫的“初始狀態”，在TransitionMotion中定義“初始狀態”的是willEnter。

```js
const willEnter = () => {
  return {
    height: 0,
    opacity: 0
  };
};
```

TransitionMotion用enter代表一個新的組件“加入”到TransitionMotion之中，leave代表一個子組件“離開”TransitionMotion被卸載。

willEnter屬性是一個函數，當一個組件“加入”TransitionMotion的時候，TransitionMotion就調用這個函數，獲得這個新組件的動畫初始狀態。

willLeave屬性的值同樣是一個函數，返回當一個組件“離開”TransitionMotion時的“結束狀態”。注意，“離開”動畫過程的“初始狀態”實際上就是“進入”狀態的結束狀態。要形成動畫效果，willLeave返回的結果不能像willEnter那樣只是返回純數字的結果，而是要用spring明確動畫的節奏。

```js
const willLeave = () => {
  return {
    height: spring(0),
    opacity: spring(0)
  };
};
```

TransitionMotion不需要CSS的協助，完全透過JavaScript代碼就可以實現動畫的效果。

那TransitionGroup的appear定製第一次裝載過程的動畫，那在TransitionMotion中如何定製？

TransitionMotion還支持一種屬性叫做defaultStyles，可以滿足類似的要求，defaultStyles格式類似styles，也是一種陣列，只是每個陣列元素中的style欄位代表的舊第一次加載時的樣式。

```js
const defaultStyles = todos.map(item => ({
  key: item.id.toString(),
  data: item,
  style: {
    height: 0,
    opacity: 0
  }
}));
```

最終的效果就是刷新網頁之後，所有預先存在的待辦事項都以動畫方式呈現。

這裡只介紹React-Motion很小的一部分功能，也就是用TransitionMotion管理裝載和卸載React組件的動畫功能，實際上React-Motion的功能還遠不止於此。在React-Motion中，還有一個組件Motion提供普通的動畫功能，一個組件StaggeredMotion提供固定數量組件相互依賴的動畫展示功能，和TransitionMotion一樣，React-Motion提供的這些組件都遵循“以函數為子組件”的模式，只要掌握“以函數為子組件”模式，就可以理解全部React-Motion的原則。

## 本章小節

這章，我們了解網頁動畫的兩種實現方式，CSS3方式和腳本方式，在React的世界，也有對應這兩種方式的動畫解決方案。

React官方的ReactCSSTransitionGroup，能夠幫助定製組件在裝載過程和卸載過程中的動畫，對於更新過程的動畫，則不在ReactCSSTransitionGroup考慮之列，可直接用CSS3來實現。

React-Motion庫提供了更強大靈活的動畫實現功能，利用“以函數為子組件”的模式，React-Motion只需提供幾個組件，這些組件透過定時向子組件提供動畫參數，就可以讓開發者自由定義動畫的功能。