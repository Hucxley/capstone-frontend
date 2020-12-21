import Vue from "vue";
import Router from "vue-router";
import LoginComponent from "@/components/Login";
import Home from "./views/Home.vue";
import Users from "./views/Users.vue";
import Profile from "./views/Profile";
import Registration from "@/views/Registration";
import Appointments from "@/views/Appointments";
import { OktaAuth } from "@okta/okta-auth-js";
import OktaVue, { LoginCallback } from "@okta/okta-vue";
import "@okta/okta-auth-js/polyfill";
import Services from "@/views/Services";

const oktaAuth = new OktaAuth({
  url: "https://dev-3583503.okta.com",
  issuer: "https://dev-3583503.okta.com/oauth2/default",
  clientId: "0oar2yxosCQDhkZkz5d5",
  redirectUri: window.location.origin + "/login/callback",
  scopes: ["openid", "profile", "email", "groups"],
  pkce: true,
  tokenManager: {
    storage: "sessionStorage",
    autoRenew: false,
    autoRemove: true
  }
});

const CALLBACK_PATH = "/login/callback";

Vue.use(Router);
Vue.use(OktaVue, {
  oktaAuth,
  onAuthRequired: () => {
    router.push("/login").then();
  }
});
const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/appointments",
    name: "Appointment",
    component: Appointments,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/users",
    name: "Users",
    component: Users,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/profile/:id",
    name: "User Profile",
    component: Profile,
    props: true,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/registration",
    name: "User Registration",
    component: Registration,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/users/search",
    name: "User Search",
    component: Users,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/login",
    component: LoginComponent
  },
  {
    path: "/services",
    component: Services,
    meta: {
      requiresAuth: false
    }
  },
  {
    path: CALLBACK_PATH,
    component: LoginCallback
  }
];

/*
const onAuthRequired = async (to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth) && !(await Vue.prototype.$auth.isAuthenticated())) {
    // Navigate to login page
    next({ path: '/login' })
  } else {
    next()
  }
}
*/

const router = new Router({
  mode: "history",
  routes
});

export default router;
