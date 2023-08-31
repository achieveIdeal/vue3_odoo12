<template>
  <el-menu
      default-active="0"
      class="el-menu-demo"
      mode="horizontal"
      @select="handleSelect"
  >
    <component v-for="(menu, index) in menus.children" :is="menu.children.length?ElSubMenu:ElMenuItem" @open="openMenu"
               @close="closeMenu" @click="clickMenu" :index="index+''">
      {{ !menu.children.length ? menu.name : '' }}
      <template v-if="menu.children.length" #title>
        {{ menu.name }}
      </template>
      <component v-if="menu.children.length" v-for="(subMenu, subIndex) in menu.children"
                 :is="subMenu.children.length?ElSubMenu:ElMenuItem" @open="openMenu"
                 @close="closeMenu" @click="clickMenu" :index="index+'-' + subIndex">
        {{ !subMenu.children.length ? subMenu.name : '' }}
        <template v-if="subMenu.children.length" #title>
          {{ subMenu.name }}
        </template>
        <component v-if="subMenu.children.length"
                   v-for="(subSubMenu, subSubIndex) in subMenu.children"
                   :is="subSubMenu.children.length?ElSubMenu:ElMenuItem" @open="openMenu"
                   @close="closeMenu" @click="clickMenu" :index="index+'-' + subIndex + '-' + subSubIndex">
          {{ !subSubMenu.children.length ? subSubMenu.name : '' }}
          <template v-if="subSubMenu.children.length" #title>
            {{ subSubMenu.name }}
          </template>
          <el-menu-item v-if="subSubMenu.children.length"
                        v-for="(subSubSubMenu, subSubSubIndex) in subSubMenu.children"
                        :index="index+'-' + subIndex + '-' + subSubIndex + '-'+ subSubSubIndex">
            {{ !subSubSubMenu.children.length ? subSubSubMenu.name : '' }}
          </el-menu-item>
        </component>
      </component>
    </component>
  </el-menu>
</template>

<script lang="ts" setup>
import {defineEmits, defineProps} from "vue";
import {ElMenuItem, ElSubMenu} from "element-plus";

const props = defineProps({
  menus: {
    type: Object,
    default: {}
  }
})
const emits = defineEmits(['menuClick']);

const findSelectMenu = (menuPath) => {
  let menu = props.menus;
  for (const path of menuPath) {
    menu = menu.children[parseInt(path)];
  }
  return menu;
}
const handleSelect = (key) => {
  const menuPath = key.split('-');
  const curMenu = findSelectMenu(menuPath);
  emits('menuClick', curMenu);
}

const openMenu = () => {
};
const closeMenu = () => {
};
const clickMenu = () => {
};
</script>

<style lang="less" scoped>

</style>

