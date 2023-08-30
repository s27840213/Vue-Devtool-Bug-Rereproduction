<template lang="pug">
div(class="text-setting" ref='body')
  span(class="text-setting__title text-blue-1 text-H6") {{$t('NN0062')}}
  div(class="text-setting__row1")
    property-bar(class="pointer record-selection" @click="openFontsPanel")
      img(v-if="props.font[0] !== '_'" class="text-setting__text-preview" :src="fontPrevUrl" @error="onError")
      span(v-else class="text-gray-2 text-setting__text-preview") {{ props.font.substr(1) }}
      svg-icon(class="pointer"
        :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
    font-size-selector
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
                @click="copyColor")
    div(class="action-bar action-bar--small flex-evenly")
      svg-icon(class="pointer record-selection btn-lh feature-button p-5"
        :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'"
        @click="openLineHeightSliderPopup()"
        v-hint="$t('NN0110')")
      svg-icon(class="pointer record-selection btn-ls feature-button p-5"
        :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'"
        @click="openSpacingSliderPopup()"
        v-hint="$t('NN0109')")
  div(class="action-bar flex-evenly")
    svg-icon(v-for="(icon,index) in mappingIcons('font')"
      class="record-selection feature-button p-5"
      :class="{ pointer: iconClickable(icon), active: iconIsActived(icon) }"
      :key="`gp-action-icon-${index}`"
      :id="`icon-${icon}`"
      v-hint="hintMap[icon]"
      :iconName="icon" :iconWidth="'20px'" :iconColor="iconClickable(icon) ? 'gray-2' : 'gray-4'" @mousedown="onPropertyClick(icon)")
  div(class="action-bar flex-evenly")
    svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
      class="pointer feature-button p-5"
      :class="{ active: iconIsActived(icon) }"
      :key="`gp-action-icon-${index}`"
      v-hint="hintMap[icon]"
      :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown="onParaPropsClick(icon)")
</template>

<script lang="ts">
import FontSizeSelector from '@/components/input/FontSizeSelector.vue'
import { IGroup, ILayer, IParagraph, IText, ITmp } from '@/interfaces/layer'
import { ColorEventType, FunctionPanelType, PopupSliderEventType } from '@/store/types'
import brandkitUtils from '@/utils/brandkitUtils'
import colorUtils, { checkAndConvertToHex, isValidHexColor } from '@/utils/colorUtils'
import editorUtils from '@/utils/editorUtils'
import GeneralUtils from '@/utils/generalUtils'
import LayerUtils from '@/utils/layerUtils'
import MappingUtils from '@/utils/mappingUtils'
import popupUtils from '@/utils/popupUtils'
import StepsUtils from '@/utils/stepsUtils'
import TextPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import TextUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { notify } from '@kyvg/vue3-notification'
import vClickOutside from 'click-outside-vue3'
import { parseInt } from 'lodash'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    FontSizeSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  emits: ['openFontsPanel', 'toggleColorPanel'],
  data() {
    return {
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
      } as Record<string, string>,
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
  unmounted() {
    this.setCurrFunctionPanel(FunctionPanelType.none)
    if (!this.isOpenFontPanel) {
      TextUtils.updateSelection(TextUtils.getNullSel(), TextUtils.getNullSel())
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      layerIndex: 'getCurrSelectedIndex',
    }),
    hasCurveText(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      if (subLayerIdx !== -1) {
        return textShapeUtils.isCurvedText(((currLayer as IGroup).layers[subLayerIdx] as IText).styles.textShape)
      }
      if (currLayer.type === 'text') {
        return textShapeUtils.isCurvedText(currLayer.styles.textShape)
      }
      return (currLayer as IGroup).layers.some(l => l.type === 'text' && textShapeUtils.isCurvedText(l.styles.textShape))
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
    },
    hasTextFill(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      if (subLayerIdx !== -1) {
        return ((currLayer as IGroup).layers[subLayerIdx] as IText).styles.textFill.name !== 'none'
      }
      if (currLayer.type === 'text') {
        return (currLayer as IText).styles.textFill.name !== 'none'
      }
      return (currLayer as IGroup).layers.some(l => l.type === 'text' && (l as IText).styles.textFill.name !== 'none')
    },
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
    ...mapActions('brandkit', {
      refreshFontAsset: 'refreshFontAsset'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    getFontPrev() {
      const url = brandkitUtils.getFontPrevUrlByFontFamily(brandkitUtils.fillFontVer({
        fontFamily: this.props.font,
        type: this.props.type,
        userId: this.props.userId,
        assetId: this.props.assetId
      }), 'prev-name')
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
    iconIsActived(iconName: string): boolean {
      switch (iconName) {
        case 'bold':
          if (this.props.weight === 'bold') return true
          break
        case 'underline':
          if (this.props.decoration === 'underline' && !this.hasTextFill) return true
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
    isValidHexColor(value: string) {
      return isValidHexColor(value)
    },
    setParagraphProp(prop: 'lineHeight' | 'fontSpacing', _value: number) {
      TextUtils.setParagraphProp(prop, _value)
    },
    openLineHeightSliderPopup() {
      popupUtils.setCurrEvent(PopupSliderEventType.lineHeight)
      popupUtils.setSliderConfig(Object.assign({ value: this.props.lineHeight, step: 0.01, width: GeneralUtils.getSliderWidth() }, MappingUtils.mappingMinMax('lineHeight')))
      popupUtils.openPopup('slider', {
        posX: 'right',
        target: '.text-setting__row2'
      })
    },
    openSpacingSliderPopup() {
      popupUtils.setCurrEvent(PopupSliderEventType.letterSpacing)
      popupUtils.setSliderConfig(Object.assign({ value: this.props.fontSpacing, step: 1, width: GeneralUtils.getSliderWidth() }, MappingUtils.mappingMinMax('letterSpacing')))
      popupUtils.openPopup('slider', {
        posX: 'right',
        target: '.text-setting__row2'
      })
    },
    copyColor() {
      GeneralUtils.copyText(this.props.color)
        .then(() => {
          notify({ group: 'copy', text: `${this.props.color} 已複製` })
        })
    },
    iconClickable(icon: string): boolean {
      switch (icon) {
        case 'font-vertical':
          return !this.hasCurveText
        case 'underline':
          return !(this.hasOnlyVerticalText || this.hasTextFill)
        case 'italic':
          return !this.hasOnlyVerticalText
        default:
          return true
      }
    },
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
