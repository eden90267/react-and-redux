import React from 'react';
import {connect} from 'react-redux';

import * as Status from "./status";

const Weather = ({status, cityName, weather, lowestTemp, highestTemp}) => {
  switch (status) {
    case Status.LOADING:
      return <div>天氣信息請求中...</div>;
    case Status.SUCCESS:
      return (
        <div>
          {cityName} {weather} 最低氣溫 {lowestTemp} 最高氣溫 {highestTemp}
        </div>
      );
    case Status.FAILURE:
      return <div>天氣信息裝載失敗</div>;
    default:
      throw new Error(`unexpected status ${status}`);
  }
};

const mapStateToProps = (state) => {
  const weatherData = state.weather;

  return {
    status: weatherData.status,
    cityName: weatherData.city,
    weather: weatherData.weather,
    lowestTemp: weatherData.temp1,
    highestTemp: weatherData.temp2,
  };
};

export default connect(mapStateToProps)(Weather);