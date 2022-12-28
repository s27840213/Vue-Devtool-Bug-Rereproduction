<template lang="pug">
  div(class="panel-color px-5")
    div(v-if="showDocumentColors")
      div(class="text-left") {{$t('NN0003')}}{{$t('NN0017')}}
      div(class="panel-color__document-colors" :style="colorsStyle"
          @scroll.passive="updateColorsOverflow" ref="colors")
        div(v-for="(color, index) in getDocumentColors"
          class="panel-color__document-color"
          :style="colorStyles(color, index)"
          @click="selectColor(index)")
      div(class="panel-color__hr")
    color-picker(
      v-if="showColorPicker"
      :isMobile="true" :aspectRatio="40"
      :currentColor="colorUtils.currColor"
      @update="handleDragUpdate"
      @final="handleChangeStop")
    color-slips(v-if="showPalette"
      mode="PanelColor"
      :allRecentlyControl="showAllRecently"
      @openColorPicker="openColorPicker"
      @openColorMore="openColorMore")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils, { checkAndConvertToHex } from '@/utils/colorUtils'
import stepsUtils from '@/utils/stepsUtils'
import { mapGetters, mapState } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import { IFrame, IGroup, IImage, ILayer, IShape } from '@/interfaces/layer'
import ColorSlips from '@/components/editor/ColorSlips.vue'
import { ColorEventType } from '@/store/types'
import pageUtils from '@/utils/pageUtils'
import frameUtils from '@/utils/frameUtils'
import shapeUtils from '@/utils/shapeUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import textBgUtils from '@/utils/textBgUtils'

export default Vue.extend({
  data() {
    return {
      currColor: '#fff',
      colorUtils,
      currSelectedColorIndex: 0,
      leftOverflow: false,
      rightOverflow: false
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
    ColorSlips
  },
  created() {
    colorUtils.setCurrEvent(this.currEvent)
    switch (this.currEvent) {
      case ColorEventType.text: {
        colorUtils.setCurrColor(this.props.color)
        break
      }
      case ColorEventType.shape: {
        colorUtils.setCurrColor(this.getDocumentColors[this.currSelectedColorIndex])
        break
      }
      case ColorEventType.background: {
        colorUtils.setCurrColor(colorUtils.currPageBackgroundColor)
        break
      }
      default: {
        break
      }
    }

    colorUtils.on(this.currEvent, this.handleColorUpdate)
    colorUtils.onStop(this.currEvent, this.recordChange)
  },
  mounted() {
    this.updateColorsOverflow()
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
    lastHistory(): string {
      return this.panelHistory[this.historySize - 1]
    },
    showColorPicker(): boolean {
      return !this.inInitialState && this.lastHistory === 'color-picker'
    },
    showDocumentColors(): boolean {
      return (this.showPalette && this.currEvent === ColorEventType.shape) &&
        this.getDocumentColors.length > 1
    },
    showPalette(): boolean {
      return ['color-palette', 'color-more'].includes(this.lastHistory) || this.inInitialState
    },
    showAllRecently(): boolean {
      return this.lastHistory === 'color-more'
    },
    colorsStyle(): Record<string, string> {
      // Use mask-image implement fade scroll style, support Safari 14.3, https://stackoverflow.com/a/70971847
      return {
        gridTemplateColumns: `repeat(${this.getDocumentColors.length}, calc((100% - 30px) / 7))`,
        maskImage: `linear-gradient(to right, transparent 0, black ${this.leftOverflow ? '48px' : 0}, black calc(100% - ${this.rightOverflow ? '48px' : '0px'}), transparent 100%)`
      }
    },
    getDocumentColors(): string[] {
      return shapeUtils.getDocumentColors
    }
  },
  methods: {
    updateColorsOverflow() {
      const { scrollLeft, scrollWidth, offsetWidth } = this.$refs.colors as HTMLElement
      this.leftOverflow = scrollLeft > 0
      this.rightOverflow = scrollLeft + 0.5 < (scrollWidth - offsetWidth) && scrollWidth > offsetWidth
    },
    handleChangeStop(color: string) {
      window.requestAnimationFrame(() => {
        colorUtils.event.emit(colorUtils.currStopEvent, color)
      })
    },
    handleDragUpdate(color: string) {
      window.requestAnimationFrame(() => {
        colorUtils.event.emit(colorUtils.currEvent, color)
        colorUtils.setCurrColor(color)
      })
    },
    handleColorUpdate(newColor: string) {
      switch (this.currEvent) {
        case ColorEventType.text: {
          if (newColor === this.props.color) return
          const hex = checkAndConvertToHex(newColor)
          tiptapUtils.spanStyleHandler('color', hex)
          break
        }
        case ColorEventType.shape: {
          const currLayer = layerUtils.getCurrLayer
          switch (currLayer.type) {
            case 'shape': {
              const color = [...this.getDocumentColors]
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
                  const color = [...this.getDocumentColors]
                  color[this.currSelectedColorIndex] = newColor
                  layerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, subLayerIdx, { color })
                }
              }
              break
            }
            case 'frame':
              this.handleFrameColorUpdate(newColor)
          }
          break
        }

        case ColorEventType.background: {
          colorUtils.setCurrPageBackgroundColor(newColor)
          break
        }

        case ColorEventType.textEffect: {
          textEffectUtils.setColor(newColor)
          break
        }

        case ColorEventType.textBg: {
          textBgUtils.setColor(newColor)
          break
        }

        case ColorEventType.photoShadow: {
          const { styles: { shadow: { currentEffect } } } = layerUtils.getCurrConfig as IImage
          imageShadowUtils.setEffect(currentEffect, { color: newColor })
          break
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
    openColorMore() {
      this.$emit('pushHistory', 'color-more')
    },
    openColorPicker() {
      this.$emit('pushHistory', 'color-picker')
    },
    colorStyles(color: string, index: number) {
      return {
        backgroundColor: color,
        boxShadow: index === this.currSelectedColorIndex ? '0 0 0 2px #808080, inset 0 0 0 1.5px #fff' : ''
      }
    },
    selectColor(index: number) {
      this.currSelectedColorIndex = index
      colorUtils.setCurrColor(this.getDocumentColors[index])
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-color {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-auto-columns: 100%;

  &__document-colors {
    @include no-scrollbar;
    width: 100%;
    margin-top: 10px;
    display: grid;
    gap: 5px;
    overflow-x: auto;
  }
  &__document-color {
    width: 100%;
    padding-top: calc(100% - 3px);
    border: 1.5px solid setColor(gray-4);
    border-radius: 4px;
    box-sizing: border-box;
    &:hover {
      box-shadow: 0 0 0 2px #808080, inset 0 0 0 1.5px #fff;
    }
    // transition: box-shadow 0.2s ease-in-out;
  }
  &__hr {
    height: 1px;
    margin: 16px 0;
    background-color: setColor(gray-4);
  }
}
</style>
