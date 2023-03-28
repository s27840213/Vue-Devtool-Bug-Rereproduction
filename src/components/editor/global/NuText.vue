<template lang="pug">
div(class="nu-text" :style="textWrapperStyle()" draggable="false")
  //- Svg BG for text effex gooey.
  svg(v-if="svgBG && !noShadow" v-bind="svgBG.attrs" class="nu-text__BG" ref="svg")
    component(v-for="(elm, idx) in svgBG.content"
              :key="`textSvgBg${idx}`"
              :is="elm.tag"
              v-bind="elm.attrs")
  div(v-for="text, idx in duplicatedText" class="nu-text__body"
      :style="Object.assign(bodyStyles(), text.extraBody)")
    nu-curve-text(v-if="isCurveText"
      :config="config"
      :layerIndex="layerIndex"
      :pageIndex="pageIndex"
      :page="page"
      :subLayerIndex="subLayerIndex"
      :primaryLayer="primaryLayer"
      :isDuplicated="idx !== duplicatedText.length-1"
      :isTransparent="isTransparent")
    p(v-else
      v-for="(p, pIndex) in config.paragraphs" class="nu-text__p"
      :style="pStyle(p.styles)")
      span(v-for="(span, sIndex) in p.spans"
        class="nu-text__span"
        :data-sindex="sIndex"
        :style="Object.assign(spanStyle(sIndex, p, config), text.extraSpan, transParentStyles)") {{ span.text }}
        br(v-if="!span.text && p.spans.length === 1")
</template>

