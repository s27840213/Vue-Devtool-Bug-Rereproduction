<template lang="pug">
  div(class="text-setting" @mousedown.capture="textRangeRecorder($event)" ref='body')
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer record-selection" @click.native="openFontsPanel")
      //- span(class="body-2 text-gray-2") {{ props.font }}
      img(v-if="props.font !== 'multi-fonts'" class="text-setting__text-preview" :src="getFontPrev")
      span(v-else class="text-gray-2 text-setting__text-preview") {{ props.font }}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar(class="relative")
        svg-icon(class="pointer" @mousedown.native="fontSizeStepping(-1)"
          :iconName="'minus'" :iconColor="'gray-2'" :iconWidth="'25px'")
        button(class="text-setting__range-input-button" @click="handleValueModal")
          input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
                @change="setSize" :value="fontSize")
        svg-icon(class="pointer" @mousedown.native="fontSizeStepping(1)"
          :iconName="'plus'" :iconColor="'gray-2'" :iconWidth="'25px'")
        value-selector(v-if="openValueSelector"
                    :valueArray="fontSelectValue"
                    class="text-setting__value-selector"
                    v-click-outside="handleValueModal"
                    @update="handleValueUpdate")
        //- div(class="text-setting__font-stepper")
        //- svg-icon(class="pointer"
        //-   :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="text-setting__color")
        div(class="color-slip record-selection"
          :style="{'background-color': isValidHexColor(props.color) ? props.color : '#000000'}"
          @click="handleColorModal")
        div(class="full-width text-left ml-10 overflow-hidden ")
          input(class="body-2 text-gray-2 record-selection" v-model.lazy="props.color" @click="handleColorModal")
      color-picker(v-if="openColorPicker"
        class="text-setting__color-picker"
        v-click-outside="handleColorModal"
        :currentColor="props.color"
        @update="handleColorUpdate")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        class="pointer record-selection"
        :key="`gp-action-icon-${index}`"
        :id="`icon-${icon}`"
        :style="propsBtnStyles(icon)"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        class="pointer"
        :key="`gp-action-icon-${index}`"
        :style="propsBtnStyles(icon)"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onParaPropsClick(icon)")
    div(class="text-setting__row5")
      div(class="relative")
        property-bar
          button(class="text-setting__range-input-button" @click="handleSliderModal('lineHeight')")
            input(class="body-2 text-gray-2 record-selection" type="text" ref="input-lineHeight"
                  :value="props.lineHeight" @change="setHeight($event, true)")
          svg-icon(class="pointer"
            :iconName="'font-height'" :iconWidth="'25px'" :iconColor="'gray-2'")
        div(v-if="openSliderBar === 'lineHeight'"
            class="text-setting__range-input-wrapper"
            v-click-outside="handleSliderModal")
          input(class="text-setting__range-input"
            :value="props.lineHeight * 100"
            :max="fieldRange.lineHeight.max"
            :min="fieldRange.lineHeight.min"
            v-ratio-change
            type="range"
            @input="setHeight")
      div(class="relative")
        property-bar
          button(class="text-setting__range-input-button" @click="handleSliderModal('fontSpacing')")
            input(class="body-2 text-gray-2 record-selection" type="text" ref="input-fontSpacing"
                  :value="props.fontSpacing" @change="setSpacing")
          svg-icon(class="pointer"
            :iconName="'font-spacing'" :iconWidth="'25px'" :iconColor="'gray-2'")
        div(v-if="openSliderBar === 'fontSpacing'"
            class="text-setting__range-input-wrapper"
            v-click-outside="handleSliderModal")
          input(class="text-setting__range-input"
            :value="props.fontSpacing"
            :max="fieldRange.fontSpacing.max"
            :min="fieldRange.fontSpacing.min"
            v-ratio-change
            type="range"
            @input="setSpacing")
      div(class="relative")
        property-bar
          button(class="text-setting__range-input-button" @click="handleSliderModal('opacity')")
            input(class="body-2 text-gray-2 record-selection" type="text" ref="input-opacity"
                  :value="props.opacity" @change="setOpacity")
          svg-icon(class="pointer"
            :iconName="'transparency'" :iconWidth="'25px'" :iconColor="'gray-2'")
        div(v-if="openSliderBar === 'opacity'"
            class="text-setting__range-input-wrapper right"
            v-click-outside="handleSliderModal")
          input(class="text-setting__range-input"
            :value="props.opacity"
            :max="fieldRange.opacity.max"
            :min="fieldRange.opacity.min"
            v-ratio-change
            type="range"
            @input="setOpacity")

