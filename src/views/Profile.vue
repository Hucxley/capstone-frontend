<template>
  <v-container class="content-container" fluid>
    <v-row>
      <v-col cols="3" xl="2">
        <v-card elevation="6" :height="$vuetify.breakpoint.xlOnly ? '90vh' : '87vh'" tile class="align-content-stretch profile-card mb-10 pb-5">
          <div class="text-center py-4">
            <v-avatar size="150" :class="profile === selectedProfile ? 'elevation-16' : 'elevation-0'" >
              <img :src="`${profile.profilePhotoUrl}`" />
            </v-avatar>
          </div>
          <v-divider></v-divider>
          <v-list justify="center">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title" align="center">
                  {{ profile.name }}
                </v-list-item-title>
                <v-list-item-subtitle align="center">
                  <v-btn class="ma-2"
                         text
                         color="blue-grey darken-2"
                         @click.stop="editProfile(profile)"
                  >
                    Edit Profile
                    <v-icon right class="pa-3" color="blue-grey darken-2">mdi-pencil</v-icon>
                  </v-btn>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-list :height="$vuetify.breakpoint.xlOnly ? '77vh' : '68vh'" class="scroll pb-16">
            <v-list-item>
              <v-list-item-icon>
                <v-icon>mdi-phone</v-icon>
              </v-list-item-icon>
              <v-list-item-title ><a :href="`tel:${profile.phoneNumber}`">{{ profile.phoneNumber }}</a> </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-icon>
                <v-icon>mdi-email</v-icon>
              </v-list-item-icon>
              <v-list-item-title><a :href="`mailto:${profile.emailAddress}`">{{ profile.emailAddress }}</a></v-list-item-title>
            </v-list-item>

            <v-list-group
              :value="true"
              no-action
              prepend-icon="mdi-account-supervisor-circle"
            >
              <template v-slot:activator>
                <v-list-item-title>Linked Accounts</v-list-item-title>
              </template>

              <v-list-group
                v-if="linkedAccounts.length"
                :value="true"
                no-action
                sub-group
              >
                <template v-slot:activator>
                  <v-list-item-content>
                    <v-list-item-title>Accounts</v-list-item-title>
                  </v-list-item-content>
                </template>
                <v-list-item
                  v-for="(account, i) in linkedAccounts"
                  :key="i"
                  link
                  :input-value="isSelectedLinkedAcct(account.name)"
                  @click="selectProfile(account)"
                >
                  <v-list-item-title v-text="account.name"></v-list-item-title>
                  <v-scroll-y-transition>
                    <v-list-item-icon v-if="isSelectedLinkedAcct(account.name)">
                      <v-icon color="blue-grey darken-4"
                      >mdi-account-supervisor</v-icon
                      >
                    </v-list-item-icon>

                    <v-list-item-icon v-else>
                      <v-icon color="blue-grey darken-4"
                      >mdi-account-supervisor-outline</v-icon
                      >
                    </v-list-item-icon>
                  </v-scroll-y-transition>
                </v-list-item>

              </v-list-group>

              <v-list-group :value="true" no-action sub-group class="pb-16">
                <template v-slot:activator>
                  <v-list-item-content>
                    <v-list-item-title>Actions</v-list-item-title>
                  </v-list-item-content>
                </template>
                <v-list-item link @click="addUser">
                  <v-list-item-title>Add</v-list-item-title>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon color="blue-grey darken-4">mdi-plus</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
                <v-list-item link @click="editProfile(selectedProfile)">
                  <v-list-item-title>Update</v-list-item-title>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon color="blue-grey darken-4">mdi-update</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
                <v-list-item link @click="deleteUser(selectedProfile)">
                  <v-list-item-title>Delete</v-list-item-title>
                  <v-list-item-action>
                    <v-btn icon>
                      <v-icon color="blue-grey darken-4">mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list-group>
            </v-list-group>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="9" xl="10">
        <v-container class="mx-0 px-0 py-0" fluid>
          <v-card elevation="6" :height="$vuetify.breakpoint.xlOnly ? '90vh' : '87vh'">
            <admin-panel @updateActiveUserSubPanel="updateActiveUserSubPanel" :active-panel="activeUserSubPanel" v-if="userPanel === 'Admin'"></admin-panel>
            <employee-panel @updateActiveUserSubPanel="updateActiveUserSubPanel" :active-panel="activeUserSubPanel" v-if="userPanel === 'Employee'"></employee-panel>
            <customer-panel @updateActiveUserSubPanel="updateActiveUserSubPanel" :active-panel="activeUserSubPanel" v-if="userPanel === 'Customer'"></customer-panel>
            <register-linked
              v-if="userPanel === 'CreateLinked'"
              :parent-profile="profile"
              @closeDialog="closeDialog"
            ></register-linked>
          </v-card>
        </v-container>
      </v-col>
    </v-row>
    <v-row align="center">
      <keep-alive>
        <edit-user-form :dialog.sync="editFormActive" :edited-user="selectedProfile" :dialog-delete="showDeleteDialog" :user-is-admin="userIsAdmin" @closeEditForm="closeEditForm"></edit-user-form>
      </keep-alive>
    </v-row>
  </v-container>
</template>

