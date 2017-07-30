# chap02. 設計高質量的React組件

高質量組件：

- 不要只滿足於編寫出可運行的代碼，而要了解代碼背後的工作原理
- 不要只滿足於自己編寫的程序能夠執行，還要讓自己的代碼可讀而且易於維護

## 易於維護組件的設計要素

就像一個人最好只專注做一件事情一樣，組件也應該盡量保持只做一件事。當開發者發現一個組件功能太多，就要考慮拆分這些組件，用多個小組件來代替。每個小組件只專注實現單個功能，但是將這些功能組合起來，也能滿足複雜的實際需求。

這就是“分而治之”的策略。但不要濫用，只有必要的時候才去拆分組件，否則得不償失。

拆分組件最關鍵的就是確定組件的邊界，每個組件都應該是可以獨立存在的，如果兩個組件邏輯太緊密，無法清晰定義各自責任，那這兩個組件本身就不該被拆開，作為同一組件可能更合理。

但也不是說組件就是孤島一樣的存在，不同組件之間總是會有**通信交流**，這樣才可能組合起來完成更大的功能。

作為軟件設計的通則，組件劃分要滿足高內聚(Higi Cohesion)和低耦合(Low Coupling)的原則。

**高內聚**指的是把邏輯緊密相關的內容放在一個組件中。用戶介面無外乎內容、交互行為和樣式。傳統HTML、JavaScript與CSS文件各自分開定義，雖然滿足功能模組的需要，卻要在三個不同文件中，這其實不滿足高內聚的原則。React卻不是這樣，展示內容的JSX、定義行為的JavaScript，甚至定義樣式的CSS，都可以放在一個JavaScript文件中，因為他們**本來就是為了實現一個目的而存在的**，所以說React天生具有高內聚的特點。

**低耦合**指的是不同組件之間的依賴關係要盡量弱化，也就是每個組件要盡量獨立。保持整個系統的低耦合度，需要對系統中的功能有充分認識，然後根據功能點劃分模組，讓不同的組件去實現不同的功能。不過，React組件對外接口非常規範，方便開發者設計低耦合系統。

要充分應用這些原則，需要對React的特性有充分的認識。

## React組件的數據

>差勁的程序員操心代碼，優秀的程序員操心數據結構和它們之間的關係(Linus Torvalds，Linux創始人)

如何組織數據是程序最重要問題。

React組件的數據分成兩種，prop和state，無論prop或state的改變，都可能引發組件的重新渲染，那麼，設計一個組件的時候，什麼時候該選prop什麼時候該選state?原則很簡單，prop是組件的對外接口，state是組件的內部狀態，對外用prop，內部用state。

演示屬性的使用，建構兩個組件，Counter組件和ControlPanel組件，ControlPanel是父組件，包含若干個Counter組件。可看到三個Counter組件有不同的初始計數值，點擊網頁中的"+"、"-"按鈕可看到對應行的計數增加或減少。

### React的prop

prop是從外部傳遞給組件的數據，一個React組件透過定義自己能接受prop就定義了自己的對外公共接口。

每個React組件都是獨立存在的模組，組件之外的一切都是外部世界，外部世界就是透過prop來和組件對話的。

1. **給prop賦值**

    ```js
    <SampleButton
      id="sample" borderWidth={2} onClick={onButtonClick} style={{color: "red"}} />
    ```
    
    看起來，React組件的prop很像是HTML元素的屬性，不過，HTML組件屬性的值都是字符串類型，即使是內嵌JavaScript，也依然是字符串形式表示代碼。React組件的prop所能支持的類型則豐富的多，除了字符串，可以是任何一種JavaScript語言支持的數據類型。
    
   在prop類型不是字符串類型，JSX必須用花括號{}把prop值包住，所以style有兩個花括號，外層花括號代表JSX的語法，內層的花括號代表這是一個對象常量。
    
    外部世界傳遞一些數據給React，最直接方式就是用prop；同樣，React組件要反饋數據給外部世界，也可用prop，因為prop不限於純數據，也可是函數，函數類型的prop等於讓父組件交給了子組件一個回調函數，**子組件在恰當的實際調用函數類型的prop**，**可以帶上必要的參數**，**這樣就可以反過來把信息傳遞給外部世界**。
    
    對於Counter組件，父組件ControlPanel就是外部世界，我們看ControlPanel是如何用prop傳遞信息給Counter的，代碼如下：
    
    ```js
    class ControlPanel extends Component {
	    render() {
	        return (
	            <div>
	                <Counter caption="First" initValue={0}/>
	                <Counter caption="Second" initValue={10}/>
	                <Counter caption="Third" initValue={20}/>
	            </div>
	        );
	    }
	}
    ```
    
    React要求render函數只能返回一個元素。
    
