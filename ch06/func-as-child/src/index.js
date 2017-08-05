import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import CountDownTimer from "./CountDownTimer";

ReactDOM.render(
  <CountDownTimer/>
  , document.getElementById('root'));

registerServiceWorker();
