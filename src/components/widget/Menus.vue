<template>
  <el-menu
      :default-active="active"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
  >
    <template v-for="menu in menus">
      <el-menu-item :index="menu.name">{{ menu.text }}</el-menu-item>
    </template>
  </el-menu>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {useRouter} from "vue-router";

let router = useRouter()
let props = defineProps({
  menus: {
    type: Array
  }
})
let active = ref('')
const handleSelect = (name: string) => {
  router.push({
    name: name,
  })
}
</script>

<style lang="less" scoped>

</style>