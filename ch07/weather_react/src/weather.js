import React, {Component} from 'react';

const cityCode = 101010100;

class Weather extends Component {

  constructor() {
    super(...arguments);

    this.state = {weather: null};
  }

  componentDidMount() {
    const apiUrl = `/data/cityinfo/${cityCode}.html`;
    fetch(apiUrl).then((res) => {
      if (res.status !== 200) {
        throw new Error(`Fail to get response with status ${res.status}`);
      }
      res.json().then((resJson) => {
        this.setState({weather: resJson.weatherinfo});
      }).catch((err) => {
        this.setState({weather: null});
      })
    }).catch((err) => {
      this.setState({weather: null});
    })
  }

  render() {
    if (!this.state.weather) {

      return <div>暫無資料</div>;
    }

    const {city, weather, temp1, temp2} = this.state.weather;
    return (
      <div>
        {city} {weather} 最低氣溫 {temp1} 最高氣溫 {temp2}
      </div>
    );
  }

}

export default Weather;