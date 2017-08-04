# chap06. React高階組件

當我們開發出更多React組件時，就會遇到這樣的問題，多個組件都需要某個功能，而且這個功能和介面並沒有關係，所以也不能簡單地抽取成一個新的組件，但是如果讓同樣的邏輯在各個組件裡各自實現，無疑會導致重複代碼。

>"重複是優秀系統設計的大敵" ─Robert C.Martin

這一章，我們會探討如何構建更易於複用、更靈活的React高級組件，包含下面兩種方式：

- 高階組件的概念及應用
- 以函數為子組件的模式

這兩種方式的最終目的都是為了重用代碼，只是策略不同，各有優劣，開發者在實際工作中要根據實際狀況決定採用何種方式。

## 高階組件

高階組件(Higher Order Component, HOC)並不是React提供的某種API，而是使用React的一種模式，用於增強現有組件的功能。

簡單來說，一個高階組件就是一個函數，這個函數接受一個組件作為輸入，然後返回一個新的組件作為結果，而且，返回的新組件擁有了輸入組件所不具有的功能。

這裡提到的組件並不是組件實例，而是一個組件類，也可以是一個無狀態組件的函數。

>**Top**：  
>在現有的文獻中，認為上面提到的函數返回結果才應該叫"高階組件"。而這個函數本身應該叫做"高階組件工廠函數"，這樣的定義又更加嚴謹。但是在本書中，我們遵循更普遍的定義，把增強功能的函數叫做"高階組件"，讀者只需知道存在這兩種說法就可以。

來看一個非常簡單的高階組件的例子：

```js
import React from 'react';

function removeUserProp(WrappedComponent) {
  return class WrappingComponent extends React.Component {
    render() {
      const {user, ...otherProps} = this.props;
      return <WrappedComponent {...otherProps}/>
    }
  };
}

export default removeUserProp;
```

在上面代碼中定義了一個函數removeUserProp，這既是我們定義的第一個高階組件。

這個高階組件，它有一個參數，名叫WrappedComponent，代表一個組件類，這個函數返回一個新的組件，所做的事情和WrappedComponent一模一樣，只是忽略user的prop。

函數removeUserProp直接返回一個class的定義，這個class名叫WrappingComponent。其實這個class叫什麼名字並不重要，因為它只是一個局部變量，這個WrappingComponent繼承自React.Component，表明返回依然是一個組件類，像上面所說的，高階組件就是根據一個組件類產生一個新的組件類。

WrappingComponent作為一個React組件，必須要有自己的render函數，在它的render函數中，利用擴展操作符將this.props分成兩部分user與otherProps，這是ES6語法的技巧。

然後，render函數把渲染的工作完全交給了removeUserProp函數的參數，只是使用了過濾掉了user的otherProps，把這個WrappedComponent組件渲染的結果作為render函數返回的結果。

假如我們現在不希望某個組件接收到user的prop，那麼我們就不要直接使用這個組件，而是把這個組件作為參數傳遞給removeUserProp函數，然後我們把這個函數的返回結果當作組件來使用：

```js
const NewComponent = removeUserProp(SimpleComponent);
```

上面的代碼中，NewComponent擁有和SampleComponent完全一樣的行為，唯一的區別就是即使傳遞user屬性給它，它也會當沒有user來處理。看起來是削弱功能，不過，只要把"屏蔽某個prop"也看作一種功能增強，那這個高階組件已經完成了"增強"的工作。

定義高階組件的意義何在?

首先，重用代碼。有時候很多React組件都需要公用同樣一個邏輯，比如說react-redux中容器組件的部分，沒有必要讓每個組件都實現一遍shouldComponentUpdate這些生命週期函數，把這個部分邏輯提取出來，利用高階組件的方式應用出去，就可以減少很多組件的重複代碼。

