import React from 'react';
import {combineReducers, createStore} from "redux";
import {mount} from "enzyme";

import {reducer as todosReducer, actions} from '../../../src/todos/index';
import {reducer as filterReducer} from '../../../src/filter/index';
import {FilterTypes} from "../../../src/constants";
import {Provider} from "react-redux";
import TodoList from '../../../src/todos/views/todoList';
import TodoItem from '../../../src/todos/views/todoItem';

describe('todos', () => {
  it('should add new todo-item on addTodo action', () => {
    const store = createStore(
      combineReducers({
        todos: todosReducer,
        filter: filterReducer
      }), {
        todos: [],
        filter: FilterTypes.ALL
      }
    );
    const subject = (
      <Provider store={store}>
        <TodoList/>
      </Provider>
    );
    const wrapper = mount(subject);

    store.dispatch(actions.addTodo('write more test'));
    expect(wrapper.find('.text').text()).toEqual('write more test');
  });
});