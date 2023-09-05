<template>
  <component v-if="hasMenu" :is="menuView" @menuClick="menuClick"/>
</template>

<script lang="ts" setup>
import RootMenuView from '../components/views/RootMenuView.vue'


import {ref} from "vue";
import {useRouter} from "vue-router";
import {useMenusStore} from "../store";
import {readFile} from "../tools";

const router = useRouter();
const menuStore = useMenusStore();
let menuView = RootMenuView;
const action = ref({});
const hasMenu = ref(false);
const curMenu = ref({});
menuStore.getMenus().then(r => {
  hasMenu.value = true;
});

const loadActiveAction = (menu) => {
  if (!!menu.action) {
    curMenu.value = menu
    console.log(menu);
    const action = menu.action.split(',');
    const action_id = action[1];
    router.push({
      name: 'action',
      query: {
        action_id: action_id,
        parent_id: menu.parent_id[0] || menu.id,
        viewType: 'tree'
      }
    })
  } else if (menu.children.length) {
    loadActiveAction(menu.children[0]);
  }
}

const menuClick = (menu) => {
  loadActiveAction(menu)
}


const createMenuTree = (menuItems) => {
  const menuMap = {};

  // 创建菜单项映射表
  menuItems.forEach(menuItem => {
    const {attrs, name} = menuItem;
    const {id, parent} = attrs;
    menuMap[id] = {attrs, name, children: []};
  });

  // 构建菜单项层次结构
  menuItems.forEach(menuItem => {
    const {attrs, name} = menuItem;
    const {id, parent} = attrs;
    if (parent) {
      const parentMenuItem = menuMap[parent];
      if (parentMenuItem) {
        parentMenuItem.children.push(menuMap[id]);
      }
    }
  });
  // 查找顶级菜单项
  return Object.values(menuMap).filter(menuItem => !menuItem.attrs.parent);;
}
readFile('views.xml').then(result => {
  console.log(result);
  const menus = createMenuTree(result.filter(r => r.tag === 'menuitem'));
  const records = result.filter(r => r.tag === 'record');
})
</script>

<style lang="less" scoped>

</style>