import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import Weather from "./weather";

ReactDOM.render(
  <Weather/>
  , document.getElementById('root'));

registerServiceWorker();