<script lang="ts">
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import { isITextLetterBg } from '@/interfaces/format'
import { IGroup, IParagraph, IText } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import generalUtils from '@/utils/generalUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import LayerUtils from '@/utils/layerUtils'
import textBgUtils, { textBgSvg } from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import textUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import _ from 'lodash'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  components: {
    NuCurveText,
  },
  props: {
    config: {
      type: Object as PropType<IText>,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    subLayerIndex: {
      type: Number,
      default: -1
    },
    primaryLayer: {
      type: Object,
      default: () => { return undefined }
    },
    isTransparent: {
      default: false,
      type: Boolean
    },
    noShadow: {
      default: false,
      type: Boolean
    },
    inPreview: {
      default: false,
      type: Boolean
    }
  },
  data() {
    const dimension = this.config.styles.writingMode.includes('vertical') ? this.config.styles.height : this.config.styles.width
    return {
      isDestroyed: false,
      initSize: {
        width: this.config.styles.width,
        height: this.config.styles.height,
        widthLimit: this.config.widthLimit === -1 ? -1 : dimension
      },
      svgBG: {} as textBgSvg|null,
    }
  },
  created() {
    textUtils.loadAllFonts(this.config)
  },
  unmounted() {
    this.isDestroyed = true
  },
  mounted() {
    this.resizeAfterFontLoaded()
  },
  computed: {
    spanEffect() {
      return textBgUtils.convertTextEffect(this.config.styles)
    },
    isCurveText(): any {
      const { textShape } = this.config.styles
      return textShape && textShape.name === 'curve'
    },
    isFlipped(): boolean {
      return this.config.styles.horizontalFlip || this.config.styles.verticalFlip
    },
    isLocked(): boolean {
      return this.config.locked
    },
    // Use duplicated of text to do some text effect, define their difference css here.
    duplicatedText(): (Record<string, Record<string, string> | never>)[] {
      const duplicatedBodyBasicCss = {
        position: 'absolute',
        top: '0px',
        width: '100%',
        height: '100%',
        opacity: 1
      }
      const textShadow = textEffectUtils.convertTextEffect(this.config)
      const duplicatedTextShadow = (textShadow.duplicatedBody || textShadow.duplicatedSpan) as Record<string, string>
      const textShadowCss = {
        extraBody: Object.assign(duplicatedBodyBasicCss, textShadow.duplicatedBody as Record<string, string>),
        extraSpan: textShadow.duplicatedSpan as Record<string, string>
      }
      return [
        ...(duplicatedTextShadow ? [textShadowCss] : []),
        {} // Original text, don't have extra css
      ]
    },
    transParentStyles(): {[key: string]: any} {
      return this.isTransparent ? {
        color: 'rgba(0, 0, 0, 0)',
        '-webkit-text-stroke-color': 'rgba(0, 0, 0, 0)',
        'text-decoration-color': 'rgba(0, 0, 0, 0)'
      } : {}
    }
  },
  watch: {
    'config.paragraphs': {
      handler(newVal) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isAutoResizeNeeded: false }, this.subLayerIndex)
        this.drawSvgBG()
        textUtils.untilFontLoaded(newVal).then(() => {
          this.drawSvgBG()
        })
      }
    },
    'config.styles.width'() { this.drawSvgBG() },
    'config.styles.height'() { this.drawSvgBG() },
    'config.styles.textBg'() { this.drawSvgBG() },
  },
  methods: {
    textWrapperStyle(): Record<string, string> {
      return {
        width: `${this.config.styles.width / this.config.styles.scale}px`,
        height: `${this.config.styles.height / this.config.styles.scale}px`,
        opacity: `${this.config.styles.opacity * 0.01}`,
        // transform: `scaleX(${this.config.styles.scale}) scaleY(${this.config.styles.scale})`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode
      }
    },
    drawSvgBG() {
      this.$nextTick(async () => {
        this.svgBG = await textBgUtils.drawSvgBg(this.config)
      })
    },
    isLayerAutoResizeNeeded(): boolean {
      return this.config.isAutoResizeNeeded
    },
    getOpacity() {
      const { active, contentEditable } = this.config
      if (active && !this.isLocked && !this.inPreview) {
        if (this.isCurveText || this.isFlipped) {
          return contentEditable ? 0.2 : 1
        } else {
          return 0
        }
      } else {
        return 1
      }
    },
    bodyStyles(): Record<string, string|number> {
      const opacity = this.getOpacity()
      const isVertical = this.config.styles.writingMode.includes('vertical')
      return {
        width: isVertical ? 'auto' : '',
        height: isVertical ? '' : '100%',
        textAlign: this.config.styles.align,
        opacity
      }
    },
    spanStyle(sIndex: number, p: IParagraph, config: IText): Record<string, string> {
      const textBg = this.config.styles.textBg
      const span = p.spans[sIndex]
      return Object.assign(tiptapUtils.textStylesRaw(span.styles),
        sIndex === p.spans.length - 1 && span.text.match(/^ +$/) ? { whiteSpace: 'pre' } : {},
        isITextLetterBg(textBg) && textBg.fixedWidth ? textBgUtils.fixedWidthStyle(span.styles, p.styles, config) : {}
      )
    },
    pStyle(styles: any) {
      return _.omit(tiptapUtils.textStylesRaw(styles), [
        'text-decoration-line', '-webkit-text-decoration-line'
      ])
    },
    async resizeCallback() {
      const config = generalUtils.deepCopy(this.config) as IText
      if (this.isDestroyed || textShapeUtils.isCurvedText(config.styles)) return

      // console.log('resize')

      let widthLimit
      if (this.isLayerAutoResizeNeeded()) {
        widthLimit = await textUtils.autoResize(config, this.initSize)
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isAutoResizeNeeded: false }, this.subLayerIndex)
      } else {
        widthLimit = config.widthLimit
      }
      const textHW = await textUtils.getTextHWAsync(config, widthLimit)
      if (typeof this.subLayerIndex === 'undefined' || this.subLayerIndex === -1) {
        let x = config.styles.x
        let y = config.styles.y
        if (config.widthLimit === -1) {
          if (config.styles.writingMode.includes('vertical')) {
            y = config.styles.y - (textHW.height - config.styles.height) / 2
          } else {
            x = config.styles.x - (textHW.width - config.styles.width) / 2
          }
        }
        // console.log(this.layerIndex, textHW.width, textHW.height, config.styles.x, config.styles.y, x, y, widthLimit)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { x, y, width: textHW.width, height: textHW.height })
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit })
      } else {
        /**
         * use LayerUtils.getLayer and not use this.primaryLayer is bcz the tmp layer may contain the group layer,
         * the group layer in the tmp layer would have a wrong updating to the primary tmp layer
         */
        const group = LayerUtils.getLayer(this.pageIndex, this.layerIndex) as IGroup
        if (group.type !== 'group' || group.layers[this.subLayerIndex].type !== 'text') return
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, { width: textHW.width, height: textHW.height })
        LayerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { widthLimit })
        const { width, height } = calcTmpProps(group.layers, group.styles.scale)
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { width, height })
      }
      this.drawSvgBG()
    },
    resizeAfterFontLoaded() {
      // To solve the issues: https://www.notion.so/vivipic/8cbe77d393224c67a43de473cd9e8a24
      textUtils.untilFontLoaded(this.config.paragraphs, true).then(() => {
        setTimeout(() => {
          this.resizeCallback()
        }, 100) // for the delay between font loading and dom rendering
      })
      this.drawSvgBG()
    }
  }
})
</script>

<style lang="scss">
.nu-text {
  width: 100%;
  height: 100%;
  position: relative;
  &__BG {
    position: absolute;
    left: 0;
    top: 0;
    overflow: visible;
  }
  &__body {
    pointer-events: none;
    outline: none;
    padding: 0;
    position: relative;
  }
  &__p {
    margin: 0;
  }
  &__span {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    position: relative;
  }
  &__curve-text-in-editing {
    pointer-events: none;
    opacity: 0.2;
  }
  &__observee {
    position: absolute;
    opacity: 0;
    top: 0;
    left: 0;
    & > span {
      display: inline-block;
    }
  }
  &__editor {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
