<template>
  <v-container ref="homeContainer" class="cont ma-0 pa-0" fluid>
    <v-row class="row1" align-content="center" justify="center" no-gutters>
      <v-col cols="4">
        <v-img alt="Cloverleaf Logo" contain src="../assets/clover_logo.png" />
      </v-col>
    </v-row>
    <v-row class="row2" align-content="center" justify="center" no-gutters>
      <v-col cols="4">
        <v-img alt="Deja Du Logo" contain src="../assets/deja_logo.png" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "Home",
  computed: {},
  created() {},
  data() {
    return {};
  },
  methods: {},
  mounted: function() {},
  watch: {}
};
</script>

<style scoped>
.cont {
  height: 100%;
}

.row1 {
  height: 50%;
  background-color: #1b5e20;
}

.row2 {
  height: 50%;
  background-color: #fac8cd;
}
</style>