</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { ILayer, IText } from '@/interfaces/layer'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import ValueSelector from '@/components/ValueSelector.vue'
import TextPropUtils, { fontSelectValue } from '@/utils/textPropUtils'
import { parseInt, toNumber } from 'lodash'
import { ISelection } from '@/interfaces/text'
import GeneralUtils from '@/utils/generalUtils'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import GroupUtils from '@/utils/groupUtils'
import { FunctionPanelType } from '@/store/types'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker,
    ValueSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openColorPicker: false,
      openValueSelector: false,
      openSliderBar: 'center',
      fieldRange: {
        fontSize: { min: 6, max: 800 },
        lineHeight: { min: 0, max: 300 },
        fontSpacing: { min: -200, max: 800 },
        opacity: { min: 0, max: 100 }
      },
      fontSelectValue: fontSelectValue
    }
  },
  mounted() {
    this.setCurrFunctionPanel(FunctionPanelType.textSetting)
    TextPropUtils.updateTextPropsState()
  },
  destroyed() {
    this.setCurrFunctionPanel(FunctionPanelType.none)
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapGetters({
      pageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      layerIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    getFontPrev(): string {
      return `https://template.vivipic.com/font/${this.props.font}/prev-name`
    },
    scale(): number {
      const layer = this.getLayer(this.pageIndex, this.layerIndex)
      if (layer && layer.layers) {
        const scaleSet = layer.layers.reduce((p: Set<number>, c: ILayer) => {
          if (c.type === 'text') { p.add(c.styles.scale) }
          return p
        }, new Set())
        if (scaleSet.size === 1) {
          const [scale] = scaleSet
          return scale * layer.styles.scale
        }
        return NaN
      }
      return layer ? layer.styles.scale : 1
    },
    fontSize(): number | string {
      if (this.props.fontSize === '--' || Number.isNaN(this.scale)) {
        return '--'
      }
      return Math.round((this.scale as number) * this.props.fontSize * 10) / 10
    }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    openFontsPanel() {
      this.$emit('openFontsPanel')
    },
    handleColorModal() {
      this.openColorPicker = !this.openColorPicker
      if (!this.openColorPicker) {
        TextUtils.focus(this.sel.start, this.sel.end)
      }
      StepsUtils.record()
    },
    handleColorUpdate (color: string) {
      if (color === this.props.color) return

      const nan = {
        pIndex: NaN,
        sIndex: NaN,
        offset: NaN
      }
      if (this.currSelectedInfo.layers.length === 1) {
        const isSelCollapse = (() => {
          for (const [k, v] of Object.entries(this.sel.start)) {
            if (this.sel.end[k] !== v) return false
          }
          return true
        })()
        window.requestAnimationFrame(() => {
          TextPropUtils.spanPropertyHandler('color', color, this.sel.start, isSelCollapse ? nan : this.sel.end)
        })
      } else {
        for (let i = 0; i < this.currSelectedInfo.layers.length; i++) {
          const layer = this.currSelectedInfo.layers[i]
          if (layer.type === 'text') {
            window.requestAnimationFrame(() => {
              TextPropUtils.spanPropertyHandler('color', color, nan, nan, i)
            })
          }
        }
      }
      TextPropUtils.updateTextPropsState({ color })
    },
    handleValueModal() {
      this.openValueSelector = !this.openValueSelector
      if (this.openValueSelector) {
        const input = this.$refs['input-fontSize'] as HTMLInputElement
        input.focus()
        input.select()
      } else {
        this.onBlur()
      }
    },
    handleValueUpdate(value: number) {
      LayerUtils.initialLayerScale(this.pageIndex, this.layerIndex)
      if (Number.isNaN(this.sel.start.offset)) {
        TextUtils.updateLayerTextSize({ size: value })
        setTimeout(() => {
          // reset layer width for getting the right position of image element
          LayerUtils.resetLayerWidth(this.pageIndex, this.layerIndex)
        }, 0)
      } else {
        TextPropUtils.spanPropertyHandler('fontSize', value, this.sel.start, this.sel.end)
      }
      TextPropUtils.updateTextPropsState({ fontSize: value.toString() })
    },
    handleSliderModal(modalName = '') {
      this.openSliderBar = modalName
      if (modalName === 'lineHeight' || modalName === 'fontSpacing' || modalName === 'opacity') {
        const input = this.$refs[`input-${modalName}`] as HTMLInputElement
        input.focus()
        input.select()
      } else {
        this.onBlur()
      }
    },
    propsBtnStyles(iconName: string) {
      const origin = { 'background-color': '', 'border-radius': '' }
      const hitStyle = { 'background-color': '#c2d6ff', 'border-radius': '2.5px' }
      switch (iconName) {
        case 'bold':
          if (this.props.weight === 'bold') return hitStyle
          break
        case 'underline':
          if (this.props.decoration === 'underline') return hitStyle
          break
        case 'italic':
          if (this.props.style === 'italic') return hitStyle
          break
        case 'font-vertical':
          if (this.props.isVertical) return hitStyle
          break
        case 'text-align-left':
          if (this.props.textAlign === 'left') return hitStyle
          break
        case 'text-align-center':
          if (this.props.textAlign === 'center') return hitStyle
          break
        case 'text-align-right':
          if (this.props.textAlign === 'right') return hitStyle
      }
      return origin
    },
    onPropertyClick(iconName: string) {
      TextPropUtils.onPropertyClick(iconName)
      /**
       *  Only select with range or none selection exist, the prop-panel update.
       * */
      if (!this.sel || (TextUtils.isSel(this.sel.start) && TextUtils.isSel(this.sel.end)) || iconName === 'font-vertical') {
        TextPropUtils.updateTextPropsState()
      }
      StepsUtils.record()
    },
    onParaPropsClick(iconName: string) {
      TextPropUtils.paragraphPropsHandler(iconName)
      if (!this.sel || (TextUtils.isSel(this.sel.start) && TextUtils.isSel(this.sel.end))) {
        TextPropUtils.updateTextPropsState()
      }
      StepsUtils.record()
    },
    fontSizeStepping(step: number, tickInterval = 100) {
      const startTime = new Date().getTime()
      const interval = setInterval(() => {
        const endTime = new Date().getTime()
        if (endTime - startTime > 500) {
          this.fontSizeSteppingHandler(step)
        }
      }, tickInterval)
      const onmouseup = () => {
        const endTime = new Date().getTime()
        if (endTime - startTime < 500) {
          this.fontSizeSteppingHandler(step)
        }
        clearInterval(interval)
        StepsUtils.record()
        window.removeEventListener('onmouseup', onmouseup)
      }
      window.addEventListener('mouseup', onmouseup)
    },
    fontSizeSteppingHandler(step: number) {
      const sel = TextUtils.getSelection()
      LayerUtils.initialLayerScale(this.pageIndex, this.layerIndex)
      if (sel) {
        const { start, end } = sel
        const finalStart = {} as ISelection
        const finalEnd = {} as ISelection
        const config = GeneralUtils.deepCopy(this.getLayer(this.pageIndex, this.layerIndex)) as IText
        for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
          const p = config.paragraphs[pidx]
          for (let sidx = 0; sidx < p.spans.length; sidx++) {
            const span = p.spans[sidx]
            const currStart = {} as ISelection
            const currEnd = {} as ISelection
            if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) {
              continue
            }

            // PIndex, sIndex both are at the start-selection
            if (pidx === start.pIndex && sidx === start.sIndex) {
              // Start-selection and the end-selection are exactly at the same span
              if ((start.pIndex === end.pIndex) && (start.sIndex === end.sIndex)) {
                Object.assign(currStart, start)
                Object.assign(currEnd, end)
              } else {
                Object.assign(currStart, start)
                Object.assign(currEnd, { pIndex: start.pIndex, sIndex: start.sIndex, offset: span.text.length })
              }
            } else if (pidx === end.pIndex && sidx === end.sIndex) {
              const endSidx = start.pIndex === end.pIndex && start.sIndex + 1 === finalStart.sIndex ? sidx + 1 : sidx
              Object.assign(currStart, { pIndex: pidx, sIndex: endSidx, offset: 0 })
              Object.assign(currEnd, { pIndex: pidx, sIndex: endSidx, offset: end.offset })
            } else {
              const endSidx = start.pIndex === pidx && start.sIndex + 1 === finalStart.sIndex ? sidx + 1 : sidx
              Object.assign(currStart, { pIndex: pidx, sIndex: endSidx, offset: 0 })
              Object.assign(currEnd, { pIndex: pidx, sIndex: endSidx, offset: span.text.length })
            }
            TextPropUtils.fontSizeStepper(span.styles.size + step, currStart, currEnd)

            if (Object.keys(finalStart).length === 0) {
              Object.assign(finalStart, this.sel.start)
            }
          }
        }
        Object.assign(finalEnd, this.sel.end)
        const finalSel = TextPropUtils.spanMerger(TextPropUtils.getCurrLayer.paragraphs, finalStart, finalEnd)
        this.$nextTick(() => {
          TextUtils.focus(finalSel[0], finalSel[1])
          TextUtils.updateSelection(finalSel[0], finalSel[1])
          TextPropUtils.updateTextPropsState()
        })
      } else {
        TextUtils.updateLayerTextSize({ diff: step })
        TextPropUtils.updateTextPropsState()
      }
    },
    isValidInt(value: string) {
      return value.match(/^-?\d+$/)
    },
    isValidFloat(value: string) {
      return value.match(/[+-]?\d+(\.\d+)?/)
    },
    isValidHexColor(value: string) {
      return value.match(/^#[0-9A-F]{6}$/)
    },
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    textRangeRecorder(e: MouseEvent) {
      console.log('text range!')
      const sel = TextUtils.getSelection()
      if ((e.target as HTMLElement).classList.contains('record-selection')) {
        TextUtils.updateSelection(sel?.start ?? TextUtils.getNullSel(), sel?.end ?? TextUtils.getNullSel())
      }
    },
    setSize(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidFloat(value)) {
        LayerUtils.initialLayerScale(this.pageIndex, this.layerIndex)
        value = this.boundValue(parseFloat(value), this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        window.requestAnimationFrame(() => {
          if (Number.isNaN(this.sel.start.offset)) {
            TextUtils.updateLayerTextSize({ size: parseFloat(value) })
            setTimeout(() => {
              // reset layer width for getting the right position of image element
              LayerUtils.resetLayerWidth(this.pageIndex, this.layerIndex)
            }, 0)
          } else {
            TextPropUtils.spanPropertyHandler('fontSize', parseFloat(value), this.sel.start, this.sel.end)
          }
          TextPropUtils.updateTextPropsState({ fontSize: value })
        })
      }
    },
    setSpacing(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidInt(value)) {
        value = this.boundValue(parseInt(value), this.fieldRange.fontSpacing.min, this.fieldRange.fontSpacing.max)
        window.requestAnimationFrame(() => {
          TextPropUtils.paragraphPropsHandler('fontSpacing', parseInt(value) / 1000, this.sel.start, this.sel.end)
          TextPropUtils.updateTextPropsState({ fontSpacing: value })
        })
      }
    },
    setHeight(e: Event, isInput?: boolean) {
      let { value } = e.target as HTMLInputElement
      if (isInput && this.isValidFloat(value)) {
        value = (parseFloat(value) * 100).toString()
      }
      if (this.isValidInt(value)) {
        value = this.boundValue(parseInt(value), this.fieldRange.lineHeight.min, this.fieldRange.lineHeight.max)
        window.requestAnimationFrame(() => {
          TextPropUtils.paragraphPropsHandler('lineHeight', toNumber((parseInt(value) / 100).toFixed(2)), this.sel.start, this.sel.end)
          TextPropUtils.updateTextPropsState({ lineHeight: toNumber((parseInt(value) / 100).toFixed(2)) })
        })
      }
    },
    setColor(e: Event) {
      const { value } = e.target as HTMLInputElement
      if (this.isValidHexColor(value)) {
        window.requestAnimationFrame(() => {
          TextPropUtils.spanPropertyHandler('color', this.props.color, this.sel.start, this.sel.end)
          TextPropUtils.updateTextPropsState({ color: value })
        })
      }
    },
    setOpacity(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidInt(value)) {
        value = this.boundValue(parseInt(value), this.fieldRange.opacity.min, this.fieldRange.opacity.max)
        if (!this.isGroup) {
          if (this.currSelectedInfo.layers.length === 1) {
            this.$store.commit('UPDATE_layerStyles', {
              pageIndex: this.pageIndex,
              layerIndex: this.currSelectedIndex,
              styles: {
                opacity: parseInt(value)
              }
            })
          } else {
            this.$store.commit('UPDATE_selectedLayersStyles', {
              styles: {
                opacity: parseInt(value)
              }
            })
          }
        } else {
          this.$store.commit('UPDATE_groupLayerStyles', {
            styles: {
              opacity: parseInt(value)
            }
          })
        }
        TextPropUtils.updateTextPropsState({ opacity: parseInt(value) })
      }
    },
    onBlur() {
      console.log('onBlur')
      TextUtils.updateSelection(TextUtils.getNullSel(), TextUtils.getNullSel())
      TextPropUtils.updateTextPropsState()
    }
  }
})
</script>

