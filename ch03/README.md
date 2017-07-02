# chap03. 從Flux到Redux

## Flux

Flux，單向數據流。2013年，與React同時面世。Facebook認為兩者結合在一起才能構建大型的JavaScript應用。

React是用來替換jQuery的。Flux就是用來替換Backbone.js、Ember.js等MVC一族框架為目的。

MVC的世界裡，React相當於V，只涉及頁面的渲染，一旦涉及應用的數據管理部分，還是交給M和C，不過Flux並不是一個MVC框架，事實上，Flux認為MVC存在一個很大問題，它推翻了MVC，並用一個新的思維來管理數據流轉。

### MVC框架的缺陷

MVC是業界廣泛接受的一種前端應用框架類型，這種框架把應用分為三部分：

- Model：負責管理數據，大部分業務邏輯也應該放在Model中
- View：負責渲染用戶介面，應該避免View中涉及業務邏輯
- Controller：負責接受用戶輸入，根據用戶輸入調用對應的Model部分邏輯，把產生的數據結果交給View部分，讓View渲染出必要的輸入

這樣邏輯劃分，實質上與把一個應用畫分為多個組件一樣，就是分而治之。

但Facebook的工程部門逐漸發現，對於非常巨大的代碼庫和廣大的組織，按照他們的原話說就是“MVC真的很快就變得非常複雜”。不同模組之間的依賴關係讓系統變得“脆弱而且不可預測”。

可以看到Model和View之間纏繞著蜘蛛網一樣複雜的依賴關係，有的是Model調用View，有的是View調用Model，好亂。

MVC框架提出的數據流很理想，用戶請求先到達Controller，由Controller調用Model獲得數據，然後把數據交給View，但是，在實際框架實現中，總是允許View和Model可以直接通信：

