# chap01. React 新的前端思維方式

## 初始化一個React項目

React不支持比IE 8更低版本的瀏覽器。

React不依賴Node.js，但開發中用到的諸多工具需要Node.js的支持。

### create-react-app工具

React技術依賴一個很廣大的技術棧，比如：

1. 轉譯JavaScript代碼需要使用Babel
2. 模組打包工具要使用Webpack
3. 定製build過程需要grunt或者gulp

這些技術棧都需要各自的配置文件，還沒開始寫一行React相關代碼，開發人員就已經被各種技術名詞淹沒。

所以Facebook提供了一個快速開發React應用的工具：create-react-app。這工具的主要目的是將開發人員從配置工作中解脫出來，無需過早關注這些技術棧細節，透過創建一個已經完成基本配置的應用，讓開發者快速開始React應用的開發。

```
npm install --global create-react-app
```

這樣電腦終究會有create-react-app這樣一個可以執行的命令，這個命令會在當前目錄下創建指定參數名的應用目錄。

```
create-react-app first_react_app
```

隨後我們只需要在這個框架的基礎上修改文件就可以開發React應用，避免了大量的手工配置工作：

```
cd first_react_app
npm start
```

這個命令會啟動一個開發模式的server，同時瀏覽器也會自動打開一個網頁：http://localhost:3000/。

恭喜你，你的第一個React應用誕生了。

## 增加一個新的React組件

React的首要思想是透過組件(component)來開發應用。所謂組件，指的是能完成某個特定功能的獨立的、可重用的代碼。

React非常適合構建用戶交互組件。

*ClickCounter.js*：

```
import React, {Component} from 'react';

class ClickCounter extends Component {
    constructor(props) {
        super(props);
        this.onClickButton = this.onClickButton.bind(this);
        this.state = {count: 0};
    }

    onClickButton() {
        this.setState({count: this.state.count + 1});
    }

    render() {
        return (
            <div>
                <button onClick={this.onClickButton}>Click Me</button>
                <div>
                    Click Count: {this.state.count}
                </div>
            </div>
        )
    }
}
export default ClickCounter;
```

App.js：

```
import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import ClickCounter from './ClickCounter';
import './index.css';

ReactDOM.render(<ClickCounter />, document.getElementById('root'));
registerServiceWorker();
```