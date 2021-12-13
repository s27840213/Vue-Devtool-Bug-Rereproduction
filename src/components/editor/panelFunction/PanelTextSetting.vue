<template lang="pug">
  div(class="text-setting" ref='body'
      @mousedown.capture="textInfoRecorder()")
    span(class="text-setting__title text-blue-1 label-lg") 文字設定
    div(class="text-setting__row1")
      div(class="property-bar pointer record-selection" @click="openFontsPanel")
        img(v-if="props.font[0] !== '_'" class="text-setting__text-preview" :src="getFontPrev")
        span(v-else class="text-gray-2 text-setting__text-preview") {{ props.font.substr(1) }}
        svg-icon(class="pointer"
          :iconName="'caret-down'" :iconWidth="'10px'" :iconColor="'gray-2'")
      div(class="size-bar relative")
        div(class="pointer"
          @mousedown="fontSizeStepping(-1)") -
        button(class="text-setting__range-input-button" @click="handleValueModal")
          input(class="body-2 text-gray-2 center record-selection" type="text" ref="input-fontSize"
                @change="setSize" :value="fontSize")
        div(class="pointer"
          @mousedown="fontSizeStepping(1)") +
        value-selector(v-if="openValueSelector"
                    :valueArray="fontSelectValue"
                    class="text-setting__value-selector"
                    v-click-outside="handleValueModal"
                    @update="handleValueUpdate")
    div(class="text-setting__row2")
      div(class="text-setting__color" v-hint="'文字顏色'")
        div(class="color-slip record-selection"
          @click="handleColorModal")
          svg-icon(iconName="text-color"
                  iconWidth="24px"
                  iconColor="gray-1")
          div(class="color-slip__bar"
              :style="{'background-color': isValidHexColor(props.color) ? props.color : '#000000', 'border': props.color === '#FFFFFF' ? '1px solid #EEEFF4' : ''}")
        div(class="text-setting__color__hex text-left overflow-hidden")
          button(class="text-setting__range-input-button input-color" @click="handleColorModal")
            input(class="body-2 text-gray-2 record-selection input-color" type="text" ref="input-color"
            :value="props.color" @change="inputColor")
            //-  v-model.lazy="props.color v-model.lazy="props.color
        svg-icon(class="text-setting__color__copy"
                iconName="copy"
                iconWidth="16px"
                iconColor="gray-4"
                @click.native="copyColor")
      div(class="action-bar action-bar--small flex-evenly")
        svg-icon(class="pointer record-selection btn-lh"
          :iconName="'font-height'" :iconWidth="'20px'" :iconColor="'gray-2'"
          @click.native="openLineHeightSliderPopup('.btn-lh')"
          v-hint="'字間距'")
        svg-icon(class="pointer record-selection btn-ls"
          :iconName="'font-spacing'" :iconWidth="'20px'" :iconColor="'gray-2'"
          @click.native="openSpacingSliderPopup('.btn-ls')"
          v-hint="'行距'")
    div(class="action-bar flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        class="pointer record-selection"
        :key="`gp-action-icon-${index}`"
        :id="`icon-${icon}`"
        :style="propsBtnStyles(icon)"
        v-hint="hintMap[icon]"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onPropertyClick(icon)")
    div(class="action-bar flex-evenly")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        class="pointer"
        :key="`gp-action-icon-${index}`"
        :style="propsBtnStyles(icon)"
        v-hint="hintMap[icon]"
        :iconName="icon" :iconWidth="'20px'" :iconColor="'gray-2'" @mousedown.native="onParaPropsClick(icon)")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import { IGroup, ILayer, IParagraph, ISpan, IText } from '@/interfaces/layer'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import ValueSelector from '@/components/ValueSelector.vue'
