import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import store from './Store';

import Provider from './Provider';
import ControlPanel from './views/ControlPanel';

import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <Provider store={store}>
    <ControlPanel/>
  </Provider>,
  document.getElementById('root'));

registerServiceWorker();
