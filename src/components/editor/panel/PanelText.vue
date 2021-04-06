<template lang="pug">
  div(class="panel-text")
    span(class="panel-text__title text-blue-1 label-lg") Text
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
.panel-text {
  @include size(100%, 100%);
  text-align: center;
  &__title {
    margin-bottom: 30px;
  }
}
</style>
