/**
 * Created by eden90267 on 2017/6/29.
 */
import React, {Component} from 'react';
import Counter from './Counter';

const style = {
    margin: '20px'
};

class ControlPanel extends Component {

    constructor(props) {
        super(props);

        this.initValues = [0, 10, 20];
        const initSum = this.initValues.reduce((a, b) => a + b, 0);
        this.state = {
            sum: initSum,
        };
    }

    onCounterUpdate = (newValue, previousValue) => {
        const valueChange = newValue - previousValue;
        this.setState({
            sum: this.state.sum + valueChange,
        });
    };

    render() {
        console.log('enter ControlPanel render');
        return (
            <div style={style}>
                <Counter caption="First" onUpdate={this.onCounterUpdate}/>
                <Counter caption="Second" initValue={this.initValues[1]} onUpdate={this.onCounterUpdate}/>
                <Counter caption="Third" initValue={this.initValues[2]} onUpdate={this.onCounterUpdate}/>
                <hr/>
                <div>Total Count: {this.state.sum}</div>
                {/*<button onClick={() => this.forceUpdate()}>*/}
                    {/*Click me to repaint!*/}
                {/*</button>*/}
            </div>
        );
    }
}

export default ControlPanel;