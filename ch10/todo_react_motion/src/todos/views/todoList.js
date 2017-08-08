import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {spring, TransitionMotion} from 'react-motion';

import TodoItem from './TodoItem';
import {selectVisibleTodos} from "../selector";

const getStyles = (todos) => {
  return todos.map(item => {
    return {
      key: item.id.toString(),
      data: item,
      style: {
        height: spring(60),
        opacity: spring(1)
      }
    };
  });
};

const willEnter = () => {
  return {
    height: 0,
    opacity: 0
  };
};

const willLeave = () => {
  return {
    height: spring(0),
    opacity: spring(0)
  };
};

const TodoList = ({todos}) => {
  const styles = getStyles(todos);
  const defaultStyles = todos.map(item => ({
    key: item.id.toString(),
    data: item,
    style: {
      height: 0,
      opacity: 0
    }
  }));
  return (
    <TransitionMotion
      defaultStyles={defaultStyles}
      willLeave={willLeave}
      willEnter={willEnter}
      styles={styles}
    >
      {
        interpolatedStyles =>
          <ul className="todo-list">
            {
              interpolatedStyles.map(config => {
                const {data, style, key} = config;

                const item = data;
                return (
                  <TodoItem
                    style={style}
                    key={key}
                    id={item.id}
                    text={item.text}
                    completed={item.completed}
                  />);
              })
            }
          </ul>
      }
    </TransitionMotion>
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