<style lang="scss" scoped>
.text-setting {
  text-align: left;
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }

  &__row2 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 2fr 3fr;
    column-gap: 20px;
    position: relative;
  }
  &__row5 {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 10px;
    column-gap: 20px;
  }
  &__color {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
  }
  &__color-picker {
    position: absolute;
    z-index: 10;
    right: 0px;
    top: 0px;
  }
  &__value-selector {
    position: absolute;
    z-index: 9;
    transform: translate(45%);
    top: 75%;
  }
  &__range-input-wrapper {
    position: absolute;
    z-index: 9;
    // top: -20px;
    // left: auto;
    right: auto;
    padding: auto;
    margin-top: -7px;
    width: 135px;
    height: 35px;
    background-color: #ffffff;
    background-color: white;
    box-shadow: 0 0 0 1px rgb(64 87 109 / 7%), 0 2px 12px rgb(53 71 90 / 20%);
    border: 1px solid #d9dbe1;
    border-radius: 3px;
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
  }
  &__range-input-button {
    width: fit-content;
  }
  &__font-stepper {
    display: flex;
    flex-direction: column;
  }
  &__text-preview {
    height: 25px;
    display: inline-flex;
    align-items: center;
  }
}
.color-slip {
  height: 100%;
  width: 40%;
}

.center {
  text-align: center;
  margin: auto;
}

.right {
  right: 0px;
}

.relative {
  position: relative;
}
</style>
