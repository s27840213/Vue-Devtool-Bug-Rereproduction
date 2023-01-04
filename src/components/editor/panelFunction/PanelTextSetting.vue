<template lang="pug">
  div(class="text-setting" ref='body'
      @mousedown.capture="textInfoRecorder()")
    span(class="text-setting__title text-blue-1 label-lg") {{$t('NN0062')}}
    div(class="text-setting__row1")
      div(class="property-bar pointer record-selection" @click="openFontsPanel")
        img(v-if="props.font[0] !== '_'" class="text-setting__text-preview" :src="fontPrevUrl" @error="onError")
        span(v-else class="text-gray-2 text-setting__text-preview") {{ props.font.substr(1) }}
        svg-icon(class="pointer"
          :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      font-size-selector
      //- div(class="size-bar relative")
      //-   div(class="pointer"
      //-     @mousedown="fontSizeStepping(-step)") -
      //-   button(class="text-setting__range-input-button" @click="handleValueModal")
      //-     input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
      //-           @change="setSize" :value="fontSize")
      //-   div(class="pointer"
      //-     @mousedown="fontSizeStepping(step)") +
      //-   value-selector(v-if="openValueSelector"
      //-               :valueArray="fontSelectValue"
      //-               class="text-setting__value-selector"
      //-               v-click-outside="handleValueModal"
      //-               @update="handleValueUpdate")
    div(class="text-setting__row2")
      div(class="text-setting__color"
          v-hint="$t('NN0099')")
        div(class="color-slip record-selection"
          @click="handleColorModal")
          svg-icon(iconName="text-color"
                  iconWidth="24px"
                  iconColor="gray-1")
          div(class="color-slip__bar"
              :style="{'background-color': isValidHexColor(props.color) ? props.color : '#000000', 'border': props.color === '#FFFFFF' ? '1px solid #EEEFF4' : ''}")
        div(class="text-setting__color__hex text-left overflow-hidden")
          button(class="text-setting__range-input-button input-color" @click="handleColorModal")
            input(class="body-3 text-gray-2 record-selection input-color" type="text" ref="input-color"
            :value="props.color" @change="inputColor")
            //-  v-model.lazy="props.color v-model.lazy="props.color
        div(class="text-setting__color__copy-wrapper")
          svg-icon(class="text-setting__color__copy"
                  iconName="copy"
                  iconWidth="16px"
                  iconColor="gray-4"
                  @click.native="copyColor")
      div(class="action-bar action-bar--small flex-evenly")
        svg-icon(class="pointer record-selection btn-lh feature-button p-5"
          :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'"
          @click.native="openLineHeightSliderPopup('.btn-lh')"
          v-hint="$t('NN0110')")
        svg-icon(class="pointer record-selection btn-ls feature-button p-5"
          :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'"
          @click.native="openSpacingSliderPopup('.btn-ls')"
          v-hint="$t('NN0109')")
    div(class="action-bar flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        class="record-selection feature-button p-5"
        :class="{ pointer: iconClickable(icon), active: iconIsActived(icon) }"
        :key="`gp-action-icon-${index}`"
        :id="`icon-${icon}`"
        v-hint="hintMap[icon]"
        :iconName="icon" :iconWidth="'20px'" :iconColor="iconClickable(icon) ? 'gray-2' : 'gray-4'" @mousedown.native="onPropertyClick(icon)")
    div(class="action-bar flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        class="pointer feature-button p-5"
        :class="{ active: iconIsActived(icon) }"
        :key="`gp-action-icon-${index}`"
        v-hint="hintMap[icon]"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onParaPropsClick(icon)")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { IGroup, ILayer, IParagraph, ISpan, IText, ITmp } from '@/interfaces/layer'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import ValueSelector from '@/components/ValueSelector.vue'
import TextPropUtils, { fontSelectValue } from '@/utils/textPropUtils'
import { parseInt } from 'lodash'
import GeneralUtils from '@/utils/generalUtils'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import { ColorEventType, FunctionPanelType, PopupSliderEventType } from '@/store/types'
import colorUtils, { checkAndConvertToHex, isValidHexColor } from '@/utils/colorUtils'
import popupUtils from '@/utils/popupUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import pageUtils from '@/utils/pageUtils'
import brandkitUtils from '@/utils/brandkitUtils'
import FontSizeSelector from '@/components/input/FontSizeSelector.vue'
import editorUtils from '@/utils/editorUtils'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker,
    ValueSelector,
    FontSizeSelector
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
        lineHeight: { min: 0.5, max: 2.5 },
        fontSpacing: { min: -200, max: 800 },
        // fontSpacing: { min: -2, max: 8 },
        // lineHeight: { min: 0, max: 300 },
        opacity: { min: 0, max: 100 }
      },
      fontSelectValue: fontSelectValue,
      isOpenFontPanel: false,
      hintMap: {
        bold: `${this.$t('NN0101')}`,
        underline: `${this.$t('NN0102')}`,
        italic: `${this.$t('NN0103')}`,
        'font-vertical': `${this.$t('NN0104')}`,
        'text-align-left': `${this.$t('NN0105')}`,
        'text-align-center': `${this.$t('NN0106')}`,
        'text-align-right': `${this.$t('NN0107')}`,
        'text-align-justify': `${this.$t('NN0108')}`
      },
      fontPrevUrl: ''
    }
  },
  mounted() {
    this.getFontPrev()
    this.setCurrFunctionPanel(FunctionPanelType.textSetting)
    // TextPropUtils.updateTextPropsState()
    colorUtils.on(ColorEventType.text, (color: string) => {
      this.handleColorUpdate(color)
    })
    colorUtils.onStop(ColorEventType.text, () => {
      this.$nextTick(() => StepsUtils.record())
    })

    popupUtils.on(PopupSliderEventType.lineHeight, (value: number) => {
      this.setParagraphProp('lineHeight', value)
    })
    popupUtils.on(PopupSliderEventType.letterSpacing, (value: number) => {
      this.setParagraphProp('fontSpacing', value)
    })
    popupUtils.on(PopupSliderEventType.stop, () => {
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      if (currLayer.type === 'text' || (currLayer.type === 'group' && subLayerIdx !== -1 &&
        currLayer.layers[subLayerIdx].type === 'text')) {
        tiptapUtils.focus({ scrollIntoView: false })
      }
    })
  },
  destroyed() {
    this.setCurrFunctionPanel(FunctionPanelType.none)
    if (!this.isOpenFontPanel) {
      TextUtils.updateSelection(TextUtils.getNullSel(), TextUtils.getNullSel())
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      layerIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    scale(): number {
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      if (currLayer && currLayer.layers) {
        if (subLayerIdx === -1) {
          const scaleSet = (currLayer as IGroup).layers.reduce((p: Set<number>, c: ILayer) => {
            if (c.type === 'text') { p.add(c.styles.scale) }
            return p
          }, new Set())
          if (scaleSet.size === 1) {
            const [scale] = scaleSet
            return scale * currLayer.styles.scale
          }
          return NaN
        } else {
          return currLayer.styles.scale * (currLayer as IGroup).layers[subLayerIdx].styles.scale
        }
      }
      return currLayer.styles.scale
    },
    fontSize(): number | string {
      if (this.props.fontSize === '--' || Number.isNaN(this.scale)) {
        return '--'
      }
      return Math.round((this.scale as number) * this.props.fontSize * 10) / 10
    },
    step(): number {
      // const config = LayerUtils.getCurrConfig
      // return 1 / config.styles.scale
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      let scale = currLayer.styles.scale
      if (subLayerIdx !== -1) {
        scale *= (currLayer as IGroup).layers[subLayerIdx].styles.scale
      }
      return 1 / scale
    },
    hasCurveText(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      if (subLayerIdx !== -1) {
        return textShapeUtils.isCurvedText((currLayer as IGroup).layers[subLayerIdx].styles)
      }
      if (currLayer.type === 'text') {
        return textShapeUtils.isCurvedText(currLayer.styles)
      }
      return (currLayer as IGroup).layers.some(l => textShapeUtils.isCurvedText(l.styles))
    },
    hasOnlyVerticalText(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      if (subLayerIdx !== -1) {
        return ((currLayer as IGroup).layers[subLayerIdx] as IText).styles.writingMode.includes('vertical')
      }
      if (currLayer.type === 'text') {
        return (currLayer as IText).styles.writingMode.includes('vertical')
      }
      return !(currLayer as IGroup).layers.some(l => l.type === 'text' && !(l as IText).styles.writingMode.includes('vertical'))
    }
  },
  watch: {
    'props.font': function () {
      this.getFontPrev()
    }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType'
    }),
    ...mapMutations('text', {
      setCurrTextInfo: 'SET_textInfo'
    }),
    ...mapActions('brandkit', {
      refreshFontAsset: 'refreshFontAsset'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    getFontPrev() {
      const url = brandkitUtils.getFontPrevUrlByFontFamily(this.props.font, this.props.type, this.props.userId, this.props.assetId, 'prev-name')
      if (this.props.type === 'private' && url === '') {
        this.refreshFont(this.props.assetId)
      }
      this.fontPrevUrl = url
    },
    refreshFont(assetId: string) {
      const assetIndex = parseInt(assetId)
      this.refreshFontAsset({
        id: assetId,
        asset_index: assetIndex
      }).then((urlMap) => {
        if (!urlMap['prev-name']) return
        this.fontPrevUrl = urlMap['prev-name']
      })
    },
    onError() {
      if (this.props.type === 'private') {
        this.refreshFont(this.props.assetId)
      }
    },
    openFontsPanel() {
      this.isOpenFontPanel = true
      this.$emit('openFontsPanel')
    },
    inputColor(input: Event) {
      const target = input.target as HTMLInputElement
      if (isValidHexColor(target.value)) {
        target.value = target.value.toUpperCase()
        this.handleColorUpdate(target.value)
        StepsUtils.record()
      }
    },
    handleColorModal() {
      colorUtils.setCurrEvent(ColorEventType.text)
      colorUtils.setCurrColor(this.props.color)

      const input = this.$refs['input-color'] as HTMLInputElement
      input.focus()
      input.select()
      editorUtils.toggleColorSlips(true)
      this.updateLayerProps({ isEdited: true })
    },
    handleColorUpdate(color: string) {
      if (color === this.props.color) return
      const hex = checkAndConvertToHex(color)
      tiptapUtils.spanStyleHandler('color', hex)
    },
    handleValueModal() {
      this.openValueSelector = !this.openValueSelector
      if (this.openValueSelector) {
        const input = this.$refs['input-fontSize'] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    handleValueUpdate(value: number) {
      LayerUtils.initialLayerScale(pageUtils.currFocusPageIndex, this.layerIndex)
      tiptapUtils.spanStyleHandler('size', value)
      tiptapUtils.forceUpdate(true)
      TextPropUtils.updateTextPropsState({ fontSize: value.toString() })
      textEffectUtils.refreshSize()
    },
    handleSliderModal(modalName = '') {
      this.openSliderBar = modalName
      if (modalName === 'lineHeight' || modalName === 'fontSpacing' || modalName === 'opacity') {
        const input = this.$refs[`input-${modalName}`] as HTMLInputElement
        input.focus()
        input.select()
      }
    },
    iconIsActived(iconName: string): boolean {
      switch (iconName) {
        case 'bold':
          if (this.props.weight === 'bold') return true
          break
        case 'underline':
          if (this.props.decoration === 'underline') return true
          break
        case 'italic':
          if (this.props.style === 'italic') return true
          break
        case 'font-vertical':
          if (this.props.isVertical) return true
          break
        case 'text-align-left':
          if (this.props.textAlign === 'left') return true
          break
        case 'text-align-center':
          if (this.props.textAlign === 'center') return true
          break
        case 'text-align-right':
          if (this.props.textAlign === 'right') return true
          break
        case 'text-align-justify':
          if (this.props.textAlign === 'justify') return true
          break
      }
      return false
    },
    textInfoRecorder() {
      const currLayer = LayerUtils.getCurrLayer
      let config = currLayer
      let subLayerIndex
      if (currLayer.type === 'group') {
        subLayerIndex = (currLayer as IGroup).layers.findIndex(l => l.type === 'text' && l.active)
        if (subLayerIndex !== -1) {
          config = (currLayer as IGroup).layers[subLayerIndex] as IText
        } else {
          subLayerIndex = undefined
        }
      }
      this.setCurrTextInfo({ config, layerIndex: LayerUtils.layerIndex, subLayerIndex })
    },
    onPropertyClick(iconName: string) {
      if (iconName === 'font-vertical') {
        if (this.hasCurveText) return
        TextPropUtils.onPropertyClick(iconName, this.props.isVertical ? 0 : 1, this.sel.start, this.sel.end)
      } else {
        switch (iconName) {
          case 'bold':
            this.handleSpanPropClick('weight', ['bold', 'normal'])
            break
          case 'underline':
            if (this.hasOnlyVerticalText) return
            this.handleSpanPropClick('decoration', ['underline', 'none'])
            break
          case 'italic':
            if (this.hasOnlyVerticalText) return
            this.handleSpanPropClick('style', ['italic', 'normal'])
            break
        }
      }
      this.updateLayerProps({ isEdited: true })
      StepsUtils.record()
    },
    handleSpanPropClick(prop: string, pair: [string, string]) {
      const { getCurrLayer: currLayer, layerIndex, subLayerIdx } = LayerUtils
      const newPropVal = this.props[prop] === pair[0] ? pair[1] : pair[0]
      if ((currLayer.type === 'group' && subLayerIdx === -1) || currLayer.type === 'tmp') {
        const layers = (currLayer as IGroup | ITmp).layers
        // const newPropVal = layers
        //   .filter(l => l.type === 'text')
        //   .every(text => {
        //     return (text as IText).paragraphs.every(p => {
        //       return p.spans.every(s => s.styles[prop] === pair[0])
        //     })
        //   }) ? pair[1] : pair[0]

        layers.forEach((l, idx) => {
          if (l.type === 'text') {
            const paragraphs = GeneralUtils.deepCopy((l as IText).paragraphs) as IParagraph[]
            paragraphs.forEach(p => {
              p.spans.forEach(s => {
                if ((l as IText).styles.writingMode.includes('vertical') && (
                  (prop === 'decoration' && newPropVal === 'underline') ||
                  (prop === 'style' && newPropVal === 'italic')
                )) return
                s.styles[prop] = newPropVal
              })
            })
            LayerUtils.updateSubLayerProps(LayerUtils.pageIndex, layerIndex, idx, { paragraphs })
          }
        })
      } else {
        tiptapUtils.applySpanStyle(prop, newPropVal)
      }
      TextPropUtils.updateTextPropsState({ [prop]: newPropVal })
    },
    updateLayerProps(props: { [key: string]: string | number | boolean }) {
      const { getCurrLayer: currLayer, layerIndex, subLayerIdx, pageIndex } = LayerUtils
      switch (currLayer.type) {
        case 'text':
          LayerUtils.updateLayerProps(pageIndex, layerIndex, props)
          break
        case 'group':
          if (subLayerIdx !== -1) {
            LayerUtils.updateSubLayerProps(pageIndex, layerIndex, subLayerIdx, props)
          } else {
            const layers = currLayer.layers as ILayer[]
            layers.forEach((layer, index) => {
              if (layer.type === 'text') {
                LayerUtils.updateSubLayerProps(pageIndex, layerIndex, index, props)
              }
            })
          }
      }
    },
    onParaPropsClick(iconName: string) {
      switch (iconName) {
        case 'text-align-left':
          this.handleTextAlign('left')
          break
        case 'text-align-center':
          this.handleTextAlign('center')
          break
        case 'text-align-right':
          this.handleTextAlign('right')
          break
        case 'text-align-justify':
          this.handleTextAlign('justify')
          break
      }
      StepsUtils.record()
    },
    handleTextAlign(prop: string) {
      const { getCurrLayer: currLayer, layerIndex, subLayerIdx, pageIndex } = LayerUtils
      if ((currLayer.type === 'group' && subLayerIdx === -1) || currLayer.type === 'tmp') {
        const layers = (currLayer as IGroup | ITmp).layers
        layers.forEach((l, idx) => {
          if (l.type === 'text') {
            const paragraphs = GeneralUtils.deepCopy(l.paragraphs) as Array<IParagraph>
            paragraphs.forEach(p => (p.styles.align = prop))
            LayerUtils.updateSubLayerProps(pageIndex, layerIndex, idx, { paragraphs })
          }
        })
        TextPropUtils.updateTextPropsState({ textAlign: prop })
      } else {
        tiptapUtils.applyParagraphStyle('align', prop)
        TextPropUtils.updateTextPropsState({ textAlign: prop })
      }
    },
    fontSizeStepping(step: number, tickInterval = 100) {
      const startTime = new Date().getTime()
      const interval = setInterval(() => {
        if (new Date().getTime() - startTime > 500) {
          try {
            TextPropUtils.fontSizeStepping(step)
            textEffectUtils.refreshSize()
          } catch (error) {
            console.error(error)
            window.removeEventListener('mouseup', onmouseup)
            clearInterval(interval)
          }
        }
      }, tickInterval)

      const onmouseup = () => {
        window.removeEventListener('mouseup', onmouseup)
        if (new Date().getTime() - startTime < 500) {
          TextPropUtils.fontSizeStepping(step)
          textEffectUtils.refreshSize()
        }
        clearInterval(interval)
        tiptapUtils.agent(editor => {
          if (!editor.state.selection.empty) {
            LayerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
            StepsUtils.record()
          }
        })
      }

      window.addEventListener('mouseup', onmouseup)
    },
    isValidInt(value: string) {
      return value.match(/^-?\d+$/)
    },
    isValidFloat(value: string) {
      return value.match(/[+-]?\d+(\.\d+)?/)
    },
    isValidHexColor(value: string) {
      return isValidHexColor(value)
    },
    boundValue(value: number, min: number, max: number): string {
      if (value < min) return min.toString()
      else if (value > max) return max.toString()
      return value.toString()
    },
    setSize(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidFloat(value)) {
        LayerUtils.initialLayerScale(pageUtils.currFocusPageIndex, this.layerIndex)
        value = this.boundValue(parseFloat(value), this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        window.requestAnimationFrame(() => {
          tiptapUtils.spanStyleHandler('size', parseFloat(value))
          tiptapUtils.forceUpdate(true)
          TextPropUtils.updateTextPropsState({ fontSize: value })
          textEffectUtils.refreshSize()
        })
      }
    },
    setParagraphProp(prop: 'lineHeight' | 'fontSpacing', _value: number) {
      TextUtils.setParagraphProp(prop, _value)
    },
    onBlur() {
      TextUtils.updateSelection(TextUtils.getNullSel(), TextUtils.getNullSel())
      TextPropUtils.updateTextPropsState()
    },
    openLineHeightSliderPopup() {
      popupUtils.setCurrEvent(PopupSliderEventType.lineHeight)
      popupUtils.setSliderConfig(Object.assign({ value: this.props.lineHeight, noText: false, step: 0.01 }, MappingUtils.mappingMinMax('lineHeight')))
      popupUtils.openPopup('slider', {
        posX: 'right',
        target: '.btn-lh'
      })
    },
    openSpacingSliderPopup() {
      popupUtils.setCurrEvent(PopupSliderEventType.letterSpacing)
      popupUtils.setSliderConfig(Object.assign({ value: this.props.fontSpacing, noText: false, step: 1 }, MappingUtils.mappingMinMax('letterSpacing')))
      popupUtils.openPopup('slider', {
        posX: 'right',
        target: '.btn-ls'
      })
    },
    copyColor() {
      GeneralUtils.copyText(this.props.color)
        .then(() => {
          this.$notify({ group: 'copy', text: `${this.props.color} 已複製` })
        })
    },
    iconClickable(icon: string): boolean {
      if (icon === 'font-vertical') { // if there is any curveText, vertical mode is disabled
        return !this.hasCurveText
      }
      if (['underline', 'italic'].includes(icon)) { // if it is single vertical text or group with only veritical texts, underline and italic are disabled
        return !this.hasOnlyVerticalText
      }
      return true
    }
  }
})
</script>

<style lang="scss" scoped>
.text-setting {
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__text-preview {
    font-size: 14px;
  }
  &__row1 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: auto 1fr;
    column-gap: 15px;
    box-sizing: border-box;
    position: relative;
    > div:nth-child(1) {
      width: 135px;
      box-sizing: border-box;
      > img {
        width: 100px;
      }
    }
  }
  &__row2 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 3fr 2fr;
    column-gap: 15px;
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
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
    width: 135px;
    height: 50px;
    box-sizing: border-box;
    &__hex {
      > button {
        padding: 0;
        > input {
          padding: 0;
          text-align: center;
        }
      }
    }
    &__copy {
      cursor: pointer;
      &:hover {
        color: setColor(gray-3);
      }
    }
    &__copy-wrapper {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 3px;
    }
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
  &__range-input-button {
    width: fit-content;
  }
  &__font-stepper {
    display: flex;
    flex-direction: column;
  }
}
.color-slip {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 42px;
  cursor: pointer;
  margin-left: 9px;
  > svg {
    margin-top: 10px;
  }
  &__bar {
    margin-top: 2px;
    width: 24px;
    height: 4px;
    box-sizing: border-box;
  }
}

.center {
  text-align: center;
}

.right {
  right: 0px;
}

.relative {
  position: relative;
}
</style>
