<template>
  <v-container class="main-display py-0 mt-0 mb-16 mx-0" fluid>
    <appointments :wrapper="true" class="mt-0 pt-0 mb-16 pb-16"></appointments>
    <v-bottom-navigation
        :value="activeDisplay"
        color="primary"
        absolute
        flat
        height="60"
        grow
    >

      <v-btn value="appointments" @click="setActiveDisplay('appointments')">
        <span>Appointments</span>
        <v-icon>mdi-calendar-month</v-icon>
      </v-btn>

    </v-bottom-navigation>
  </v-container>
</template>

<script>


import Appointments from "@/views/Appointments";

export default {
  name: "CustomerPanel",
  components: { Appointments },
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
      activeDisplay: 'appointments',
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
    this.activeDisplay = 'appointments'
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
.main-display {
  height: 85vh;
  overflow: hidden !important;
}
</style>