其次，修改現有React組件的行為。有些現成React組件並不是開發者自己開發的，來自第三方，或者，即使是我們自己開發的，但是我們不想去觸碰這些組件的內部邏輯，這時候高階組件有了用武之地。通過一個獨立於原有組件的函數，可以產生新的組件，對原有組件沒有任何侵害。

上面例子只是冰山一角，高階組件的實現方式可以分為兩大類：

- 代理方式的高階組件
- 繼承方式的高階組件

接下來我們就來介紹這兩大類實現，然後介紹高階組件的顯示名，最後講一段歷史故事。

### 代理方式的高階組件

removeUserProp例子就是一個代理方式的高階組件，特點是返回的新組件類直接繼承自React.Component類。新組件扮演的角色是傳入參數組件的一個"代理"，在新組件的render函數中，把被包裏組件渲染出來，除了高階組件自己要做的工作，其餘功能全都轉手給了被包裏的組件。

如果高階組件要做的功能不涉及除了render之外的生命週期函數，也不需要維護自己的狀態，那也可以乾脆返回一個純函數，像上面的removeUserProp，代碼可以簡寫成下面這樣：

```js
function removeUserProp(WrappedComponent) {
  return function newRender(props) {
    const {user, ...otherProps} = props;
    return <WrappedComponent {...otherProps}/>
  }
}
```

雖然這樣寫代碼更少，但是為了代碼邏輯更加清晰，在本章其他的例子中，我們還是統一讓高階組件返回同一個class，而不只是一個函數。

代理方式的高階組件，可以應用在下列場景中：

- 操縱prop
- 訪問ref
- 抽取狀態
- 包裝組件

下面分別介紹各種場景：

#### 1. 操縱 prop

代理類型高階組件返回的新組件，渲染過程也被新組件的render函數控制，而render函數相當於一個代理，完全決定如何使用被包裏的組件。

在render函數中，this.props包含新組件接收到的所有prop，最簡單的方式當然是把this.props原封不動地傳遞給被包裏組件，當然，高階組件也可以增減、刪除、修改傳遞給包裏組件的props列表。

來看一下增加prop的例子：

```js
const addNewPropsHOC = (WrappedComponent, newProps) => {
  return class WrappingComponent extends React.Component {
    render() {
      return <WrappedComponent {...this.props} {...newProps}/>
    }
  }
}
```

```js
const FooComponent = addNewPropsHOC(DemoComponent, {foo: 'foo'});
const BarComponent = addNewPropsHOC(OtherComponent, {bar: 'bar'});
```

由此可見，一個高階組件可以在重用在不同的組件上，減少代碼的重複。

#### 2. 訪問ref

在第四章介紹ref我們就已經強調，訪問ref並不是值得推薦的React組件使用方式，在這裡我們只是展示應用高階組件來實現這種方式的可行性。

我們寫一個名為refsHOC的高階組件，能夠獲得被包裏組件的直接應用ref，然後就可以根據ref直接操縱被包裏組件的實例：

```js
const refsHOC = (WrappedComponent) => {
  return class HOCComponent extends React.Component {
    constructor() {
      super(...arguments);
    }
    
    linkRef= wrappedInstance => {
      this._root = wrappedInstance;
    };
    
    render() {
      const props = {...this.props, ref: this.linkRef};
      return <WrappedComponent {...props}/>
    }
  }
}
```

這個refHOC的工作原理其實也是增加傳遞給被包裏組件的props，只是利用了ref這個特殊的prop，ref這個prop可以是一個函數，在被包裏組件的裝載過程完成的時候被調用，參數就是被裝載的組件本身。

傳遞給被包裏組件的ref值是一個成員函數linkRef，當linkRef被調用時就得到了被包裏組件的DOM實例，記錄在this._root中。

這樣的高階組件，可以說非常有用，也可以說沒什麼用。說他非常有用，是因為只要獲得了對包裏組件的ref引用，那它基本上就無所不能，因為透過這個引用可以任意操縱一個組件的DOM元素。說它沒什麼用，是因為ref的使用非常容易出問題，我們已經知道最好能用“控制中的組件”(Controlled
Component)來代替ref。

