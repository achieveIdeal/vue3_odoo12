<template>
  <template v-for="(searchFacet,index) in searchFacets" :key="index">
    <div aria-label="search" class="facet" role="img" tabindex="0">
    <span class="facet_label">
    {{ searchFacet.string }}
    </span>
      <div class="facet_value">
      <span>
      {{ searchFacet.text instanceof Array? searchFacet.text.join(' 或 '): searchFacet.text}}
      </span>
      </div>
      <el-icon class="icon-close">
        <Close @click="closeClick(searchFacet)"/>
      </el-icon>
    </div>
  </template>
</template>

<script lang="ts" setup>

import {onMounted} from "vue";

const props = defineProps({
  searchFacets: {
    type: Object,
    default: []
  }
})
const emits = defineEmits(['facetCloseClick'])

const closeClick = (searchFacet) => {
  const searchFacets = props.searchFacets;
  const curIndex = searchFacets.indexOf(searchFacet);
  searchFacets.splice(curIndex, 1);
  emits('facetCloseClick', searchFacet);
}
</script>

<style lang="less" scoped>
    .facet {
      border: 1px solid #8f8f8f;
      background: #ffffff;
      color: #8f8f8f;
      -webkit-box-flex: 0;
      -webkit-flex: 0 0 auto;
      flex: 0 0 auto;
      max-width: 100%;
      display: flex;
      position: relative;
      margin: 1px;
      z-index: 5;

      .facet_label {
        -webkit-box-flex: 0;
        -webkit-flex: 0 0 auto;
        flex: 0 0 auto;
        display: inline-block;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: top;
        padding: 1px;
        padding-right: 2px;
        color: white;
        display: -webkit-box;
        display: -webkit-flex;
        display: flex;
        align-items: center;
        background-color: #7db5ef;
        font-size: 12px;
      }

      .facet_value {
        direction: ltr;
        padding-top: 1.2px;
        padding-left: 1.5px;
        font-size: 12px;
      }

      .icon-close {
        display: inline-block;
        padding-top: 1.5px;
        cursor: pointer;
      }
    }

</style>