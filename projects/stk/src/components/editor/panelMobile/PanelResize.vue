<template lang="pug">
div(class="panel-resize")
  keep-alive
    page-size-selector(:isDarkTheme="false" ref="pageSizeSelector")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageSizeSelector from '@/components/editor/PageSizeSelector.vue'

export default defineComponent({
  emits: [],
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
