import * as actions from "../../src/weather/actions";
import reducer from "../../src/weather/reducer";
import * as Status from "../../src/weather/status";

describe('weather/reducer', () => {
  it('should reutrn loading status', () => {
    const action = actions.fetchWeatherStarted();
    const newState = reducer({}, action);
    expect(newState.status).toBe(Status.LOADING);
  });
});