<template>
  <v-dialog
    :value="dialog"
    @input="$emit('update:dialog', false)"
    persistent
    max-width="600px"
  >
    <v-card>
      <v-card-title>
        <span class="headline" v-if="appointment && appointment.id"
          >Edit Appointment</span
        >
        <span class="headline" v-else>Schedule Appointment</span>
      </v-card-title>
      <v-card-text>
        <v-alert
          type="error"
          dismissible
          elevation="2"
          v-if="saveFailed"
          >{{ updateStatus.message }}</v-alert>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                label="Customer Search"
                v-if="isAdmin || isEmployee"
                v-model="customerSelected"
                :items="customers"
                :loading="isCustomersLoading"
                :search-input.sync="customerSearch"
                :filter="customerFilter"
                item-text="name"
                hide-no-data
                hide-selected
                placeholder="Start typing to search"
                prepend-inner-icon="mdi-magnify"
                return-object
                clearable
              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                label="Select Employee"
                v-model="employeeSelected"
                :items="employees"
                item-text="name"
                hide-no-data
                hide-selected
                placeholder="Start typing to search"
                prepend-inner-icon="mdi-account"
                return-object
                clearable
              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-autocomplete
                label="Select Service"
                v-model="serviceSelected"
                :items="services"
                item-text="name"
                hide-no-data
                hide-selected
                placeholder="Start typing to search"
                prepend-inner-icon="mdi-content-cut"
                return-object
                clearable
              ></v-autocomplete>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-menu
                v-model="showDatePicker"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="290px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    :value="computedDateFormatted"
                    label="Select Date"
                    prepend-inner-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="datePickerDate"
                  no-title
                  :disabled-dates="disabledDates"
                  :min-date="new Date()"
                  @input="showDatePicker = false"
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="6">
              <v-menu
                ref="timeMenu"
                v-model="showTimePicker"
                :close-on-content-click="false"
                :nudge-right="40"
                :return-value.sync="timeSelected"
                transition="scale-transition"
                offset-y
                max-width="290px"
                min-width="290px"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="timeSelected"
                    label="Set Time"
                    prepend-inner-icon="mdi-clock-time-four-outline"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-time-picker
                  v-if="showTimePicker"
                  v-model="timeSelected"
                  full-width
                  :allowed-minutes="allowedStep"
                  min="09:00"
                  max="17:45"
                  format="ampm"
                  @click:minute="$refs.timeMenu.save(timeSelected)"
                ></v-time-picker>
              </v-menu>
            </v-col>
          </v-row>
        </v-container>
        <small>*indicates required field</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="closeFormDialog">
          Close
        </v-btn>
        <v-btn color="blue darken-1" text @click="saveAppointment">
          Save
        </v-btn>
      </v-card-actions>
      <v-snackbar v-model="loading">
        Saving data...
      </v-snackbar>
    </v-card>
    <v-snackbar
        top
        app
        absolute
        width="600px"
        transition="slide-y-transition"
        text
        :color="updateStatus.color"
        v-model="showUpdateStatus"
        timeout="5000"
    >{{ updateStatus.message }}
    </v-snackbar>
  </v-dialog>
</template>

<script>
import api from "@/api";
import { mapState } from "vuex";
import { format, parseISO, addDays } from "date-fns";