<script>
import api from "@/api";
import AdminPanel from "@/components/AdminPanel";
import RegisterLinked from "@/components/CreateLinkedAccount";
import EditUserForm from "@/components/EditUserForm";
import { mapState } from 'vuex'
import EmployeePanel from "@/components/EmployeePanel";
import CustomerPanel from "@/components/CustomerPanel";

export default {
  components: {EditUserForm, AdminPanel, RegisterLinked, EmployeePanel, CustomerPanel },
  computed: {
    ...mapState(["user", "clUser", "primaryRole"]),
    currentUser() {
      return this.clUser;
    },
    userIsAdmin() {
      if (this.$store.state) {
        return this.$store.state.primaryRole === "Admin" || this.$store.state.primaryRole === 'Employee';
      }
      return false;
    },
  },
  created() {
  },
  data: function() {
    return {

      activeUserSubPanel: null,
      userId: this.$route.params.id,
      profile: {},
      linkedAccounts: [],
      selectedProfile: {},
      dialog: false,
      userPanel: false,
      previousPanel: null,
      editFormActive: false,
      showDeleteDialog: false,

    };
  },
  methods: {
    closeDialog(profile){
      if(profile){
        this.linkedAccounts.push(profile)
        this.selectedProfile = profile
        this.userPanel = this.previousPanel

      }else{
        this.userPanel = this.previousPanel
      }
      this.dialog = false
    },
    closeEditForm(editedProfile){
      if(editedProfile){
        this.editFormActive = false
      }else{
        this.selectedProfile = {}
        this.editFormActive = false
      }
    },
    editProfile(profile){
      profile.firstName = profile.name.split(" ")[0];
      profile.lastName = profile.name.split(" ")[1];
      this.selectedProfile = profile
      this.editFormActive = true
    },
    getParentAccount(id) {
      let vm = this;
      let resourceUrl = `/user/${id}`
      try{
        api
            .execute("get", resourceUrl)
            .then(response => {
              if (response && response.linkedAccounts) {
                vm.linkedAccounts = response.linkedAccounts;
              }
            })
            .catch(error => {
              console.log(error);
            });
      } catch (e) {
        console.log(e)
      }

    },
    getRandomColor() {
      let baseColor = [
        "red",
        "purple",
        "indigo",
        "blue",
        "cyan",
        "green",
        "amber",
        "blue-grey"
      ];
      let modifier = ["lighten", "darken"];
      let range = ["1", "2", "3", "4"];
      let selectedBase =
        baseColor[Math.floor(Math.random() * baseColor.length)];
      let selectedModifier =
        modifier[Math.floor(Math.random() * modifier.length)];
      let selectedRange = range[Math.floor(Math.random() * range.length)];
      let colorSelected =
        selectedBase + " " + selectedModifier + "-" + selectedRange;
      return colorSelected;
    },
    async initialize(){
      try {
        let response = await api.execute(
            "get",
            `/user/${this.$route.params.id}/details`
        );
        if (response) {
          this.profile = response;
          this.userPanel = response.primaryRole;
        }
      } catch (e) {
        this.$log.debug(e);
      }
    },
    isSelectedLinkedAcct(name){
      return this.selectedProfile.name === name
    },
    selectProfile(profile) {
      if(profile === this.selectedProfile){
        this.selectedProfile = this.profile
      }else{
        this.selectedProfile = profile;
      }
    },
    addUser() {
      this.userPanel = "CreateLinked";
    },
    updateActiveUserSubPanel(activeView){
      if(activeView !== this.activeUserSubPanel){
        this.activeUserSubPanel = activeView
      }
    },
    deleteUser(profile) {
      this.selectedProfile = profile
      this.showDeleteDialog = true
    },
  },
  mounted() {
    this.initialize()
  },
  watch: {
    async $route(to, from) {
      if (to !== from) {
        try {
          let response = await api.execute(
            "get",
            `/user/${this.$route.params.id}/details`
          );
          if (response) {
            this.profile = response;
            this.$forceUpdate()
          }
        } catch (e) {
          this.$log.debug(e);
        }
      }
    },
    profile(newProfile, oldProfile) {
      if (newProfile !== oldProfile) {
        if (newProfile.parentId !== -1) {
          this.getParentAccount(newProfile.parentId);
        }
        this.linkedAccounts = newProfile.linkedAccounts
        // can remove following lines after all profiles have photos and phone numbers
        if (!newProfile.profilePhotoUrl) {
          let seed = Math.random() * Date.now();
          newProfile.profilePhotoUrl = "https://i.pravatar.cc/150?u=" + seed;
        }
        if (!newProfile.phoneNumber) {
          newProfile.phoneNumber = "212-555-1212";
        }
        if (!newProfile.emailAddress) {
          newProfile.emailAddress = "placeholder@example.com";
        }
      }
    },
    currentUser(newUser) {
      if (newUser) {
        this.userPanel = this.$store.state.primaryRole;
      }
    },
    selectedProfile(newProfile, oldProfile) {
      if(newProfile === oldProfile){
        this.selectedProfile = {}
      }
    },
    userPanel(newVal, oldVal) {
      this.previousPanel = oldVal
    },
    showDeleteDialog(newVal){
      console.log(newVal)
    }
  }
};
</script>

<style scoped>
.profile-card {
  overflow: hidden;
}
.scroll {
  overflow-y: auto !important;
}

</style>
