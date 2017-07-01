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