2. **讀取prop值**

    看Counter組件內部怎麼接收傳入的prop，首先是構造函數：
    
    ```js
    class Counter extends Component {

        constructor(props){
            super(props);
        
            this.onClickIncrementButton = this.onClickIncrementButton.bind(this);
            this.onClickDecrementButton = this.onClickDecrementButton.bind(this);
        
            this.state = {
                count: props.initValue || 0
            };
        }
        
        // ...
    }
    ```
    
    如果一個組件需要定義自己的構造函數，一定要記得在構造函數的第一行透過super調用父類也就是React.Component的構造函數。如果沒有調用super(props)，那麼組件實例被創造之後，類實例的所有成員函數就無法透過this.props訪問到父組件傳遞過來的props值。很明顯，給this.props賦值是React.Component構造函數的工作之一。
    
    在Counter的構造函數中還給兩位成員函數綁定了當前this的執行環境，因為**ES6方法構造的React組件類並不自動給我們綁定this到當前實例對象**。
    
    在構造函數的最後，我們可以看到讀取傳入props的方法，在構造函數中可以透過參數props獲得傳入props值，其他函數中則可以透過this.props訪問傳入props的值，比如在Counter組件的render函數中，我們就是透過this.props獲得傳入caption：
    
    ```js
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
    
3. **propTypes檢查**

    既然prop是組件的對外接口，那麼就應該有某種方式讓組件聲明自己的接口規範。簡單說，一個組件應該可以規範以下這些方面：
    
    - 這個組件支持哪些prop
    - 每個prop應該是什麼格式
    
    React透過propTypes來支持這些功能。
    
    在ES6方法定義的組件類中，可以透過增加類的propTypes屬性來定義prop規格，這不只是聲明，而且是一種限制，在**運行**時和**靜態代碼檢查**時，都可以根據propTypes判斷外部世界是否正確使用組件的屬性。
    
    ```js
    Counter.propTypes = {
	    caption: PropTypes.string.isRequired,
	    initValue: PropTypes.number
	};
    ```
    
    違反propTypes規定，會在browser的console介面，看到一個紅色警告提示。
    
    propTypes檢查只是一個補助開發的功能，並不會改變組件的行為。
    
    propTypes雖然能夠在開發階段發現代碼中的問題，但放在產品環境中就不大合適了。
    
    首先，定義類的propTypes屬性，無疑要**佔用一些代碼空間**，而且propTypes檢查也需要**消耗CPU計算資源**的。其次，在**產品環境下做propTypes檢查沒有什麼幫助**，畢竟，propTypes產生的錯誤只有開發者看得懂，放在產品環境中，browser console輸出這些錯誤沒什麼意義。
    
    所以，最好方式是，開發者在代碼中定義propTypes，在開發過程中避免犯錯，但在發佈產品代碼時，用一種自動的方式將propTypes去掉，這樣最終部署到產品環境代碼就會更優。現有的babel-react-optimize就具有這個功能，可以透過npm安裝，但應該確保只在發佈產品代碼時使用它。
    
### React的state

驅動組件渲染過程除了prop，還有state，state代表組件的內部狀態。由於**React組件不能修改傳入的prop**，**所以需要記錄自身數據變化**，**就要使用state**。
    
1. 初始化state

    通常在組件類的構造函數結尾處初始化state，在Counter構造函數中，透過對this.state的賦值完成了對組件state的初始化。
    
    ```js
    constructor(props){
        super(props);

        // ...

        this.state = {
            count: props.initValue || 0
        };
    }
    ```
    
    因為initValue是一個可選的props，要考慮到父組件沒指定props值的情況。
    
    組件的state必須是一個JavaScript對象，不能是string或number這樣的簡單數據類型。即使是簡單的單一數據，也只能把它存作state某個字段對應的值。
    
    >Top：在React創建之初，使用的是React.createClass方法來創建組件類，這種方式下，透過定義組件類的一個getInitialState方法來獲取初始state值，但是這種做法已經被廢棄了，我們現在都用ES6的語法來定義組件類，所以不再考慮定義getInitialState方法。
    
    我們在constructor放置prop值不存在則給默認初始值，這並不是一件美觀的事情，可使用React的defaultProps功能，讓代碼更加容易讀懂：
    
    ```js
    Counter.defaultProps = {
        initValue: 0
    };
    ```
    
2. 讀取和更新state

    以“+”按鈕的響應函數為例：

    ```js
    onClickIncrementButton() {
        this.setState({
            count: this.state.count + 1,
        });
    }
    ```
    
    值得注意的是，我們改變組件state必須要使用`this.setState()`函數，而不直接去修改this.state。直接修改this.state這樣做的話，事實上會改變組件的內部狀態，但不會驅動組件進行重新渲染。this.setState()函數所做的事情，首先是改變this.state的值，然後驅動組件經歷更新過程，這樣才有機會讓this.state裡新的值出現在介面上。
    
### prop 和 state 的對比

總結一下prop和state的區別：

- prop用於定義外部接口，state用於記錄內部狀態
- prop的賦值在外部世界使用組件時，state的賦值在組件內部
- 組件不應該改變prop的值，而state存在的目的就是讓組件來改變的

組件的state就相當於組件的記憶，存在意義就是被修改，每一次透過this.setState函數修改state就改變了組件的狀態，然後透過渲染過程把這種變化體現出來。

但是，組件是絕不應該去修改傳入的props值的，假如父組件包含多個子組件，然後把一個JavaScript對象作為props值傳給這幾個子組件，而某個子組件居然改變了對象的內部值，那麼，接下來其他子組件讀取這個對象會得到什麼值呢？一個子組件去修改props的值，可能會讓程序陷入一團混亂，這就完全違背了React設計的初衷。

React扮演的角色是render函數的角色，應該是一個**沒有副作用的純函數**。修改props的值，是一個副作用，組件應該避免。

## 組件的生命週期

每個組件在網頁中會被創建、更新和刪除，如同有生命的機體一樣。

React嚴格定義了組件的生命週期，生命週期可能會經歷三個過程：

- 裝載過程(Mount)：也就是把組件第一次在DOM樹中渲染的過程
- 更新過程(Update)：當組件被重新渲染的過程
- 卸載過程(Unmount)：組件從DOM中刪除的過程

三種不同的過程，React庫會依次調用組件的一些成員函數，這些函數稱為生命週期函數。

### 裝載過程

當組件第一次被渲染，依次調用函數：

- constructor
- getInitialState
- getDefaultProps
- componentWillMount
- render
- componentDidMount

1. constructor

    要創建一個組件的實例，當然調用對應的構造函數。
    
    無狀態的React組件往往就不需要定義構造函數，一個React組件需要構造函數，往往是為了下面目的：
    
    - 初始化state，因為組件生命週期中任何函數都可能要訪問state，所以構造函數自然是初始化state最理想地方。
    - 綁定成員函數的this環境
    
    在ES6語法下，**類的每個成員函數在執行時的this並不是和類實例自動綁定的**。而在構造函數中，this就是當前組件實例，所以，為了方便將來的調用，往往在構造函數中將這個實例的特定函數綁定this為當前實例。
    
    ```js
    this.onClickIncrementButton = this.onClickIncrementButton.bind(this);
    this.onClickDecrementButton = this.onClickDecrementButton.bind(this);
    ```
    
    可用allow func解決：
    
    ```js
    onClickIncrementButton = () => {
        this.setState({
            count: this.state.count + 1,
        });
    };

    onClickDecrementButton = () => {
        this.setState({
            count: this.state.count - 1,
        });
    };
    ```

2. getInitialState和getDefaultProps：

    getInitialState這個函數的返回值會用來初始化組件的this.state，但這個方法只有用React.createClass方法創造的組件類才會發生作用。本書只會用ES6，所以這個函數根本不會產生作用。
    
    getDefaultProps函數的返回值可以做為props的初始值，和getInitialState一樣，這個方法只有用React.createClass方法創造的組件類才會發生作用。ES6根本不會用到。
    
    ```js
    const Sample = React.createClass({
        getInitialState: function() {
            return {foo: 'bar'};
        },
        getDefaultProps: function() {
            return {sampleProp: 0}
        },
    });
    ```
    
    ES6的話，在constructor中透過給this.state賦值完全狀態的初始化；透過給**類屬性**(注意是類屬性，不是類的實例對象屬性)defaultProps賦值指定props初始值：
    
    ```js
    class Sample extends React.Component {
        constructor(props) {
            super(props);
            this.state = {foo: 'bar'};
        }
    };
    
    Sample.defaultProps = {
        sampleProp: 0,
    };
    ```
    
    getInitialState只出現在裝載過程，也就是說在一個組件的整個生命週期過程中，這個函數只會被調用一次。
    
3. render

    render函數無疑是React組件中最重要的函數，一個React組件可以忽略其他所有函數都不實現，但是一定要實現render函數，因為所有React組件的父類React.Component類對除render之外的生命週期函數都有默認實現。
    
    通常一個組件要發揮作用，總是要渲染一些東西，render函數並不做實際的渲染動作，它只是返回一個JSX描述的結構，最終由React來操作渲染過程。
    
    當然，某些特殊組件的作用不是渲染介面，或者，組件在某些情況下選擇沒有東西可畫，那就讓render函數返回一個null或false，等於告訴React，這個組件這是不需要渲染任何DOM元素。
    
    需注意，render函數應該是一個純函數，完全根據this.state和this.props來決定返回的結果，而且不要產生任何副作用。在render函數中去調用this.setState毫無疑問是錯誤的，因為純函數不應該引起狀態的改變。

4. componentWillMount和componentDidMount

    componentWillMount會在調用render函數之前被調用，componentDidMount會在調用render函數之後被調用。這兩個函數把render函數夾住，正好分別做render前後必要的工作。
    
    不過，我們通常不用定義componentWillMount，它是發生在“將要裝載”的時候，這個時候沒有任何渲染出來的結果，即使調用this.setState修改狀態也不會引發重新繪製，一切都遲了。換句話說，所有可以在這個componentWillMount中做的事情，都可以提前到constructor中間去做，可以認為這個函數主要目的就是為了和componentDidMount對稱。
    
    componentDidMount的作用就大了。
    
    需注意的是，render函數被調用完之後，componentDidMount函數並不是會被立刻調用，componentDidMount被調用的時候，render函數返回的東西已經引發了渲染，組件已經被“裝載”到DOM樹上。
    
    ```
    enter constructor: First
    enter componentWillMount First
    enter constructor: Second
    enter componentWillMount Second
    enter constructor: Third
    enter componentWillMount Third
    enter componentDidMount: First
    enter componentDidMount: Second
    enter componentDidMount: Third
    ```
    
    componentWillMount都是緊跟著自己組件的render函數之前被調用，componentDidMount可不是緊跟著render函數被調用。當所有三個組件的render函數都被調用之後，三個組件的componentDidMount才連在一起被調用。
     
    之所以會有上面現象，是因為render函數本身並不往DOM樹上渲染或者裝載內容，它只是返回一個JSX表示的對象，然後由React庫來根據返回對象決定如何渲染。而React庫肯定是要把所有組件返回的結果綜合起來，才能知道該如何產生對應的DOM修改。
    
    componentWillMount與componentDidMount這對兄弟函數還有一個區別，就是componentWillMount可以在server、browser端被調用；而**componentDidMount只能在browser端被調用**。
    
    為什麼componentDidMount僅在browser端執行，這是一個實現上的決定，不是設計時刻意為之。因為“裝載”是一個創建組件並放到DOM樹上的過程，因此，真正的“裝載”是不可能在server端完成的。可以這麼解釋，server端渲染不會產生DOM樹，透過React組件產生的只是一個純粹的字符串而已。
    
    componentDidMount只在browser端執行，倒是給我們一個開發者很好的位置做只有browser端才做的邏輯，比如透過AJAX獲取數據來填充組件的內容。
    
    在componentDidMount被調用的時候，組件已經被裝載到DOM樹上了，可以放心獲取出來的任何DOM。
    
    在實際開發過程中，可能需要讓React和其他UI庫配合使用，比如，因為項目前期已經用jQuery開發了很多功能，需要繼續使用，有時候其他的UI庫做某些功能比React更合適，比如d3.js已經支持了豐富的繪製圖表的功能，這樣的情況下我們不得不考慮如何讓React和其他UI庫和平共處。
    
    以和jQuery配合為例，我們知道，React是用來取代jQuery的，但如果真的要讓React和jQuery配合，就需要利用componentDidMount函數，當componentDidMount被執行，React組件對應的DOM已經存在，所有事件函數也已經設置好，這時候，就可以調用jQuery的代碼，讓jQuery代碼在已經繪製的DOM基礎上增強新的功能。
    
    在componentDidMonut中調用jQuery代碼**只處理了裝載過程**，要和jQuery完全結合，又要考慮React的更新過程，就需要componentDidUpdate函數。
    
### 更新過程

當組件被裝載到DOM樹上之後，用戶在網頁上可以看到組件的第一印象，但要提供更好的交互體驗，就要讓該組件可以隨用戶操作改變展現內容，當props或state被修改的時候，就會引發組件的更新過程。

更新過程會一次調用下面的生命週期函數：

- componentWillReceiveProps
- shouldComponentUpdate
- componentWillUpdate
- render
- componentDidUpdate

有意思的是，並不是所有的更新過程都會執行全部函數。

1. componentWillReceiveProps(nextProps)

    關於這個componentWillReceiveProps存在一些誤解。有些教材聲稱這個函數只有當組件的props發生改變才會被調用，其實是不正確的。實際上，只要是父組件的render函數被調用，在render函數裡面被渲染的子組件就會經歷更新過程，不管父組件傳給子組件的props有沒有改變，都會觸發子組件的componentWillReceiveProps函數。
    
    注意，透過this.setState方法觸發的更新過程不會調用這個函數，這是因為這個函數適合根據新的props值(也就是參數nextProps)來計算出是不是要更新內部狀態state。更新組件內部狀態的方法就是this.setState，如果this.setState的調用導致componentWillReceiveProps再一次被調用，那就是一個死循環了。
    
    我們對ControlPanel做一些小的改進，來體會一下上面的規則。
    
    我們首先在Counter組件類裡增加函數定義，讓這個函數componentWillReceiveProps在console上輸出一些文字：
    
    ```js
    componentWillReceiveProps(nextProps) {
        console.log('enter componentWillReceiveProps: ' + this.props.caption);
    }
    ```
    
    ControlPanel的render函數：
    
    ```js
    render() {
        console.log('enter ControlPanel render');
        return (
            <div style={style}>
                ...
                <button onClick={() => this.forceUpdate()}>
                    Click me to repaint!
                </button>
            </div>
        );
    }
    ```
    
    每個React組件都可以透過forceUpdate函數強行引發一次重新繪製。
    
    >Top：在JSX用直接把匿名函數賦值給onClick方法，看起來非常簡潔而且方便，其實並不是值得提倡的方法。因為每次渲染都會創造一個新的匿名方法對象，而且有可能引發子組件不必要的重新渲染。
    
    點擊那顆新增的按鈕：
    
    ```
    enter ControlPanel render
    enter componentWillReceiveProps: First
    enter componentWillReceiveProps: Second
    enter componentWillReceiveProps: Third
    ```
    
    componentWillReceiveProps有必要把傳入參數nextProps和this.props作必要對比。nextProps代表的是這一次渲染傳入的props值，this.props代表的是上一次渲染時的props值，只有兩者有變化的時候才有必要調用this.setState更新內部狀態。
    
    我們試著點擊Counter組件的“+”按鈕，可以看到瀏覽器的console輸出如下：
    
    ```
    enter render First
    ```
    
    明顯可看到Counter的render函數被調用，函數componentWillReceiveProps沒有被調用。
    
    在React的組件組合中，完全可以只渲染一個子組件，而其他組件完全不需要渲染，這是提高React性能的重要方式。
    
2. shouldComponentUpdate(nextProps, nextState)

    除了render函數，shouldComponentUpdate可能是React組件生命週期中最重要的一個函數了。
    
    render函數決定了該渲染什麼，shouldComponentUpdate函數則決定一個組件什麼時候不需要渲染。

    render和shouldComponentUpdate函數，也是React生命週期函數中唯二兩個要求有返回結果的函數。render函數的返回結果將用於構造DOM對象，而shouldComponentUpdate函數返回一個boolean值，告訴React庫這個組件在這次更新過程中是否要繼續。
    
    在更新過程中，React庫首先調用shouldComponentUpdate函數，如果返回true，那就會繼續更新過程，接下來調用render函數；反之，false則立刻停止更新過程，也就不引發後續的渲染了。
    
    shouldComponentUpdate使用恰當，可大大提升React組件的性能。
    
    render純函數的邏輯輸入就是組件的props和state。所以，shouldComponentUpdate的參數就是接下來的props和state值。若要定義shouldComponentUpdate，那就是根據這兩個參數，外加this.props與this.state來判斷出是返回true還是返回false。
    
    現在來嘗試給Counter組件類增加shouldComponentUpdate函數的定義：
    
    ```js
    shouldComponentUpdate(nextProp, nextState) {
        return nextProp.caption !== this.props.caption || nextState.count !== this.state.count;
    }
    ```
    
    值得一提的是，透過this.setState函數引發更新過程，並不是立刻更新組件的state值，在執行到函數shouldComponentUpdate的時候，this.state依然是this.setState函數執行之前的值，所以我們要做的實際上就是nextProps、nextState、this.props和this.state中互相比對。
    
    在網頁中引發ControlPanel的重新繪製：
    
    ```
    enter ControlPanel render
    enter componentWillReceiveProps: First
    enter componentWillReceiveProps: Second
    enter componentWillReceiveProps: Third
    ```
    
    可以看到，三個Counter組件的render函數都沒有被調用。

3. componentWillUpdate和componentDidUpdate

    如果組件的shouldComponentUpdate函數返回true，React接下來就會依次調用對應組件的componentWillUpdate、render和componentDidUpdate函數。

    和裝載過程不同的是，當在server端使用React渲染，這一對函數中的Did函數，也就是componentDidUpdate函數，並不是只在browser端才執行的，無論更新過程發生在服務器端還是瀏覽器端，該函數都會被調用。
    
    當React組件被更新時，原有的內容被重新繪製，這時候就需要在componentDidUpdate函數再次調用jQuery代碼。
    
    實際上，使用React作server端渲染，基本上不會經歷更新過程，因為server端只要產出HTML字符串，一個裝載過程就足夠產出HTML了，所以正常狀況下server端不會調用componentDidUpdate函數，如果調用了，代表我們程序有誤，需要改進。
    
### 卸載過程

React組件的卸載過程只涉及一個函數componentWillUnmount，當React組件要從DOM樹上刪掉之前，對應的componentWillUnmount函數會被調用，所以這個函數適合做一些清理的動作。

componentWillUnmount通常與componentDidMount有關，componentDidMount中用非React方法創造了一些DOM元素，如果撒手不管可能造成內存泄露，那就需要在componentWillUnmount中把這些創造的DOM元素清理掉。

## 組件向外傳遞數據

如何子組件把數據傳遞給父組件。

ControlPanel新增一個能夠即時顯示這三個子組件當前計數值之和。

但要解決一個問題：要讓ControlPanel“知道”三個子組件當前的計數值，而且是每次變更都要立刻知道，而Counter組件的當前值組件的內部狀態，如何讓外部世界知道這個值？

答案依然是使用prop。組件的prop可以是任何JavaScript對象，而在JavaScript中，函數是一等公民，函數本身就可以被看作一種對象，既可以像其他對象一樣作為prop的值從父組件傳遞給子組件，又可以被子組件作為函數調用，這件事就好辦了。

Counter組件：

```js
onClickIncrementButton = () => {
    this.updateCount(true);
};