export default {
  props: {
    activeUser: {
      type: Object
    },
    appointment: {
      type: Object
    },
    dialog: {
      type: Boolean
    },
    services: {
      type: Array
    },
    selectedEmployee: {
      type: Object
    },
    date: {
    },
  },
  computed: {
    ...mapState(["user", "clUser", "primaryRole"]),
    computedDateFormatted() {
      if(this.datePickerDate){
        return format(addDays(parseISO(new Date(this.datePickerDate).toISOString()), 1), "MM/dd/yyyy")
      }else{
        return format(parseISO(new Date().toISOString()), "MM/dd/yyyy")
      }
    },
  },
  created() {},
  name: "AppointmentEditForm",
  data() {
    return {

      appointmentDate: this.date,
      currentUser: this.activeUser,
      customer: null,
      customers: [],
      customerSearch: null,
      customerOptions: [],
      customerSelector: [],
      customerSelected: {},
      datePickerDate: null,
      employeeSelected: this.selectedEmployee ? this.selectedEmployee : null,
      employees: [],
      employeeSelector: [],
      isCustomersLoading: false,
      linkedAccounts: [],
      loading: false,
      serviceSelected: {},
      serviceList: [],
      serviceSelector: [],
      showDatePicker: false,
      showTimePicker: false,
      timeSelected: null,
      today: new Date(),
      disabledDates: { weekdays: [1, 2] },
      updateStatus: {color: '', message: ''},
      showUpdateStatus: false,
      saveFailed: false,

    };
  },
  methods: {
    allowedStep: m => m % 5 === 0,
    closeFormDialog() {
      this.$emit("closeDialog");
    },
    customerFilter(item, queryText) {
      const name = item.name.toLowerCase();
      const phoneNumber = item.phoneNumber.toString();
      const primaryRole = item.primaryRole.toLowerCase();
      const emailAddress = item.emailAddress.toLowerCase();

      const searchText = queryText.toLowerCase();

      return (
        name.indexOf(searchText) > -1 ||
        phoneNumber.indexOf(searchText) > -1 ||
        primaryRole.indexOf(searchText) > -1 ||
        emailAddress.indexOf(searchText) > -1
      );
    },
    isAdmin() {
      return this.activeUser ? this.activeUser.primaryRole === "Admin" : false;
    },
    isEmployee() {
      return this.activeUser
        ? this.activeUser.primaryRole === "Employee"
        : false;
    },
    async getCustomers() {
      this.isCustomersLoading = true;
      if (this.activeUser) {
        let id = this.activeUser.id;
        if (id) {
          let action = "get";
          let resource = `/customers/info/detailed?id=${id}`;
          try {
            let response = await api.execute(action, resource);
            if (response) {
              this.customers = response;
            }
            this.isCustomersLoading = false;
          } catch (e) {
            console.log(e);
          }
        }
      }
    },
    async getAppointmentsForDate() {
      let userRole = this.primaryRole;
      let action = "GET";
      let resource = "/appointments";
      let data = { userRole: userRole, date: this.appointmentDate };
      try {
        let response = await api.execute(action, resource, data);
        if (response) {
          console.log(response);
        }
      } catch (e) {
        console.log(e)
      }

    },
    async saveAppointment() {
      let employee = this.employeeSelected;
      let service = this.serviceSelected;
      let customer = this.customerSelected;
      let date = this.computedDateFormatted;
      let time = this.timeSelected;
      let timestampDate = new Date(date + " " + time)
      let timestamp = timestampDate.getTime();
      let appointment;
      if (employee && service && customer && timestamp) {
        appointment = {
          employee: employee,
          services: [service],
          customer: customer,
          start: timestamp
        };
        let action = "post";
        let resource = `/appointments/create`;
        try {
          let response = await api.execute(action, resource, appointment);
          if (response !== "Requested appointment slot is not valid.") {
            this.updateStatus.color = "success"
            this.updateStatus.message = "Appointment Saved Successfully"
            this.$emit("refresh");
            this.$emit("closeDialog");
          } else {
            this.updateStatus.color = "error"
            this.updateStatus.message = "This time slot is not available because it overlaps with another appointment. Please change the time/date for the appointment."
            this.saveFailed = true
          }
        } catch (e) {
          console.log(e);
        }
      }
    },
    setCustomerOptions() {
      let customers = []
      customers.push(this.activeUser)
      if(this.activeUser.linkedAccounts.length > 0){
        for(let user of this.activeUser.linkedAccounts){
          customers.push(user)
        }
      }
      this.customers = customers

    },
    setServiceSelector() {
      for (let service of this.services) {
        this.serviceSelector.push(service.name);
      }
    },
    setSelectedService(service) {
      this.selectedService = service
    },
    setupAppointment(){
      this.employeeSelected = this.appointment.employee
      this.serviceSelected = this.appointment.service
      this.customer = this.appointment.customerSelected

    },
    async initialize() {
      this.currentUser = this.activeUser
      this.userRole = this.primaryRole
      this.serviceList = this.services
      if (this.activeUser && this.activeUser.id) {
        this.linkedAccounts = this.activeUser.linkedAccounts
      }
      try {
        const response = await api.execute("get", `/employees/info/basic`)
        if (response) {
          this.employees = response
          for (const employee of response) {
            this.employeeSelector.push(employee.name)
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
  },
  mounted() {
    if(this.appointment){
      this.setupAppointment()
    }else{
      this.initialize();
    }
  },
  watch: {
    date(newVal){
      if(newVal){
        this.datePickerDate = format(parseISO(new Date(newVal).toISOString()), "yyyy-MM-dd")
      }
    },
    activeUser(newVal) {
      if (newVal) {
        this.initialize();
        this.userId = newVal.id;
        if (newVal.primaryRole === "Admin" || newVal.primaryRole === "Employee") {
          this.getCustomers();
        }
        if (newVal.primaryRole === "Customer") {
          this.setCustomerOptions(newVal);
        }
      }
    },
    appointmentDate(newVal) {
      if (newVal) {
        this.datePickerDate = format(parseISO(new Date(newVal).toISOString()), "yyyy-MM-dd")
        this.$emit("update-selected", this.timelineDate);
      }
    },
    serviceSelected() {
      this.refresh = false;
    },
    services(newVal) {
      if (newVal.length) {
        this.setServiceSelector();
      }
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
        this.$emit("closeDialog");
        this.refresh = false;
      }
    }
  }
};
</script>

<style scoped></style>
