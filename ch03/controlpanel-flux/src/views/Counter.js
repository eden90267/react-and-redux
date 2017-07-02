/**
 * Created by eden90267 on 2017/7/2.
 */
import React, {Component} from 'react';

import CounterStore from "../stores/CounterStore";
import * as Actions from '../Actions';

const buttonStyle = {
    margin: '10px'
};

class Counter extends Component {

    constructor(props) {
        super(props);

        this.state = {
            count: CounterStore.getCounterValues()[props.caption],
        };
    }

    componentDidMount() {
        CounterStore.addChangeListener(this.onChange);
    }

    componentWillUnmount() {
        CounterStore.removeChangeListener(this.onChange);
    }

    onChange = () => {
        const newCount = CounterStore.getCounterValues()[this.props.caption];
        this.setState({
            count: newCount,
        });
    };

    onClickIncrementButton = () => {
        Actions.increment(this.props.caption);
    };

    onClickDecrementButton = () => {
        Actions.decrement(this.props.caption);
    };

    render() {
        const {caption} = this.props;
        return (
            <div>
                <button style={buttonStyle} onClick={this.onClickIncrementButton}>+</button>
                <button style={buttonStyle} onClick={this.onClickDecrementButton}>-</button>
                <span>{caption} count: {this.state.count}</span>
            </div>
        );
    }

}

export default Counter;