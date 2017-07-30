/**
 * Created by eden90267 on 2017/7/2.
 */
import React, {Component, PropTypes} from 'react';

import * as Actions from '../Actions';

const buttonStyle = {
  margin: '10px'
};

function Counter({caption, onIncrement, onDecrement, value}) {
  return (
    <div>
      <button style={buttonStyle} onClick={onIncrement}>+</button>
      <button style={buttonStyle} onClick={onDecrement}>-</button>
      <span>{caption} count: {value}</span>
    </div>
  );
}

Counter.propTypes = {
  caption: PropTypes.string.isRequired,
  onIncrement: PropTypes.func.isRequired,
  onDecrement: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired,
};

class CounterContainer extends Component {
  constructor() {
    super(...arguments);

    this.state = this.getOwnState();
  }

  getOwnState = () => {
    return {
      value: this.context.store.getState()[this.props.caption]
    };
  };

  onIncrement = () => {
    this.context.store.dispatch(Actions.increment(this.props.caption));
  };

  onDecrement = () => {
    this.context.store.dispatch(Actions.decrement(this.props.caption));
  };

  onChange = () => {
    this.setState(this.getOwnState());
  };

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.caption !== this.props.caption || nextState.value !== this.state.value;
  }

  componentDidMount() {
    this.context.store.subscribe(this.onChange);
  }

  componentWillUnmount() {
    this.context.store.unsubscribe(this.onChange);
  }

  render() {
    return (
      <Counter caption={this.props.caption}
               onIncrement={this.onIncrement}
               onDecrement={this.onDecrement}
               value={this.state.value}/>
    );
  }
}

CounterContainer.contextTypes = {
  store: PropTypes.object,
};

CounterContainer.propTypes = {
  caption: PropTypes.string.isRequired,
};

export default CounterContainer;