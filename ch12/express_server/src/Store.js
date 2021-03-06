import {createStore, applyMiddleware, combineReducers, compose} from 'redux';
import {routerReducer} from 'react-router-redux';

import resetEnhancer from './enhancer/reset';

const configureStore = () => {
  const originalReducers = {
    routing: routerReducer
  };
  const reducer = combineReducers(originalReducers);

  const win = global.window;

  const middlewares = [];
  if (process.env.NODE_ENV !== 'production') {
    middlewares.push(require('redux-immutable-state-invariant').default());
  }

  const storeEnhancers = compose(
    resetEnhancer,
    applyMiddleware(...middlewares),
    (win && win.devToolsExtension) ? win.devToolsExtension() : (f) => f,
  );

  const store = createStore(reducer, {}, storeEnhancers);
  store._reducers = originalReducers;

  return store;
};

export {configureStore};