<template lang="pug">
  div(class="text-setting" @mousedown="textRangeRecorder($event)" ref='body')
    span(class="text-setting__title text-blue-1 label-lg") Text Setting
    property-bar(class="pointer record-selection" @click.native="openFontsPanel")
      span(class="body-2 text-gray-2") {{ props.font }}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    div(class="text-setting__row2")
      property-bar(class="relative")
        svg-icon(class="pointer" @mousedown.native="fontSizeStepping(-2)"
          :iconName="'minus'" :iconColor="'gray-2'" :iconWidth="'25px'")
        button(class="text-setting__range-input-button" @click="handleValueModal")
          input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
                @change="setSize" v-model.lazy="props.fontSize")
        svg-icon(class="pointer" @mousedown.native="fontSizeStepping(2)"
          :iconName="'plus'" :iconColor="'gray-2'" :iconWidth="'25px'")
        value-selector(v-if="openValueSelector"
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
        div(class="full-width text-left ml-10")
          input(class="body-2 text-gray-2 record-selection" v-model.lazy="props.color" @click="handleColorModal")
      color-picker(v-if="openColorPicker"
        class="text-setting__color-picker"
        v-click-outside="handleColorModal"
        :currentColor="props.color"
        @update="handleColorUpdate")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        class="pointer"
        :key="`gp-action-icon-${index}`"
        :id="`icon-${icon}`"
        :style="propsBtnStyles(icon)"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
    action-bar(class="flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        class="pointer"
        :key="`gp-action-icon-${index}`"
        :style="propsBtnStyles(icon)"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
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
            type="range"
            @input="setSpacing")
      div(class="relative")
        property-bar
          button(class="text-setting__range-input-button" @click="handleSliderModal('opacity')")
            input(class="body-2 text-gray-2 record-selection" type="number" ref="input-opacity"
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
            type="range"
            @input="setOpacity")

</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { IText } from '@/interfaces/layer'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import ValueSelector from '@/components/ValueSelector.vue'
import TextPropUtils from '@/utils/textPropUtils'
import { parseInt, toNumber } from 'lodash'
import { ISelection } from '@/interfaces/text'
import GeneralUtils from '@/utils/generalUtils'

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
        fontSize: { min: 6, max: 120 },
        lineHeight: { min: 0, max: 300 },
        fontSpacing: { min: -200, max: 800 },
        opacity: { min: 0, max: 100 }
      }
    }
  },
  mounted() {
    // if (!TextUtils.getCurrLayer.layers) {
    // this.$store.commit('text/SET_default')
    TextPropUtils.updateTextPropsState()
    // }
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
    opacity: {
      get(): number {
        return this.getLayer(this.pageIndex, this.layerIndex).styles.opacity
      },
      set(value) {
        this.$store.commit('UPDATE_layerStyles', {
          pageIndex: this.pageIndex,
          layerIndex: this.layerIndex,
          styles: {
            opacity: value
          }
        })
      }
    }
  },
  methods: {
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
    },
    handleColorUpdate (color: string) {
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
      TextPropUtils.spanPropertyHandler('fontSize', value, this.sel.start, this.sel.end)
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
      // Only select without range or none selection exist, the prop-panel update.
      if (!this.sel || (TextUtils.isSel(this.sel.start) && TextUtils.isSel(this.sel.end))) {
        TextPropUtils.updateTextPropsState()
      }
    },
    fontSizeStepping(step: number) {
      const sel = TextUtils.getSelection()
      // if (sel) {
      //   const start = {
      //     pIndex: sel.start.pIndex,
      //     sIndex: sel.start.sIndex
      //   }
      //   const config = this.getLayer(this.pageIndex, this.layerIndex) as IText
      //   const fontSize = config.paragraphs[start.pIndex].spans[start.sIndex].styles.size
      //   TextPropUtils.spanPropertyHandler('fontSize', fontSize + step)
      //   TextPropUtils.updateTextPropsState()
      // }
      // let panelFontVal = this.sel.props.fontSize
      if (sel) {
        const { start, end } = sel
        console.log(start.sIndex)
        const finalStart = {} as ISelection
        const finalEnd = {} as ISelection
        const config = GeneralUtils.deepCopy(this.getLayer(this.pageIndex, this.layerIndex)) as IText
        console.log(end.sIndex)
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
              console.log('----------FIRST START------------')
              // Start-selection and the end-selection are exactly at the same span
              if ((start.pIndex === end.pIndex) && (start.sIndex === end.sIndex)) {
                Object.assign(currStart, start)
                Object.assign(currEnd, end)
              } else {
                Object.assign(currStart, start)
                Object.assign(currEnd, { pIndex: start.pIndex, sIndex: start.sIndex, offset: span.text.length })
              }
            } else if (pidx === end.pIndex && sidx === end.sIndex) {
              console.log('----------END START------------')
              console.log(pidx)
              console.log(sidx)
              console.log(start.sIndex)
              const endSidx = start.sIndex + 1 === finalStart.sIndex ? sidx + 1 : sidx
              Object.assign(currStart, { pIndex: pidx, sIndex: endSidx, offset: 0 })
              Object.assign(currEnd, { pIndex: pidx, sIndex: endSidx, offset: end.offset })
            } else {
              console.log('----------ELSE------------')
              console.log(pidx)
              console.log(sidx)
              Object.assign(currStart, { pIndex: pidx, sIndex: sidx, offset: 0 })
              Object.assign(currEnd, { pIndex: pidx, sIndex: sidx, offset: span.text.length })
            }
            TextPropUtils.fontSizeStepper(span.styles.size + step, currStart, currEnd)

            if (Object.keys(finalStart).length === 0) {
              Object.assign(finalStart, this.sel.start)
            }
          }
        }
        Object.assign(finalEnd, this.sel.end)
        this.$nextTick(() => {
          console.log(finalStart)
          console.log(finalEnd)
          TextUtils.focus(finalStart, finalEnd)
        })
      } else {
        const config = this.getLayer(this.pageIndex, this.layerIndex) as IText
        for (const [pidx, p] of config.paragraphs.entries()) {
          for (const [sidx, span] of p.spans.entries()) {
            const currStart = {
              pIndex: pidx,
              sIndex: sidx,
              offset: 0
            }
            const currEnd = {
              pIndex: pidx,
              sIndex: sidx,
              offset: span.text.length
            }
            TextPropUtils.fontSizeStepper(span.styles.size + step, currStart, currEnd)
          }
        }
      }
      TextPropUtils.updateTextPropsState()
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
      const sel = TextUtils.getSelection()
      if ((e.target as HTMLElement).classList.contains('record-selection')) {
        TextUtils.updateSelection(sel?.start ?? TextUtils.getNullSel(), sel?.end ?? TextUtils.getNullSel())
        console.log(this.sel.start)
      }
    },
    setSize(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidInt(value)) {
        value = this.boundValue(parseInt(value), this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        window.requestAnimationFrame(() => {
          TextPropUtils.spanPropertyHandler('fontSize', parseInt(value), this.sel.start, this.sel.end)
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
      background-color: #D9DBE1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid #3C64B1;
      transition: .2s;
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
