<template lang="pug">
div(class="text-setting" ref='body'
    @mousedown.capture="textInfoRecorder()")
  //- span(class="text-setting__title text-blue-1 label-lg") {{$t('NN0062')}}
  div(class="text-setting__btn-row")
    div(class="text-setting__btn")
      svg-icon(iconName="text" iconWidth="24px" iconColor="gray-4")
      span 字型
    div(class="text-setting__btn" @click="openPanel('size')")
      svg-icon(iconName="vertical" iconWidth="24px" iconColor="gray-4")
      span 大小
    div(class="text-setting__btn")
      svg-icon(iconName="test" iconWidth="24px" iconColor="gray-4")
      span 顏色
    div(class="text-setting__btn")
      svg-icon(iconName="font-spacing" iconWidth="24px" iconColor="gray-4")
      span 空白
    div(class="text-setting__btn")
      svg-icon(iconName="bold" iconWidth="24px" iconColor="gray-4")
      span 格式
    div(class="text-setting__btn")
      svg-icon(iconName="text-align-left" iconWidth="24px" iconColor="gray-4")
      span 對齊
  transition(name="slide")
    div(v-if="openedPanel!==''" class="text-setting__config-panel")
      div(class="text-setting__config-panel__close" @click="closePanel")
        svg-icon(iconName="close" iconWidth="24px" iconColor="white")
      div(v-if="openedPanel==='size'" class="text-setting__config-panel__size")
  //- div(class="text-setting__row1")
  //-   div(class="property-bar pointer record-selection" @click="openFontsPanel")
  //-     img(v-if="props.font[0] !== '_'" class="text-setting__text-preview" :src="getFontPrev")
  //-     span(v-else class="text-gray-2 text-setting__text-preview") {{ props.font.substr(1) }}
  //-     svg-icon(class="pointer"
  //-       :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
  //-   div(class="size-bar relative")
  //-     div(class="pointer"
  //-       @mousedown="fontSizeStepping(-step)") -
  //-     button(class="text-setting__range-input-button" @click="handleValueModal")
  //-       input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
  //-             @change="setSize" :value="fontSize")
  //-     div(class="pointer"
  //-       @mousedown="fontSizeStepping(step)") +
  //-     value-selector(v-if="openValueSelector"
  //-                 :valueArray="fontSelectValue"
  //-                 class="text-setting__value-selector"
  //-                 v-click-outside="handleValueModal"
  //-                 @update="handleValueUpdate")
  //- div(class="text-setting__row2")
  //-   div(class="text-setting__color"
  //-       v-hint="$t('NN0099')")
  //-     div(class="color-slip record-selection"
  //-       @click="handleColorModal")
  //-       svg-icon(iconName="text-color"
  //-               iconWidth="24px"
  //-               iconColor="gray-1")
  //-       div(class="color-slip__bar"
  //-           :style="{'background-color': isValidHexColor(props.color) ? props.color : '#000000', 'border': props.color === '#FFFFFF' ? '1px solid #EEEFF4' : ''}")
  //-     div(class="text-setting__color__hex text-left overflow-hidden")
  //-       button(class="text-setting__range-input-button input-color" @click="handleColorModal")
  //-         input(class="body-2 text-gray-2 record-selection input-color" type="text" ref="input-color"
  //-         :value="props.color" @change="inputColor")
  //-         //-  v-model.lazy="props.color v-model.lazy="props.color
  //-     svg-icon(class="text-setting__color__copy"
  //-             iconName="copy"
  //-             iconWidth="16px"
  //-             iconColor="gray-4"
  //-             @click.native="copyColor")
  //-   div(class="action-bar action-bar--small flex-evenly")
  //-     svg-icon(class="pointer record-selection btn-lh"
  //-       :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'"
  //-       @click.native="openLineHeightSliderPopup('.btn-lh')"
  //-       v-hint="$t('NN0109')")
  //-     svg-icon(class="pointer record-selection btn-ls"
  //-       :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'"
  //-       @click.native="openSpacingSliderPopup('.btn-ls')"
  //-       v-hint="$t('NN0110')")
  //- div(class="action-bar flex-evenly")
  //-   svg-icon(v-for="(icon,index) in mappingIcons('font')"
  //-     class="record-selection"
  //-     :class="{ pointer: icon !== 'font-vertical' || !hasCurveText }"
  //-     :key="`gp-action-icon-${index}`"
  //-     :id="`icon-${icon}`"
  //-     :style="propsBtnStyles(icon)"
  //-     v-hint="hintMap[icon]"
  //-     :iconName="icon" :iconWidth="'20px'" :iconColor="icon === 'font-vertical' && hasCurveText ? 'gray-4' : 'gray-2'" @mousedown.native="onPropertyClick(icon)")
  //- div(class="action-bar flex-evenly")
  //-   svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
  //-     class="pointer"
  //-     :key="`gp-action-icon-${index}`"
  //-     :style="propsBtnStyles(icon)"
  //-     v-hint="hintMap[icon]"
  //-     :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onParaPropsClick(icon)")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { IGroup, ILayer, IParagraph, ISpan, IText, ITmp } from '@/interfaces/layer'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import ValueSelector from '@/components/ValueSelector.vue'
