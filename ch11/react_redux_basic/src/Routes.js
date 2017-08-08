import React from 'react';
import {Router, Route, browserHistory} from 'react-router';

import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';
import App from "./pages/App";

const history = browserHistory;
const Routes = () => (
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="home" component={Home}/>
      <Route path="about" component={About}/>
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>
);

export default Routes;