import TextPropUtils, { fontSelectValue } from '@/utils/textPropUtils'
import { parseInt, toNumber } from 'lodash'
import { ISelection } from '@/interfaces/text'
import GeneralUtils from '@/utils/generalUtils'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import { ColorEventType, FunctionPanelType, PopupSliderEventType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import popupUtils from '@/utils/popupUtils'
import tiptapUtils from '@/utils/tiptapUtils'

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
        lineHeight: { min: 0.5, max: 2.5 },
        fontSpacing: { min: -200, max: 800 },
        // fontSpacing: { min: -2, max: 8 },
        // lineHeight: { min: 0, max: 300 },
        opacity: { min: 0, max: 100 }
      },
      fontSelectValue: fontSelectValue,
      isOpenFontPanel: false,
      hintMap: {
        bold: '粗體',
        underline: '底線',
        italic: '斜體',
        'font-vertical': '垂直文字',
        'text-align-left': '左對齊',
        'text-align-center': '文字置中',
        'text-align-right': '右對齊',
        'text-align-justify': '兩端對齊'
      }
    }
  },
  mounted() {
    this.setCurrFunctionPanel(FunctionPanelType.textSetting)
    TextPropUtils.updateTextPropsState()
    colorUtils.on(ColorEventType.text, (color: string) => {
      this.handleColorUpdate(color)
    })

    popupUtils.on(PopupSliderEventType.lineHeight, (value: number) => {
      this.setHeight(value)
    })
    popupUtils.on(PopupSliderEventType.letterSpacing, (value: number) => {
      this.setSpacing(value)
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
    // ...mapState('text', ['currTextInfo']),
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
    ...mapMutations('text', {
      setCurrTextInfo: 'SET_textInfo'
    }),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    openFontsPanel() {
      this.isOpenFontPanel = true
      this.textInfoRecorder()
      this.$emit('openFontsPanel')
    },
    inputColor(input: Event) {
      const target = input.target as HTMLInputElement
      if (GeneralUtils.isValidHexColor(target.value)) {
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
    },
    handleColorUpdate(color: string) {
      if (color === this.props.color) return
      const currLayer = LayerUtils.getCurrLayer
      const nan = TextUtils.getNullSel()

      if (currLayer.type === 'text') {
        StepsUtils.record()
        tiptapUtils.agent(editor => editor.chain().focus().setSpanProps({ color }).run())
      }

      if (currLayer.type === 'group' || currLayer.type === 'tmp') {
        const { subLayerIndex } = this.currTextInfo
        const primaryLayer = currLayer as IGroup
        if (typeof subLayerIndex === 'undefined') {
          for (let i = 0; i < primaryLayer.layers.length; i++) {
            const layer = primaryLayer.layers[i] as IText
            if (layer.type === 'text') {
              TextPropUtils._spanPropertyHandler('color', color, nan, nan, i)
            }
          }
        } else {
          TextPropUtils._spanPropertyHandler('color', color, this.sel.start, this.sel.end, subLayerIndex)
          if (!TextUtils.isSel(this.sel.end)) {
            TextUtils.focus(this.sel.start, this.sel.end, subLayerIndex)
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
      const newFontSize = `${value * 1.3333}px`
      tiptapUtils.agent(editor => editor.chain().focus().setSpanProps({ 'font-size': newFontSize }).setParagraphProps({ 'font-size': newFontSize }).run())
      tiptapUtils.agent(editor => {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
        StepsUtils.record()
      })
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
    textInfoRecorder() {
      console.log('text info recoreder')
      const currLayer = LayerUtils.getCurrLayer
      let config = currLayer
      let start
      let end
      let subLayerIndex
      if (currLayer.type === 'group') {
        subLayerIndex = (currLayer as IGroup).layers.findIndex(l => l.type === 'text' && l.active)
        if (subLayerIndex !== -1) {
          config = (currLayer as IGroup).layers[subLayerIndex] as IText
        } else {
          subLayerIndex = undefined
        }
      }

      const sel = TextUtils.getSelection()
      start = TextUtils.isSel(sel?.start) ? sel?.start as ISelection : TextUtils.getNullSel()
      end = TextUtils.isSel(sel?.end) ? sel?.end as ISelection : TextUtils.getNullSel()

      if (!TextUtils.isSel(start) && config.type === 'text') {
        start = TextUtils.selectAll(config as IText).start
        end = TextUtils.selectAll(config as IText).end
      }
      TextUtils.updateSelection(start, end)
      this.setCurrTextInfo({ config, layerIndex: LayerUtils.layerIndex, subLayerIndex })
    },
    onPropertyClick(iconName: string) {
      if (iconName === 'font-vertical') {
        TextPropUtils.onPropertyClick(iconName, undefined, this.sel.start, this.sel.end)
      } else {
        tiptapUtils.agent(editor => {
          switch (iconName) {
            case 'bold':
              editor.chain().focus().setSpanProps({ 'font-weight': 'bold' }).run()
              break
            case 'underline':
              editor.chain().focus().setSpanProps({ 'text-decoration': 'underline' }).run()
              break
            case 'italic':
              editor.chain().focus().setSpanProps({ 'font-style': 'italic' }).run()
              break
          }
        })
      }

      // Only select with range or none selection exist, the prop-panel update.
      if (!this.sel || (TextUtils.isSel(this.sel.start) && TextUtils.isSel(this.sel.end)) || iconName === 'font-vertical') {
        TextPropUtils.updateTextPropsState()
      }
      StepsUtils.record()
    },
    onParaPropsClick(iconName: string) {
      // TextPropUtils.paragraphPropsHandler(iconName)
      tiptapUtils.agent(editor => {
        switch (iconName) {
          case 'text-align-left':
            editor.chain().focus().setParagraphProps({ 'text-align': 'left' }).run()
            break
          case 'text-align-center':
            editor.chain().focus().setParagraphProps({ 'text-align': 'center' }).run()
            break
          case 'text-align-right':
            editor.chain().focus().setParagraphProps({ 'text-align': 'right' }).run()
            break
          case 'text-align-justify':
            editor.chain().focus().setParagraphProps({ 'text-align': 'justify' }).run()
            break
        }
      })
      if (!this.sel || (TextUtils.isSel(this.sel.start) && TextUtils.isSel(this.sel.end))) {
        TextPropUtils.updateTextPropsState()
      }
      StepsUtils.record()
    },
    fontSizeStepping(step: number, tickInterval = 100) {
      const startTime = new Date().getTime()
      const { config, subLayerIndex } = this.currTextInfo
      let { start, end } = GeneralUtils.deepCopy(TextUtils.getCurrSel) as {
        start: ISelection,
        end: ISelection
      }
      const interval = setInterval(() => {
        if (new Date().getTime() - startTime > 500) {
          try {
            const { start: _start, end: _end } = this.fontSizeSteppingHandler(start, end, step)
            start = _start
            end = _end
            TextUtils.updateLayerSize(config, LayerUtils.pageIndex, LayerUtils.layerIndex, subLayerIndex)
          } catch (error) {
            console.error(error)
            window.removeEventListener('mouseup', onmouseup)
            clearInterval(interval)
          }
        }
      }, tickInterval)

      const onmouseup = () => {
        window.removeEventListener('mouseup', onmouseup)
        const { start, end } = GeneralUtils.deepCopy(TextUtils.getCurrSel) as {
          start: ISelection,
          end: ISelection
        }
        if (new Date().getTime() - startTime < 500) {
          this.fontSizeSteppingHandler(start, end, step)
        }
        clearInterval(interval)
        StepsUtils.record()
      }

      window.addEventListener('mouseup', onmouseup)
    },
    fontSizeSteppingHandler(start: ISelection, end: ISelection, step: number) {
      LayerUtils.initialLayerScale(this.pageIndex, this.layerIndex)
      const { config: _config, subLayerIndex } = this.currTextInfo
      const { paragraphs } = _config
      if (this.sel) {
        // console.log('start: p: ', start.pIndex, ' s: ', start.sIndex, 'off: ', start.offset)
        // console.log('end: p: ', end.pIndex, ' s: ', end.sIndex, 'off: ', end.offset)

        const finalStart = {} as ISelection
        const finalEnd = {} as ISelection
        const currStart = {} as ISelection
        const currEnd = {} as ISelection
        for (let pidx = start.pIndex; pidx <= end.pIndex; pidx++) {
          const p = paragraphs[pidx]
          for (let sidx = 0; sidx < p.spans.length; sidx++) {
            const span = p.spans[sidx]
            if ((pidx === start.pIndex && sidx < start.sIndex) || (pidx === end.pIndex && sidx > end.sIndex)) {
              continue
            }
            // PIndex, sIndex both are at the start-selection
            if (pidx === start.pIndex && sidx === start.sIndex) {
              // Start-selection and the end-selection are exactly at the same span
              if ((start.pIndex === end.pIndex) && (start.sIndex === end.sIndex)) {
                Object.assign(currStart, start)
                Object.assign(currEnd, end)
                sidx++
              } else {
                Object.assign(currStart, start)
                Object.assign(currEnd, { ...start, offset: span.text.length })
              }
            } else if (pidx === end.pIndex && sidx === end.sIndex) {
              const endSidx = (start.pIndex === end.pIndex && start.sIndex + 1 === finalStart.sIndex) ? sidx + 1 : sidx
              Object.assign(currStart, { pIndex: pidx, sIndex: endSidx, offset: 0 })
              Object.assign(currEnd, { pIndex: pidx, sIndex: endSidx, offset: end.offset })
            } else {
              const endSidx = (start.pIndex === pidx && start.sIndex + 1 === finalStart.sIndex) ? sidx + 1 : sidx
              Object.assign(currStart, { pIndex: pidx, sIndex: endSidx, offset: 0 })
              Object.assign(currEnd, { pIndex: pidx, sIndex: endSidx, offset: span.text.length })
            }
            // TextPropUtils.fontSizeStepper(span.styles.size + step, this.sel.start, this.sel.end)
            TextPropUtils.fontSizeStepper(_config, span.styles.size + step, currStart, currEnd)
            console.log(GeneralUtils.deepCopy(_config.paragraphs))

            if (Object.keys(finalStart).length === 0) {
              Object.assign(finalStart, this.sel.start)
            }
            Object.assign(finalEnd, currEnd)
          }
        }
        // Object.assign(finalEnd, this.sel.end)
        // const finalSel = TextPropUtils.spanMerger(_config.paragraphs, finalStart, finalEnd)
        this.$nextTick(() => {
          // TextUtils.focus(finalSel[0], finalSel[1], subLayerIndex)
          // TextUtils.updateSelection(finalSel[0], finalSel[1])
          TextUtils.focus(finalStart, finalEnd)
          TextPropUtils.updateTextPropsState()
        })
        return { start: { ...finalStart }, end: { ...finalEnd } }
      } else {
        TextUtils.updateLayerTextSize({ diff: step })
        TextPropUtils.updateTextPropsState()
        const endP = _config.paragraphs.length - 1
        const endS = _config.paragraphs[endP].spans.length - 1
        return {
          start: { pIndex: 0, sIndex: 0, offset: 0 },
          end: {
            pIndex: endP,
            sIndex: endS,
            offset: _config.paragraphs[endP].spans[endS].offset
          }
        }
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
    setSize(e: Event) {
      let { value } = e.target as HTMLInputElement
      if (this.isValidFloat(value)) {
        LayerUtils.initialLayerScale(this.pageIndex, this.layerIndex)
        value = this.boundValue(parseFloat(value), this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        window.requestAnimationFrame(() => {
          const newFontSize = `${parseFloat(value) * 1.3333}px`
          tiptapUtils.agent(editor => editor.chain().focus().setSpanProps({ 'font-size': newFontSize }).setParagraphProps({ 'font-size': newFontSize }).run())
          tiptapUtils.agent(editor => {
            LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { paragraphs: tiptapUtils.toIParagraph(editor.getJSON()).paragraphs })
            StepsUtils.record()
          })
          TextPropUtils.updateTextPropsState({ fontSize: value })
        })
      }
    },
    setSpacing(value: number) {
      if (this.isValidFloat(value.toString())) {
        value = parseFloat(this.boundValue(value, this.fieldRange.fontSpacing.min, this.fieldRange.fontSpacing.max))
        window.requestAnimationFrame(() => {
          tiptapUtils.agent(editor => editor.chain().focus().setParagraphProps({ 'letter-spacing': `${value / 1000}em` }).run())
          TextPropUtils.updateTextPropsState({ fontSpacing: value / 1000 })
        })
      }
    },
    setHeight(value: number, isInput?: boolean) {
      if (this.isValidFloat(value.toString())) {
        value = parseFloat(this.boundValue(value, this.fieldRange.lineHeight.min, this.fieldRange.lineHeight.max))
        window.requestAnimationFrame(() => {
          tiptapUtils.agent(editor => editor.chain().focus().setParagraphProps({ 'line-height': `${toNumber((value).toFixed(2))}em` }).run())
          TextPropUtils.updateTextPropsState({ lineHeight: toNumber((value).toFixed(2)) })
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
      popupUtils.setSliderConfig(Object.assign({ value: this.props.fontSpacing / 1000, noText: false, step: 1 }, MappingUtils.mappingMinMax('letterSpacing')))
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
  &__title {
    margin-bottom: 30px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
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
    &__copy{
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
</style>
