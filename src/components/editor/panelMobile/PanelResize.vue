<template lang="pug">
  div(class="panel-resize")
    keep-alive
      page-size-selector(:isDarkTheme="false" ref="pageSizeSelector")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageSizeSelector from '@/components/editor/PageSizeSelector.vue'

export default defineComponent({
  components: {
    PageSizeSelector
  },
  data() {
    return {
    }
  },
  computed: {
  },
  methods: {
    applySelectedFormat() {
      (this.$refs.pageSizeSelector as any).applySelectedFormat()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-resize {
}
</style>
