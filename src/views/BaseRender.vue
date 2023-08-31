<template>
  <menuView/>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {readFile} from "../tools";

const menus = ref([]);
const records = ref([]);
readFile('views.xml').then(result => {
  menus.value = result.find(r => r.tag === 'menuitem');
  records.value = result.find(r => r.tag === 'record');
})
</script>

<style lang="less" scoped>

</style>