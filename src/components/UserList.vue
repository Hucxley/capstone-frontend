<template>
  <v-container class="mx-0 my-0 py-0" fluid>
    <v-alert
        :value="showFailureAlert"
        dense
        prominent
        text
        border="left"
        type="error"
        dismissible
        transition="expand-transition"
    >
      Unable to delete account for <strong>{{ editedUser.name }}</strong>! Please ensure that all pending appointments have been canceled.
    </v-alert>
    <v-data-table
      :headers="headers"
      :items="users"
      :search="search"
      fixed-header
      sort-by="id"
      :footer-props="{'itemsPerPageOptions':[9, 15, -1]}"
      no-results-text="No matches found... Try to change your search term."
      loading-text="Loading... Please wait"
      :height="$vuetify.breakpoint.xlOnly ? '77vh' : '68vh'"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>Manage Users</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-spacer></v-spacer>
          <v-spacer></v-spacer>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            clearable
          ></v-text-field>
          <v-dialog v-model="dialog" max-width="600px">
            <v-card>
              <v-card-title>
                <span class="headline">Edit User</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        v-model="editedUser.firstName"
                        label="First Name"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="editedUser.lastName"
                        label="Last Name"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedUser.emailAddress"
                        label="Account Username"
                        disabled
                        hint="Username is locked, and must be edited with login provider"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedUser.phoneNumber"
                        label="Phone Number"
                        hint="Numbers only, no spaces or dashes"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedUser.profilePhotoUrl"
                        label="Profile Photo URL"
                      ></v-text-field>
                    </v-col>
                    <v-col
                      cols="12"
                      v-if="editedUser.primaryRole == 'Customer'"
                    >
                      <v-text-field
                        v-if="editedUser.primaryRole === 'Customer'"
                        v-model="editedUser.repeatInterval"
                        label="Preferred Weeks Between Appointments"
                        hint="Enter number of weeks for recurring appointments"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="5" v-if="userIsAdmin">
                      <p>Primary Role: {{ editedUser.primaryRole }}</p>
                    </v-col>
                    <v-col
                      cols="7"
                      v-if="userIsAdmin && editedUser.subscriberId"
                    >
                      <a
                        :href="
                          `https://dev-3583503-admin.okta.com/admin/user/profile/view/${editedUser.subscriberId}#tab-groups`
                        "
                        target="_blank"
                        v-html="
                          `Edit User Role (will update on next user login)`
                        "
                      ></a>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text color="blue-grey darken-4" @click="close"
                  >Cancel</v-btn
                >
                <v-btn text color="blue-grey darken-4" @click="save"
                  >Save</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="dialogDelete" max-width="475px">
            <v-card align="center">
              <v-card-title
                class="subtitle-2 text-center"
                align="center"
                v-if="!canDelete"
              >
                You cannot delete your own account, please seen an administrator
              </v-card-title>
              <v-card-title class="subtitle-2 text-center" v-else
                >Are you sure you want to delete this item?</v-card-title
              >
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="closeDelete">Cancel</v-btn>
                <v-btn text :disabled="!canDelete" @click="deleteItemConfirm"
                  >OK</v-btn
                >
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>

      <template v-slot:item.profilePhoto="{ item }">
        <v-avatar size="50" class="my-2" v-if="item.profilePhotoUrl">
          <img
            :src="`${item.profilePhotoUrl}`"
            :alt="`${item.firstName}'s profile photo`"
          />
        </v-avatar>
        <v-avatar size="50" class="my-2" :color="item.avatar.color" v-else>
          <span class="white--text title" v-text="item.avatar.initials"></span>
        </v-avatar>
      </template>

      <template v-slot:item.parentAccount="{ item }">
        <a :href="`/profile/${item.parentId}`" v-if="item.parentId !== -1">View Account</a>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon small class="mr-2" @click="viewProfile(item)">mdi-eye</v-icon>
        <v-icon small class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon small class="mr-2" @click="deleteItem(item)" v-if="userIsAdmin">mdi-delete</v-icon>
      </template>
      <template v-slot:no-data>
        <v-btn color="primary" @click="initialize">Reset</v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import api from "@/api";

