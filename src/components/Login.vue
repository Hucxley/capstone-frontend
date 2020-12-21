<template>
  <div class="login">
    <div id="osw-container"></div>
  </div>
</template>

<script>
import OktaSignIn from "@okta/okta-signin-widget";
import "@okta/okta-signin-widget/dist/css/okta-sign-in.min.css";

let signInWidgetConfig = {
  baseUrl: "https://dev-3583503.okta.com",
  el: "#osw-container",
  clientId: "0oar2yxosCQDhkZkz5d5",
  logo: "https://ok12static.oktacdn.com/fs/bco/1/fs0ytcorkJrG2iFUh5d5",
  redirectUri: window.location.origin + "/login/callback",
  logoText: "Cloverleaf Barbershop & Deja Du Login",
  tokenManager: {
    autoRenew: true,
    storage: sessionStorage
  },
  idps: [
    { type: "GOOGLE", id: "0oanoihl9Q4gL6zRB5d5" },
    { type: "FACEBOOK", id: "0oannsdgFRmpgOHP95d5" }
  ],
  idpDisplay: "PRIMARY",
  authParams: {
    pkce: true,
    issuer: "https://dev-3583503.okta.com/oauth2/default/",
    display: "popup",
    scopes: ["openid", "profile", "email"]
  },
  registration: {
    parseSchema: function(schema, onSuccess) {
      // handle parseSchema callback
      onSuccess(schema);
    },
    preSubmit: function(postData, onSuccess) {
      // handle preSubmit callback
      onSuccess(postData);
    },
    postSubmit: function(response, onSuccess) {
      // handle postsubmit callback
      console.log(response);
      // call success to finish registration flow
      onSuccess(response);
    }
  },
  features: {
    // Used to enable registration feature on the widget.
    // https://github.com/okta/okta-signin-widget#feature-flags
    registration: true, // REQUIRED
    // Enables IdP Discovery
    idpDiscovery: true,
    // allow self-unlock
    selfServiceUnlock: true,
    // enable sms recovery
    smsRecovery: true,
    autoPush: true
  }
};

export default {
  name: "Login",
  data() {
    return {
      widget: ""
    };
  },
  methods: {
    widgetSuccessCallback(res) {
      let key = "";
      if (res[0]) {
        key = Object.keys(res[0])[0];
        this.widget.tokenManager.add(key, res[1]);
      }
      if (res.status === "SUCCESS") {
        res.session.setCookieAndRedirect();
      }
    },
    widgetErrorCallback(err) {
      console.log(err);
    }
  },
  mounted: function() {
    this.widget = new OktaSignIn(signInWidgetConfig);
    this.widget.showSignInAndRedirect();
  },
  destroyed() {
    // Remove the widget from the DOM on path change
    this.widget.remove();
  }
};
</script>
