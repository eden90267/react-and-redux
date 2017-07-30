/**
 * Created by eden90267 on 2017/7/2.
 */
import React, {Component, PropTypes} from 'react';


function Summary({sum}) {
  return (
    <div>Total Count: {sum}</div>
  );
}

Summary.propTypes = {
  sum: PropTypes.number.isRequired,
};

class SummaryContainer extends Component {

  constructor() {
    super(...arguments);

    this.state = this.getOwnState();
  }

  onChange = () => {
    this.setState(this.getOwnState());
  };


  getOwnState = () => {
    const state = this.context.store.getState();
    return {sum: Object.keys(state).reduce((res, key) => res += state[key], 0)};
  };

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.sum !== this.state.sum;
  }

  componentDidMount() {
    this.context.store.subscribe(this.onChange);
  }

  componentWillUnmount() {
    this.context.store.unsubscribe(this.onChange);
  }

  render() {
    return (
      <Summary sum={this.state.sum}/>
    )
  }

}

SummaryContainer.contextTypes = {
  store: PropTypes.object,
};

export default SummaryContainer;