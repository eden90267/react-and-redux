import React from 'react';
const ReactDOM = require("react-dom");
import {Router, Route, IndexRoute, browserHistory, match} from 'react-router';
import {Provider} from "react-redux";
import {syncHistoryWithStore} from 'react-router-redux';
import {combineReducers} from 'redux';

import {configureStore} from './Store';
import App from "./pages/App";

const store = configureStore();
const win = global.window;

const getHomePage = (nextState, callback) => {
  require.ensure([], function (require) {
    callback(null, require('./pages/Home.js').default);
  }, 'home');
};
const getCounterPage = (nextState, callback) => {
  require.ensure([], function (require) {
    const {page, reducer, stateKey, initState} = require('./pages/CounterPage');

    const dehydratedState = (win && win.DEHYDRATED_STATE);
    const state = store.getState();
    const mergedState = {...state, ...dehydratedState};
    const statePromise = mergedState[stateKey]
      ? Promise.resolve(mergedState[stateKey])
      : initState();

    statePromise.then((result) => {
      store.reset(combineReducers({
        ...store._reducers,
        [stateKey]: reducer
      }), {
        ...state,
        [stateKey]: result
      });

      callback(null, page);
    });
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

export const renderRoutes = (domElement) => {
  match({history, routes}, (err, redirectLocation, renderProps) => {
    ReactDOM.render(
      <Provider store={store}>
        <Router {...renderProps}/>
      </Provider>,
      domElement
    );
  });
};