<template>
  <v-container class="admin-display py-0 my-0" ref="adminContainer" fluid>
    <v-container style="height: 95%" class="py-0" fluid>
      <user-list v-if="activeDisplay === 'users'"></user-list>
      <profile-appointments-view :profile="currentUser" v-if="activeDisplay === 'appointments'"></profile-appointments-view>
    </v-container>
    <v-bottom-navigation
        :value="activeDisplay"
        color="primary"
        absolute
        flat
        height="60"
        grow
    >
      <v-btn value="users" @click="setActiveDisplay('users')">
        <span>Accounts</span>
        <v-icon>mdi-account-box-multiple</v-icon>
      </v-btn>

      <v-btn value="appointments" @click="setActiveDisplay('appointments')">
        <span>Appointments</span>
        <v-icon>mdi-calendar-month</v-icon>
      </v-btn>

    </v-bottom-navigation>
  </v-container>
</template>

<script>
import UserList from "@/components/UserList"
import ProfileAppointmentsView from "@/components/ProfileAppointmentsView";

export default {
  name: "EmployeePanel",
  components: {ProfileAppointmentsView, UserList },
  props: ['activePanel'],
  computed: {
    currentUser() {
      return this.$store.state.clUser;
    }
  },
  created() {
    this.setActiveDisplay(this.activePanel);
  },
  data() {
    return {

      manageUsers: false,
      addService: false,
      viewService: false,
      activeDisplay: null,
    };
  },
  methods: {
    setActiveDisplay(display) {
      if(display){
        this.activeDisplay = display
      }else{
        this.activeDisplay = "users"
      }

    }
  },
  mounted() {

  },
  watch: {
    activeDisplay(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$emit('updateActiveUserSubPanel', newVal)
      }
    },
    activePanel(newVal){
      if(newVal) {
        this.setActiveDisplay(newVal)
      }
    }
  }
}
</script>

<style scoped>
.admin-display {
  height: 87vh;
}
</style>