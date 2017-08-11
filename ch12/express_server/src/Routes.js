import React, {Component} from 'react';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import {Provider} from "react-redux";
import {syncHistoryWithStore} from 'react-router-redux';
import {combineReducers} from 'redux';

import {configureStore} from './Store';
import App from "./pages/App";

const store = configureStore();

const createElement = (Component, props) => {
  return (
    <Provider store={store}>
      <Component {...props}/>
    </Provider>
  )
};

const getHomePage = (nextState, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/Home.js').default);
  }, 'home');
};
const getCounterPage = (nextState, callback) => {
  require.ensure([], function (require) {
    const {page, reducer, stateKey, initialState} = require('./pages/CounterPage');

    const state = store.getState();
    store.reset(combineReducers({
      ...store._reducers,
      counter: reducer
    }), {
      ...state,
      [stateKey]: initialState
    });
    callback(null, page);
  }, 'counter');
};
const getAboutPage = (nextState, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/About.js').default);
  }, 'about');
};
const getNotFoundPage = (nextState, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/NotFound.js').default);
  }, '404');
};

const history = syncHistoryWithStore(browserHistory, store);
// const history = browserHistory;
const routes = (
  <Route path="/" component={App}>
    <IndexRoute getComponent={getHomePage}/>
    <Route path="home" getComponent={getHomePage}/>
    <Route path="counter" getComponent={getCounterPage}/>
    <Route path="about" getComponent={getAboutPage}/>
    <Route path="*" getComponent={getNotFoundPage}/>
  </Route>
);
class Routes extends  Component {
  render() {
    return (
      <Router history={history} createElement={createElement}>
        {routes}
      </Router>
    );
  }
}

export default Routes;