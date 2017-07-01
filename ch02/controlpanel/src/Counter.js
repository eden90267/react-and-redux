import React, {Component, PropTypes} from 'react';

const buttonStyle = {
    margin: '10px'
};

class Counter extends Component {

    constructor(props) {
        console.log('enter constructor: ' + props.caption);
        super(props);

        this.state = {
            count: props.initValue
        };
    }

    componentWillMount() {
        console.log('enter componentWillMount ' + this.props.caption);
    }

    componentWillReceiveProps(nextProps) {
        console.log('enter componentWillReceiveProps: ' + this.props.caption);
    }

    shouldComponentUpdate(nextProp, nextState) {
        return nextProp.caption !== this.props.caption || nextState.count !== this.state.count;
    }

    onClickIncrementButton = () => {
        this.updateCount(true);
    };

    onClickDecrementButton = () => {
        this.updateCount(false);
    };

    updateCount = (isIncrement) => {
        const previousValue = this.state.count;
        const newValue = previousValue + (isIncrement ? 1 : -1);
        this.setState({count: newValue});
        this.props.onUpdate(newValue, previousValue);
    };

    render() {
        console.log('enter render ' + this.props.caption);
        const {caption} = this.props;
        return (
            <div>
                <button style={buttonStyle} onClick={this.onClickIncrementButton}>+</button>
                <button style={buttonStyle} onClick={this.onClickDecrementButton}>-</button>
                <span>{caption} count: {this.state.count}</span>
            </div>
        );
    }

    componentDidMount() {
        console.log('enter componentDidMount: ' + this.props.caption);
    }

}

Counter.propTypes = {
    caption: PropTypes.string.isRequired,
    initValue: PropTypes.number,
    onUpdate: PropTypes.func,
};

Counter.defaultProps = {
    initValue: 0,
    onUpdate: f => f, // 什麼都不做
};

export default Counter;