import React, {Component} from 'react';
import fetch from 'isomorphic-fetch';

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

const END_POINT = process.env.HOST_NAME || 'localhost:9000';
const initState = () => {
  return fetch(`http://${END_POINT}/api/count`).then(response => {
    if (response.status !== 200) {
      throw new Error(`Fail to fetch count`);
    }
    return response.json();
  }).then(responseJson => {
    return responseJson.count;
  })
};

export {page, reducer, initState, stateKey};