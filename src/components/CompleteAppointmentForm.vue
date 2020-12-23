<template>
  <v-dialog
      :value="dialog"
      @input="$emit('update:dialog', false)"
      persistent
      max-width="600px"
  >
    <v-card>
      <v-card-title>
        <span class="headline">{{ service.name }} Closeout</span>
      </v-card-title>
      <v-card-subtitle class="my-0 py-0">
        <strong>{{ customer.name }}</strong>
      </v-card-subtitle>
      <v-card-text class="my-0 py-0">
        <v-container class="px-0 mx-0">
          <v-row align="center">
            <v-col cols="12">
              {{ service.description }}
            </v-col>
            <v-col cols="9">
              <span><strong>{{ startDisplay }} - {{ endDisplay }}</strong></span>
            </v-col>
            <v-col cols="3">
              <v-text-field
                  label="Total Price*"
                  prepend-icon="mdi-currency-usd"
                  v-model="totalPrice"
                  required
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <small>*indicates required field</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            color="blue darken-1"
            text
            @click="close()"
        >
          Close
        </v-btn>
        <v-btn
            v-if="!updateSuccessful"
            color="blue darken-1"
            text
            @click="saveAppointment()"
        >
          Save
        </v-btn>
      </v-card-actions>
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
  </v-dialog>
</template>

<script>
import api from "@/api";

export default {
  name: "CompleteAppointmentForm",
  props:{
    appointment: {
      type: Object
    },
    dialog: {
      type: Boolean
    }
  },
  mounted() {

  },
  data(){
    return {

      totalPrice: 0.00,
      showUpdateStatus: false,
      updateStatus: {"color": '', "message": ''},
      updateSuccessful: false,
      service: {},
      customer: {},
      employee: {},
      updatedAppointment: {},
      startDisplay: '',
      endDisplay: '',

    }
  },
  methods:{
    initialize(){
      this.employee = this.appointment.employee
      this.customer = this.appointment.customer
      this.service = this.appointment.services
      this.startDisplay = this.appointment.startDisplay
      this.endDisplay = this.appointment.endDisplay
      if(this.service.fixedPrice){
        this.totalPrice = this.service.fixedPrice
      }else{
        this.totalPrice = 0.00
      }

    },
    async saveAppointment(){
      if(!this.totalPrice > 0){
        this.updateStatus.color = "error"
        this.updateStatus.message = "Appointment Closeout requires a Total Price to be entered."
        this.showUpdateStatus = true
      }else{
        let appointmentToUpdate = this.appointment
        appointmentToUpdate.totalPrice = this.totalPrice
        appointmentToUpdate.status = 'COMPLETED'
        let action = "POST"
        try{
          let resource = `/appointments/${appointmentToUpdate.id}`
          let data = appointmentToUpdate
          let response = await api.execute(action, resource, data)
          if(response && response.completed && response.totalPrice == this.totalPrice){
            this.updateStatus.color = "success"
            this.updateStatus.message = "Appointment Closeout Complete. Remember to reschedule another visit!"
            this.showUpdateStatus = true
            this.updateSuccessful = true
            this.updatedAppointment = response
          }
        }catch (e) {
          this.updateStatus.color = "error"
          this.updateStatus.message = "Appointment Closeout Error. Please report this to an administrator."
          this.showUpdateStatus = true
          this.updatedAppointment = this.appointment
        }
      }


    },
    close(){
      this.$emit('closeDialog', this.updatedAppointment)
    }
  },
  watch:{
    appointment(newVal){
      if(newVal){
        this.initialize()
      }
    }
  }
}
</script>

<style scoped>

</style>