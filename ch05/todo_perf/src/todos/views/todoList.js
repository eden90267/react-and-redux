import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

import TodoItem from './TodoItem';
import {selectVisibleTodos} from "../selector";

const TodoList = ({todos}) => {
  return (
    <ul className="todo-list">
      {
        todos.map(item => (
          <TodoItem
            key={item.id}
            id={item.id}
            text={item.text}
            completed={item.completed}
          />
        ))
      }
    </ul>
  );
};

TodoList.propTypes = {
  todos: PropTypes.array.isRequired
};

const mapStateToProps = (state) => {
  return {
    todos: selectVisibleTodos(state)
  };
};

export default connect(mapStateToProps)(TodoList);