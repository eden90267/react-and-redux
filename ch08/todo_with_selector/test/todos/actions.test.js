import {addTodo} from "../../src/todos/actions";
import * as actionTypes from "../../src/todos/actionTypes";

describe('todos/actions', () => {
  describe('addTodo', () => {
    it('should create an action to add todo', () => {
      const text = 'first todo';
      const action = addTodo(text);

      expect(action.text).toBe(text);
      expect(action.completed).toBe(false);
      expect(action.type).toBe(actionTypes.ADD_TODO);
    });
  });
});