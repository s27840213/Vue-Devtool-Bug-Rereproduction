<template lang="pug">
div(class="panel-color-picker")
  color-picker(
    :isMobile="true" :aspectRatio="40"
    :currentColor="colorUtils.currColor"
    @update="handleDragUpdate")
</template>

<script lang="ts">
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils from '@/utils/colorUtils'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      colorUtils
    }
  },
  components: {
    ColorPicker
  },
  props: {
    currEvent: {
      type: String,
      required: true
    }
  },
  methods: {
    handleDragUpdate(color: string) {
      window.requestAnimationFrame(() => {
        colorUtils.event.emit(this.currEvent, color)
        colorUtils.setCurrColor(color)
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-color-picker {
  width: 100%;
  box-sizing: border-box;
  padding: 0 8px;
}
</style>
