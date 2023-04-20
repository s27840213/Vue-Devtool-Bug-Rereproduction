<template lang="pug">
div(class="nu-text" :style="textWrapperStyle()" draggable="false")
  //- NuText BGs.
  template(v-for="(bgConfig, idx) in [textBg, textFillBg]")
    custom-element(v-if="bgConfig" class="nu-text__BG" :config="bgConfig" :key="`textSvgBg${idx}`")
  div(v-for="text, idx in duplicatedText"
      :key="`text${idx}`"
      class="nu-text__body"
      :style="Object.assign(bodyStyles(), text.extraBodyStyle)")
    nu-curve-text(v-if="isCurveText"
      :config="config"
      :layerIndex="layerIndex"
      :pageIndex="pageIndex"
      :page="page"
      :subLayerIndex="subLayerIndex"
      :primaryLayer="primaryLayer"
      :extraSpanStyle="text.extraSpanStyle")
    p(v-else
      v-for="(p, pIndex) in config.paragraphs"
      :key="`p${pIndex}`"
      class="nu-text__p"
      :style="pStyle(p.styles)")
      span(v-for="(span, sIndex) in p.spans"
        :key="`span${sIndex}`"
        class="nu-text__span"
        :data-sindex="sIndex"
        :style="Object.assign(spanStyle(sIndex, pIndex, config), text.extraSpanStyle)") {{ span.text }}
        br(v-if="!span.text && p.spans.length === 1")
</template>

<script lang="ts">
import CustomElement from '@/components/editor/global/CustomElement.vue'
import NuCurveText from '@/components/editor/global/NuCurveText.vue'
import { CustomElementConfig } from '@/interfaces/editor'
import { isITextFillConfig } from '@/interfaces/format'
import { IGroup, IParagraphStyle, IText } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import generalUtils from '@/utils/generalUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import LayerUtils from '@/utils/layerUtils'
import textBgUtils from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textFillUtils from '@/utils/textFillUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import textUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import _ from 'lodash'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  components: {
    NuCurveText,
    CustomElement,
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
      textBg: {} as CustomElementConfig | null,
      textFillBg: {} as CustomElementConfig | null,
      textFillSpanStyle: [] as Record<string, string | number>[][]
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
    isCurveText() {
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
    duplicatedText(): (Partial<Record<'extraBodyStyle' | 'extraSpanStyle', Record<string, string>>>)[] {
      const duplicatedBodyBasicCss = {
        position: 'absolute',
        top: '0px',
        width: '100%',
        height: '100%',
        opacity: 1
      }
      const duplicatedTexts = textEffectUtils.convertTextEffect(this.config).duplicatedTexts as
        Record<'extraBodyStyle' | 'extraSpanStyle', Record<string, string>>[] | undefined
      return [
        ...duplicatedTexts ? duplicatedTexts.map(d => {
          d.extraBodyStyle = Object.assign({}, duplicatedBodyBasicCss, d.extraBodyStyle) // Set extra body default style
          return d
        }) : [],
        {} // Original text, don't have extra css
      ]
    }
  },
  watch: {
    'config.paragraphs'(newVal) {
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { isAutoResizeNeeded: false }, this.subLayerIndex)
      this.drawTextBg()
      textUtils.untilFontLoaded(newVal).then(async () => {
        this.drawTextBg()
        this.textFillSpanStyle = await textFillUtils.convertTextEffect(this.config)
      })
    },
    async 'config.styles.width'() {
      this.drawTextBg()
      this.textFillSpanStyle = await textFillUtils.convertTextEffect(this.config)
    },
    async 'config.styles.height'() {
      this.drawTextBg()
      this.textFillSpanStyle = await textFillUtils.convertTextEffect(this.config)
    },
    'config.styles.textBg'() { this.drawTextBg() },
    async 'config.styles.textFill'() {
      this.textFillBg = textFillUtils.drawTextFill(this.config)
      this.textFillSpanStyle = await textFillUtils.convertTextEffect(this.config)
    },
  },
  methods: {
    textWrapperStyle(): Record<string, string> {
      return {
        width: `${this.config.styles.width / this.config.styles.scale}px`,
        height: `${this.config.styles.height / this.config.styles.scale}px`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode,
        ...(this.config.styles.opacity !== 100 && { opacity: `${this.config.styles.opacity * 0.01}` })
      }
    },
    drawTextBg(): Promise<void> {
      return new Promise(resolve => {
        this.$nextTick(async () => {
          this.textBg = await textBgUtils.drawTextBg(this.config)
          resolve()
        })
      })
    },
    isLayerAutoResizeNeeded(): boolean {
      return this.config.isAutoResizeNeeded
    },
    getOpacity() {
      const { active, contentEditable } = this.config
      const isTextFill = isITextFillConfig(this.config.styles.textFill)
      if (active && !this.isLocked && !this.inPreview) {
        if (this.isCurveText || this.isFlipped || isTextFill) {
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
        width: isVertical ? '100%' : '',
        height: isVertical ? '' : '100%',
        textAlign: this.config.styles.align,
        opacity,
      }
    },
    spanStyle(sIndex: number, pIndex: number, config: IText): Record<string, string> {
      const p = config.paragraphs[pIndex]
      const span = p.spans[sIndex]
      const textEffectStyles = textEffectUtils.convertTextEffect(this.config)
      const textFillStyle = this.textFillSpanStyle[pIndex]?.[sIndex] ?? {}
      return Object.assign(tiptapUtils.textStylesRaw(span.styles),
        sIndex === p.spans.length - 1 && span.text.match(/^ +$/) ? { whiteSpace: 'pre' } : {},
        textFillStyle,
        textEffectStyles,
        textBgUtils.fixedWidthStyle(span.styles, p.styles, config),
      )
    },
    pStyle(styles: IParagraphStyle) {
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
      await this.drawTextBg()
    },
    async resizeAfterFontLoaded() {
      // To solve the issues: https://www.notion.so/vivipic/8cbe77d393224c67a43de473cd9e8a24
      textUtils.untilFontLoaded(this.config.paragraphs, true).then(() => {
        setTimeout(async () => {
          await this.resizeCallback()
        }, 100) // for the delay between font loading and dom rendering
      })
      this.drawTextBg()
      this.textFillBg = textFillUtils.drawTextFill(this.config)
      this.textFillSpanStyle = await textFillUtils.convertTextEffect(this.config)
    }
  }
})
</script>

<style lang="scss">
.nu-text {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  font-feature-settings: 'liga' 0;
  -webkit-font-feature-settings: 'liga' 0;
  -webkit-font-smoothing: subpixel-antialiased; // for textUtils.getTextHW
  text-rendering: geometricPrecision; // for textUtils.getTextHW
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
    // position: relative;
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
