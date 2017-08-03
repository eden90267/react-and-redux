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