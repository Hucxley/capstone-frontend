<template>
  <v-container fluid class="mx-0 px-0">
    <v-toolbar flat>
      <v-row align="center" justify="center">
        <v-col cols="3">
          <v-toolbar-title align="left">Appointments</v-toolbar-title>
        </v-col>
        <v-col cols="6" class="text-center" align="center">
          <v-btn text icon @click="previousWeek"
            ><v-icon>mdi-chevron-left</v-icon></v-btn
          >
          <span class="text-subtitle-2"> {{ displayMonth }} </span>
          <v-btn text icon @click="nextWeek"
            ><v-icon>mdi-chevron-right</v-icon></v-btn
          >
        </v-col>
        <v-col cols="3" class="text-right" align="center">
          <v-spacer v-if="$vuetify.breakpoint.xlOnly"></v-spacer>
          <v-toolbar flat class="py-0 my-0">
            <v-spacer v-if="hasElevated"></v-spacer>
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
                    label="Date Finder"
                    prepend-inner-icon="mdi-calendar"
                    readonly
                    v-bind="attrs"
                    v-on="on"
                    clearable
                    @click:clear="onClearDateClicked"
                    class="shrink pt-2 pr-3 text-right"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="datePickerDate"
                scrollable
                no-title
                @input="showDatePicker = false"
              ></v-date-picker>
            </v-menu>
            <v-select
              class="shrink pt-2 pr-3 text-right"
              clearable
              v-model="selectedEmployee"
              :items="employeeSelector"
              prepend-inner-icon="mdi-account"
              label="Select Employee"
              dense
            ></v-select>
            <v-btn
              :x-small="$vuetify.breakpoint.lgAndDown"
              :small="$vuetify.breakpoint.xlOnly"
              text
              @click="addAppointment()"
              class="my-0 py-0 text-right"
            >
              New Appt
              <v-icon right>mdi-plus</v-icon>
            </v-btn>
          </v-toolbar>
        </v-col>
      </v-row>
    </v-toolbar>
    <div id="content-container" class="mx-0 px-0">
      <v-row class="mx-0 px-0"
             v-touch="{
                left: () => nextWeek(),
                right: () => previousWeek()}">
        <Calendar
          :refresh.sync="refresh"
          :isWrapped="isWrapped"
          :range="viewRange"
          :employee="employeeFilter"
          :services="services"
          :activeUser="activeUser"
          @update-selected="updateSelectedDate"
        ></Calendar>
      </v-row>
    </div>
    <keep-alive>
      <appointment-edit-form
        :services="services"
        :activeUser="activeUser"
        :dialog.sync="showEditForm"
        :appointment="appointmentToAdd"
        :selectedEmployee="employeeFilter"
        :date="selectedDate"
        @closeDialog="closeDialog"
        @refresh="refreshCalendar"
      >
      </appointment-edit-form>
    </keep-alive>
  </v-container>
</template>

<script>
import Calendar from "@/views/Calendar";
import AppointmentEditForm from "@/components/AppointmentEditForm";
import api from "@/api";
import {
  isAfter,
  addDays,
  subDays,
  format,
  fromUnixTime,
  isPast,
  parseISO
} from "date-fns";
import { mapState } from "vuex";

