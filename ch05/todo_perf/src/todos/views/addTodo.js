import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import {addTodo} from '../actions';

class AddTodo extends Component {

  constructor() {
    super(...arguments);

    this.state = {
      value: ''
    };
  }

  onSubmit = ev => {
    ev.preventDefault();

    const {value} = this.state;
    if (!value.trim()) {
      return;
    }

    this.props.onAdd(value);
    this.setState({
      value: ''
    });
  };

  onInputChange = ev => {
    this.setState({
      value: ev.target.value
    });
  };

  render() {
    return (
      <div className="add-todo">
        <form onSubmit={this.onSubmit}>
          <input className="new-todo" onChange={this.onInputChange} value={this.state.value}/>
          <button className="add-btn" type="submit">
            添加
          </button>
        </form>
      </div>
    )
  }

}

AddTodo.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => {
  return {
    onAdd: (text) => {
      dispatch(addTodo(text));
    }
  }
};

export default connect(null, mapDispatchToProps)(AddTodo);