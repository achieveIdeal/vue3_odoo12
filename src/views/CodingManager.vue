<template>
  <PageHeader title="赋码标签信息"/>
  <el-tabs v-model="active" @tab-click="changeMenu">
    <el-tab-pane v-for="(tab, ind) in tabs" :label="tab.title" :name="tab.name" :key="ind"/>
  </el-tabs>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component"/>
    </keep-alive>
  </router-view>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {useRouter} from "vue-router";
import MinPack from './code_manager/MinPack.vue'
import BoardPack from './code_manager/BoardPack.vue'
import OuterPack from './code_manager/OuterPack.vue'

const router = useRouter()

const tabs = [{
  name: 'min_pack',
  title: '最小包装',
  component: MinPack
}, {
  title: '外箱包装',
  name: 'outer_pack',
  component: OuterPack
},
  {
    name: 'board_pack',
    component: BoardPack,
    title: '卡板包装'

  }
]
const routerPath = router.currentRoute.value.path.split('/');

let index = ref(0)
let active = ref(routerPath[routerPath.length-1])
const changeMenu = (name) => {
  router.replace({
    name: name.paneName,
  })
}
</script>

<style scoped>

</style>