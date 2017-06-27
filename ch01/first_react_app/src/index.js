import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import ClickCounter from './ClickCounter';
import './index.css';

ReactDOM.render(<ClickCounter />, document.getElementById('root'));
registerServiceWorker();
