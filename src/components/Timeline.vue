<template>
  <v-card
    :elevation="0"
    class="mx-auto pb-1"
    tile
    :width="(wrapped ? '16.25vw' : '19.75vw')"
    height="85vh"
    @click="toggleActive()"
  >
    <v-card-title class="justify-center" >
      {{ dayOfWeek }}
    </v-card-title>
    <v-card-subtitle class="text-center" >
      {{ dayOfMonth }}
    </v-card-subtitle>
    <v-card
      flat
      style="overflow-x:hidden !important; overflow-y: auto; height: 93%;"
      width="20vw"
      class="mx-0 pb-0"
    >
      <v-card-text v-if="(events.length === 0 && loading)" class="text-center text-subtitle-2 pt-10">
        Loading Agenda...
      </v-card-text>
      <v-card-text v-else-if="events.length && !loading" class="text-truncate">
        <v-timeline
            dense
            height="90%"
            class="mr-xl-1 mr-sm-1 pb-10" >
            <div
                v-for="(event, i) in events"
                :key="`agenda-event-${position}-${i}`"
                class="scroll"
            >

                <v-timeline-item
                    class="mb-0"
                    small
                    right
                >
                  <template v-slot:icon>
                    <v-avatar v-if="event.employeePhoto">
                      <img :src="event.employeePhoto" />
                    </v-avatar>
                  </template>
                  <v-card class="elevation-6">
                      <v-list-item three-line>
                        <v-list-item-content>
                          <div class="overline mb-2">
                            {{ event.startDisplay }} - {{ event.endDisplay }}
                          </div>
                          <v-list-item-title class="text-lg-caption text-xl-subtitle-2 text-truncate">
                            {{ event.name }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="caption" v-if="isAdmin || isEmployee">
                            {{ event.customer.name }}
                          </v-list-item-subtitle>
                          <v-list-item-subtitle v-else-if="event.customer.name">
                            {{ event.customer.name  }}
                          </v-list-item-subtitle>
                          <v-list-item-subtitle v-else>
                            RESERVED
                          </v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                    <v-card-actions align="space-between" class="text-center" v-if="!event.complete">
                    <v-row align="center" justify="center">
                      <v-btn v-if="(isAdmin || isEmployee) && (event.canceled)"
                             x-small color="blue-grey darken-4" dark elevation="3"
                             :class="$vuetify.breakpoint.xl ? 'ma-1 white--text' : 'mx-1 px-1'"
                             @click="deleteAppointment(event)"
                      >
                        Remove
                        <v-icon
                            class="px-1"
                            dark
                            x-small
                            right
                        >mdi-check-bold</v-icon>
                      </v-btn>

                        <v-btn v-if="(isAdmin || isEmployee) && (!event.canceled && !event.requested && !event.completed)"
                               x-small color="blue-grey darken-4" dark elevation="3"
                               :icon="$vuetify.breakpoint.lgAndDown"
                               :class="$vuetify.breakpoint.xl ? 'ma-1 white--text' : 'mx-1 px-1'"
                               @click="completeAppointment(event)"
                        >{{ $vuetify.breakpoint.xl ? 'Complete' : '' }}
                          <v-icon
                              class="px-1"
                              dark
                              x-small
                              :align="$vuetify.breakpoint.xl ? 'right' : 'center'"
                          >mdi-clock-check-outline</v-icon>
                        </v-btn>

                        <v-btn v-if="event.canCancel && (!event.canceled || event.status === 'CANCELED')"
                               x-small color="blue-grey darken-4" dark red elevation="3"
                               :icon="$vuetify.breakpoint.lgAndDown"
                               :class="$vuetify.breakpoint.xl ? 'ma-1 white--text' : 'mx-1 px-1'"
                               @click="updateAppointmentStatus(event, 'canceled')">{{ $vuetify.breakpoint.xl ? 'Cancel' : ''}}
                          <v-icon
                              class="px-1"
                              dark
                              x-small
                              :align="$vuetify.breakpoint.xl ? 'right' : 'center'"
                          >mdi-cancel</v-icon>
                        </v-btn>
                        <v-btn v-if="event.toApprove"
                               x-small color="blue-grey darken-4" dark green elevation="3"
                               :icon="$vuetify.breakpoint.lgAndDown"
                               :class="$vuetify.breakpoint.xl ? 'ma-1 white--text' : 'mx-1 px-1'"
                               @click="updateAppointmentStatus(event, 'confirmed')">{{ ($vuetify.breakpoint.xl ? 'Accept' : '') }}
                          <v-icon
                              class="px-1"
                              dark x-small
                              :align="$vuetify.breakpoint.xl ? 'right' : 'center'"
                          >mdi-checkbox-marked-circle</v-icon>
                        </v-btn>
                      </v-row>
                  </v-card-actions>
                </v-card>
              </v-timeline-item>
            </div>
        </v-timeline>
      </v-card-text>
      <v-card-text v-if="!events.length && !loading" class="text-center text-subtitle-2 pt-10">
        <div>No appointments scheduled today!</div>
      </v-card-text>
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
    <keep-alive>
      <complete-appointment-form
          :activeUser="activeUser"
          :dialog.sync="dialog"
          :date="timelineDate"
          :appointment="appointmentToUpdate"
          @closeDialog="closeDialog"
      ></complete-appointment-form>
    </keep-alive>
  </v-card>
</template>

<script>
import CompleteAppointmentForm from "@/components/CompleteAppointmentForm";
import {format, parseISO, addDays} from "date-fns";
import { mapState } from "vuex";
import api from "@/api";

export default {
  name: "Timeline",
  components: { CompleteAppointmentForm },
  props: ["services", "activeUser", "date", "agenda", "position", "isWrapped"],
  created() {
    this.loading = true
    this.initialize();
    this.timelineDate = this.date;
  },
  computed: {
    ...mapState(["user", "clUser", "primaryRole"]),
    computedDateFormatted() {
      return this.date
          ? format(parseISO(this.date).getTime(), "MM/dd/yyyy")
          : "";
    },
    getCurrentUser(){
      return this.$store.state.clUser
    },
    wrapped(){ return this.isWrapped }
  },
  data() {
    return {

      currentUser: null,
      active: false,
      appointmentToUpdate: null,
      events: [],
      selectedEmployee: null,
      shortestServiceDuration: null,
      workDays: ["Tues", "Wed", "Thu", "Fri", "Sat"],
      staffColors: ["blue", "red"],
      dialog: false,
      timelineAgenda: "",
      refresh: false,
      update: null,
      dayOfWeek: null,
      dayOfMonth: null,
      timelineDate: null,
      isAdmin: false,
      isEmployee: false,
      loading: true,
      showDeleteConfirm: false,
      updateStatus: {color: '', message: ''},
      showUpdateStatus: false,
    }
  },
  methods: {
    closeDialog(appointment) {
      if(appointment){
        this.events[this.events.indexOf(appointment)] = appointment
      }
      this.dialog = false;
      this.$emit('refresh', this.timelineDate)
    },
    completeAppointment(appointment){
      this.appointmentToUpdate = appointment
      this.dialog = true

    },
    async updateAppointmentStatus(appointment, status){
      let updateIndex = this.events.indexOf(appointment)
      let action = 'post'
      let resource = `/appointments/${appointment.id}/update/status`
      let id = this.getCurrentUser.id
      let data = JSON.stringify({userId: id, appointmentStatus: status.toUpperCase()})
      try{
        let response = await api.execute(action, resource, data)
        if(response){
          if(response.id === appointment.id){
            this.events[updateIndex] = response
            this.$emit('refresh', true)
          }
        }
      }catch (e) {
        console.log(e)
      }
    },
    async deleteAppointment(appointment){
      this.appointmentToUpdate = appointment
      let action = 'delete'
      let updateIndex = this.events.indexOf(appointment)
      let resource = `/appointments/${appointment.id}/delete`
      try{
        let response = await api.execute(action, resource)
        if(response){
          this.updateStatus.color = "green"
          this.updateStatus.message = `${appointment.employee.name}'s appointment with ${appointment.customer.name} has been deleted!`
          this.showUpdateStatus = true
          this.events.splice(updateIndex, 1)
        }
      }catch (e) {
        this.updateStatus.color = "red"
        this.updateStatus.message = `${appointment.employee.name}'s appointment with ${appointment.customer.name} was NOT removed due to an error!`
        this.showUpdateStatus = true
      }
      this.$emit('refresh', true)

    },
    getDayOfMonth() {
      let dom;
      if (this.timelineDate) {
        dom = format(this.timelineDate, "d")
      }
      return dom;
    },
    getDayOfWeek() {
      let dow;
      if (this.timelineDate) {
        dow = format(this.timelineDate, "ccc");
      }
      return dow;
    },
    getColorByStaffId(id) {
      return this.staffColors[id];
    },
    getFormattedDate(date){
      if(date){
        return format(addDays(date, 2), "yyyy-MM-dd")
      }
    },
    async initialize() {
      this.loading = true
      let shortest = 480;
      this.shortestServiceDuration = shortest
      this.timelineDate = this.date
      this.dayOfMonth = this.getDayOfMonth(this.date)
      this.dayOfWeek = this.getDayOfWeek(this.date)
      this.currentUser = this.getCurrentUser;
      this.mapAgenda(this.timelineAgenda)
    },
    mapAgenda(list) {
      let newList = []
      if (list) {
        list.forEach(item => {
          let utcOffset = new Date().getTimezoneOffset() // in hours
          let offsetMillis = utcOffset * 60000
          let startTime = new Date(item.start).getTime()
          let endTime = new Date(item.end).getTime();
          item.canCancel = this.canCancel(item)
          item.toApprove = item.requested && (this.isAdmin || this.activeUser.id === item.employee.id)
          item.startDisplay = format(startTime - offsetMillis, "h:mmaa")
          item.endDisplay = format(endTime - offsetMillis, "h:mmaa")
          item.name = item.services.name
          newList.push(item);
        });
      }
      this.events = newList;
      this.loading = false;

    },
    canCancel(item){
      let user = this.getCurrentUser
      let canCancel = false
      if((this.isAdmin || this.isEmployee)){
        canCancel = true
      } else {
        let customerAccounts = []
        let linkedAccounts = user.linkedAccounts
        if(linkedAccounts.length > 0){
          for(let account of linkedAccounts){
            customerAccounts.push(account.id)
          }
          customerAccounts.push(user.id)
        }
        let accountIndex = customerAccounts.indexOf(item.customer.id)
        if(accountIndex !== - 1){
          if(accountIndex === customerAccounts.length -1){
            item.customer = user
          }else{
            item.customer = user.linkedAccounts[accountIndex]
          }
          canCancel = true
        }
      }
      if(canCancel){
        if(item.status === 'CANCELED' || item.status === "COMPLETED" || item.canceled || item.completed){
          canCancel = false
        }
      }
      return canCancel
    },
    toggleActive() {
      this.active = !this.active;
    },
    isActive() {
      this.$emit("update-selected", this.timelineDate);
    }
  },
  mounted() {
    this.loading = true
    if(this.activeUser || this.clUser){
      this.currentUser = this.getCurrentUser
    }

  },
  watch: {
    active() {
      this.isActive();
    },
    primaryRole(newVal){
      if(newVal){
        this.isAdmin = newVal === 'Admin'
        this.isEmployee = newVal === 'Employee'
      }
    },
    agenda(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.timelineAgenda = this.agenda;
        this.loading = true
        this.mapAgenda(this.timelineAgenda);
      }
    },
    currentUser(newVal) {
      if (newVal && newVal.primaryRole) {
        this.isAdmin = newVal.primaryRole === "Admin";
        this.isEmployee = newVal.primaryRole === "Employee";
      }
    },
    date(newVal) {
      this.timelineDate = newVal;
      this.initialize();
    },
    services(newVal){
      console.log(newVal)
    }
  }
};
</script>

<style scoped>

</style>
