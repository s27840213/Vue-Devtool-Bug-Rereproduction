<template lang="pug">
  div(class="panel-resize")
    keep-alive
      page-size-selector(:isDarkTheme="false" ref="pageSizeSelector")
</template>

<script lang="ts">
import Vue from 'vue'
import PageSizeSelector from '@/components/editor/PageSizeSelector.vue'

export default Vue.extend({
  components: {
    PageSizeSelector
  }
})
</script>

<style lang="scss" scoped>
.panel-resize {
  height: 100%;
}
</style>
