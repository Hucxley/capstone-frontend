<template>
  <div>
    <v-toolbar fluid tile flat>
      <v-container fluid>
        <v-row align="center" justify="center">
          <v-col cols="12">
            <v-toolbar-title align="left">{{ displayTitle }}</v-toolbar-title>
          </v-col>
        </v-row>
      </v-container>
    </v-toolbar>
    <v-card height="81vh" flat class="no-overflow mx-0 mt-0 pt-0" width="100vw">
      <v-card-text class="scroll pa-0">
        <v-container fluid>
          <v-row dense no-gutters>
            <v-col cols="12" v-for="(day, key) in appointmentsDisplay" :key="`daily-appointments-list-${key}`">
              <v-card flat class="ma-0 pa-0">
                <v-card-subtitle>{{ day.displayLabel }}</v-card-subtitle>
              </v-card>
              <v-card-text class="ma-0 pa-0">
                <v-container fluid>
                  <v-row dense>
                    <v-col cols="12"
                           v-for="(mainAppointmentList, index) in day.appointments"
                           :key="`daily-appointment-info-${index}`">
                      <v-card width="100vw" flat outlined class="pt-0">
                        <v-list-item>
                          <v-avatar size="60" tile class="mt-2">
                            <img :src="mainAppointmentList.employee.profilePhotoUrl"/>
                          </v-avatar>
                          <v-list-item-content class="pl-2">
                            <v-list-item-subtitle>
                              {{ mainAppointmentList.employee.name }}
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>

                        <v-card-text class="py-1 px-2">
                          <v-container fluid class="ma-0 pa-0">
                            <v-row dense>
                              <v-col
                                  v-for="(appointment) in mainAppointmentList.appointments"
                                  :key="`appointment-details-${appointment.id}`"
                                  class="mx-0 px-1 text--white"
                              >
                                <v-alert
                                  dense
                                  text
                                  color="info"
                                  prominent
                                class="pa-0 ma-0">
                                  <v-row align="center">
                                    <v-col cols="5" class="py-1">
                                      <v-list
                                          two-line
                                      >
                                        <v-list-item>
                                          <v-list-item-content>
                                            <v-list-item-title>{{ appointment.startDisplay }} - {{ appointment.endDisplay }}</v-list-item-title>
                                            <v-list-item-subtitle>
                                              {{appointment.services[0].name}}
                                            </v-list-item-subtitle>
                                          </v-list-item-content>
                                        </v-list-item>
                                      </v-list>
                                      <v-spacer></v-spacer>
                                    </v-col>
                                    <v-col cols="7" align="right" v-if="!isCustomer">
                                      <v-btn x-small color="blue-grey darken-4" dark class="text---white mr-3 pr-3" @click="updateAppointmentStatus(appointment, 'CANCELED')" v-if="appointment.requested || appointment.confirmed">Cancel</v-btn>
                                      <v-btn x-small color="blue-grey darken-4" dark class="text---white mr-3 pr-3" @click="updateAppointmentStatus(appointment, 'CONFIRMED')" v-if="appointment.requested">Confirm</v-btn>
                                      <v-btn x-small color="blue-grey darken-4" dark class="text---white mr-3 pr-3" @click="completeAppointment(appointment)" v-if="appointment.confirmed">Complete</v-btn>
                                      <v-btn x-small color="blue-grey darken-4" dark class="text---white mr-3 pr-3" @click="deleteAppointment(appointment)" v-if="appointment.canceled || appointment.rejected">Remove</v-btn>
                                    </v-col>
                                  </v-row>
                                </v-alert>
                              </v-col>
                            </v-row>
                          </v-container>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
    <keep-alive>
      <complete-appointment-form
          :activeUser="profile"
          :dialog.sync="dialog"
          :appointment="appointmentToUpdate"
          @closeDialog="closeDialog"
      ></complete-appointment-form>
    </keep-alive>
    <v-snackbar
        top
        app
        absolute
        width="600px"
        transition="slide-y-transition"
        text
        :color="updateStatus.color"
        v-model="showUpdateStatus"
        timeout="3000"
    >{{ updateStatus.message }}
    </v-snackbar>
  </div>
</template>

<script>
import api from "@/api";
import CompleteAppointmentForm from "@/components/CompleteAppointmentForm";

import {
  addDays,
  format,
  isBefore,
  isAfter,
  isToday,
  isSameDay,
  isSunday,
  isMonday,
  parseISO,
} from 'date-fns'
let _ = require('lodash')