軟件開發中一個問題有很多解法，可行的解法很多，但合適的解法不多，了解一種可能性並不表示一定要使用它，我們只需要知道高階組件有訪問ref這種可能，並不意味著我們必須要使用這種高階組件。

#### 3. 抽取狀態

其實，我們已經使用過“抽取狀態”的高階組件了，就是react-redux的connect函數，注意connect函數本身不是高階組件，connect函數執行的結果是另一個函數，這個函數才是高階組件。

在傻瓜組件和容器組件的關係中，通常讓傻瓜組件不要管理自己的狀態，只要做一個無狀態的組件就好，所有狀態的管理都交給外面的容器組件，這個模式就是“抽取狀態”。

我們嘗試實現一個簡易版的connect高階組件，代碼結構如下：

```js
const doNothing = () => ({});

function connect(mapStateToProps = doNothing, mapDispatchToProps = doNothing) {
  return function(WrappedComponent) {
    class HOCComponent extends React.Component {
      // 在這裡定義HOCComponent的生命週期函數
    }
    
    HOCComponent.contextTypes = {
      store: React.PropTypes.object
    };
    return HOCComponent;
  };
}
```

創造的新組件HOCComponent需要利用React的Context功能，所以定義了contextTypes屬性，從Context中獲取名為store的值。

和react-redux的connect一樣，我們connect方法接受mapStateToProps和mapDispatchToProps。返回的React組件類預期能夠訪問一個叫store的context值，在react-redux中，這個context由Provider提供，在組件中我們透過this.context.store就可以訪問到Provider提供的store實例。

為實現類似react-redux功能，HOCComponent組件需要一系列成員函數來維持內部狀態和store同步：

```js
class HOCComponent extends React.Component {
  
  constructor() {
    super(...arguments);
    this.state = {};
  }
  
  componentDidMount() {
    this.context.store.subscribe(this.onChange);
  }
  
  componentWillUnmount() {
    this.context.store.unsubscribe(this.onChange);
  }
  
  onChange = () => {
    this.setState({});
  };
  
}
```

在上面的代碼中，借助store的subscribe和unsubscribe函數，HOCComponent保證每當Redux的Store上狀態發生變化的時候，都會驅動這個組件的更新。

雖然應該返回一個有狀態的組件，但反正真正的狀態存在Redux
Store上，組件內的狀態存什麼真的不重要，我們使用組件狀態的唯一原因是可以透過this.setState函數來驅動組件的更新過程，所以這個組件的狀態實際上是一個空對象就足夠。

每當React Store上的狀態發生變化時，就透過this.setState函數重設一遍組件的狀態，每次都創造一個新的對象，雖然state沒有任何有意義的值，卻能夠驅動組件的更新過程。

再來看HOCComponent的render函數：

```js
class HOCComponent extends React.Component {
  render() {
    const store = this.context.store;
    const newProps = {
      ...this.props,
      ...mapStateToProps(store.getState()),
      ...mapDispatchToProps(store.dispatch)
    };
    
    return <WrappedComponent {...newProps} />;
  }
}
```

render中邏輯類似“操控Props”的方式，雖然渲染工作交給了WrappedComponent，但是卻控制住了傳給WrappedComponent的props，因為WrappedComponent預期是一個無狀態的組件，所以能夠渲染什麼完全由props決定。

傳遞給connect函數的mapStateToProps和mapDispatchToProps兩個參數在render函數中被使用，根據執行store.getState函數來得到Redux Store的狀態，透過store.dispatch可以得到傳遞給mapDispatchToProps的dispatch方法。

使用擴展操作符，this.props、mapStateToProps和mapDispatchToProps返回結果被結合成一個對象，傳遞給了WrappedComponent，就是最終渲染結果。

