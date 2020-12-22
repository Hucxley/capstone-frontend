<template>
  <div>
    <v-toolbar fluid tile flat>
      <v-toolbar-title>Random Appointment Generator</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-select
            v-model="startMonth"
            label="Select Start Month"
            :items="months"
            item-text="name"
            item-value="value"
            return-object
            single-line
            class="px-2"
        ></v-select>
        <v-select
            v-model="endMonth"
            label="Select End Month"
            :items="months"
            item-text="name"
            item-value="value"
            return-object
            single-line
        ></v-select>
      </v-toolbar-items>
    </v-toolbar>
    <v-card height="80vh" class="mx-0 px-0" width="100vw" flat>
      <v-row align="center" justify="center">
        <v-col v-for="i in 5" :key="`col-${i}`">
          <v-card width="15.3vw">
            <v-card-text class="text-center">
              <v-btn dark large @click="generateAppointments(i * 5)">{{ i*5 }} Appointments</v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
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
        timeout="3000"
    >{{ updateStatus.message }}
    </v-snackbar>
  </div>

</template>

<script>
import api from "@/api";
import { getDaysInMonth, isSunday, isMonday, parseISO, format } from 'date-fns'

let _ = require('lodash')

export default {
  name: "AppointmentGenerator",
  computed: {

  },
  created() {


  },
  mounted() {
    this.months = this.getMonths()
  },
  data(){
    return {
      services: this.getServices(),
      employees: this.getEmployees(),
      customers: this.getCustomers(),
      servicesReady: false,
      employeesReady: false,
      customersReady: false,
      allReady: false,
      months: [],
      startMonth: null,
      endMonth: null,
      showUpdateStatus: false,
      updateStatus: {"color": "success", message: "Appointments Added!"},
    }
  },
  methods:{
    isAllReady(){
      return this.allReady
    },
    getMonths(){
      let months = [
        {name: 'January', value: 0},
        {name: 'February', value: 1},
        {name: 'March', value: 2},
        {name: 'April', value: 3},
        {name: 'May', value: 4},
        {name: 'June', value: 5},
        {name: 'July', value: 6},
        {name: 'August', value: 7},
        {name: 'September', value: 8},
        {name: 'October', value: 9},
        {name: 'November', value: 10},
        {name: 'December', value: 11},
      ]
      return months
    },
    async generateAppointments(n){
      if(this.isAllReady()){
        console.log(`Generating ${n} appointments`)
        let appointments = []
        while(appointments.length < n){
          let appointment = this.createRandomAppointment()
          let randomEmployeeId = this.employees[this.getRandom(0, this.employees.length - 1)].id
          let randomCustomerId = this.customers[this.getRandom(0, this.customers.length - 1)].id
          let randomService = {id: this.services[this.getRandom(0, this.services.length - 1)].id}
          appointment.customer.id = randomCustomerId
          appointment.employee.id = randomEmployeeId
          appointment.services = [randomService]
          console.log(appointment)
          if(!isSunday(appointment.start) && !isMonday(appointment.start)){
            let savedAppointment = await this.saveAppointment(appointment)
            if(!savedAppointment.id){
              console.log(appointment)
            }else if(savedAppointment.id){
              appointments.push(savedAppointment)
            }
          }
        }
        let startMonth = ''
        let endMonth = ''
        let year = ''
        if(!this.startMonth && !this.endMonth){
          startMonth = format(parseISO(new Date(appointments[0].start).toISOString()), "LLLL")
          year = format(parseISO(new Date(appointments[0].start).toISOString()), "yyyy")

          this.updateStatus.message = `${n} Appointments Added beginning in ${startMonth} ${year}`
        }else{
          startMonth = this.startMonth.name
          year = format(parseISO(new Date(appointments[0].start).toISOString()), "yyyy")
          endMonth = this.endMonth.name
          this.updateStatus.message = `${n} Appointments Added from ${startMonth} to ${endMonth}`
        }

        this.showUpdateStatus = true
      }
    },
    async getServices(){
      let resource = '/services'
      let services = await this.getData(resource)
      if(services.length > 0){
        this.services = services
      }
    },
    async getEmployees(){
      let resource = '/Employee/info/detailed'
      let employees = await this.getData(resource)
      if(employees.length > 0){
        this.employees = employees
      }
    },
    async getCustomers(){
      let resource = "/Customer/info/detailed"
      let customers = await this.getData(resource)
      if(customers.length > 0){
        this.customers = customers
      }

    },
    async saveAppointment(appointment){
      let action = "POST"
      let resource = "/appointments/create"
      let data = appointment
      return api.execute(action, resource, data)
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
    getEmptyAppointment(){
      return {"start": null, "services": [{"id": null}], "employee": {"id": null}, "customer": {"id": null,}}
    },
    createRandomAppointment(){
      let year = 2020
      let appointment = this.getEmptyAppointment()
      let startMonth = this.startMonth ? this.startMonth.value : 11
      let endMonth = this.endMonth ? this.endMonth.value : 11
      let month = this.getRandom(startMonth, endMonth)
      if(month > 10){
        year = 2020
      }else{
        year = 2021
      }
      let day = this.getRandom(1, getDaysInMonth(new Date(year, month)))
      let hour = this.getRandom(9, 16)
      let minute = this.getRandom(0, 59)
      let randomDate = new Date(year, month, day, hour, minute)

      let appointmentTime = randomDate.getTime()
      appointment.start = appointmentTime
      return appointment
    },
    getRandom(min, max){ //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max-min +1) + min)
    },
  },

  watch:{
    services(newVal){
      if(newVal && newVal.length){
        this.servicesReady = true
        if(this.employeesReady && this.customersReady){
          this.allReady = true
        }
      }
    },
    employees(newVal) {
      if (newVal && newVal.length){
        this.employeesReady = true
        if(this.servicesReady && this.customersReady){
          this.allReady = true
        }
      }
    },
    customers(newVal){
      if(newVal && newVal.length){
        this.customersReady = true
        if(this.employeesReady && this.servicesReady){
          this.allReady = true
        }
      }
    },
  }
};
</script>

<style scoped></style>
