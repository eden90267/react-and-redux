import React from 'react';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import {Provider} from "react-redux";
import {syncHistoryWithStore} from 'react-router-redux';

import store from './Store';
import App from "./pages/App";
// import Home from './pages/Home';
// import About from './pages/About';
// import NotFound from './pages/NotFound';

const createElement = (Component, props) => {
  return (
    <Provider store={store}>
      <Component {...props}/>
    </Provider>
  )
};

const getHomePage = (location, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/Home.js').default);
  }, 'home');
};
const getAboutPage = (location, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/About.js').default);
  }, 'about');
};
const getNotFoundPage = (location, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/NotFound.js').default);
  }, '404');
};

const history = syncHistoryWithStore(browserHistory, store);
// const history = browserHistory;
const Routes = () => (
  <Router history={history} createElement={createElement}>
    <Route path="/" component={App}>
      <IndexRoute getComponent={getHomePage}/>
      <Route path="home" getComponent={getHomePage}/>
      <Route path="about" getComponent={getAboutPage}/>
      <Route path="*" getComponent={getNotFoundPage}/>
    </Route>
  </Router>
);

export default Routes;