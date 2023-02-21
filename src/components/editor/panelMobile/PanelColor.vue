<template lang="pug">
div(class="panel-color px-5")
  div(v-if="showDocumentColors")
    div(class="text-left") {{$t('NN0798')}}
    div(class="panel-color__shape-colors" :style="colorsStyle"
        @scroll.passive="updateColorsOverflow" ref="colors")
      color-btn(v-for="(color, index) in getDocumentColors"
                :color="color" :focus="index === currSelectedColorIndex"
                @click="selectColor(index)")
    div(class="panel-color__hr")
  //- There is no row-gap in MobilePanel while active PanelColor.
  //- Instead, control gap by PanelColor itself.
  div(v-else class="mt-10")
  color-picker(
    v-if="showColorPicker"
    :isMobile="true" :aspectRatio="40"
    :currentColor="colorUtils.currColor"
    @update="handleDragUpdate"
    @final="handleChangeStop")
  color-slips(v-if="showPalette"
    :class="{'show-document-colors': showDocumentColors}"
    mode="PanelColor"
    :allRecentlyControl="showAllRecently"
    :selectedColor="selectedColor"
    :currPage="currPage"
    @openColorPicker="openColorPicker"
    @openColorMore="openColorMore")
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import ColorSlips from '@/components/editor/ColorSlips.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import { IFrame, IImage, IShape } from '@/interfaces/layer'
import { ColorEventType } from '@/store/types'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import colorUtils, { checkAndConvertToHex } from '@/utils/colorUtils'
import stepsUtils from '@/utils/stepsUtils'
import layerUtils from '@/utils/layerUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import pageUtils from '@/utils/pageUtils'
import frameUtils from '@/utils/frameUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import textBgUtils from '@/utils/textBgUtils'
import shapeUtils from '@/utils/shapeUtils'
import { cloneDeep } from 'lodash'
import { IPage } from '@/interfaces/page'

export default defineComponent({
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
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  emits: ['pushHistory'],
  components: {
    MobileSlider,
    ColorPicker,
    ColorSlips,
    ColorBtn
  },
  created() {
    colorUtils.on(this.currEvent, this.handleColorUpdate)
    colorUtils.onStop(this.currEvent, this.recordChange)
  },
  beforeUnmount() {
    colorUtils.event.off(this.currEvent, this.handleColorUpdate)
    colorUtils.offStop(this.currEvent, this.recordChange)
  },
  watch: {
    // For switch PanelColor event target without close MobilePanel. Ex: shape color and text color in group
    currEvent(newVal, oldVal) {
      colorUtils.event.off(oldVal, this.handleColorUpdate)
      colorUtils.offStop(oldVal, this.recordChange)
      colorUtils.on(newVal, this.handleColorUpdate)
      colorUtils.onStop(newVal, this.recordChange)
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      layerIndex: 'getCurrSelectedIndex',
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
      return this.showPalette && this.currEvent === ColorEventType.shape &&
        this.getDocumentColors.length > 1 && !this.showAllRecently &&
        // Prevent show object colors if group has multiple single-color objects.
        !shapeUtils.hasMultiColors
    },
    showPalette(): boolean {
      return ['color-palette', 'color-more'].includes(this.lastHistory) || this.inInitialState
    },
    showAllRecently(): boolean {
      return this.lastHistory === 'color-more'
    },
    currEvent(): string {
      return colorUtils.currEvent
    },
    selectedColor(): string {
      switch (this.currEvent) {
        case ColorEventType.text:
          return colorUtils.globalSelectedColor.textColor
        case ColorEventType.textEffect:
          return textEffectUtils.currColor
        case ColorEventType.textBg:
          return textBgUtils.currColor
        case ColorEventType.shape:
          return this.getDocumentColors[this.currSelectedColorIndex]
        default:
          return colorUtils.globalSelectedColor.color
      }
    },
    colorsStyle(): Record<string, string> {
      // Use mask-image implement fade scroll style, support Safari 14.3, https://stackoverflow.com/a/70971847
      return {
        gridTemplateColumns: `repeat(${this.getDocumentColors.length}, calc((100% - 30px) / 7))`,
        maskImage: `linear-gradient(to right, transparent 0, black ${this.leftOverflow ? '48px' : 0}, black calc(100% - ${this.rightOverflow ? '48px' : '0px'}), transparent 100%)`
      }
    },
    getDocumentColors(): string[] {
      return colorUtils.globalSelectedColor.colors
    }
  },
  methods: {
    updateColorsOverflow() {
      if (!this.$refs.colors) return
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
        colorUtils.event.emit(this.currEvent, color)
        colorUtils.setCurrColor(color)
      })
    },
    handleColorUpdate(newColor: string) {
      const newDocumentColors = cloneDeep(this.getDocumentColors)
      newDocumentColors[this.currSelectedColorIndex] = newColor

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
              layerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.currSelectedIndex, { color: newDocumentColors })
              break
            }
            case 'tmp':
            case 'group': {
              const { subLayerIdx } = layerUtils
              if (subLayerIdx === -1) {
                const singleColorShapes = currLayer.layers.filter(l => l.type === 'shape' && l.color.length === 1) as IShape[]
                const multiColorShapes = currLayer.layers.filter(l => l.type === 'shape' && l.color.length !== 1) as IShape[]
                // For one multiple-color shape
                if (singleColorShapes.length === 0 && multiColorShapes.length === 1) {
                  for (const [i, layer] of currLayer.layers.entries()) {
                    if (layer.type === 'shape' && layer.color.length !== 1) {
                      layerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, +i, { color: newDocumentColors })
                    }
                  }
                  // For one or more single-color shape
                } else if (singleColorShapes.length !== 0) {
                  for (const [i, layer] of currLayer.layers.entries()) {
                    if (layer.type === 'shape' && layer.color.length === 1) {
                      layerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, +i, { color: [newColor] })
                    }
                  }
                }
              } else {
                const subLayerType = layerUtils.getCurrConfig.type
                if (subLayerType === 'frame') {
                  this.handleFrameColorUpdate(newColor)
                }
                if (subLayerType === 'shape') {
                  layerUtils.updateSelectedLayerProps(pageUtils.currFocusPageIndex, subLayerIdx, { color: newDocumentColors })
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
          if (currentEffect === ShadowEffectType.frame) {
            imageShadowUtils.setEffect(currentEffect, { frameColor: newColor })
          } else {
            imageShadowUtils.setEffect(currentEffect, { color: newColor })
          }
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

  &__shape-colors {
    @include no-scrollbar;
    width: 100%;
    padding: 10px 0 16px 0;
    display: grid;
    gap: 5px;
    overflow-x: auto;
  }
  &__hr {
    height: 1px;
    background-color: setColor(gray-4);
  }
  & .show-document-colors:deep(.color-panel__scroll) {
    padding-top: 16px;
  }
}
</style>
