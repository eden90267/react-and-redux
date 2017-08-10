import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import Routes from './Routes';

ReactDOM.render(
  <AppContainer>
    <Routes/>
  </AppContainer>,
  document.getElementById('root')
);