import TextPropUtils, { fontSelectValue } from '@/utils/textPropUtils'
import { parseInt, toNumber } from 'lodash'
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

export default defineComponent({
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
      openedPanel: ''
    }
  },
  mounted() {
    this.setCurrFunctionPanel(FunctionPanelType.textSetting)
    // TextPropUtils.updateTextPropsState()
    colorUtils.on(ColorEventType.text, (color: string) => {
      this.handleColorUpdate(color)
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
        (currLayer as IGroup).layers[subLayerIdx].type === 'text)')) {
        tiptapUtils.focus({ scrollIntoView: false })
      }
    })
  },
  unmounted() {
    this.setCurrFunctionPanel(FunctionPanelType.none)
    this.$emit('toggleConfigPanel', false)
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
    getFontPrev(): string {
      return `https://template.vivipic.com/font/${this.props.font}/prev-name`
    },
    scale(): number {
      const layer = this.getLayer(pageUtils.currFocusPageIndex, this.layerIndex)
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
    }
  },
  methods: {
    ...mapMutations({
      setCurrFunctionPanel: 'SET_currFunctionPanelType'
    }),
    ...mapMutations('text', {
      setCurrTextInfo: 'SET_textInfo'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    openFontsPanel() {
      this.isOpenFontPanel = true
      this.$emit('openFontsPanel')
    },
    openPanel(panelType: string) {
      this.openedPanel = panelType
      this.$emit('toggleConfigPanel', panelType !== '')
    },
    closePanel() {
      this.openPanel('')
    },
    inputColor(input: Event) {
      const target = input.target as HTMLInputElement
      if (isValidHexColor(target.value)) {
        target.value = target.value.toUpperCase()
        this.handleColorUpdate(target.value)
      }
    },
    handleColorModal() {
      colorUtils.setCurrEvent(ColorEventType.text)
      colorUtils.setCurrColor(this.props.color)

      const input = this.$refs['input-color'] as HTMLInputElement
      input.focus()
      input.select()
      this.$emit('toggleColorPanel', true)
      this.updateLayerProps({ isEdited: true })
    },
    handleColorUpdate(color: string) {
      if (color === this.props.color) return
      const { subLayerIdx, getCurrLayer: currLayer, layerIndex } = LayerUtils

      switch (currLayer.type) {
        case 'text':
          tiptapUtils.applySpanStyle('color', checkAndConvertToHex(color))
          break
        case 'tmp':
        case 'group':
          if (subLayerIdx === -1 || !(currLayer as IGroup).layers[subLayerIdx].contentEditable) {
            TextPropUtils.applyPropsToAll('span', { color }, layerIndex, subLayerIdx)
            if (subLayerIdx !== -1) {
              tiptapUtils.updateHtml()
            }
          } else {
            tiptapUtils.applySpanStyle('color', checkAndConvertToHex(color))
          }
      }
      StepsUtils.record()
      TextPropUtils.updateTextPropsState({ color })
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
      tiptapUtils.applySpanStyle('size', value)
      tiptapUtils.agent(editor => {
        LayerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
        StepsUtils.record()
      })
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
          break
        case 'text-align-justify':
          if (this.props.textAlign === 'justify') return hitStyle
      }
      return origin
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
            this.handleSpanPropClick('decoration', ['underline', 'none'])
            break
          case 'italic':
            this.handleSpanPropClick('style', ['italic', 'normal'])
            break
        }
      }
      this.updateLayerProps({ isEdited: true })
      StepsUtils.record()
    },
    handleSpanPropClick(prop: string, pair: [string, string]) {
      const { getCurrLayer: currLayer, layerIndex, subLayerIdx } = LayerUtils
      if ((currLayer.type === 'group' && subLayerIdx === -1) || currLayer.type === 'tmp') {
        const layers = (currLayer as IGroup | ITmp).layers
        const newPropVal = layers
          .filter(l => l.type === 'text')
          .every(text => {
            return (text as IText).paragraphs.every(p => {
              return p.spans.every(s => s.styles[prop] === pair[0])
            })
          }) ? pair[1] : pair[0]

        layers.forEach((l, idx) => {
          if (l.type === 'text') {
            const paragraphs = GeneralUtils.deepCopy((l as IText).paragraphs) as IParagraph[]
            paragraphs.forEach(p => {
              p.spans.forEach(s => {
                s.styles[prop] = newPropVal
              })
            })
            LayerUtils.updateSubLayerProps(LayerUtils.pageIndex, layerIndex, idx, { paragraphs })
          }
        })
      } else {
        tiptapUtils.applySpanStyle(prop, (this.props[prop] === pair[0]) ? pair[1] : pair[0])
        TextPropUtils.updateTextPropsState({ [prop]: (this.props[prop] === pair[0]) ? pair[1] : pair[0] })
      }
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
    // isValidHexColor(value: string) {
    //   return isValidHexColor(value)
    // },
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
          tiptapUtils.applySpanStyle('size', value)
          tiptapUtils.agent(editor => {
            LayerUtils.updateLayerProps(pageUtils.currFocusPageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
            StepsUtils.record()
          })
          TextPropUtils.updateTextPropsState({ fontSize: value })
          textEffectUtils.refreshSize()
        })
      }
    },
    setSpacing(value: number) {
      if (this.isValidFloat(value.toString())) {
        value = parseFloat(this.boundValue(value, this.fieldRange.fontSpacing.min, this.fieldRange.fontSpacing.max))
        window.requestAnimationFrame(() => {
          tiptapUtils.applyParagraphStyle('fontSpacing', value / 1000, false)
          TextPropUtils.updateTextPropsState({ fontSpacing: value / 1000 })
        })
      }
    },
    setHeight(value: number, isInput?: boolean) {
      if (this.isValidFloat(value.toString())) {
        value = parseFloat(this.boundValue(value, this.fieldRange.lineHeight.min, this.fieldRange.lineHeight.max))
        window.requestAnimationFrame(() => {
          tiptapUtils.applyParagraphStyle('lineHeight', toNumber((value).toFixed(2)), false)
          TextPropUtils.updateTextPropsState({ lineHeight: toNumber((value).toFixed(2)) })
        })
      }
    },
    setParagraphProp(prop: 'lineHeight' | 'fontSpacing', _value: number) {
      if (this.isValidFloat(_value.toString())) {
        let value = parseFloat(this.boundValue(_value, this.fieldRange[prop].min, this.fieldRange[prop].max))
        switch (prop) {
          case 'lineHeight':
            value = toNumber((value).toFixed(2))
            break
          case 'fontSpacing':
            value = value / 1000
        }
        const { layerIndex, subLayerIdx, getCurrLayer: currLayer } = LayerUtils
        window.requestAnimationFrame(() => {
          if (['group', 'tmp'].includes(currLayer.type) && subLayerIdx === -1) {
            (currLayer as IGroup | ITmp).layers
              .forEach((l, idx) => {
                l.type === 'text' && TextPropUtils.propAppliedAllText(layerIndex, idx, prop, value)
                l.type === 'text' && TextUtils.updateGroupLayerSizeByShape(LayerUtils.pageIndex, layerIndex, idx)
              })
          } else {
            tiptapUtils.applyParagraphStyle(prop, value, false)
            TextPropUtils.updateTextPropsState({ [prop]: value })
          }
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
              pageIndex: pageUtils.currFocusPageIndex,
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
    }
  }
})
</script>

