<template lang="pug">
  div(class="panel-bg")
    search-bar
    tmp-images
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
.panel-bg {
  @include size(100%, 100%);
}
</style>
