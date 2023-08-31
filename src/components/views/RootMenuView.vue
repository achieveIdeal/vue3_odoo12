<template>
  <div class="menus">
    <div class="menu-item" v-for="menu in menus.children" type="success" @click="menuClick(menu)">
      <img class="menu-img"
           :src="menu.web_icon && 'http://127.0.0.1:8069/' + menu.web_icon.replace(',', '/') || 'http://127.0.0.1:8069/' +'web_enterprise/static/src/img/default_icon_app.png'"
           alt=""/>
      <div class="menu-text">{{ menu.name }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>

import {defineProps} from "vue";
import {useMenusStore} from "../../store";

const menusStore = useMenusStore();
const menus = menusStore.menus['root'];
const emits = defineEmits(['menuClick']);
const menuClick = (menu) => {
  emits('menuClick', menu);
}
</script>

<style lang="less" scoped>
.menus {
  padding: 50px;
  display: flex;
  flex-wrap: wrap;
  text-align: center;

  .menu-item {
    cursor: pointer;
    margin: 40px;
  }

  .menu-img {
    border-radius: 10px;
    width: 110px;
  }

  .menu-text {
    font-size: 12px;
  }
}
</style>