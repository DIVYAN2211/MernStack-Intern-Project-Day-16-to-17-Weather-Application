const request = require("request");//HTTP Request//obj
const openWeatherMap = {
    BASE_URL: "https://api.openweathermap.org/data/2.5/weather?q=",
    SECRET_KEY: "461b6ed428db175dc58242e633bce387",
  };
//Fetch weather data 
//encodeURIComponent -Ensures the address properly formatted without space like that
//callback -function that handles response or error
  const weatherData = (address, callback) => {
    const url =
      openWeatherMap.BASE_URL +
      encodeURIComponent(address) +                 
      "&APPID=" +
      openWeatherMap.SECRET_KEY;
    console.log(url);
    request({ url, json: true }, (error, data) => {
      if (error) {
        callback(true, "Unable to fetch data, Please try again. " + error);
      }
      callback(false, data?.body);
    });
  };
  
  module.exports = weatherData;