不過，這裡實現的不是完整的connect實現邏輯。比如shouldComponentUpdate沒有實現。

#### 4. 包裝組件

目前為止，透過高階組件產生的新組件，render函數都是直接返回被包裏組件，修改的只是props部分。其實render函數的JSX中完全可以引入其他元素，甚至可以組合多個React組件，這樣就會得到更加豐富多采的行為。

一個實用的例子是給組件添加樣式style：

```js
const styleHOC = (WrappedComponent, style) => {
  
  return class HOCComponent extends React.Component {
    
    render() {
      return (
        <div start={style}>
          <WrappedComponent {...this.props} />
        </div>
      )
    }
    
  }
  
}
```

用div包起來，添加一個style來定製其CSS屬性，可以直接影響被包裏的組件對應DOM元素的展示樣式。

```js
const style = {color: red};
const NewComponent = styleHOC(DemoComponent, style);
```

### 繼承方式的高階組件

繼承方式的高階組件採用繼承關係關聯作為參數的組件和返回的組件。

我們用繼承方式重新實現一遍removeUserProp這個高階組件：

```js
function removeUserProps(WrappedComponent) {
  return class NewComponent extends WrappedComponent {
    render() {
      const {user, ...otherProps} = this.prpos;
      this.props = otherProps;
      return super.render();
    }
  }
}
```

代理方式和繼承方式最大的差別，是使用被包裏組件的方式。

代理方式下，render函數中的使用被包裏組件是透過JSX代碼：

```js
return <WrappedComponent {...otherProps}>
```

繼承方式下：

```js
return super.render();
```

因為我們創造的新組件繼承自傳入的WrappedComponent，所以直接調用super.render就能夠得到渲染出來的元素。

需要注意一下，在代理方式下WrappedComponent經歷了一個完整的生命週期，但在繼承方式下super.render只是生命週期的一個函數而已；在代理方式下產生的新組件和參數組件是兩兩個不同的組件，一次渲染，兩個組件都要經歷各自的生命週期，在繼承方式下兩者合二為一，只有一個生命週期。

在上面例子中我們直接修改了this.props，這實在不是個好作法，實際上，這樣操作可能產生不可預料的結果。

繼承方式的高階組件可以應用於下列場景：

- 操縱prop
- 操縱生命週期函數

#### 1. 操縱Props

繼承方式的高階組件也可以操縱props，除了上面不安全的修改this.props方法，還可利用React.cloneElement讓組件重新繪製：

```js
const modifyPropsHOC = (WrappedComponent) => {
  return class NewComponent extends WrappedComponent {
    render() {
      const elements = super.render();
      const newStyle = {
        color: (elements && elements.type === 'div') ? 'red' : 'green'
      };
      const newProps = {...this.props, style: newStyle};
      return React.cloneElement(elements, newProps, elements.props.children);
    }
  }
}
```

上面的高階組件實現的功能首先檢查參數組件的render函數返回結果，如果頂層元素是div，就將其增加一個color為red的style屬性，否則增加color為green的style屬性。最後，我們用React.cloneElement來傳入新的props，讓這些產生的組件重新渲染一遍。

雖然這樣可行，但過程實在非常複雜，唯一用得上的場景就是高階組件需要根據參數組件WrappedComponent渲染結果來決定如何修改props。否則，實在沒有必要用繼承方式來實現這樣的高階組件，使用代理方式來實現操縱prop的功能更加清晰。

#### 2. 操縱生命週期函數

因為繼承方式的高階組件返回的新組件繼承了參數組件，所以可以重新定義任何一個React組件的生命週期函數。

這是繼承方式高階函數特用的場景，代理方式無法修改傳入組件的生命週期函數。

例如，我們可定義一個高階組件，讓參數組件只有在用戶登陸時才顯示：

