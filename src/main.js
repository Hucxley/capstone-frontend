import Vue from "vue";
import Vuex from "vuex";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import "@babel/polyfill";
import VueLogger from "vuejs-logger";

Vue.config.productionTip = false;
Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    user: {},
    clUser: {},
    primaryRole: ""
  },
  mutations: {
    updateUser(state, user) {
      state.user = user;
    },
    updateCLUser(state, user) {
      state.clUser = user;
    },
    updatePrimaryRole(state, role) {
      state.primaryRole = role;
    },
    resetUser(state) {
      state.user = {};
      state.primaryRole = "";
      state.clUser = {};
    }
  }
});

const options = {
  isEnabled: true,
  logLevel: "debug",
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: false,
  separator: "|",
  showConsoleColors: true
};

Vue.use(VueLogger, options);

/* eslint-disable no-new */

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
