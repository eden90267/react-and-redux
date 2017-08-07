import * as Status from "./status";
import {FETCH_FAILURE, FETCH_STARTED, FETCH_SUCCESS} from "./actionTypes";

export default (state = {status: Status.LOADING}, action) => {
  switch (action.type) {
    case FETCH_STARTED:
      return {status: Status.LOADING};
    case FETCH_SUCCESS:
      return {...state, status: Status.SUCCESS, ...action.result};
    case FETCH_FAILURE:
      return {status: Status.FAILURE};
    default:
      return state;
  }
};