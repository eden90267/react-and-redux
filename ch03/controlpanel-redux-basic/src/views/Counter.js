/**
 * Created by eden90267 on 2017/7/2.
 */
import React, {Component, PropTypes} from 'react';

import store from '../Store';
import * as Actions from '../Actions';

const buttonStyle = {
    margin: '10px'
};

class Counter extends Component {

    constructor(props) {
        super(props);

        this.state = this.getOwnState();
    }

    onChange = () => {
        this.setState(this.getOwnState());
    };

    componentDidMount() {
        store.subscribe(this.onChange);
    }

    componentWillUnmount() {
        store.unsubscribe(this.onChange);
    }

    getOwnState = () => {
        return {
            value: store.getState()[this.props.caption]
        };
    };

    onIncrement = () => {
        store.dispatch(Actions.increment(this.props.caption));
    };

    onDecrement = () => {
        store.dispatch(Actions.decrement(this.props.caption));
    };

    render() {
        const {value} = this.state;
        const {caption} = this.props;

        return (
            <div>
                <button style={buttonStyle} onClick={this.onIncrement}>+</button>
                <button style={buttonStyle} onClick={this.onDecrement}>-</button>
                <span>{caption} count: {value}</span>
            </div>
        );
    }

}

Counter.propTypes = {
    caption: PropTypes.string.isRequired,
};

export default Counter;