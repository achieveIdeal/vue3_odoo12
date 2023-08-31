<template>
  <ElConfigProvider :locale="zhCn">
    <router-view/>
  </ElConfigProvider>
</template>

<script setup lang="ts">
import {provide} from "vue";

import zhCn from "element-plus/es/locale/lang/zh-cn";
import {ElConfigProvider} from "element-plus";

const appElement = document.getElementById('app');
for (const field of Object.keys(appElement.dataset)) {
  provide(field, appElement.dataset[field]);
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}


</style>
