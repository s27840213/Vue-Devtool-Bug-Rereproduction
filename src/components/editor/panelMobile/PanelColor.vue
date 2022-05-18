<template lang="pug">
  div(class="panel-color scrollbar-gray-thin")
    color-panel(v-if="!showColorPicker" :whiteTheme="true" :noPadding="true" @openColorPicker="openColorPicker")
    color-picker(
      v-if="showColorPicker"
      :isMobile="true" :aspectRatio="40"
      :currentColor="colorUtils.currColor"
      @update="handleDragUpdate"
      @final="handleChangeStop")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils from '@/utils/colorUtils'
import stepsUtils from '@/utils/stepsUtils'
import { mapGetters, mapState } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textPropUtils from '@/utils/textPropUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import { IFrame, IGroup, ILayer, IShape } from '@/interfaces/layer'
import ColorPanel from '@/components/editor/ColorPanel.vue'
import { ColorEventType, LayerType } from '@/store/types'
import pageUtils from '@/utils/pageUtils'
import frameUtils from '@/utils/frameUtils'

export default Vue.extend({
  data() {
    return {
      currColor: '#fff',
      colorUtils,
      currSelectedColorIndex: 0
    }
  },
  props: {
    currEvent: {
      type: String,
      required: true
    },
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  components: {
    MobileSlider,
    ColorPicker,
    ColorPanel
  },
  mounted() {
    colorUtils.setCurrEvent(this.currEvent)
    switch (this.currEvent) {
      case ColorEventType.text: {
        colorUtils.setCurrColor(this.props.color)
        break
      }
      case ColorEventType.shape: {
        colorUtils.setCurrColor(this.getColors[this.currSelectedColorIndex])
        break
      }
      default: {
        break
      }
    }

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
    }),
    historySize(): number {
      return this.panelHistory.length
    },
    inInitialState(): boolean {
      return this.historySize === 0
    },
    showColorPicker(): boolean {
      return !this.inInitialState && this.panelHistory[this.historySize - 1] === 'color-picker'
    },
    inGrouped(): boolean {
      const currLayer = layerUtils.getCurrLayer
      let oneColorObjNum = 0
      if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        for (const layer of (currLayer as IGroup).layers) {
          if (layer.type === 'shape' && (layer as IShape).color.length === 1) {
            oneColorObjNum++
          }
        }
        return oneColorObjNum >= 2 && !(currLayer as IGroup).layers
          .some(l => l.type === 'shape' && l.active)
      }
      return false
    },
    getColors(): string[] {
      const layer = layerUtils.getCurrLayer
      switch (layer.type) {
        case 'shape':
          return (layer as IShape).color || []
        case 'tmp':
        case 'group': {
          const { subLayerIdx } = layerUtils
          if (subLayerIdx === -1) {
            if (!this.inGrouped) {
              const layers = (layer as IGroup).layers
                .filter((l: ILayer) => l.type === 'shape' && (l as IShape).color && (l as IShape).color.length === 1)
              return (layers.length ? layers[0].color : []) as string[]
            } else return []
          } else {
            const subLayer = (layer as IGroup).layers[subLayerIdx]
            if (subLayer.type === LayerType.frame) {
              const { decoration, decorationTop } = subLayer as unknown as IFrame
              return [...(decoration?.color || []), ...(decorationTop?.color || [])]
            }
            if (subLayer.type === LayerType.shape) {
              const colors = (subLayer as IShape).color
              return colors
            }
            return []
          }
        }
        case 'frame': {
          const { decoration, decorationTop } = layerUtils.getCurrLayer as IFrame
          return [...(decoration?.color || []), ...(decorationTop?.color || [])]
        }
        default:
          console.error('Wrong with the right-side-panel color')
          return []
      }
    }
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
    handleColorUpdate(newColor: string) {
      console.log('handleColor update')
      if (this.currEvent === ColorEventType.text) {
        if (newColor === this.props.color) return
        const { subLayerIdx, getCurrLayer: currLayer, layerIndex } = layerUtils

        switch (currLayer.type) {
          case 'text':
            tiptapUtils.applySpanStyle('color', tiptapUtils.isValidHexColor(newColor) ? newColor : tiptapUtils.rgbToHex(newColor))
            break
          case 'tmp':
          case 'group':
            if (subLayerIdx === -1 || !(currLayer as IGroup).layers[subLayerIdx].contentEditable) {
              textPropUtils.applyPropsToAll('span', { newColor }, layerIndex, subLayerIdx)
              if (subLayerIdx !== -1) {
                tiptapUtils.updateHtml()
              }
            } else {
              tiptapUtils.applySpanStyle('color', tiptapUtils.isValidHexColor(newColor) ? newColor : tiptapUtils.rgbToHex(newColor))
            }
        }
        textEffectUtils.refreshColor()
        stepsUtils.record()
        textPropUtils.updateTextPropsState({ newColor })
      } else if (this.currEvent === ColorEventType.shape) {
        const currLayer = layerUtils.getCurrLayer
        switch (currLayer.type) {
          case 'shape': {
            const color = [...this.getColors]
            color[this.currSelectedColorIndex] = newColor
            layerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.currSelectedIndex, { color })
            break
          }
          case 'tmp':
          case 'group': {
            const { subLayerIdx } = layerUtils
            if (subLayerIdx === -1) {
              for (const [i, layer] of (currLayer as IGroup).layers.entries()) {
                if (layer.type === 'shape' && (layer as IShape).color.length === 1) {
                  layerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, +i, { color: [newColor] })
                }
              }
            } else {
              const subLayerType = layerUtils.getCurrConfig.type
              if (subLayerType === 'frame') {
                this.handleFrameColorUpdate(newColor)
              }
              if (subLayerType === 'shape') {
                const color = [...this.getColors]
                color[this.currSelectedColorIndex] = newColor
                layerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, subLayerIdx, { newColor })
              }
            }
            break
          }
          case 'frame':
            this.handleFrameColorUpdate(newColor)
        }
      }
    },
    handleFrameColorUpdate(newColor: string) {
      const { decoration, decorationTop } = layerUtils.getCurrConfig as IFrame
      let color = [] as Array<string>
      let key = ''
      if (decoration && decorationTop && decoration.color.length && decorationTop.color.length) {
        if (this.currSelectedColorIndex <= decoration.color.length - 1) {
          key = 'decorationColors'
          color = [...decoration.color]
          color[this.currSelectedIndex] = newColor
        } else {
          key = 'decorationTopColors'
          color = [...decorationTop.color]
          color[this.currSelectedColorIndex - decoration.color.length] = newColor
        }
      } else {
        decoration && decoration.color.length && (key = 'decorationColors') && (color = [...decoration.color])
        decorationTop && decorationTop.color.length && (key = 'decorationTopColors') && (color = [...decorationTop.color])
        color[this.currSelectedColorIndex] = newColor
      }
      frameUtils.updateFrameDecorColor({
        pageIndex: layerUtils.pageIndex,
        layerIndex: layerUtils.layerIndex,
        subLayerIdx: layerUtils.subLayerIdx
      }, { [key]: color })
    },
    recordChange() {
      stepsUtils.record()
    },
    openColorPicker() {
      this.$emit('pushHistory', 'color-picker')
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-color {
  width: 100%;
  max-height: 250px;
  overflow-y: scroll;
}
</style>
