<template>
  <v-app id="app">
    <v-app-bar dark class="blue-grey darken-4 align-center" dense app>
      <v-toolbar-title
        >Cloverleaf Barbershop & Deja Du Salon Scheduling</v-toolbar-title
      >
      <v-spacer> </v-spacer>
      <span class="text-sm-caption pr-2">Get in Touch: </span>
      <v-toolbar-items class="pr-5">
        <v-btn icon v-for="(item, i) in icons" :href="item.url" :key="i">
          <v-icon>{{ item.icon }}</v-icon>
        </v-btn>
      </v-toolbar-items>
      <v-divider vertical></v-divider>
      <span class="pr-5"></span>
      <v-toolbar-items class="pr-10">
        <v-btn icon href="/">
          <v-icon>mdi-home</v-icon>
        </v-btn>
        <v-btn icon href="/appointments">
          <v-icon>mdi-calendar</v-icon>
        </v-btn>
        <v-btn icon :href="`/profile/${activeUser.id}`" v-if="activeUser.id">
          <v-icon>mdi-account</v-icon>
        </v-btn>

        <v-btn icon v-if="isAdmin || isEmployee" href="/users/search">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
      </v-toolbar-items>
      <div v-if="authenticated && currentUser">
        <small>{{ activeUser.emailAddress }}</small>
        <v-menu bottom left>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>mdi-account-circle</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item :href="`/profile/${activeUser.id}`"
              >My Account</v-list-item
            >
            <v-list-item @click="logout">Logout</v-list-item>
          </v-list>
        </v-menu>
      </div>
      <div v-else>
        <small>Login</small>
        <v-btn icon href="/login">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
    <v-footer
      ref="footerContainer"
      dark
      class="blue-grey darken-4"
      fixed
      padless
      app
    >
      <v-col cols="12" class="text-center">
        <span class="pb-1 pt-1 white--text text-center">
          {{ new Date().getFullYear() }} —
          <strong>Cloverleaf Barbershop & Deja Du Salon</strong>
        </span>
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>
import api from "@/api";
import { mapState } from "vuex";

export default {
  name: "app",
  computed: {
    ...mapState(["user", "clUser", "primaryRole"])
  },
  created() {
    this.isAuthenticated();
  },
  data: () => {
    return {
      activeUser: {},
      authenticated: false,
      currentUser: null,
      activeClAccount: false,
      idToken: null,
      claims: [],
      groups: [],
      loading: false,
      isAdmin: false,
      isEmployee: false,
      isCustomer: false,
      isGuest: true,
      icons: [
        {
          text: "Facebook",
          icon: "mdi-facebook",
          url: "https://www.facebook.com/cloverleafbarberandsalon"
        },
        {
          text: "Instagram",
          icon: "mdi-instagram",
          url: "https://www.instagram.com/cloverleafbarbershop/"
        },
        { text: "Call Us!", icon: "mdi-phone", url: "tel:423-877-9913" }
      ]
    };
  },

  methods: {
    async isAuthenticated() {
      this.authenticated = await this.authState.isAuthenticated;
    },
    async logout() {
      await this.$auth.signOut();
      await this.isAuthenticated();
    },
    async getCLAccount(user) {
      user.primaryRole = this.getPrimaryGroup(user.groups);
      // only run if user is not registered, roles have changed, or user does not match registered user in storage
      try {
        let response = await api.execute("get", `/user/email?email=${user.email}`)
        if(response !== null) {
          if (response.primaryRole) {
            // update user if role changed since last login
            console.log(response.primaryRole !== user.primaryRole);
            if (response.primaryRole !== user.primaryRole) {
              response.primaryRole = user.primaryRole;
              let updateUrl = `/user/${response.id}/update`;
              let result = await api.execute("PUT", updateUrl, response)
              if(result.primaryRole === response.primaryRole) {
                this.$store.commit("updatePrimaryRole", result.primaryRole);
              }
            } else {
              console.log(response.primaryRole);
              this.$store.commit("updatePrimaryRole", response.primaryRole);
            }
            this.isAdmin = response.primaryRole === "Admin";
            this.isEmployee = response.primaryRole === "Employee";
            this.isCustomer = response.primaryRole === "Customer";
            console.log(response);
            this.activeUser = response;
            this.$store.commit("updateCLUser", response);
          } else {
            this.$router.push({ path: "/registration" });
          }
        } else {
          this.$router.push({ path: "/" });
        }
      } catch (e) {
        alert(e)
      }
    },
    getPrimaryGroup(groups) {
      if (groups.includes("Admin")) {
        return "Admin";
      } else if (groups.includes("Employee")) {
        return "Employee";
      } else if (groups.includes("Customer")) {
        return "Customer";
      } else return "Guest";
    }
  },
  watch: {
    $route: "isAuthenticated",
    authenticated: async function(newAuth, oldAuth) {
      if ((!oldAuth && newAuth) || newAuth !== oldAuth) {
        this.currentUser = await this.$auth.getUser();
      }
    },
    currentUser: function(newUser) {
      if (newUser !== undefined) {
        this.$store.commit("updateUser", newUser);
        newUser.primaryRole = this.getPrimaryGroup(newUser.groups);
        this.getCLAccount(newUser);
      }
    }
  }
};
</script>
