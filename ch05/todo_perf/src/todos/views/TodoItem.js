import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

const TodoItem = ({onToggle, onRemove, completed, text}) => (
  <li
    className="todo-item"
    style={{
      textDecoration: completed ? 'line-through' : 'none'
    }}>
    <input className="toggle" type="checkbox" checked={completed ? "checked" : ""} readOnly onClick={onToggle}/>
    <label className="text">{text}</label>
    <button className="remove" onClick={onRemove}>x</button>
  </li>
);

TodoItem.propTypes = {
  onToggle: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired,
  id: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired
};

export default connect()(TodoItem);