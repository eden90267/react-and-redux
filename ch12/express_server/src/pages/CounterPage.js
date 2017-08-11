import React, {Component} from 'react';

import {view as Counter, stateKey, reducer} from "../components/Counter";

class page extends Component {
  render() {
    return (
      <div>
        <div>Counter</div>
        <Counter/>
      </div>
    );
  }
}

const initialState = 100;
export {page, reducer, initialState, stateKey};