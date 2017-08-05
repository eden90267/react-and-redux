import React, {Component} from 'react';
import CountDown from "./CountDown";

class CountDownTimer extends Component {

  showCount(count) {
    return (
      <div>
        {count}
      </div>
    );
  }


  render() {
    return (
      <CountDown startCount={10}>
        {this.showCount}
      </CountDown>
    );
  }

}

export default CountDownTimer;