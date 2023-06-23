<template>
  <ElConfigProvider :locale="zhCn">
    <router-view/>
  </ElConfigProvider>
</template>

<script setup lang="ts">
import {provide} from "vue";
import zhCn from "element-plus/lib/locale/lang/zh-cn"
import {ElConfigProvider} from "element-plus";
provide('supplier_id', parseInt(document.getElementById('app').attributes['data-id']?.value||0))

</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
</style>
