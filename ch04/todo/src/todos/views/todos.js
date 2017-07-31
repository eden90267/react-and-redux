import React from 'react';
import AddTodo from './addTodo';
import TodoList from './todoList';

import './style.css';

export default () => (
  <div className="todos">
    <AddTodo/>
    <TodoList/>
  </div>
);