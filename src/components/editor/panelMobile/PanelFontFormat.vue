<template lang="pug">
  div(class="panel-font-format")
    div(class="panel-font-format__bar mb-15")
      svg-icon(v-for="(icon,index) in mappingIcons('font')"
        class="record-selection feature-button p-5"
        :class="{ pointer: iconClickable(icon)}"
        :key="`gp-action-icon-${index}`"
        :id="`icon-${icon}`"
        :iconName="icon" :iconWidth="'20px'" :iconColor="iconIsActived(icon)? 'blue-1' :iconClickable(icon) ? 'gray-2' : 'gray-4'" @touchstart.native="onPropertyClick(icon)")
    div(class="panel-font-format__bar")
      svg-icon(v-for="(icon,index) in mappingIcons('font-align')"
        class="pointer feature-button p-5"
        :key="`gp-action-icon-${index}`"
        :iconName="icon" :iconWidth="'20px'" :iconColor="iconIsActived(icon)? 'blue-1'  :'gray-2'" @touchstart.native="onParaPropsClick(icon)")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import textShapeUtils from '@/utils/textShapeUtils'
import { IGroup, ILayer, IParagraph, IText, ITmp } from '@/interfaces/layer'
import { mapState } from 'vuex'
import mappingUtils from '@/utils/mappingUtils'
import textPropUtils from '@/utils/textPropUtils'
import stepsUtils from '@/utils/stepsUtils'
import layerUtils from '@/utils/layerUtils'
import generalUtils from '@/utils/generalUtils'
import tiptapUtils from '@/utils/tiptapUtils'
export default defineComponent({
  components: {
    MobileSlider
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    hasCurveText(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      if (subLayerIdx !== -1) {
        return textShapeUtils.isCurvedText((currLayer as IGroup).layers[subLayerIdx].styles)
      }
      if (currLayer.type === 'text') {
        return textShapeUtils.isCurvedText(currLayer.styles)
      }
      return (currLayer as IGroup).layers.some(l => textShapeUtils.isCurvedText(l.styles))
    },
    hasOnlyVerticalText(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      if (subLayerIdx !== -1) {
        return ((currLayer as IGroup).layers[subLayerIdx] as IText).styles.writingMode.includes('vertical')
      }
      if (currLayer.type === 'text') {
        return (currLayer as IText).styles.writingMode.includes('vertical')
      }
      return !(currLayer as IGroup).layers.some(l => l.type === 'text' && !(l as IText).styles.writingMode.includes('vertical'))
    }
  },
  methods: {
    mappingIcons(type: string) {
      return mappingUtils.mappingIconSet(type)
    },
    iconClickable(icon: string): boolean {
      if (icon === 'font-vertical') { // if there is any curveText, vertical mode is disabled
        return !this.hasCurveText
      }
      if (['underline', 'italic'].includes(icon)) { // if it is single vertical text or group with only veritical texts, underline and italic are disabled
        return !this.hasOnlyVerticalText
      }
      return true
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
    onPropertyClick(iconName: string) {
      if (iconName === 'font-vertical') {
        if (this.hasCurveText) return
        textPropUtils.onPropertyClick(iconName, this.props.isVertical ? 0 : 1, this.sel.start, this.sel.end)
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
      stepsUtils.record()
    },
    updateLayerProps(props: { [key: string]: string | number | boolean }) {
      const { getCurrLayer: currLayer, layerIndex, subLayerIdx, pageIndex } = layerUtils
      switch (currLayer.type) {
        case 'text':
          layerUtils.updateLayerProps(pageIndex, layerIndex, props)
          break
        case 'group':
          if (subLayerIdx !== -1) {
            layerUtils.updateSubLayerProps(pageIndex, layerIndex, subLayerIdx, props)
          } else {
            const layers = currLayer.layers as ILayer[]
            layers.forEach((layer, index) => {
              if (layer.type === 'text') {
                layerUtils.updateSubLayerProps(pageIndex, layerIndex, index, props)
              }
            })
          }
      }
    },
    handleSpanPropClick(prop: string, pair: [string, string]) {
      const { getCurrLayer: currLayer, layerIndex, subLayerIdx } = layerUtils
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
            const paragraphs = generalUtils.deepCopy((l as IText).paragraphs) as IParagraph[]
            paragraphs.forEach(p => {
              p.spans.forEach(s => {
                if ((l as IText).styles.writingMode.includes('vertical') && (
                  (prop === 'decoration' && newPropVal === 'underline') ||
                  (prop === 'style' && newPropVal === 'italic')
                )) return
                s.styles[prop] = newPropVal
              })
            })
            layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, idx, { paragraphs })
          }
        })
      } else {
        tiptapUtils.applySpanStyle(prop, newPropVal)
      }
      textPropUtils.updateTextPropsState({ [prop]: newPropVal })
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
      stepsUtils.record()
    },
    handleTextAlign(prop: string) {
      const { getCurrLayer: currLayer, layerIndex, subLayerIdx, pageIndex } = layerUtils
      if ((currLayer.type === 'group' && subLayerIdx === -1) || currLayer.type === 'tmp') {
        const layers = (currLayer as IGroup | ITmp).layers
        layers.forEach((l, idx) => {
          if (l.type === 'text') {
            const paragraphs = generalUtils.deepCopy(l.paragraphs) as Array<IParagraph>
            paragraphs.forEach(p => (p.styles.align = prop))
            layerUtils.updateSubLayerProps(pageIndex, layerIndex, idx, { paragraphs })
          }
        })
        textPropUtils.updateTextPropsState({ textAlign: prop })
      } else {
        tiptapUtils.applyParagraphStyle('align', prop)
        textPropUtils.updateTextPropsState({ textAlign: prop })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-font-format {
  width: 100%;

  &__bar {
    display: flex;
    background-color: setColor(gray-7);
    justify-content: space-around;
    padding: 4px;
  }
}
</style>
