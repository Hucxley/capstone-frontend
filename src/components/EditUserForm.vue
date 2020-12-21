<template>
  <div class="text-center">
    <v-dialog :value="dialog"
              @input="$emit('update:dialog', false)"
              persistent
              max-width="600px"
    >
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
                    hint="Username is locked, and must be updated with login provider"
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
            <v-alert
                :value="showSuccessAlert"
                dense
                prominent
                text
                border="left"
                type="success"
                dismissible
                transition="expand-transition"
            >
              Update for <strong>{{ editedUser.name }}</strong> was <strong>successful!</strong>
            </v-alert>
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
              Unable to update <strong>{{ editedUser.name }}</strong> please <strong>Contact Us</strong> for help!
            </v-alert>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="red darken-4" @click="close"
          >Cancel</v-btn
          >
          <v-btn text color="blue-grey darken-4" v-if="!showCloseButton" @click="save"
          >Save</v-btn
          >
          <v-btn text color="green darken-4" v-else @click="close"
          >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showDialogDelete" max-width="475px">
      <v-card align="center">
        <v-card-title
            class="subtitle-2 text-center"
            align="center"
            v-if="!canDelete"
        >
          You cannot delete your own account, please seen an administrator
        </v-card-title>
        <v-card-title class="subtitle-2 text-center" v-else
        >Are you sure you want to permanently delete {{ editedUser.name }}?</v-card-title
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
  </div>
</template>

<script>
import api from "@/api";
import { mapState } from "vuex";

export default {
  name: "EditUserForm",
  props: {
    dialog: {
      type: Boolean
    },
    dialogDelete: {
      type: Boolean
    },
    editedUser: {
      type: Object
    },
    userIsAdmin: {
      type: Boolean
    }
  },
  computed: {
    ...mapState(["user", "clUser", "primaryRole"]),

  },
  data() {
    return {

      canDelete: false,
      showSuccessAlert: false,
      showFailureAlert: false,
      showCloseButton: false,
      showDialogDelete: false,


    }
  },
  methods:{

    canDeleteUser() {
      this.canDelete = this.clUser.id !== this.editedUser.id
    },

    close() {
      this.$emit('closeEditForm', this.previousPanel)
    },

    closeDelete() {
      this.showDialogDelete = false;
    },

    deleteItem(editedUser) {
      this.canDeleteUser(editedUser.id);
      this.showDialogeDelete = true;
    },

    async save() {
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
      try {
        let response = await this.updateUser(resource, u);
        if (response) {
          this.showSuccessAlert = true
          this.showCloseButton = true
        }
      } catch (e) {
        console.log(e)
        this.showFailureAlert = true
        this.showCloseButton = true
      }
    },

    async deleteItemConfirm() {
      let id = this.editedUser.id;
      try {
        let response = await api.execute("delete", `/user/${id}/delete`);
        if (response.deleted) {
          this.showSuccessAlert = true
          this.showCloseButton = true
        }
      } catch (e) {
        this.showFailureAlert = true
        this.showCloseButton = true
        console.log(e);
      }
      this.closeDelete();
    },

    async updateUser(url, user) {
      let response = {};
      try {
        response = await api.execute("POST", url, user);
        if (response) {
          return response;
        }
      } catch (e) {
        console.log(e)
        return e
      }
    },
  },
  mounted() {
    if(this.dialogDelete){
      this.deleteItem(this.editedUser)
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogDelete(val) {
      this.showDialogDelete = val || this.closeDelete();
    },
    editedUser(){
      this.canDeleteUser()
    },
  }
}
</script>

<style scoped>

</style>