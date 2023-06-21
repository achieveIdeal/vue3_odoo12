<template>
  <PageHeader title="供应商信息"/>
  <el-tabs v-model="active" @tab-click="changeMenu">
    <el-tab-pane v-for="(tab, ind) in tabs" :label="tab.name" :name="tab.name" :key="ind"/>
  </el-tabs>
  <keep-alive>
    <component :is="tabs[index].component"/>
  </keep-alive>
</template>

<script lang="ts" setup>
import {inject, provide, ref} from "vue";

import BankInfoInfo from './supplier_info/BankInfoInfo.vue'
import CompanyInfoInfo from './supplier_info/CompanyInfoInfo.vue'
import InnerRegisterInfo from './supplier_info/InnerRegisterInfo.vue'
import PermRelatedInfo from './supplier_info/PermRelatedInfo.vue'
import ProductInfo from './supplier_info/ProductInfo.vue'
import PurchaseInfo from './supplier_info/PurchaseInfo.vue'
import SaleInfo from './supplier_info/SaleInfo.vue'
import SupplierBaseInfo from './supplier_info/SupplierBaseInfo.vue'

provide('id', parseInt(inject('supplier_id')))
const tabs = [
  {
    name: '供应商基础信息',
    component: SupplierBaseInfo
  }, {
    name: '银行信息',
    component: BankInfoInfo
  }, {
    name: '公司信息',
    component: CompanyInfoInfo
  }, {
    name: '注册信息',
    component: InnerRegisterInfo
  }, {
    name: '权限信息',
    component: PermRelatedInfo
  }, {
    name: '产品信息',
    component: ProductInfo
  }, {
    name: '采购信息',
    component: PurchaseInfo
  }, {
    name: '销售信息',
    component: SaleInfo
  }
]
let index = ref(0)
let active = ref(tabs[0].name)

const changeMenu = (attr) => {
  index.value = parseInt(attr.index || '0')
}
</script>

<style scoped>

</style>