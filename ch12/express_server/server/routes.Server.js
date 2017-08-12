import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {Route, RouterContext, IndexRoute, match} from 'react-router';
import {Provider} from 'react-redux';
import {combineReducers} from "redux";

import {configureStore} from "../src/Store";

import App from '../src/pages/App';
import Home from '../src/pages/Home';
import About from '../src/pages/About';
import NotFound from '../src/pages/NotFound';
import {page as CounterPage, reducer, initState, stateKey} from '../src/pages/CounterPage';

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={Home}/>
    <Route path="home" component={Home}/>
    <Route path="counter" component={CounterPage}/>
    <Route path="about" component={About}/>
    <Route path="*" component={NotFound}/>
  </Route>
);

const pathInitData = {
  '/counter': {
    stateKey,
    reducer,
    initState
  }
};

function safeJSONstringify(obj) {
  return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}

function renderMatchedPage(req, res, renderProps, assetManifest) {
  const store = configureStore();
  // 獲取匹配Page的initState函數
  const path = renderProps.location.pathname;
  const pathInfo = pathInitData[path] || {};
  const {stateKey, reducer, initState} = pathInfo;
  const statePromise = initState ? initState() : Promise.resolve(null);

  statePromise.then((result) => {
    if (stateKey) {
      const state = store.getState();
      store.reset(combineReducers({
        ...store._reducers,
        [stateKey]: reducer
      }), {
        ...state,
        [stateKey]: result
      });
    }

    const appHtml = ReactDOMServer.renderToString(
      <Provider store={store}>
        <RouterContext {...renderProps}/>
      </Provider>
    );

    const dehydratedState = store.getState();

    res.render('index', {
      title: 'Sample React App',
      PUBLIC_URL: '/',
      assetManifest,
      appHtml,
      dehydratedState: safeJSONstringify(dehydratedState)
    });

  });
}

export const renderPage = (req, res, assetManifest) => {
  match({routes, location: req.url}, function (err, redirect, renderProps) {
    // 檢查error和redirect，如果存在就讓res結束
    if (err) {
      return res.status(500).send(err.message);
    }
    if (redirect) {
      return res.redirect(redirect.pathname + redirect.search);
    }
    if (!renderProps) {
      return res.status(404).send('Not Found');
    }

    return renderMatchedPage(req, res, renderProps, assetManifest);
  });
};