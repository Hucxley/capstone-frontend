<template>
  <v-container>
    <form>
      <div class="text-center">
        <v-avatar v-if="profilePhotoUrl" size="128" class="my-5">
          <img
            :src="`${profilePhotoUrl}`"
            :alt="`${name}'s profile photo`"
            size="128"
          />
        </v-avatar>
        <v-avatar size="128" color="white" v-else>
          <span class="white--text headline"></span>
        </v-avatar>
      </div>
      <v-text-field
        v-model="name"
        :error-messages="nameErrors"
        :counter="40"
        label="Name"
        required
        @input="$v.name.$touch()"
        @blur="$v.name.$touch()"
      ></v-text-field>
      <v-text-field
        v-model="emailAddress"
        :error-messages="emailErrors"
        label="E-mail"
        @input="$v.emailAddress.$touch()"
        @blur="$v.emailAddress.$touch()"
      ></v-text-field>
      <v-text-field
        v-model="phoneNumber"
        :error-messages="phoneErrors"
        label="Phone Number"
        hint="Enter numbers only"
        :counter="18"
        required
        @input="$v.phoneNumber.$touch()"
        @blur="$v.phoneNumber.$touch()"
      ></v-text-field>
      <v-checkbox
        v-model="checkbox"
        :error-messages="checkboxErrors"
        label="Do you agree to create an account with Cloverleaf Barbershop & Deja Du Salon?"
        required
        @change="$v.checkbox.$touch()"
        @blur="$v.checkbox.$touch()"
      ></v-checkbox>

      <v-btn class="mr-4" @click="submit">
        submit
      </v-btn>
      <v-btn class="mr-4" @click="clear">
        clear
      </v-btn>
      <v-btn @click="cancel">
        cancel
      </v-btn>
    </form>
  </v-container>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required, maxLength, email } from "vuelidate/lib/validators";
import api from "@/api";
import axios from "axios";

export default {
  mixins: [validationMixin],

  validations: {
    name: { required, maxLength: maxLength(40) },
    emailAddress: { email },
    phoneNumber: { required, maxLength: maxLength(18) },
    checkbox: {
      checked(val) {
        return val;
      }
    }
  },
  async created() {},
  mounted() {
    this.updateCurrentUser();
  },
  computed: {
    checkboxErrors() {
      const errors = [];
      if (!this.$v.checkbox.$dirty) return errors;
      !this.$v.checkbox.checked && errors.push("You must agree to continue!");
      return errors;
    },
    emailErrors() {
      const errors = [];
      if (!this.$v.emailAddress.$dirty) return errors;
      !this.$v.emailAddress.email &&
        errors.push("E-mail address must be valid");
      return errors;
    },
    nameErrors() {
      const errors = [];
      if (!this.$v.name.$dirty) return errors;
      !this.$v.name.maxLength &&
        errors.push("Name must be less than 40 characters");
      !this.$v.name.required && errors.push("Name is required");
      return errors;
    },
    phoneErrors() {
      const errors = [];
      if (!this.$v.phoneNumber.$dirty) return errors;
      !this.$v.phoneNumber.maxLength &&
        errors.push("Phone number must be less than 18 characters");
      !this.$v.phoneNumber.required && errors.push("Phone number is required!");
      return errors;
    }
  },
  name: "Registration",
  data() {
    return {
      currentUser: null,
      loading: true,
      emailAddress: null,
      idToken: null,
      name: null,
      phoneNumber: "",
      profilePhotoUrl: null,
      primaryRole: null,
      checkbox: false,
      userGroups: null,
      submitStatus: "PENDING",
      subscriberId: ""
    };
  },
  methods: {
    async updateCurrentUser() {
      this.currentUser = await this.$auth.getUser();
      this.userGroups = await this.$auth.getUser().groups;
      this.idToken =
        (await this.$auth.getIdToken()) || this.$auth.getAccessToken();
    },
    async getFakeProfile() {
      let randoURL =
        "https://randomuser.me/api/?inc=name,%20email,%20phone,%20picture&nat=us&noinfo";
      try {
        let response = await axios.get(randoURL);
        if (response) {
          console.log(response);
          let info = response.data.results[0];
          this.name = info.name.first + " " + info.name.last;
          this.phoneNumber = info.phone.replace(/\D+/g, "");
          this.profilePhotoUrl = info.picture.large;
          this.emailAddress = this.currentUser.email;
        }
      } catch (e) {
        console.log(e);
      }
    },
    submit() {
      this.$v.$touch();
      if (this.$v.$invalid) {
        this.submitStatus = "ERROR";
      } else {
        this.createUser();
      }
    },
    async createUser() {
      let id;
      let newUser = {
        name: this.name,
        emailAddress: this.currentUser.email,
        phoneNumber: this.phoneNumber.replace(/\D+/g, ""),
        profilePhotoUrl: this.profilePhotoUrl,
        primaryRole: this.primaryRole,
        subscriberId: this.currentUser.sub
      };
      try {
        await api.execute("post", `/user/create`, newUser).then(response => {
          console.log(response);
          if (response) {
            id = response.id;
            this.currentUser = response;
            this.$store.commit("updateUser", response);
            this.$store.commit("updatePrimaryRole", response.primaryRole);
            this.$router.push({ path: `/profile/${id}` });
          }
        });
      } catch (e) {
        console.log(e);
      }
    },
    clear() {
      this.name = "";
      this.emailAddress = "";
      this.phoneNumber = "";
      this.checkBox = false;
    },
    decodeToken(token) {
      let base64Url = token.split(".")[1];
      let base64 = base64Url.replace("-", "+").replace("_", "/");
      let decodedData = JSON.parse(
        Buffer.from(base64, "base64").toString("binary")
      );
      return decodedData;
    },
    async cancel() {
      this.clear();
      await this.$auth.logout();
      this.$store.commit("resetUser");
      await this.$router.push({ path: "/" });
    },
    async verifyUserRoles(groups) {
      this.primaryRole = this.getPrimaryGroup(groups);
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
    currentUser: function(newVal, oldVal) {
      console.log(newVal);
      if (newVal && newVal !== oldVal) {
        if (newVal.groups) {
          this.verifyUserRoles(newVal.groups);
        }
        if (!newVal.name) {
          this.getFakeProfile();
        }
      }
    },
    idToken(newVal) {
      if (newVal) {
        this.subscriberId = this.decodeToken(newVal).sub;
      }
    }
  }
};
</script>
