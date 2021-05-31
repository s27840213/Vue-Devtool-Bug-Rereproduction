<template lang="pug">
  div(class="panel-file")
    span(class="panel-file__title text-blue-1 label-lg") My File
    btn(class="full-width mt-20" :type="'primary-mid'") Upload Image
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
.panel-file {
  @include size(100%, 100%);
  text-align: center;
  &__title {
    margin-bottom: 30px;
  }
}
</style>
