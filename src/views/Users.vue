<template>
  <UserList v-if="elevatedRole"></UserList>
</template>

<script>
import UserList from "@/components/UserList.vue";
export default {
  name: "Users",
  components: { UserList },
  computed: {
    currentUser() {
      return this.$store.state.user;
    },
    elevatedRole() {
      return (
        this.$store.state.primaryRole === "Admin" ||
        this.$store.state.primaryRole === "Employee"
      );
    }
  }
};
</script>

<style scoped></style>
