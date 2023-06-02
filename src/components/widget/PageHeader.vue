<template>
  <el-page-header class="header-back" :title="' '"  @back="onBack">
    <template #content>
      <span class="text-large font-600 mr-3">{{ title }}</span>
    </template>
  </el-page-header>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
const router = useRouter()
defineProps({
  title: {
    type: String
  }
})

const onBack = ()=>{
  router.back();
}
</script>

<style lang="less" scoped>
.header-back {
  color: rgb(0, 160, 157);
  padding-top: 20px;
  margin-bottom: 20px;
}
</style>