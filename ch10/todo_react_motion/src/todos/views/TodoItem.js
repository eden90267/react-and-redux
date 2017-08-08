import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import {toggleTodo, removeTodo} from '../actions';

class TodoItem extends Component {
  constructor() {
    super(...arguments);

    console.log('enter TodoItem constructor: ' + this.props.text);
  }

  render() {
    const {completed, onToggle, onRemove, text} = this.props;

    console.log('enter TodoItem render: ' + text);

    return (
      <li
        className="todo-item"
        style={{
          textDecoration: completed ? 'line-through' : 'none'
        }}>
        <input className="toggle" type="checkbox" checked={completed ? "checked" : ""} readOnly onClick={onToggle}/>
        <label className="text">{text}</label>
        <button className="remove" onClick={onRemove}>x</button>
      </li>
    )
  }

}

TodoItem.propTypes = {
  completed: PropTypes.bool.isRequired,
  id: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggle: () => dispatch(toggleTodo(ownProps.id)),
  onRemove: () => dispatch(removeTodo(ownProps.id))
});

export default connect(null, mapDispatchToProps)(TodoItem);