export default {
  name: "UserList",
  data() {
    return {
      isAdmin: this.userIsAdmin,
      dialog: false,
      dialogDelete: false,
      headers: [
        { text: "Profile Photo", value: "profilePhoto" },
        { text: "First Name", value: "firstName" },
        { text: "Last Name", value: "lastName" },
        { text: "User Role", value: "primaryRole" },
        { text: "Phone Number", value: "phoneNumber" },
        { text: "Email Address", value: "emailAddress" },
        { text: "Profile Photo", value: "profilePhotoUrl" },
        { text: "Weeks Between Appts", value: "repeatInterval" },
        { text: "Linked Account", value: "hasLinked" },
        { text: "Parent Account", value: "parentAccount" },
        { text: "Actions", value: "actions", sortable: false }
      ],
      users: [],
      loading: false,
      canDelete: true,
      editedIndex: -1,
      editUserTypeOptions: ["Customer", "Employee", "Admin", "Guest"],
      editUserTypeDisabled: this.isAdmin,
      editedUser: {
        name: "",
        primaryRole: "",
        userRoles: [],
        phoneNumber: "",
        emailAddress: "",
        repeatInterval: 0,
        profilePhotoUrl: ""
      },
      defaultItem: {
        name: "",
        primaryRole: "",
        phoneNumber: "",
        emailAddress: "",
        repeatInterval: 0,
        profilePhotoUrl: "",
        userRoles: []
      },
      search: "",
      showFailureAlert: false,
    };
  },

  computed: {
    userIsAdmin() {
      if (this.$store.state) {
        return this.$store.state.primaryRole === "Admin";
      }
      return false;
    }
  },
  created() {
    this.initialize();
  },
  methods: {
    async initialize() {
      this.loading = true;
      let userList = [];
      try {
        const response = await api.execute("get", `/users`)
        if (response) {
          for (const user of response) {
            if (!user.id || !user.active) {
              // do nothing
            } else {
              user.firstName = user.name.split(" ")[0];
              user.lastName = user.name.split(" ")[1];
              user.hasLinked = user.parentId !== -1 ? "Yes" : "No";
              user.parentAccount = user.parentId !== -1 ? user.parentId : "";
              if (!user.profilePhotoUrl) {
                user.avatar = {
                  color: this.getRandomColor(),
                  initials: this.getInitials(user.firstName, user.lastName)
                };
              }
              userList.push(user);
            }
          }
          this.users = userList;
          this.loading = false;
        }
      } catch (e) {
        console.log(e);
      }
    },
    canDeleteUser(id) {
      if (this.$store) {
        this.canDelete = this.$store.state.user.id !== id;
      }
    },
    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedUser = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    closeDelete() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedUser = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    deleteItem(item) {
      this.canDeleteUser(item.id);
      this.dialogDelete = true;
      const index = this.users.indexOf(item);
      this.editedIndex = index;
    },
    async deleteItemConfirm() {
      let id = this.users[this.editedIndex].id;
      try {
        let response = await api.execute("delete", `/user/${id}/delete`);
        if (response === "Successfully deleted the provided user") {
          this.users.splice(this.editedIndex, 1);
          console.log(response);
        }else{
          this.showFailureAlert = true
        }
      } catch (e) {
        console.log(e);
      }
      this.editedIndex = -1;
      this.closeDelete();
    },
    editItem(item) {
      this.editedIndex = this.users.indexOf(item);
      this.editedUser = Object.assign({}, item);
      this.dialog = true;
    },
    getInitials(first, last) {
      return first[0].toUpperCase() + last[0].toUpperCase();
    },
    getRandomColor() {
      let baseColors = [
        "red",
        "purple",
        "deep-purple",
        "indigo",
        "light-blue",
        "teal",
        "green",
        "amber",
        "deep-orange"
      ];
      // Random selector from 1-4 to vary the darken-n value
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
      let modifier = Math.floor(Math.random() * 4) + 1;
      let selectedColorIndex = Math.floor(Math.random() * baseColors.length);
      return `${baseColors[selectedColorIndex]} darken-${modifier}`;
    },
    async save() {
      if (this.editedIndex > -1) {
        let e = this.editedUser;
        let u = {
          name: e.firstName + " " + e.lastName,
          emailAddress: e.emailAddress,
          phoneNumber: e.phoneNumber,
          profilePhotoUrl: e.profilePhotoUrl,
          linkedAccounts: e.linkedAccounts,
          parentId: e.parentId,
          repeatInterval: parseInt(e.repeatInterval),
          primaryRole: e.primaryRole,
          subscriberId: e.subscriberId
        };
        let resource = `/user/${e.id}/update`;
        let response = await this.updateUser(resource, u);
        if (response) {
          console.log(response);
        }
        await this.initialize();
        this.close();
      }
    },
    splitName(name) {
      return name.split(" ")[0];
    },
    async updateUser(url, user) {
      console.log(user);
      let response = {};
      try {
        response = await api.execute("POST", url, user);
        if (response) {
          console.log(response);
          return response;
        }
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    viewProfile(item) {
      this.$router.push(`/profile/${item.id}`);
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogDelete(val) {
      val || this.closeDelete();
    },
  }
};
</script>

<style scoped>

</style>