```js
const onlyForLoggedinHOC = (WrappedComponent) => {
  return class NewComponent extends WrappedComponent {
    render() {
      if (this.props.loggedIn) {
        return super.render();
      } else {
        return null;
      }
    }
  }
}
```

又例如，我們可以重新定義shouldComponentUpdate函數，只要prop中的useCache不為邏輯false就不做重新渲染的動作：

```js
const cacheHOC = (WrappedComponent) => {
  return class NewComponent extends WrappedComponent {
    shouldComponentUpdate(nextProps, nextState) {
      return !nextProps.useCache;
    }
  };
}
```

從上面例子的比較可以看出來，各方面看來代理方式都優於繼承方式。

業界有一句老話：“優先考慮組合，然後才考慮繼承”(Composition over Inheritance)。前人誠不欺我，我們應該盡量使用代理方式來構建高階組件。

### 高階組件的顯示名

每個高階組件都會產生一個新的組件，使用這個新組件就丟失掉了參數組件的“顯示名”，為了方便開發和維護，往往需要給高階組件重新定義一個“顯示名”，不然，在debug和日誌中看到的組件名就會莫名其妙。增加“顯示名”的方式就是給高階組件類的displayName賦上一個字符串類型的值。

以react-redux的connect為例，我們希望高階組件的名字包含Connect，同時要包含參數組件WrappedComponent的名字，所以我們對connect高階組件做如下修改：

```js
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
HOCComponent.displayName = `Connect(${getDisplayName(WrappedComponent)})`;
```

增加displayName的定義之後，在React Perf等工具看到的組件類名就更有意義。

### 曾經的React Mixin

除了上面提到的高階組件，React還有一個可以提供組件之間復用代碼的功能叫Mixin，不過這已經是一個不建議使用的功能，這裡講一段歷史故事讓大家理解靈活到不靈活的原因。

我們可定義這樣一個包含shouldComponentUpdate函數的Mixin：

```js
const ShouldUpdateMixin = {
  shouldComponentUpdate: function() {
    return !this.props.useCache;
  }
}
```

但是Mixin只能在用React.createClass方式創建的組件類中才能使用，不能再透過ES6語法創建的React組件中使用。

下面是一個使用Mixin的代碼樣例：

```js
const SampleComponent = React.createClass({
  mixins: [ShouldUpdateMixin],
  
  render: function() {
    // 實現render函數
  }
});
```

使用React.classClass創建出來的React組件，有mixins欄位的存在，成員方法就“混入”ShouldUpdateMixin這個對象裡的方法。

Mixin因為太靈活，導致難以管理，而且作為一項設計原則，應該盡量把state從組件裡抽取出來，盡量構建無狀態組件，Mixin卻反其道而行，鼓勵往React組件中加入狀態，這也是一個很大的缺陷。

## 以函數為子組件

高階組件並不是唯一可用於提高React組件代碼重用的方法。上一節介紹中可以體會到，高階組件擴展現有組件的方式主要是透過props，增加props或者減少props。以代理方式的高階組件為例，新產生的組件和原有的組件說到底是兩個組件，是父子關係，而兩個React組件之間的通信方式自然是props。因為每個組件都應該透過propTypes聲明自己所支持的props，高階組件利用原組件的props來擴充功能，在靜態代碼檢查上也佔優勢。

但是，高階組件也有缺點，那就是對原組件的props有了固化的要求。也就是說，能不能把一個高階組件作用於某個組件X，要先看一下這個組件X是不是能夠接受高階組件過來的props，如果組件X並不支持這些props，或者對這些props的命名有不同，或者使用方式不是預期的方式，那也就沒有辦法應用這個高階組件。

舉例，假如有這樣一個高階組件addUserProp，它讀取loggedinUser，這是"當前登陸用戶"的資料，把這個資料為新的名為user的prop傳遞給參數組件，代碼如下：

```js
const addUserProp = (WrappedComponent) => {
  class WrappingComponent extends React.Component {
    render() {
      const newProps =  {user: loggedinUser};
      return (<WrappedComponent {...this.props} {...newProps}/>);
    }
  }
}
```

