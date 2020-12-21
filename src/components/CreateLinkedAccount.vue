<template>
  <v-container>
    <form>
      <div class="text-center">
        <v-avatar
          v-if="name.length == 0"
          size="75"
          color="blue-grey darken-4"
          class="my-5"
        >
          <v-icon dark x-large>
            mdi-account-circle
          </v-icon>
        </v-avatar>
        <v-avatar v-else size="75" color="blue-grey darken-4" class="my-5">
          <span class="white--text headline">{{ initials }}</span>
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
      <v-text-field
          v-model="repeatInterval"
          label="Preferred Weeks Between Appointments"
          hint="Enter number of weeks for recurring appointments"
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
  props: ["parentProfile"],
  name: "CreateLinkedAccount",
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
  created() {},
  mounted() {
    this.initialize(this.parentProfile)
  },
  data: function() {
    return {
      checkbox: false,
      name: "",
      emailAddress: this.parentProfile.emailAddress,
      phoneNumber: this.parentProfile.phoneNumber,
      repeatInterval: null,
      initials: "",
      parentId: this.parentProfile.id,
      parent: this.parentProfile,
    };
  },
  methods: {
    splitName(name) {
      let nameSplit = name.split(" ");
      if (nameSplit) {
        if (nameSplit.length) {
          let firstInitial = nameSplit[0][0];
          if (nameSplit.length > 1) {
            let lastInitial = nameSplit[1][0];
            if (lastInitial) {
              this.initials = firstInitial + lastInitial;
            }
          }
        }
      } else {
        this.initials = "";
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
      let newUser = {
        name: this.name,
        emailAddress: this.emailAddress,
        phoneNumber: this.phoneNumber.replace(/\D+/g, ""),
        profilePhotoUrl: null,
        parentId: this.parentId,
        primaryRole: "Customer",
        repeatInterval: this.repeatInterval,
      };
      try {
        await api.execute("POST", `/user/create`, newUser).then(response => {
          if (response) {
            let userId = response.id;
            let resource = `/user/${userId}/update/parent?parentId=${this.parentProfile.id}`;
            api.execute("POST", resource).then(response => {
              if (response) {
                this.$forceUpdate();
                this.$emit('closeDialog', response)
              }
            });
          }
        })
      } catch (e) {
        console.log(e);
      }
    },
    clear() {
      this.name = "";
      this.checkBox = false;
      this.$forceUpdate();

    },
    initialize(parentProfile) {
      this.parent = parentProfile
      this.parenId = parentProfile.id
    },
    async cancel() {
      this.$emit('closeDialog', false)
      this.clear()
    }
  },
  watch: {
    name(val) {
      this.splitName(val);
    },
    parentProfile(val) {
      if(val.id){
        this.parentId = val.id
      }
    }
  }
};
</script>

<style scoped></style>
