<template lang="pug">
  div(class="shape-setting")
    //- span(class="color-picker__title text-blue-1 label-lg") Document Colors
    action-bar(class="flex-around" style="padding: 2px 0"
              v-if="currLayer.type === 'shape' && currLayer.category === 'D'")
      div(class="shape-setting__line-action-wrapper-dashAndEdge")
        svg-icon(class="pointer"
                iconName="line-width" iconWidth="24px" iconColor="gray-2"
                @click.native="handleSliderModal('line-width')")
        div(v-if="openSliderBar === 'line-width'"
            class="shape-setting__range-input-wrapper-line-width right"
            v-click-outside="handleSliderModal")
          input(class="shape-setting__range-input shape-setting__range-input-line-width"
            :value="lineWidth"
            :max="fieldRange.lineWidth.max"
            :min="fieldRange.lineWidth.min"
            v-ratio-change
            type="range"
            @input="setLineWidth")
          div(class="shape-setting__range-input-line-width-value") {{ lineWidth }}
      div(class="shape-setting__line-action-wrapper-dashAndEdge")
        svg-icon(class="pointer"
                iconName="line-dash" iconWidth="24px" iconColor="gray-2"
                @click.native="handleValueModal('line-dash')")
        general-value-selector(v-if="openValueSelector === 'line-dash'"
                      :valueArray="[[1, 2], [3, 4]]"
                      class="shape-setting__value-selector"
                      v-click-outside="handleValueModal"
                      :values="dashAndEdge"
                      @update="handleLineDashEdgeUpdate"
                      itemMinWidth="70",
                      buttonHeight="20")
          template(class="pointer" v-slot:g0i0)
            svg-icon(iconName="no-dash" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
          template(class="pointer" v-slot:g0i1)
            svg-icon(iconName="dash-1" iconWidth="25px" iconHeight="20px" iconColor="gray-2")
          template(class="pointer" v-slot:g1i0)
            svg-icon(iconName="butt" iconWidth="11px" iconHeight="6px" iconColor="gray-2")
            div(class="shape-setting__value-selector__button-text") 方形
          template(class="pointer" v-slot:g1i1)
            svg-icon(iconName="round" iconWidth="11px" iconHeight="6px" iconColor="gray-2")
            div(class="shape-setting__value-selector__button-text") 圓角
      div(class="vertical-rule")
      div(class="shape-setting__line-action-wrapper-marker")
        svg-icon(class="pointer"
                iconName="start-marker" iconWidth="37px" iconColor="gray-2"
                @click.native="handleValueModal('start-marker')")
      div(class="shape-setting__line-action-wrapper-marker")
        svg-icon(class="pointer"
                iconName="end-marker" iconWidth="37px" iconColor="gray-2"
                @click.native="handleValueModal('end-marker')")
    div(class="relative")
      property-bar(class="shape-setting__property-bar")
        button(class="shape-setting__range-input-button" @click="handleSliderModal('opacity')")
          input(class="body-2 text-gray-2 record-selection" ref="input-opacity" type="text"
                :value="opacity" @change="setOpacity")
        svg-icon(class="pointer"
          :iconName="'transparency'" :iconWidth="'25px'" :iconColor="'gray-2'")
      div(v-if="openSliderBar === 'opacity'"
          class="shape-setting__range-input-wrapper-opacity right"
          v-click-outside="handleSliderModal")
        input(class="shape-setting__range-input"
          :value="opacity"
          :max="fieldRange.opacity.max"
          :min="fieldRange.opacity.min"
          v-ratio-change
          type="range"
          @input="setOpacity")
    div(class="shape-setting__colors")
      div(v-if="isGrouped"
        class="shape-setting__color"
        :style="groupColorStyles()")
      div(v-for="(color, index) in getColors"
        class="shape-setting__color"
        :style="colorStyles(color, index)"
        @click="selectColor(index)")
    div(v-if="getColors.length || isGrouped" class="shape-setting__title")
      span(class="shape-setting__title text-blue-1 label-lg") Color Palette
      div(class="shape-setting__colors")
        div(class="shape-setting__color rainbow" ref="rainbow"
          :style="colorPickerStyles()" @click="handleColorModalOn")
          color-picker(v-if="openColorPicker"
            class="shape-setting__color-picker"
            v-click-outside="handleColorModalOff"
            :currentColor="getColors[currSelectedColorIndex]"
            @update="handleColorUpdate")
        div(v-for="(color, index) in colorPresets"
          class="shape-setting__color palette"
          :style="paletteColorStyle(color, index)"
          @click="setColor(color, index)")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import GeneralValueSelector from '@/components/GeneralValueSelector.vue'
import LayerUtils from '@/utils/layerUtils'
import { IGroup, ILayer, IShape } from '@/interfaces/layer'
import GeneralUtils from '@/utils/generalUtils'
import color from '@/store/module/color'
import { Layer } from 'konva/types/Layer'
import shapeUtils from '@/utils/shapeUtils'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker,
    GeneralValueSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      colorPresets: [
        '#000000',
        '#FFFFFF',
        '#F2994A',
        '#F2C94C',
        '#219653',
        '#BB6BD9',
        '#EB5757',
        '#2F80ED',
        '#2D9CDB',
        '#56CCF2',
        '#FF0000'
      ],
      fieldRange: {
        opacity: { min: 0, max: 100 },
        lineWidth: { min: 1, max: 100 }
      },
      currSelectedColorIndex: 0,
      openSliderBar: '',
      openValueSelector: '',
      openColorPicker: false,
      paletteRecord: [{ key: 0, value: -1 }],
      dashAndEdge: [1, 3]
    }
  },
  mounted() {
    this.initilizeRecord()
    this.dashAndEdge[0] = ((this.currLayer as IShape).dasharray ?? []).length === 0 ? 1 : 2
    this.dashAndEdge[1] = ((this.currLayer as IShape).linecap ?? 'butt') === 'butt' ? 3 : 4
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    opacity(): string | number {
      const { currLayer } = this
      if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        const layers = [...(currLayer as IGroup).layers]
        return new Set(layers.map((l: ILayer) => l.styles.opacity)).size === 1 ? layers[0].styles.opacity : '--'
      } else {
        return currLayer.styles.opacity
      }
    },
    /**
     * This parameter means if current layer is a group/tmp and contains at least 2 of more
     * IShape that the color-list of them only has one entry.
     */
    lineWidth(): string | number {
      const { currLayer } = this
      // if (currLayer.type === 'tmp' || currLayer.type === 'group') {
      //   const layers = [...(currLayer as IGroup).layers]
      //   return new Set(layers.map((l: ILayer) => {
      //     return (l.type === 'shape' && l.category === 'D') ? ((l as IShape).size?.[0] ?? '--') : '--'
      //   })).size === 1 ? ((layers[0] as IShape).size?.[0] ?? '--') : '--'
      // } else {
      //   return (currLayer as IShape).size?.[0] ?? '--'
      // }
      return (currLayer as IShape).size?.[0] ?? '--'
    },
    currLayer(): ILayer {
      return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex) as ILayer
    },
    isGrouped(): boolean {
      const { currLayer } = this as any
      let oneColorObjNum = 0
      if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        for (const layer of currLayer.layers) {
          if (layer.type === 'shape' && layer.color.length === 1) {
            oneColorObjNum++
          }
        }
      }
      return (currLayer.type === 'tmp' || currLayer.type === 'group') && oneColorObjNum >= 2
    },
    getColors(): string[] {
      const layer = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex)
      if (!(layer.type === 'tmp' || layer.type === 'group')) {
        return this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).color
      } else if (!this.isGrouped) {
        return layer.layers.filter((l: ILayer) => l.type === 'shape' && (l as IShape).color.length === 1)[0].color
      } else {
        return []
      }
    }
  },
  watch: {
    currSelectedIndex: function() {
      this.initilizeRecord()
    }
  },
  methods: {
    ...mapMutations({
      _updateLayerProps: 'UPDATE_layerProps'
    }),
    colorStyles(color: string, index: number) {
      return {
        backgroundColor: color,
        boxShadow: index === this.currSelectedColorIndex ? '0 0 0 2px #808080, inset 0 0 0 1.5px #fff' : ''
      }
    },
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    groupColorStyles() {
      const currLayer = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex)
      if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        const origin = currLayer.layers.find((l: ILayer) => l.type === 'shape' && (l as IShape).color.length === 1).color[0]
        const isGroupSameColor = (() => {
          for (const layer of currLayer.layers) {
            if (layer.type === 'shape' && (layer as IShape).color.length === 1 && (layer as IShape).color[0] !== origin) {
              return false
            }
          }
          return true
        })()
        return isGroupSameColor ? {
          backgroundColor: origin,
          boxShadow: '0 0 0 2px #808080, inset 0 0 0 1.5px #fff'
        } : {
          background: `url(${require('@/assets/img/png/multi-color.png')})`,
          boxShadow: '0 0 0 2px #808080, inset 0 0 0 1.5px #fff'
        }
      }
    },
    paletteColorStyle(color: string, index: number) {
      const currSelectedInPalette = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)?.value
      if (currSelectedInPalette === index) {
        return {
          backgroundColor: color,
          boxShadow: '0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff'
        }
      } else {
        return {
          backgroundColor: color
        }
      }
    },
    colorPickerStyles() {
      const isSelected = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)?.value === -1
      return {
        background: `url(${require('@/assets/img/png/picker.png')})`,
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        boxShadow: isSelected ? '0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff' : ''
      }
    },
    handleColorModalOn(e: MouseEvent) {
      this.openColorPicker = true
    },
    handleColorModalOff(e: MouseEvent) {
      this.openColorPicker = false
    },
    handleColorUpdate(color: string) {
      this.setColor(color, this.currSelectedColorIndex)
      const record = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)
      if (record) {
        record.value = -1
      }
    },
    selectColor(index: number) {
      if (this.openColorPicker) {
        this.openColorPicker = false
      }
      this.currSelectedColorIndex = index
    },
    handleSliderModal(modalName = '') {
      this.openSliderBar = modalName
      if (modalName === 'opacity') {
        const input = this.$refs[`input-${modalName}`] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    handleValueModal(modalName = '') {
      this.openValueSelector = modalName
      console.log(this.openValueSelector)
    },
    setColor(newColor: string, index: number) {
      const { currLayer } = this
      if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        for (const [i, layer] of (currLayer as IGroup).layers.entries()) {
          if (layer.type === 'shape' && (layer as IShape).color.length === 1) {
            const color = [newColor]
            LayerUtils.updateSelectedLayerProps(this.lastSelectedPageIndex, i, { color })
          }
        }
      } else {
        const color = [...this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex).color]
        color[this.currSelectedColorIndex] = newColor
        const record = this.paletteRecord.find(record => record.key === this.currSelectedColorIndex)
        if (record) {
          record.value = index
        }
        LayerUtils.updateLayerProps(this.lastSelectedPageIndex, this.currSelectedIndex, { color })
      }
    },
    setOpacity(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (GeneralUtils.isValidInt(value)) {
        value = this.boundValue(parseInt(value), this.fieldRange.opacity.min, this.fieldRange.opacity.max)
        const { currLayer } = this
        if (currLayer.type === 'tmp' || currLayer.type === 'group') {
          LayerUtils.updateAllGroupStyles({ opacity: value })
        } else {
          LayerUtils.updateLayerStyles(
            this.lastSelectedPageIndex,
            this.currSelectedIndex,
            { opacity: value }
          )
        }
      }
    },
    setLineWidth(e: Event) {
      const { value } = e.target as HTMLInputElement
      if (GeneralUtils.isValidInt(value)) {
        const lineWidth = parseInt(this.boundValue(parseInt(value), this.fieldRange.lineWidth.min, this.fieldRange.lineWidth.max))
        const { currLayer } = this
        // if (currLayer.type === 'tmp' || currLayer.type === 'group') {
        //   LayerUtils.updateAllGroupProps({ size: [lineWidth] })
        // } else {
        //   LayerUtils.updateLayerProps(
        //     this.lastSelectedPageIndex,
        //     this.currSelectedIndex,
        //     { size: [lineWidth] }
        //   )
        // }
        const { point, styles, size } = (currLayer as IShape)
        LayerUtils.updateLayerProps(
          this.lastSelectedPageIndex,
          this.currSelectedIndex,
          { size: [lineWidth] }
        )
        const trans = shapeUtils.getTranslateCompensationForLineWidth(point ?? [], styles, size?.[0] ?? 1, lineWidth)
        LayerUtils.updateLayerStyles(
          this.lastSelectedPageIndex,
          this.currSelectedIndex,
          {
            x: trans.x,
            y: trans.y
          }
        )
      }
    },
    handleLineDashEdgeUpdate(index: number, value: number) {
      if (index === 0) {
        this.handleLineDash(value)
      } else {
        this.handleLineEdge(value)
      }
      this.$set(this.dashAndEdge, index, value)
    },
    handleLineDash(dash: number) {
      LayerUtils.updateLayerProps(
        this.lastSelectedPageIndex,
        this.currSelectedIndex,
        { dasharray: (dash === 1) ? [] : [1] }
      )
    },
    handleLineEdge(edge: number) {
      LayerUtils.updateLayerProps(
        this.lastSelectedPageIndex,
        this.currSelectedIndex,
        { linecap: (edge === 3) ? 'butt' : 'round' }
      )
    },
    initilizeRecord() {
      this.paletteRecord = []
      for (let i = 0; i < this.getColors.length; i++) {
        const record = { key: i, value: this.colorPresets.findIndex(color => this.getColors[i] === color) }
        this.paletteRecord.push(record)
      }
      while (this.currSelectedColorIndex > this.paletteRecord.length - 1) {
        this.currSelectedColorIndex--
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.shape-setting {
  @include size(100%, 100%);
  text-align: center;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  grid-template-columns: 1fr;
  &__title {
    margin-bottom: 0px;
    margin-top: 10px;
  }
  > div {
    margin-top: 10px;
  }
  &__colors {
    width: 100%;
    margin-top: 10px;
    padding: 5px;;
    display: flex;
    flex-wrap: wrap;
  }
  &__color {
    @include size(clamp(30px, 2vw, 50px), clamp(30px, 2vw, 50px));
    margin: 5px;
    border: 1.5px solid setColor(gray-4);
    border-radius: 4px;
    &:hover {
      box-shadow: 0 0 0 2px #808080, inset 0 0 0 1.5px #fff
    }
    transition: box-shadow .2s ease-in-out;
  }
  &__value-selector {
    position: absolute;
    z-index: 9;
    left: -22.5px;
    top: 35px;
    margin: 0;

    &__button-text {
      font-size: 12px;
    }
  }
  &__color-picker {
    position: absolute;
    z-index: 10;
    left: -5px;
    top: 35px;
  }
  &__property-bar{
    width: 50%;
    box-sizing: border-box;
    position: relative;
  }
  &__range-input-wrapper {
    position: absolute;
    z-index: 9;
    // top: -20px;
    // left: auto;
    right: auto;
    padding: auto;
    width: 135px;
    height: 35px;
    background-color: #ffffff;
    background-color: white;
    box-shadow: 0 0 0 1px rgb(64 87 109 / 7%), 0 2px 12px rgb(53 71 90 / 20%);
    border: 1px solid #d9dbe1;
    border-radius: 3px;
    display: flex;
    align-items: center;

    &-line-width {
      @extend .shape-setting__range-input-wrapper;
      width: 155px;
      left: -16px;
      right: unset;
      top: 35px;
    }

    &-opacity {
      @extend .shape-setting__range-input-wrapper;
      margin-top: -12px;
    }
  }
  &__range-input {
    display: block;
    margin: auto;
    width: 120px;
    height: 35px;
    appearance: none;
    outline: none;
    background: none;
    &::-webkit-slider-runnable-track {
      height: 2px;
      background-color: #d9dbe1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid #3c64b1;
      transition: 0.2s;
      margin-top: -6.5px;
      position: relative;
    }
    &-line-width {
      width: 80px;

      &-value {
        @extend .shape-setting__range-input-line-width;
        width: 30px;
        margin: auto;
        height: 23px;
        line-height: 23px;
        font-size: 10px;
        border: 1px solid map-get($colors, gray-4);
        border-radius: 5px;
      }
    }
  }
  &__range-input-button {
    width: fit-content;
  }
  &__line-action-wrapper {
    position: relative;

    &-dashAndEdge {
      @extend .shape-setting__line-action-wrapper;
      height: 24px;
    }

    &-marker {
      @extend .shape-setting__line-action-wrapper;
      height: 37px;
    }
  }
}
.rainbow {
  position: relative;
  &:hover {
    box-shadow: 0 0 0 2px #7d2ae8, inset 0 0 0 1.5px #fff
  }
}
.vertical-rule {
  @extend .bg-gray-4;
  width: 1px;
  height: 20px;
  display: inline-block;
  margin: 0;
  padding: 0;
}

</style>