export default {
  name: "Appointments",
  components: { Calendar, AppointmentEditForm },
  props: {
    wrapper:{
      type: Boolean
    }
  },
  computed: {
    ...mapState(["user", "clUser", "primaryRole"]),
    computedDateFormatted() {
      return this.datePickerDate
        ? format(parseISO(this.datePickerDate).getTime(), "MM/dd/yyyy")
        : "";
    },
    hasElevated() {
      return (
        this.$store.state.primaryRole === "Admin" ||
        this.$store.state.primaryRole === "Employee"
      );
    },
    isWrapped(){
      return this.wrapper ? true : false
    }
  },
  created() {
    this.loading = true;
  },
  data() {
    return {

      activeUser: this.$store.state.clUser ? this.$store.state.clUser : {},
      isAdmin: null,
      isEmployee: null,
      appointmentToAdd: null,
      appointmentToEdit: {},
      currentDate: null,
      startDate: null,
      displayMonth: "",
      endDate: null,
      employees: [],
      employeeFilter: null,
      employeeSelector: [],
      services: [],
      selectedEmployee: null,
      selectedDate: false,
      showEditForm: false,
      showDatePicker: false,
      datePickerDate: null,
      viewRange: {},
      refresh: false,
      loading: true
    };
  },
  mounted() {
    this.activeUser = this.$store.state.clUser;
    this.isAdmin = this.activeUser.primaryRole === "Admin";
    this.isEmployee = this.activeUser.primaryRole === "Employee";
    this.initialize();
  },
  methods: {
    addAppointment(appointment) {
      this.activeUser = this.$store.state.clUser;
      if (!appointment) {
        this.appointmentToAdd = { date: this.selectedDate };
      } else {
        this.appointmentToAdd = appointment;
      }
      this.showEditForm = true;
    },
    closeDialog() {
      this.showEditForm = false;
    },
    async getServices() {
      let action = "GET";
      let resource = "/services";
      try {
        let response = await api.execute(action, resource);
        if (response) {
          console.log(response)
          this.services = response;
        }
      } catch (e) {
        console.log(e);
      }
    },
    onClearDateClicked(){
      let date = new Date().toISOString()
      this.datePickerDate = date
    },
    nextWeek() {
      this.startDate = addDays(this.startDate, 7);
      this.endDate = addDays(this.endDate, 7);
      this.viewRange = { startDate: this.startDate, endDate: this.endDate };
    },
    previousWeek() {
      if (!isPast(subDays(this.startDate, 1))) {
        this.startDate = subDays(this.startDate, 7);
        this.endDate = subDays(this.endDate, 7);
        this.viewRange = { startDate: this.startDate, endDate: this.endDate };
      }
    },
    refreshCalendar() {
      this.refresh = true
    },
    updateSelectedDate(date) {
      if (date && date !== this.selectedDate) {
        this.selectedDate = date;
      }
    },
    async initialize() {
      this.loading = true;
      this.currentDate = this.currentDate
        ? this.currentDate
        : fromUnixTime(Date.now() / 1000);
      this.startDate = this.currentDate;
      this.datePickerSelected = this.currentDate;
      this.displayMonth = format(this.startDate, "MMMM");
      this.endDate = addDays(this.startDate, 7);
      this.viewRange = { startDate: this.startDate, endDate: this.endDate };
      this.activeUser = this.$store.state.clUser;
      this.isAdmin = this.activeUser.primaryRole === "Admin";
      this.isEmployee = this.activeUser.primaryRole === "Employee";
      await this.getServices();
      try {
        const response = await api.execute("get", `/employees/info/basic`);
        if (response) {
          this.employees = response;
          for (const employee of response) {
            this.employeeSelector.push(employee.name);
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  },
  watch: {
    $store: function(newVal) {
      if (newVal.state.clUser) {
        this.initialize();
      }
    },
    isWrapped(newVal){
      console.log(newVal)
    },
    activeUser(newVal, oldVal) {
      if (newVal !== "undefined") {
        if (newVal.name && newVal !== oldVal) {
          this.isAdmin = newVal.primaryRole === "Admin";
          this.isEmployee = newVal.primaryRole === "Employee";
          this.activeUser = newVal;
        }
      }
      this.loading = false;
    },
    datePickerDate(newVal) {
      let newDate = parseISO(newVal);
      let yesterday = subDays(new Date(), 1)
      if (isAfter(newDate, yesterday)) {
        this.startDate = newDate;
        this.endDate = addDays(this.startDate, 7);
        this.viewRange = { startDate: this.startDate, endDate: this.endDate };
      }
    },
    selectedEmployee(newVal) {
      if (newVal != undefined) {
        this.employeeFilter = this.employees[
          this.employeeSelector.indexOf(newVal)
        ];
      } else this.employeeFilter = null
    },
    selectedDate(newVal) {
      if (newVal !== this.selectedDate) {
        this.updateSelectedDate(new Date(newVal).getTime())
      }
    },
    startDate(newVal) {
      this.displayMonth = format(newVal, "MMMM, yyyy");
    },
    viewRange(newRange, oldRange) {
      if (newRange && newRange !== oldRange) {
        console.log(
          "new view range set from " +
            newRange.startDate +
            " to " +
            newRange.endDate
        );
      }
    }
  }
};
</script>

<style scoped>
#content-container {
  height: 85vh;
}
</style>