要使用這個高階組件，作為參數的組件必須要能夠接受名為user的prop，不然應用這個高階組件就完全沒有用處。當然，我們可以給高階組件增加其他參數，讓使用者可以定製代表"當前登陸用戶"prop的名字。但是，作為層層傳遞的props，高階組件這種要求參數組件必須和自己有契約的方式，會帶來很多麻煩。

"以函數為子組件"的模式就是為了克服高階組件的這種侷限而生。在這種模式下，實現代碼重用的不是一個函數，而是一個真正的React組件，這樣的React組件有個特點，要求必須有子組件的存在，而且這個子組件必須是一個函數。在組件實例的生命週期函數中，this.props.children引用的就是子組件，render函數會直接把this.props.children當作函數來調用，得到的結果就可以作為render返回結果的一部分。

我們把addUserProp高階函數用"以函數為子組件"的方式重新實現。代碼如下：

```js
const loggedinUser = 'mock user';

class AddUserProp extends React.Component {
  render() {
    const user = loggedinUser;
    return this.props.children(user);
  }
}

AddUserProp.propTypes = {
  children: React.PropTypes.func.isRequired
};
```

AddUserProp首字母大寫，因為現在我們創造的是一個真正的組件類，而不是一個函數。這個類的代碼，和被增強組件的唯一聯繫就是this.props.children，而且this.props.children是函數類型，在render函數中直接調用this.props.children函數，參數就是我們希望傳遞下去的user。

使用這個AddUserProp的靈活之處在於它沒有被增強組件有任何props要求，只是傳遞一個參數過去，至於怎麼使用，完全由作為子組件的函數決定。

例如，我們想要讓一個組件把user顯示出來，代碼如下：

```js
<AddUserProp>
  {
    (user) => <div>{user}</div>
  }
</AddUserProp>
```

或者，我們想要把user作為一個prop傳遞給一個接受user名prop的組件Foo，那只需要用另一個函數作為AddUserProp的子組件就可以，代碼如下：

```js
<AddUserProp>
  {
    (user) => <Foo user={user} />
  }
</AddUserProp>
```

再或者，有一個組件Bar也可以接受prop，但是它接受的prop名為currentUser，使用高階組件就會很麻煩，但是使用AddUserProp在子組件函數中就可以完成從user到currentUser的轉換：

```js
<AddUserProp>
  {
    (user) => <Bar currentUser={user} />
  }
</AddUserProp>
```

從上面三個使用案例可以看得出來，利用這種模式非常靈活，因為AddUserProp預期子組件是一個函數，而函數使得一切皆有可能。

作為AddUserProp子組件的函數，成為了連接父祖件和底層組件的橋樑。一個函數可以包含各種邏輯，這樣就給使用AddUserProp提供了最大的靈活性。"以函數為子組件"模式沒有高階組件那麼多分類和應用場景，因為以函數為連接橋梁的方式已經提供了無數種用例。

### 實例CountDown

上面的AddUserProp太簡單，讓我們利用"以函數為子組件"模式來構建一個複雜一點的例子CountDown，實現倒計時的通用功能。

如果我們要求所有子組件都接受一個固定的prop，那就顯得太不靈活了，該是"以函數為子組件"模式上場的時候了。

我們要定義一個名為CountDown的組件，這個CountDown可以接受一個初始值作為當前數字，然後每隔一秒鐘調用一次函數形式的子組件，同時把當前數字減1，如此重複，直到當前數字減為0。

下面是CountDown組件的代碼，首先CountDown是一個React組件，構造函數代碼如下：

```js
class CountDown extends React.Component {
  constructor() {
    super(...arguments);
    this.state = {count: this.props.startCount};
  }
}
```

在我們的CountDown中，需要有一個倒數的開始值，所以還需要一個名為sartCount的prop