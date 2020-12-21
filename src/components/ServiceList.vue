<template>
  <v-container fluid class="mt-0 pt-0" ref="serviceView">
    <v-toolbar fluid flat>
      <v-toolbar-title>Services</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-item v-if="currentUser.primaryRole === 'Admin'">
          <v-btn text small @click="editService()">
            Add New Service
            <v-icon right>mdi-plus</v-icon>
          </v-btn>
        </v-item>
      </v-toolbar-items>
    </v-toolbar>
    <div v-if="services" class="pb-lg-0 pb-sm-10" id="services-container">
      <v-list
        three-line
        style="min-height: 50vh; max-height: 78vh;"
        class="overflow-y-auto pb-lg-11 pb-md-16"
      >
        <template v-for="(service, index) in services">
          <v-list-item :key="service.id">
            <v-list-item-content>
              <v-list-item-title v-html="service.name"></v-list-item-title>
              <v-list-item-subtitle
                v-html="`Description: ${service.description}`"
              ></v-list-item-subtitle>
              <v-list-item-subtitle
                v-html="`Price: ${service.displayPrice}`"
              ></v-list-item-subtitle>
              <v-list-item-subtitle
                v-html="`Appointment Length: ${service.duration} mins`"
              ></v-list-item-subtitle>
            </v-list-item-content>
            <v-spacer></v-spacer>
            <v-btn
              @click="editService(service)"
              v-if="currentUser.primaryRole === 'Admin'"
            >
              <span>Edit</span>
              <v-icon right>mdi-pencil</v-icon>
            </v-btn>
          </v-list-item>
          <v-divider
            v-if="index < services.length - 1"
            :key="`list-item-${index}`"
          ></v-divider>
        </template>
      </v-list>
    </div>
    <keep-alive>
      <service-edit-form
        @refresh="refresh"
        :dialog.sync="showEditForm"
        @closeDialog="closeDialog"
        v-bind:service="serviceToUpdate"
      ></service-edit-form>
    </keep-alive>
  </v-container>
</template>

<script>
import api from "@/api";
import ServiceEditForm from "@/components/ServiceEditForm";
let _ = require("lodash");

export default {
  name: "ServiceList.vue",
  components: { "service-edit-form": ServiceEditForm },
  computed: {
    currentUser() {
      return this.$store.state.user;
    }
  },
  data() {
    return {
      services: [],
      serviceToUpdate: {},
      showEditForm: false,
      savedService: {},
      refresh: false,
      update: null
    };
  },
  methods: {
    async getServices(){
      let vm = this;
      try {
        let response = await api.execute("get", `/services`)
        if (response) {
          _.orderBy(response, ["id"], ["asc"]);
          response.forEach(service => {
            if (service.minPrice && service.maxPrice) {
              service.displayPrice = `Ranges from $${service.minPrice} - $${service.maxPrice}`;
            } else if (service.minPrice) {
              service.displayPrice = `Starts at $${service.minPrice}`;
            } else {
              service.displayPrice = `$${service.fixedPrice}`;
            }
            vm.services.push(service);
          });
        }
      } catch (e) {
        this.$log.debug(e);
      }
    },
    editService(service) {
      this.serviceToUpdate = service;
      this.showEditForm = true;
    },
    closeDialog() {
      this.showEditForm = false;
    }
  },
  mounted: async function() {
    await this.getServices()
  },
  watch: {
    savedService(newVal) {
      if (newVal) {
        if (this.services.indexOf(newVal) == -1) {
          this.services.push(newVal);
        }
      }
    },
    refresh() {
      this.getServices()
    },
    update() {
      this.getServices()
    }
  }
};
</script>

<style scoped>
#services-container {
  max-height: 90%;
}
</style>
