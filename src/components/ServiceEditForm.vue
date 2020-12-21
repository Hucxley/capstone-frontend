<template>
  <v-dialog
    :value="dialog"
    @input="$emit('update:dialog', false)"
    persistent
    max-width="600px"
  >
    <v-card>
      <v-card-title>
        <span class="headline" v-if="service">Edit Service</span>
        <span class="headline" v-else>Create New Service</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="Service Name*"
                required
                v-model="selectedService.name"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                rows="2"
                auto-grow
                label="Description*"
                clearable
                required
                v-model="selectedService.description"
              ></v-textarea>
            </v-col>
            <v-col cols="3">
              <v-text-field
                label="Fixed Price"
                v-model="selectedService.fixedPrice"
              ></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-text-field
                label="Min Price"
                v-model="selectedService.minPrice"
              ></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-text-field
                label="Max Price"
                v-model="selectedService.maxPrice"
              ></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-select
                :items="[5, 10, 20, 30, 45, 60, 90, 120, 150, 180, 240]"
                label="Duration*"
                required
                v-model="selectedService.duration"
              ></v-select>
            </v-col>
          </v-row>
        </v-container>
        <small>*indicates required field</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="red darken-1" text @click="deleteService">
          delete
        </v-btn>
        <v-btn color="blue darken-1" text @click="cancelEdit">
          Close
        </v-btn>
        <v-btn color="blue darken-1" text @click="saveService">
          Save
        </v-btn>
      </v-card-actions>
      <v-snackbar v-model="loading">
        Saving data...
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script>
import api from "@/api";

export default {
  props: {
    service: {
      type: Object
    },
    dialog: Boolean
  },
  created() {
    if (this.service.id) {
      this.selectedService = this.service;
    }
  },
  name: "ServiceEditForm",
  data() {
    return {
      selectedService: {},
      loading: false,
      refresh: false
    };
  },
  methods: {
    async saveService() {
      let updatedService = null;
      this.refresh = false;
      let resourceUrl;
      let action;
      let body = this.selectedService;
      if (this.service) {
        // call Service Update endpoint on service controller
        resourceUrl = `/service/${this.service.id}`;
        action = "PUT";
      } else {
        resourceUrl = `/services/create`;
        action = "POST";
      }
      try {
        this.loading = true;
        let response = await api.execute(action, resourceUrl, body);
        if (response) {
          updatedService = response;
        }
      } catch (e) {
        console.log(e);
      }
      if (updatedService) {
        this.refresh = true;
      }
    },
    deleteService() {},
    cancelEdit() {
      this.$emit("closeDialog");
    },
    setSelectedService(service) {
      this.selectedService = service;
    }
  },
  mounted() {},
  watch: {
    selectedService() {
      this.refresh = false;
    },
    service(newVal) {
      let s = {};
      if (newVal) {
        s = newVal;
      } else {
        s.name = "";
        s.description = "";
        s.duration = "";
        s.fixedPrice = null;
        s.minPrice = null;
        s.maxPrice = null;
      }
      this.setSelectedService(s);
    },
    refresh(newVal) {
      if (newVal === true) {
        this.$emit("refresh", newVal);
      }
    }
  }
};
</script>

<style scoped></style>
