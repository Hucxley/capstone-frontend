import axios from "axios";
import Vue from "vue";

const instance = axios.create({
  baseURL: "https://cors-anywhere.herokuapp.com/https://agile-springs-79985.herokuapp.com/api/v1"
});

export default {
   async execute(method, resource, data, config){
    let accessToken = await Vue.prototype.$auth.getAccessToken();
    try{
      const response = await instance({
        method: method,
        url: resource,
        data: data,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "content-type": "application/json"
        },
        validateStatus: function(status) {
          return status < 501; // resolve promise if error < 501
        },
        ...config
      })
      // successful request
       return response.data
    } catch (error) {
      if (error.response) {
        return error.response
      } else if (error.request) {
          return error.request
      } else {
          return error
      }
    }
  }
};
