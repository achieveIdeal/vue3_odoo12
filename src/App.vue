<template>
  <router-view/>
</template>

<script setup lang="ts">
import {provide} from "vue";

provide('supplier_id', parseInt(document.getElementById('app').attributes['data-id']?.value))

</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}

input:disabled {
  background-color: #fff;
}
</style>
