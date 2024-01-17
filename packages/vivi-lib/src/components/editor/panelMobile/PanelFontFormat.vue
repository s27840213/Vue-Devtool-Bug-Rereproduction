<template lang="pug">
div(class="panel-font-format")
  div(
    v-for="(icon1d, i) in content"
    :key="i"
    class="panel-font-format__bar")
    svg-icon(
      v-for="icon in icon1d"
      :key="icon.name"
      class="p-5"
      :class="{'click-disabled': !icon.clickable}"
      :iconName="icon.name"
      iconWidth="20px"
      :iconColor="icon.active ? activeColor : icon.clickable ? inactiveColor : disabledColor"
      @touchstart="icon.action")
</template>

<script lang="ts">
import { IColorKeys } from '@/interfaces/color'
import { IGroup, ILayer, IParagraph, IText, ITmp } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import layerUtils from '@/utils/layerUtils'
import mappingUtils from '@/utils/mappingUtils'
import stepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import textUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { indexOf } from 'lodash'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'

type IFontFormatIcon = {
  name: string
  clickable: boolean
  active: boolean
  action: (icon: string) => void
}

export default defineComponent({
  emits: [],
  data() {
    return {
      activeColor: (this.$isStk || this.$isCm ? 'white' : 'blue-1') as IColorKeys,
      inactiveColor: (this.$isStk || this.$isCm ? 'black-5' : 'gray-2') as IColorKeys,
      disabledColor: (this.$isStk || this.$isCm ? 'black-3-5' : 'gray-4') as IColorKeys,
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    hasCurveText(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      if (subLayerIdx !== -1) {
        return textShapeUtils.isCurvedText(((currLayer as IGroup).layers[subLayerIdx] as IText).styles.textShape)
      }
      if (currLayer.type === 'text') {
        return textShapeUtils.isCurvedText(currLayer.styles.textShape)
      }
      return (currLayer as IGroup).layers.some(l => l.type === 'text' && textShapeUtils.isCurvedText(l.styles.textShape))
    },
    hasOnlyVerticalText(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      if (subLayerIdx !== -1) {
        return ((currLayer as IGroup).layers[subLayerIdx] as IText).styles.writingMode.includes('vertical')
      }
      if (currLayer.type === 'text') {
        return currLayer.styles.writingMode.includes('vertical')
      }
      return !(currLayer as IGroup).layers.some(l => l.type === 'text' && !(l as IText).styles.writingMode.includes('vertical'))
    },
    hasTextFill(): boolean {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      if (subLayerIdx !== -1) {
        return ((currLayer as IGroup).layers[subLayerIdx] as IText).styles.textFill.name !== 'none'
      }
      if (currLayer.type === 'text') {
        return (currLayer as IText).styles.textFill.name !== 'none'
      }
      return (currLayer as IGroup).layers.some(l => l.type === 'text' && (l as IText).styles.textFill.name !== 'none')
    },
    content(): IFontFormatIcon[][] {
      const fontAlign = mappingUtils.mappingIconSet('font-align')

      // If non-cm version be removed, trun it to 1d.
      const iconArr2d = this.$isCm ? [[
        ...mappingUtils.mappingIconSet('font'),
        `text-align-${this.props.textAlign}`
      ]]: [
        mappingUtils.mappingIconSet('font'),
        fontAlign,
      ]

      return iconArr2d.map((iconArr) => iconArr.map(icon => ({
        name: icon,
        clickable: this.iconClickable(icon),
        active: this.iconIsActived(icon),
        action: () => {
          if (!icon.startsWith('text-align-')) {
            this.onPropertyClick(icon)
          } else if (this.$isCm) {
            this.handleTextAlign( // Loop text align.
              fontAlign[((indexOf(fontAlign, icon) as number) + 1) % 4]
            )
          } else {
            this.handleTextAlign(icon)
          }
          stepsUtils.record()
        }
      })))
    }
  },
  methods: {
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
    iconIsActived(iconName: string): boolean {
      switch (iconName) {
        case 'bold':
          return this.props.weight === 'bold'
        case 'underline':
          return this.props.decoration === 'underline' && !this.hasTextFill
        case 'italic':
          return this.props.style === 'italic'
        case 'font-vertical':
          return this.props.isVertical
        case 'text-align-left':
          return this.props.textAlign === 'left'
        case 'text-align-center':
          return this.props.textAlign === 'center'
        case 'text-align-right':
          return this.props.textAlign === 'right'
        case 'text-align-justify':
          return this.props.textAlign === 'justify'
      }
      return false
    },
    onPropertyClick(iconName: string) {
      if (iconName === 'font-vertical') {
        if (this.hasCurveText) return
        textPropUtils.onPropertyClick(iconName, this.props.isVertical ? 0 : 1, this.sel.start, this.sel.end)
        // don't delete below, it's disabled temporarily only
        // if (this.$isStk) {
        //   textUtils.handleAutoRescale({ onlyCentralize: true })
        // }
        textUtils.handleAutoRescale()
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
                if (l.styles.writingMode.includes('vertical') && (
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
    handleTextAlign(prop: string) {
      prop = prop.replace('text-align-', '')
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
  display: grid;
  gap: 15px;

  &__bar {
    display: flex;
    border-radius: 5px;
    @include setColors(gray-7, black-3) using ($color) {
      background-color: $color;
    }
    justify-content: space-around;
    padding: 4px;
  }
}
</style>