<style lang="scss" scoped>
.text-setting {
  position: relative;
  height: 100%;
  width: calc(100vw - 75px);
  &__title {
    // margin-bottom: 30px;
    height: 30px;
  }
  // > div {
  //   margin-top: 15px;
  //   &:nth-child(1) {
  //     margin-top: 0px;
  //   }
  // }
  &__btn-row {
    display: flex;
    align-items: center;
    gap: 15px;
    width: calc(100vw - 105px);
    height: 75px;
    overflow-x: scroll;
    padding: 0 15px;
  }
  &__btn {
    width: 60px;
    height: 60px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: #414d70;
    border-radius: 5px;
    & > span {
      font-size: 12px;
      color: setColor(gray-4);
    }
  }
  &__config-panel {
    position: absolute;
    z-index: 100;
    height: 200px;
    width: calc(100vw - 75px);
    bottom: 0;
    left: 0;
    background: white;
    border-radius: 5px 5px 0px 0px;
    box-sizing: border-box;
    box-shadow: 1px 3px 10px 0px;
    &__close {
      width: 24px;
      height: 24px;
      float: right;
      background-color: setColor(gray-3);
      border-radius: 50%;
      margin-top: 5px;
      margin-right: 5px;
    }
  }
  &__row1 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: auto 1fr;
    column-gap: 20px;
    box-sizing: border-box;
    position: relative;
    > div:nth-child(1) {
      > img {
        width: 100px;
      }
    }
  }
  &__row2 {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 3fr 2fr;
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
    border: 1px solid setColor(gray-4);
    border-radius: 3px;
    width: 130px;
    height: 50px;
    gap: 3px;
    box-sizing: border-box;
    &__hex {
      width: 62px;
      > button {
        padding: 0;
        > input {
          padding: 0;
        }
      }
    }
    &__copy {
      cursor: pointer;
      &:hover {
        color: setColor(gray-3);
      }
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
}
.color-slip {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 42px;
  cursor: pointer;
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

.slide {
  &-enter-active,
  &-leave-active {
    transition: 0.1s ease;
  }

  &-enter,
  &-leave-to {
    bottom: -200px;
  }
}
</style>
