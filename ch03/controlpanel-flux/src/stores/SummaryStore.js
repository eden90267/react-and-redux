/**
 * Created by eden90267 on 2017/7/2.
 */
import AppDispatcher from '../AppDispatcher';
import {EventEmitter} from 'events';
import CounterStore from './CounterStore';
import * as ActionTypes from '../ActionType';

const CHANGE_EVENT = 'changed';

function computeSummary(counterValues) {
    return Object.keys(counterValues).reduce((res, prop) => res += counterValues[prop], 0);
}

const SummaryStore = Object.assign({}, EventEmitter.prototype, {
    getSummary: function () {
        return computeSummary(CounterStore.getCounterValues());
    },
    emitChange: function() {
        this.emit(CHANGE_EVENT);
    },
    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback);
    },
    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },
});

SummaryStore.dispatchToken = AppDispatcher.register((action) => {
    if (action.type === ActionTypes.INCREMENT || action.type === ActionTypes.DECREMENT) {
        AppDispatcher.waitFor([CounterStore.dispatchToken]);
        SummaryStore.emitChange();
    }
});

export default SummaryStore;