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
