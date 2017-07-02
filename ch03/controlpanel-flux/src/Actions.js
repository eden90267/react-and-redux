/**
 * Created by eden90267 on 2017/7/1.
 */
import * as ActionTypes from './ActionType';
import AppDispatcher from './AppDispatcher';

export const increment = (counterCaption) => {
    AppDispatcher.dispatch({
        type: ActionTypes.INCREMENT,
        counterCaption,
    });
};

export const decrement = (counterCaption) => {
    AppDispatcher.dispatch({
        type: ActionTypes.DECREMENT,
        counterCaption,
    });
};