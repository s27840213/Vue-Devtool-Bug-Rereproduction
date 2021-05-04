<template lang="pug">
  div(class="page-setting")
    span(class="page-setting__title text-blue-1 label-lg") Page Setting
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'

export default Vue.extend({
  components: {
    SearchBar
  }
})
</script>

<style lang="scss" scoped>
.page-setting {
  @include size(100%, 100%);
  text-align: center;
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 1fr);
    column-gap: 20px;

    > button:nth-child(1) {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }
}
</style>