export default {
  name: "ProfileAppointmentsView",
  components: { CompleteAppointmentForm },
  props:{
    profile:{
      type: Object
    }
  },
  computed: {

  },
  created() {
  },
  mounted() {
    if(this.profile){
      this.initialize(this.profile)
    }
  },
  data(){
    return {

      dialog: false,
      currentUser: this.profile,
      appointmentToUpdate: {},
      appointmentsByEmployee: null,
      appointmentsDisplay: null,
      displayTitle: null,
      daysToShow: 5,
      isAdmin: null,
      isEmployee: null,
      isCustomer: null,
      mainAppointmentList: null,
      employees: null,
      primaryRole: this.profile.primaryRole,
      startDate: null,
      endDate: null,
      datesShown: null,
      updateStatus: {color: '', message: ''},
      showUpdateStatus: false,
      employeeFilter: null,
      showDatePicker: false,
      datePickerDate: null,
      initializeDate: new Date(),
      viewRange: {},


    }
  },
  methods:{
    initialize(user){
      this.isAdmin = user.primaryRole === 'Admin'
      this.isEmployee = user.primaryRole === 'Employee'
      this.isCustomer = this.profile.primaryRole === 'Customer'
      this.currentUser = user
      this.datesShown = this.getDates()
      this.startDate = this.datesShown[0]
      this.endDate = this.datesShown[this.daysToShow - 1]
      if(this.isCustomer){
        this.displayTitle="Appointments I'm Tracking"
        this.getCustomerAppointments(user)
        this.getEmployees()
      }
      if(this.isEmployee){
        this.displayTitle = "My Appointments (Next 5 days)"
        this.employeeFilter = this.currentUser.id
        this.getEmployeeAppointments()
        this.getEmployees()
      }
      if(this.isAdmin){
        this.displayTitle = "Employee Appointments (5 day Outlook)"
        this.getEmployeeAppointments()
        this.getEmployees()
      }
    },
    closeDialog() {
      this.initialize(this.profile)
      this.dialog = false
    },
    completeAppointment(appointment){
      this.appointmentToUpdate = appointment
      this.dialog = true
    },
    async deleteAppointment(appointment, key, index, i){
      let action = 'delete'
      let resource = `/appointments/${appointment.id}/delete`
      let successText = "Appointment was successfully deleted"
      let notFoundText = `Appointment with id: ${appointment.id} NOT FOUND`
      let failedText = `Appointment with id: ${appointment.id} was NOT deleted successfully`
      try{
        let response = await api.execute(action, resource)
        if(response === successText){
          this.updateStatus.color = "green"
          this.updateStatus.message = `${appointment.employee.name}'s appointment with ${appointment.customer.name} has been deleted!`
          this.showUpdateStatus = true
          this.appointmentsDisplay[key][index].splice(i, 1)
        }else if(response === notFoundText || response === failedText){
          this.updateStatus.color = "red"
          this.updateStatus.message = `${appointment.employee.name}'s appointment with ${appointment.customer.name} was NOT removed due to an error!`
          this.showUpdateStatus = true
        }
      }catch (e) {
          console.log(e)
      }
      await this.getEmployeeAppointments()

    },
    async getEmployees() {
      let resource = '/Employee/info/detailed'
      let employees = await this.getData(resource)
      let employeeList = []
      if (employees.length > 0) {
        if(this.isAdmin){
          employeeList = employees
        }else if(this.isEmployee){
          for(let employee of employees){
            if(employee.id === this.currentUser.id){
              employeeList.push(employee)
            }
          }
        }
      }
      this.employees = employeeList
    },
    async getCustomerAppointments(user){
      let action = "get"
      let resource = `/appointments/customer/${user.id}/all`
      let startDate = this.startDate
      let endDate = this.endDate
      try{
        let response = await api.execute(action, resource)
        if(response){
          let appointments = []
          for (let appointment of response) {
            let appointmentDate = new Date(appointment.start)
            let utcOffset = new Date().getTimezoneOffset() // in hours
            let offsetMillis = utcOffset * 60000
            let startTime = new Date(appointment.start).getTime()
            let endTime = new Date(appointment.end).getTime();
            if(isSameDay(appointmentDate, startDate) || isAfter(appointmentDate, startDate)) {
              if (isBefore(appointmentDate, this.endDate) || isSameDay(appointmentDate, endDate)) {
                appointment.startDisplay = format(startTime - offsetMillis, "hh:mma")
                appointment.endDisplay = format(endTime - offsetMillis, "hh:mma")
                if(this.isAdmin){
                  appointments.push(appointment)
                }else{
                  if(this.isEmployee && this.employeeFilter === appointment.employee.id){
                    appointments.push(appointment)
                  }
                }
              }
            }
          }
          this.mainAppointmentList = appointments
        }
      }catch (e) {
        console.log(e)
      }
    },
    async getEmployeeAppointments(){
      let action = 'get'
      let resource = `/appointments/Employee/all`
      let startDate = this.startDate
      let endDate = this.endDate
      try{
        let response = await api.execute(action, resource)
        if(response){
          let appointments = []
          for (let appointment of response) {
            let appointmentDate = new Date(appointment.start)
            let utcOffset = new Date().getTimezoneOffset() // in hours
            let offsetMillis = utcOffset * 60000
            let startTime = new Date(appointment.start).getTime()
            let endTime = new Date(appointment.end).getTime();
            if(isSameDay(appointmentDate, startDate) || isAfter(appointmentDate, startDate)) {
              if (isBefore(appointmentDate, endDate) || isSameDay(appointmentDate, endDate)) {
                appointment.startDisplay = format(startTime - offsetMillis, "hh:mma")
                appointment.endDisplay = format(endTime - offsetMillis, "hh:mma")
                if(this.isAdmin){
                  appointments.push(appointment)
                }else{
                  if(this.isEmployee && this.employeeFilter === appointment.employee.id){
                    appointments.push(appointment)
                  }
                }
              }
            }
          }
          this.mainAppointmentList = appointments
        }
      }catch (e) {
        console.log(e)
      }
    },
    getCurrentUser(){
      return this.profile
    },
    getDates(){
      let dates = []
      let startDate = this.initializeDate
      while(isSunday(startDate) || isMonday(startDate)){
        startDate = addDays(startDate, 1)
      }
      dates.push(startDate)
      for(let i = 0; dates.length < this.daysToShow; i++){
        let nextDate = addDays(startDate, i+1)
        if(!isSunday(nextDate) && !isMonday(nextDate)){
          dates.push(nextDate)
        }
      }
      return dates
    },
    getEndDate(){
      return addDays(this.startDate, this.daysToShow)
    },
    async updateAppointmentStatus(appointment, status){
      let action = 'post'
      let resource = `/appointments/${appointment.id}/update/status`
      let user = this.getCurrentUser()
      if(user){
        let id = user.id
        let data = JSON.stringify({userId: id, appointmentStatus: status.toUpperCase()})
        try{
          let response = await api.execute(action, resource, data)
          if(response){
            if(response.id === appointment.id){
              appointment.status = response.status
              appointment = response
              await this.getEmployeeAppointments()
            }
          }
        }catch (e) {
          console.log(e)
        }
      }
    },
    sortByDay(){
      let appointmentsByDate = []
      for(let date of this.datesShown){
        let dayLabel = ''
        let dailyAppointments = []
        if(isToday(date)){
          dayLabel = "Today"
        }else{
          dayLabel = format(parseISO(new Date(date).toISOString()), 'EEE MMMM do' )
        }
        for(let appointment of this.mainAppointmentList){
          if(isSameDay(parseISO(appointment.start), date)){
            dailyAppointments.push(appointment)
          }
        }
        let sortedByEmployee = this.sortByEmployee(dailyAppointments)
        appointmentsByDate.push({"displayLabel": dayLabel, "appointments": sortedByEmployee })
      }
      this.appointmentsDisplay = appointmentsByDate
    },
    sortByEmployee(appointments){
      let sortedEmployeeAppts = []
      for (let employee of this.employees){
        let mainAppointmentList = []
        let employeeId = employee.id
        for(let appointment of appointments){
          if(appointment.employee.id === employeeId){
            mainAppointmentList.push(appointment)
          }
        }

        sortedEmployeeAppts.push({employee: employee, appointments: mainAppointmentList})
      }

      return sortedEmployeeAppts
    },


    // General helper function to avoid DRY
    getData: async function (resource) {
      let action = "get"
      try {
        let response = await api.execute(action, resource);
        if (response) {
          let sortedResponse = _.orderBy(response, ["id"], ["asc"]);
          return sortedResponse
        }
      } catch (e) {
        console.log(e)
      }
    },
  },
  watch:{
    daysToShow(newVal, oldVal){
      if(newVal !== oldVal){
        this.datesShown = this.getDates()
      }
    },
    mainAppointmentList(newVal){
      if(newVal){
        this.sortByDay()
      }
    },
  }
}
</script>

<style scoped>
.no-overflow {
  overflow: hidden !important;
  overflow-y: auto !important;
}

</style>