![](http://htmljs.b0.upaiyun.com/uploads/1421067671341-4.jpeg)

遺憾的是，在一些官方的教學文檔中，甚至是Android和IOS的教學文檔中的例子中，也會出現View和Model直接通信的例子。不過這種狀況逐漸在改變，因為越來越多的同行發現，在MVC中讓View和Model直接對話就是災難。

Server端的MVC：往往就是每個請求就在MVC三者之間走一圈，結果就返回給browser去渲染或其他處理了，然後這個請求生命週期的MVC就可以回收銷毀了，這是一個嚴格意義的單向數據流。

Browser端的MVC：存在用戶的交互處理，介面渲染出來之後，Model和View依然存在於瀏覽器中，這時候就會誘惑開發者為了簡便，讓現存的Model和View直接對話。

對於MVC框架，為了讓數據流可控，Controller應該是中心，當View要傳遞消息給Model時，應該調用Controller方法，同樣，當Model要更新View時，也應該透過Controller引發新的渲染。

Flux出現意義上說明了一個特點：更嚴格的數據流控制。

![](http://htmljs.b0.upaiyun.com/uploads/1421067726546-5.jpeg)

一個Flux應用包含四個部分：

- Dispatcher，處理動作分發，維持Store之間的依賴關係
- Store，負責存儲數據和處理數據相關邏輯
- Action，驅動Dispatcher的JavaScript對象
- View，視圖部分，負責顯示用戶介面

Flux和MVC的結構對比，Dispatcher -> Controller、Store -> Model、View -> View，多出來的Action，可以理解為對應給MVC框架的**用戶請求**。

MVC框架裡，系統能夠提供什麼樣的服務，透過Controller暴露函數來實現。每增加一個功能，Controller往往就要增加一個函數；在Flux世界裡，新增加一個功能並不需要Dispatcher增加新的函數，實際上，Dispatcher自始自終只需要暴露一個函數Dispatch，當需要增加新的功能時，要做的是**增加一種新的Action類型**，Dispatcher的對外接口並不用改變。

當需要擴充應用所能處理的“請求”時，MVC方法就需要增加新的Controller，而對於Flux則只是增加新的Action。

### Flux應用

Flux提供了一些輔助工具類和函數，能夠幫助創建Flux應用：

```
npm install --save flux
```

#### 1. Dispatcher

首先，我們創造一個Dispatcher，幾乎所有應用都只需要擁有一個Dispatcher。

*src/AppDispatcher.js*：

```
import {Dispatcher} from 'flux';

export default new Dispatcher();
```

我們引入flux庫中的Dispatcher類，然後創造一個新的對象作為文件默認輸出就足夠了。

Dispatcher存在的作用，就是用來派發action，接下來我們就來定義應用中涉及的action。

#### 2. action

action顧名思義代表一個“動作”，不過這個動作只是一個普通的JavaScript對象，代表一個動作的純數據，類似於DOM API中的事件(event)。甚至，和事件相比，action其實還是更加純粹的數據對象，因為事件往往還包含一些方法，比如點擊事件就有preventDefault方法，但是action對象不自帶方法，就是純粹的數據。

作為管理，action對象必須有一個名為type的字段，**代表這個action對象的類型**，為了記錄日誌和debug方便，這個type應該是字符串類型。

定義action通常需要兩個文件，一個定義action的類型，一個定義action的構造函數(也稱為action creator)。分成兩個文件的主要原因是在Store中會根據action類型做不同操作，也就有單獨導入action類型的需要。

*src/ActionType.js*，定義action的類型：

```
export const INCREMENT = 'increment';
export const DECREMENT = 'decrement';
```

現在我們在*src/Actions.js*文件定義action構造函數：

```
import * as ActionTypes from './ActionType';
import AppDispatcher from './AppDispatcher';

export const increment = (counterCaption) => {
    AppDispatcher.dispatch({
        type: ActionTypes.INCREMENT,
        counterCaption,
    });
};

export const decrement = (counterCaption) => {
    AppDispatcher.dispatch({
        type: ActionTypes.DECREMENT,
        counterCaption,
    });
};
```

雖然出於業界習慣，這個文件被命名為Actions.js，但裡面定義的並不是action對象本身，而是能夠**產生**並**派發action對象**的函數。

*Actions.js*文件中，引入ActionTypes和AppDispatcher，看得出來是要直接使用Dispatcher。

*Actions.js*導出了兩個action構造函數increment和decrement，當這兩個函數被調用的時候，創造了對應的action對象，並立即透過AppDispatcher.dispatch函數派發出去。

#### 3. Store

一個Store也是一個對象，這個對象存儲應用狀態，同時還要接受Dispatcher派發的動作，根據動作來決定是否更新應用狀態。

現在，創造兩個Store，一個是為Counter組件服務的CounterStore，另一個就是為總數服務的SummaryStore。

*src/stores/CounterStore.js*：

```
import {EventEmitter} from 'events';

const CHANGE_EVENT = 'changed';

const counterValues = {
    'First': 0,
    'Second': 10,
    'Third': 30
};

const CounterStore = Object.assign({}, EventEmitter.prototype, {
    getCounterValues: function () {
        return counterValues;
    },
    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },
    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },
    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    }
});
```

當Store狀態發生變化的時候，需要通知應用的其他部分做必要的響應。在我們應用中，做出響應的部分當然就是View部分，但是我們不應該硬編碼這種關係，應該用消息的方式建立Store和View的聯繫。這就是為什麼我們讓CounterStore擴展了EventEmitter.proptotype，等於讓CounterStore成了EventEmitter對象。一個EventEmitter實例對象支持下列相關函數：

- emit，可以廣播一個特定事件，第一個參數是字符串類型的事件名稱。
- on，可以增加一個掛在這個EventEmitter對象特定事件上的處理函數，第一個參數是事件名稱，第二個參數是處理函數。
- removeListener，和on函數做的事情相反，刪除掛在這個EventEmitter對象特定事件上的處理函數，和on函數一樣，第一個參數是事件名稱，第二個參數是處理函數。要注意，如果要調用removeListener函數，就一定要保留對處理函數的引用。

對於CounterStore對象，emitChange、addChangeListener和removeChangeListener函數就是利用EventEmitter上述的三個函數完成對CounterStore狀態更新的廣播、添加監聽函數和刪除監聽函數等操作。

getCounterValues函數用於讓應用中其他模組可以讀取當前的計數值，當前計數值存儲在文件模組級的變量counterValues中。

>Top：寫代碼要注意，不應該去修改透過Store得到的數據(Immutable)。

上面實現的Store只有註冊到Dispatcher實例上才能發揮作用，所以還需要添加下列代碼：

```
CounterStore.dispatchToken = AppDispatcher.register((action) => {
    if (action.type === ActionTypes.INCREMENT) {
        counterValues[action.counterCaption]++;
        CounterStore.emitChange();
    } else if (action.type === ActionTypes.DECREMENT) {
        counterValues[action.counterCaption]--;
        CounterStore.emitChange();
    }
});
```

這是最重要的步驟，要把CounterStore註冊到全局唯一的Dispatcher上去。Dispatcher有一個函數叫register，接受一個回調函數作為參數，返回值是一個token，這個token可以用於Store之間的同步，目前在CounterStore還用不上，稍後SummaryStore會用到。

來看看register接受的這個回調函數參數，這是Flux流程中最核心的部分，當透過register函數把一個回調函數註冊到Dispatcher之後，所有派發給Dispatcher的action對象，都會傳遞到這個回調函數中來。

回調函數要做的，就是根據action對象來決定如何更新自己的狀態。

無論加一或減一，最後都要調用CounterStore.emitChange函數，這讓調用者透過CounterStore.addChangeListener關注了CounterStore的狀態變化，這個emitChange函數調用就會引發監聽函數的執行。

再來看所有計數器計數值的總和Store，*src/stores/SummaryStore.js*：

SummaryStore與CounterStore完全重複，不同點是對獲取狀態函數的定義。

```
import CounterStore from './CounterStore';
import {EventEmitter} from 'events';

function computeSummary(counterValues) {
    return Object.keys(counterValues).reduce((res, prop) => res += counterValues[prop], 0);
}

const SummaryStore = Object.assign({}, EventEmitter.prototype, {
    getSummary: function () {
        return computeSummary(CounterStore.getCounterValues());
    }
});
```

SummaryStore.getSummary是實時讀取CounterStore.getCounterValues來計算總和返回給調用者。可見，雖然名為Store，但並不表示一個Store必須要存儲什麼東西，Store只是提供**獲取數據**的方法。

SummaryStore在Dispatcher上註冊的回調函數：

```
SummaryStore.dispatchToken = AppDispatcher.register((action) => {
    if (action.type === ActionTypes.INCREMENT || action.type === ActionTypes.DECREMENT) {
        AppDispatcher.waitFor([CounterStore.dispatchToken]);
        SummaryStore.emitChange();
    }
});
```

在這裡使用了waitFor函數，這個函數解決了下面描述的問題。

既然一個action對象會被派發給回調函數，這就產生一個問題，到底是按照什麼順序調用各個回調函數呢？

即使Flux按照register調用的順序去調用回調函數，我們也無法把握各個Store哪個先裝載從而調用register函數。所以可認為Dispatcher調用回調函數的順序是完全無法預期的。

設想一下，當INCREMENT類型的動作配派發，如果先調用SummaryStore的回調函數，這函數立即調用emitChange通知監聽者，監聽者則會立即調用SummaryStore.getSummary獲取結果，然後才去調用CounterStore的回調函數來加一，這樣SummaryStore.getSummary就是錯誤值了。

怎麼解決這個問題？這就要靠Dispatcher的waitFor函數了。在SummaryStore的回調函數中，之前在CounterStore註冊的回調函數時保存下來的dispatchToken終於派上用場。

Dispatcher的waitFor可以接受一個數組作為參數，數組的每個元素都是dispatcher.register返回的dispatchToken。這個函數告訴Dispatcher，當前的處理必須暫停，直到dispatchToken代表的那些回調函數執行結束才能繼續。

調用waitFor，把控制權交給Dispatcher，讓Dispatcher檢查一下dispatchToken代表的回調函數有沒有被執行，有就繼續，沒有就調用dispatchToken代表的回調函數之後waitFor才返回。

注意一個事實，Dispatcher的register函數，只提供註冊一個回調函數的功能，卻不能讓調用者在register時選擇只監聽某些action，換句話說，每個register的調用者只能這樣請求：“當有任何動作被派發時，請調用我。”不能夠這樣請求：“當這種類型還有那種類型的動作被派發的時候，請調用我”。

當一個動作被派發的時候，Dispatcher就是簡單地將所有註冊的回調函數全都調用一遍，至於這個動作是不是對方關心的，Flux的Dispatcher不關心，要求每個回調函數去鑑別。

#### 4. View

Flux框架中，View並不是說必須要使用React，View本身是一個獨立的部分，可以用任何一種UI庫來實現。

存在於Flux框架中的React組件需要實現以下幾個功能：

- 創建時要讀取Store上狀態來初始化組件內部狀態。
- 當Store上狀態發生變化時，組件要立刻同步更新內部狀態保持一致。
- View如果要改變Store狀態，**必須而且只能**派發action。

*src/views/ControlPanel.js*：

```
import React, {Component} from 'react';

import Counter from './Counter';
import Summary from './Summary';


const style = {
    margin: '20px'
};

class ControlPanel extends Component {
    render() {
        return (
            <div style={style}>
                <Counter caption="First"/>
                <Counter caption="Second"/>
                <Counter caption="Third"/>
                <hr/>
                <Summary/>
            </div>
        );
    }
}

export default ControlPanel;
```

接著看*src/views/Counter.js*：

```
import React, {Component} from 'react';
import CounterStore from "../stores/CounterStore";

class Counter extends Component {

    constructor(props) {
        super(props);

        this.state = {
            count: CounterStore.getCounterValues()[props.caption],
        };
    }

    onChange = () => {

    };

    onClickIncrementButton = () => {

    };

    onClickDecrementButton = () => {

    };

}

exports default Counter;
```

Counter組件的state應該成為Flux Store上狀態的一個同步鏡像，為了保持兩者一致，除了在構造函數中的初始化之外，在之後當CounterStore上狀態變化時，Counter組件也要對應變化。

```
componentDidMount() {
    CounterStore.addChangeListener(this.onChange);
}

componentWillUnmount() {
    CounterStore.removeChangeListener(this.onChange);
}

onChange = () => {
    const newCount = CounterStore.getCounterValues()[this.props.caption];
    this.setState({
        count: newCount,
    });
};
```

接下來看React組件如何派發action：

```
onClickIncrementButton = () => {
    Actions.increment(this.props.caption);
};

onClickDecrementButton = () => {
    Actions.decrement(this.props.caption);
};

render() {
    const {caption} = this.props;
    return (
        <div>
            <button style={buttonStyle} onClick={this.onClickIncrementButton}>+</button>
            <button style={buttonStyle} onClick={this.onClickDecrementButton}>-</button>
            <span>{caption} count: {this.state.count}</span>
        </div>
    );
}
```

不免於CounterStore的getCounterValues函數叫用兩次：一個在構造函數、一個在CounterStore狀態變化的onChange函數。

不使用組件的狀態，就可逃出在代碼中使用Store兩次的宿命，也就是“無狀態”組件。

*src/views/Summary.js*：

```
import React, {Component} from 'react';

import SummaryStore from '../stores/SummaryStore';

class Summary extends Component {

    constructor(props) {
        super(props);

        this.state = {
            sum: SummaryStore.getSummary(),
        }
    }

    componentDidMount() {
        SummaryStore.addChangeListener(this.onUpdate);
    }

    componentWillUnmount() {
        SummaryStore.removeChangeListener(this.onUpdate);
    }

    onUpdate = () => {
        this.setState({
            sum: SummaryStore.getSummary(),
        });
    };

    render(){
        return (
            <div>Total Count: {this.state.sum}</div>
        );
    }

}

export default Summary;
```

*index.js*：

```
import React from 'react';
import ReactDOM from 'react-dom';
import ControlPanel from './views/ControlPanel';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<ControlPanel/>, document.getElementById('root'));
registerServiceWorker();
```

### Flux的優勢

回顧一下完全只使用React實現的版本，應用的狀態數據只存在於React組件之中，每個組件都要維護驅動自己渲染的狀態數據，單個組件的狀態還好維護，但如果多個組件狀態還有關聯，那就麻煩了。各自Counter、Summary維護自身狀態，那同步就成了問題。React只提供了props方法讓組件之間通信，若組件關係稍微複雜點，這種方式就顯得很笨拙。

Flux的架構下，應用的狀態放在Store中，React只是扮演View的作用，被動根據Store的狀態來渲染。在上面例子中，React組件依然有自己的狀態，但是已經完全論為Store組件的一個映射，而不是主動變化的數據。

在完全只用React實現的版本裡，用戶的交互作用，比如點擊“+”按鈕，引發的時間處理函數直接透過this.setState改變組件的狀態。在Flux的實現版本裡，用戶操作引發的是一個“動作”的派發，這個派發的動作會發送給所有的Store對象，引起Store對象的狀態改變，而不是直接引發組件的狀態改變。因為組件的狀態是Store狀態的映射，所以改變了Store對象也就觸發了React組件對象的狀態改變，從而引發了介面的重新渲染。

Flux帶來了哪些好處？ 最重要的就是“單向數據流”的管理方式。

在Flux理念裡，如果要改變介面，必須改變Store中的狀態，如果要改變Store的狀態，必須派發一個action對象，這就是規矩。這個規矩下，想要追朔一個應用的邏輯就變得非常容易。

MVC最大問題就是無法禁絕View和Model之間的直接對話。在Flux中，Store只有get方法，沒有set方法，根本不可能去修改內部狀態，View只能透過get方法獲取Store的狀態，無法直接去修改狀態，如果View想要修改Store狀態，只有派發一個action對象給Dispatcher。

這是一個很好的“限制”，禁絕了數據流混亂的可能。

簡單說來，在Flux的體系下，驅動介面改變始於一個動作的派發，別無他法。

### Flux的不足

#### 1. Store之間的依賴關係

在Flux體系中，如果兩個Store之間有邏輯依賴關係，就必須用上Dispatcher的waitFor函數。靠的是register函數的返回值dispatchToken，而dispatchToken的產生，當然是依賴的組件控制的。

換句話說，要這樣設計：

- 依賴的組件必須要把註冊回調函數產生的dispatchToken公之於眾。
- 組件必須要在代碼裡建立對依賴組件的dispatchToken的依賴。

雖然Flux這個設計的確解決了Store之間的依賴關係，但是，這樣明顯的模組之間的依賴，看了還是讓人感覺不舒服，畢竟，最好的依賴管理是不讓依賴產生。

#### 2. 難以進行Server端渲染

Server端渲染，輸出不是一個DOM樹，而是一個字符串，準確來說就是一個全是HTML的字符串。

在Flux體系中，有一個全局的，然後每一個Store都是一個全局唯一的對象，這對瀏覽器端應用完全沒問題，但放在Server端，就會有大問題。

和一個瀏覽器網頁只服務於一個用戶不同，在server端要同時接受很多用戶的請求，如果說Store都是全局唯一的對象，那不同請求的狀態肯定就亂套了。

Flux作Server端渲染很困難，Facebook也說得很清楚，Flux不是設計用作Server端渲染的，他們也重來沒有嘗試過把Flux應用於Server端。

#### 3. Store混雜了邏輯和狀態

Store封裝了數據和處理數據的邏輯，用面向對象的思維來看，這是一件好事，畢竟對象就是這樣定義。但是，當我們要動態替換一個Store的邏輯時，只能把這個Store整體替換掉，也就無法保持Store中存儲的狀態。

開發模式或生產環境下，都有可能面臨有bug要替換Store邏輯或根據用戶屬性動態加載不同的模組，而且希望狀態可保留，且網頁不reload，這就是熱加載(Hot Load)。

“偷梁換柱”的替換應用邏輯是不可能做到的。實際上，Redux就能做到。

## Redux

Redux是Flux的一種實現，除了Redux之外，還有很多實現Flux的框架，比如Reflux、Fluxible等。而Redux獲得的關注最多，因為Redux有很多其他框架無法比擬的優勢。

### Redux的基本原則

2013年問世的Flux飽受爭議，而2015年提出了在Flux基礎上的改進框架Redux，則是一鳴驚人，在所有Flux的變體中算是最受關注的框架。

Flux的基本原則是“單向數據流”，Redux在此基礎上強調三個基本原則：

- 唯一數據源
- 保持狀態只讀
- 數據改變只能透過純函數完成

#### 1. 唯一數據源

唯一數據源指的是應用的狀態數據只存儲在唯一的一個Store上。

在Flux中，應用可以擁有多個Store，往往根據功能把應用的狀態數據劃分給若干個Store分別存儲管理。

如果狀態數據分散在多個Store中，容易造成數據冗餘，這樣數據一致性方面就會出問題。雖然利用Dispatcher的waitFor方法可以保證多個Store之間的更新順序，但是這又產生了不同Store之間的顯示依賴關係，這種依賴關係的存在增加了應用的複雜度，容易帶來新的問題。

Redux解決辦法是：整個應用只保持一個Store，所有組件的數據源就是這個Store上的狀態。(但不阻止多個Store，不過不會有任何好處)。

這個唯一Store上的狀態，是一個樹型的對象，每個組件往往只是用樹型對象上一部分的數據，而如何設計Store上狀態的結構，就是Redux應用的核心問題。

#### 2. 保持狀態只讀

就是說不能去直接修改狀態，要修改Store的狀態，必須要透過派發一個action對象完成，和Flux的要求沒區別。

但我們說過驅動用戶介面更改的是狀態，如果狀態都是只讀的不能修改，怎麼引起用戶介面的變化呢？

當然，要驅動用戶介面渲染，就要改變應用的狀態，但是改變狀態的方法不是去修改狀態上值，而是**創建一個新的狀態對象返回給Redux**，**由Redux完成新的狀態的組裝**。

這就直接引出了第三個基本原則。

#### 3. 數據改變只能透過純函數完成

這裡所說的純函數就是Reducer，Redux這個名字前三個字母Red代表就是Reducer。以作者Dan abramov的說法，**Redux名字的含義是Reducer+Flux**。

Reducer是一個電腦科學中的通用概念，很多語言和框架都有對Reducer函數的支持。以JavaScript為例，陣列類型就有reduce函數，接受的參數就是一個reducer，reducer做的事情就是把陣列的所有元素依次做“規約”，對每個元素都調用一次參數reducer，透過reducer函數完成規約所有元素的功能。

```
[1,2,3,4].reduce(function reducer(accumulation, item) {
    return accumulation + item;
}, 0);
```

reducer接受兩個參數，第一個參數是上一次規約的結果，第二個參數是這一次規約的元素，函數體就是返回兩者之和，所以這個規約的結果就是所有元素之和。

在Redux中，每個reducer的函數簽名如下所示：

```
reduce(state, action)
```

reducer要做的事情，就是根據state和action的值產生一個新的對象返回，注意reducer必須是純函數，返回結果必須完全由參數決定，而且不產生任何副作用，也不能修改參數state和action的對象。

回顧一下Flux的Store是如何處理函數的：

```
CounterStore.dispatchToken = AppDispatcher.register((action) => {
    if (action.type === ActionTypes.INCREMENT) {
        counterValues[action.counterCaption]++;
        CounterStore.emitChange();
    } else if (action.type === ActionTypes.DECREMENT) {
        counterValues[action.counterCaption]--;
        CounterStore.emitChange();
    }
});
```

Flux更新狀態的函數只有一個參數action，因為狀態是由Store直接管理的，所以處理函數中會看到代碼直接更新state；在Redux中，一個實現同樣功能的reducer代碼如下：

```
function reducer(state, action) {
  const {counterCaption} = action;
  
  switch(action.type) {
    case ActionTypes.INCREMENT:
      return {...state, [counterCaption]: state[counterCaption] + 1};
    case ActionTypes.DECREMENT:
      return {...state, [counterCaption]: state[cunterCaption] - 1};
    default:
      return state;
  }
}
```

可以看到reducer函數不光接受action為參數，還接受state為參數。也就是說**Reducer只負責計算狀態**，卻**不負責存儲狀態**。

從Redux基本原則來看，Redux並沒有賦予我們強大的功能，反而是給開發者增加了很多限制，開發者喪失了想怎麼寫就怎麼寫的靈活度。

>“如果你願意限制做事方式的靈活度，你幾乎總會發現可以做得更好。”  —— John Carmark

在電腦編程的世界裡，完成任何一個任務，可能都有一百種以上的方法，但是無節制的靈活度反而讓軟件難以維護，**增加限制是提高軟件質量的法門**。

### Redux實例

React與Redux事實上是兩個獨立的產品。

有所謂的react-redux庫可使用，但這裡先以最簡單的Redux使用方法開始。

*src/ActionTypes.js*：

```

```