<template lang="pug">
  div(class="panel-color")
    color-picker(
      :isMobile="true" :aspectRatio="40"
      :currentColor="colorUtils.currColor"
      @update="handleDragUpdate"
      @final="handleChangeStop")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import { mapGetters, mapState } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textPropUtils from '@/utils/textPropUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import { IGroup } from '@/interfaces/layer'

export default Vue.extend({
  data() {
    return {
      currColor: '#fff',
      colorUtils
    }
  },
  props: {
    currEvent: {
      type: String,
      required: true
    }
  },
  components: {
    MobileSlider,
    ColorPicker
  },
  mounted() {
    colorUtils.setCurrEvent(this.currEvent)
    colorUtils.setCurrColor(this.props.color)

    colorUtils.on(this.currEvent, this.handleColorUpdate)
    colorUtils.onStop(this.currEvent, this.recordChange)
  },
  beforeDestroy() {
    colorUtils.event.off(this.currEvent, this.handleColorUpdate)
    colorUtils.offStop(this.currEvent, this.recordChange)
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      layerIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    })
  },
  methods: {
    handleChangeStop(color: string) {
      console.log('change update')
      window.requestAnimationFrame(() => {
        colorUtils.event.emit(colorUtils.currStopEvent, color)
      })
    },
    handleDragUpdate(color: string) {
      console.log('drag update')
      window.requestAnimationFrame(() => {
        colorUtils.event.emit(colorUtils.currEvent, color)
        colorUtils.setCurrColor(color)
      })
    },
    handleColorUpdate(color: string) {
      if (color === this.props.color) return
      const { subLayerIdx, getCurrLayer: currLayer, layerIndex } = layerUtils

      switch (currLayer.type) {
        case 'text':
          tiptapUtils.applySpanStyle('color', tiptapUtils.isValidHexColor(color) ? color : tiptapUtils.rgbToHex(color))
          break
        case 'tmp':
        case 'group':
          if (subLayerIdx === -1 || !(currLayer as IGroup).layers[subLayerIdx].contentEditable) {
            textPropUtils.applyPropsToAll('span', { color }, layerIndex, subLayerIdx)
            if (subLayerIdx !== -1) {
              tiptapUtils.updateHtml()
            }
          } else {
            tiptapUtils.applySpanStyle('color', tiptapUtils.isValidHexColor(color) ? color : tiptapUtils.rgbToHex(color))
          }
      }
      textEffectUtils.refreshColor()
      stepsUtils.record()
      textPropUtils.updateTextPropsState({ color })
    },
    recordChange() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-color {
  width: 100%;
}
</style>
