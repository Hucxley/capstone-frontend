<template>
  <v-container fluid class="content-container">
    <v-row class="max-vertical d-lg-inline-flex flex-lg-nowrap" no-gutters>
      <v-col v-for="i in 5" :key="`timeline-col-${i}`" class="mx-0">
        <timeline
          :services="services"
          :isWrapped="wrapped"
          :activeUser="activeUser"
          :date="displayDateRange[i - 1]"
          :agenda="displayedEvents[i - 1]"
          :position="i - 1"
          @refresh="refreshView"
          @update-selected="updateSelectedDate"
        ></timeline>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Timeline from "@/components/Timeline.vue";
import { addDays, isSunday, isMonday, isSameDay, isValid } from "date-fns";
import api from "@/api";
import { mapState } from "vuex";

export default {
  name: "Calendar",
  components: {
    Timeline
  },
  props: ["refresh", "range", "employee", "services", "activeUser","isWrapped"],
  computed: {
    ...mapState(["user", "clUser", "primaryRole"]),
    wrapped(){ return this.isWrapped }
  },
  created() {
    this.dateRange = this.range;
    this.startDate = this.range.startDate;
  },
  data() {
    return {

      displayedEvents: [],
      startDate: null,
      endDate: null,
      events: [],
      displayDateRange: [],
      selectedDate: false,
      userRole: this.$store.state.primaryRole ? this.$store.state.primaryRole : null,
      displayDateRangeReady: false,
      activeUserReady: false,
      userRoleReady: false,

    };
  },
  methods: {
    async getAppointments() {
      let primaryRole = this.userRole
      if (primaryRole && this.displayDateRangeReady) {
        let appointments = []
        let action = "get"
        primaryRole = primaryRole.toLowerCase()
        let resource = `/appointments/${primaryRole}/all`;
        let response = await api.execute(action, resource);
        if (response) {
          for (const date of this.displayDateRange) {
            let timelineDate = new Date(date);
            let dailyEvents = [];
            for (const item of response) {
              if (item) {
                let services
                if(!item.services.id){
                  services = item.services[0]
                }else{
                  services = item.services
                }
                let itemDate = new Date(item.start);
                if (isSameDay(timelineDate, itemDate)) {
                  if (primaryRole !== 'Admin' || primaryRole !== 'Employee') {
                    let customerServices = {
                      "name": services.name,
                      "fixedPrice": services.fixedPrice,
                      "description": services.description
                    }
                    item.services = customerServices
                  }
                  item.services = services
                  item.employeePhoto = item.employee.profilePhotoUrl
                      ? item.employee.profilePhotoUrl
                      : null;
                  dailyEvents.push(item);
                }
              }
            }
            appointments.push(dailyEvents);
          }
        }
        this.events = appointments
        this.displayedEvents = appointments;
        this.displayDateRangeReady = false
      }
      this.$forceUpdate()
    },
    filterByEmployeeId(id) {
      let filteredDisplay = [];
      let filteredEvents = this.events;
      for (const group of filteredEvents) {
        let filteredGroup = group.filter(item => {
          return item.employee.id === id;
        });
        filteredDisplay.push(filteredGroup);
      }
      this.displayedEvents = filteredDisplay;
    },
    setDisplayRange(date) {
      let displayDates = [];
      this.displayDateRange = [];
      for (let i = 0; i < 7; i++) {
        let newDate = addDays(date, i);
        if (isValid(newDate) && !isSunday(newDate) && !isMonday(newDate)) {
          displayDates.push(newDate);
        }
      }
      if (displayDates.length) {
        this.displayDateRange = displayDates;
      }
    },
    refreshView(){
      this.displayDateRangeReady = true
    },
    updateSelectedDate(date) {
      if (date && date !== this.selectedDate) {
        this.selectedDate = date
        this.$emit("update-selected", this.selectedDate);
      }
    }
  },
  mounted() {},
  watch: {
    activeUser(newVal) {
      if (newVal && newVal.primaryRole) {
        this.userRole = newVal.primaryRole
      }
    },
    employee(newVal) {
      if (!newVal) {
        this.displayedEvents = this.events;
      } else {
        this.filterByEmployeeId(newVal.id);
      }
    },
    displayDateRange(newVal) {
      if (newVal && newVal.length) {
        this.displayDateRangeReady = true;
      }
    },
    primaryRole(newVal) {
      if (newVal) {
        this.userRole = newVal;
      }
    },
    startDate(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.setDisplayRange(newVal);
      }
    },
    range(newVal) {
      if (newVal && newVal.startDate && newVal.endDate) {
        this.startDate = newVal.startDate;
        this.endDate = newVal.endDate;
      }
    },
    refresh(newVal) {
      if (newVal) {
        this.displayDateRangeReady = true
        this.getAppointments();
      }
    },
    userRole(newVal){
      if(newVal){
        this.userRoleReady = true
      }
    },
    displayDateRangeReady(newVal) {
      if (newVal) {
        if(newVal && this.userRoleReady){
          this.getAppointments()
        }
      }
    },
    userRoleReady(newVal){
      if(newVal && this.displayDateRangeReady){
          this.getAppointments()
      }
    }
  }
};
</script>

<style scoped>
.content-container {
  height: 94vh;
}

.max-vertical {
  height: 90%;
}
</style>
