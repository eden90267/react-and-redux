/**
 * Created by eden90267 on 2017/7/2.
 */
import * as ActionTypes from './ActionTypes';

export const increment = (counterCaption) => {
    return {
        type: ActionTypes.INCREMENT,
        counterCaption
    };
};


export const decrement = (counterCaption) => {
    return {
        type: ActionTypes.DECREMENT,
        counterCaption
    };
};