onClickDecrementButton = () => {
    this.updateCount(false);
};

updateCount = (isIncrement) => {
    const previousValue = this.state.count;
    const newValue = previousValue + (isIncrement ? 1 : -1);
    this.setState({count: newValue});
    this.props.onUpdate(newValue, previousValue);
};
```

增加調用this.props.onUpdate這個函數。

對應的，Counter組件的propTypes和defaultProps就要增加onUpdate的定義：

```js
Counter.propTypes = {
    caption: PropTypes.string.isRequired,
    initValue: PropTypes.number,
    onUpdate: PropTypes.func,
};

Counter.defaultProps = {
    initValue: 0,
    onUpdate: f => f, // 什麼都不做
};
```

這個onUpdate類型是函數，當Counter的狀態改變的時候，就會調用這個給定的函數，從而達到通知父組件的作用。

onUpdate成為子組件向父組件傳遞數據的渠道，根據newValue與previousValue給父組件，從而使其推導數值是增加還是減少。

現在ControlPanel需要包含自己的state，首先是構造函數的部分：

```js
constructor(props) {
    super(props);

    this.initValues = [0, 10, 20];
    const initSum = this.initValues.reduce((a, b) => a + b, 0);
    this.state = {
        sum: initSum,
    };
}
```

ControlPanel傳遞給Counter組件的onUpdate這個prop的值是onCounterUpdate函數：

```js
onCounterUpdate = (newValue, previousValue) => {
    const valueChange = newValue - previousValue;
    this.setState({
        sum: this.state.sum + valueChange,
    });
};
```

遺憾的是，React雖然有PropType能夠檢查prop的類型，**卻沒有任何機制來限制prop的參數規格**，參數的一致性只能靠開發者來保證。

ControlPanel組件的render函數：

```js
render() {
    console.log('enter ControlPanel render');
    return (
        <div style={style}>
            <Counter caption="First" onUpdate={this.onCounterUpdate}/>
            <Counter caption="Second" initValue={this.initValues[1]} onUpdate={this.onCounterUpdate}/>
            <Counter caption="Third" initValue={this.initValues[2]} onUpdate={this.onCounterUpdate}/>
            <hr/>
            <div>Total Count: {this.state.sum}</div>
        </div>
    );
}
```

## React組件state和prop的侷限

每個Counter有自己的狀態紀錄當前計數，而父組件ControlPanel也有一個狀態存儲所有Counter計數總合，也就是說，數據發生重複，就會有個問題，如何保證重複的數據一致？

兩種解法：

1. 以某一個組件狀態為準，這個組件是狀態的“領頭羊”，其餘組件都保持和“領頭羊”的狀態同步。但實際情況這種方法難以實施。
2. 乾脆不要讓任何一個React組件扮演“領頭羊”ˇ的角色，把數據源放在React組件之外形成全局狀態。讓各個組件保持和全局狀態的一致，這樣更容易控制

全局狀態就是唯一可靠的數據源，這就是Flux和Redux中Store的概念。

除了state，利用prop在組件之間傳遞信息也會遇到問題，會有中間層的組件做搬運工的角色，然而他是不需要用上這個prop，只因為子組件用得上。這明顯違反了低耦合的設計要求。

## 本章小結

保證組件高質量的一個重要工作就是保持組件對外接口清晰簡潔。

prop對外接口；state內部狀態。

React的生命週期：裝載過程、更新過程和卸載過程。

使用React的state來儲存狀態的缺點，就是數據的冗餘和重複。