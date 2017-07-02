/**
 * Created by eden90267 on 2017/7/2.
 */
import React, {Component} from 'react';

import store from '../Store';

class Summary extends Component {

    constructor(props) {
        super(props);

        this.state = this.getOwnState();
    }

    onChange = () => {
        this.setState(this.getOwnState());
    };


    getOwnState = () => {
        const state = store.getState();
        return {sum: Object.keys(state).reduce((res, key) => res += state[key], 0)};
    };

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.sum !== this.state.sum;
    }

    componentDidMount() {
        store.subscribe(this.onChange);
    }

    componentWillUnmount() {
        store.unsubscribe(this.onChange);
    }

    render() {
        const {sum} = this.state;
        return (
            <div>Total Count: {sum}</div>
        );
    }

}

export default Summary;