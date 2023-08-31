<template>
  <div class="top-header">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="less" scoped>
.top-header {
  text-align: left;
  display: flex;
  border-bottom: 1px solid #343434;
  align-items: center;
  padding-bottom: 10px;
  justify-content: space-between
}
</style>