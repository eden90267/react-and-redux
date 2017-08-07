import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import {stub} from 'sinon';
import * as actions from "../../src/weather/actions";
import * as actionTypes from "../../src/weather/actionTypes";


const middlewares = [thunk];
const createMockStore = configureStore(middlewares);

describe('weather/actions', () => {
  describe('fetchWeather', () => {
    let stubbedFetch;
    const store = createMockStore();

    beforeEach(() => {
      stubbedFetch = stub(global, 'fetch');
    });

    afterEach(() => {
      stubbedFetch.restore();
    });

    it('should dispatch fetchWeatherSuccess action type on fetch success', () => {
      const mockResponse = Promise.resolve({
        status: 200,
        json: () => Promise.resolve({
          weatherinfo: {}
        })
      });
      stubbedFetch.returns(mockResponse);

      return store.dispatch(actions.fetchWeather(1)).then(() => {
        const dispatchedActions = store.getActions();
        expect(dispatchedActions.length).toBe(2);
        expect(dispatchedActions[0].type).toBe(actionTypes.FETCH_STARTED);
        expect(dispatchedActions[1].type).toBe(actionTypes.FETCH_SUCCESS);
      });
    });

  });
});