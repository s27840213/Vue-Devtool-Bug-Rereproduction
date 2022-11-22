<template lang="pug">
  div(class="brand-kit-color-palette")
    div(class="brand-kit-color-palette__header")
      div(class="brand-kit-color-palette__name")
        span(:title="paletteName") {{ paletteName }}
    div(class="brand-kit-color-palette__colors")
      div(v-for="(color, index) in colorPalette.colors"
        class="brand-kit-color-palette__colors__color-wrapper")
        div(class="brand-kit-color-palette__colors__color"
          :style="backgroundColorStyles(color.color)"
          @click="handleSetColor(color.color)")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrandColorPalette } from '@/interfaces/brandkit'
import { mapMutations } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IShape } from '@/interfaces/layer'
import textPropUtils from '@/utils/textPropUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import stepsUtils from '@/utils/stepsUtils'
import colorUtils from '@/utils/colorUtils'
import textEffectUtils from '@/utils/textEffectUtils'

export default defineComponent({
  data() {
    return {
    }
  },
  props: {
    colorPalette: Object
  },
  computed: {
    paletteName(): string {
      return this.getDisplayedPaletteName(this.colorPalette)
    },
    applicable(): string {
      const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
      let subLayer
      switch (currLayer.type) {
        case 'text':
          return 'text'
        case 'shape':
          return ((currLayer as IShape).color?.length ?? 0) === 1 ? 'shape' : ''
        case 'group':
          if (subLayerIdx === -1) return ''
          subLayer = (currLayer as IGroup).layers[subLayerIdx]
          if (subLayer.type === 'text') return 'text'
          if (subLayer.type === 'shape' && ((subLayer as IShape).color?.length ?? 0) === 1) return 'shape'
          return ''
        default:
          return ''
      }
    }
  },
  methods: {
    ...mapMutations({
      updateDocumentColors: 'UPDATE_documentColors'
    }),
    backgroundColorStyles(color: string) {
      return { backgroundColor: color, cursor: this.applicable !== '' ? 'pointer' : 'not-allowed' }
    },
    getDisplayedPaletteName(colorPalette: IBrandColorPalette): string {
      return brandkitUtils.getDisplayedPaletteName(colorPalette)
    },
    handleSetColor(color: string) {
      const type = this.applicable
      let pageIndex = 0
      switch (type) {
        case 'text':
          pageIndex = this.handleSetTextColor(color)
          break
        case 'shape':
          pageIndex = this.handleSetShapeColor(color)
          break
        default:
          return
      }
      stepsUtils.record()
      colorUtils.setCurrColor(color)
      this.updateDocumentColors({ pageIndex, color })
    },
    handleSetTextColor(color: string): number {
      const { layerIndex, pageIndex, subLayerIdx } = layerUtils
      textPropUtils.applyPropsToAll('span,paragraph', { color }, layerIndex, subLayerIdx)
      tiptapUtils.updateHtml()
      textPropUtils.updateTextPropsState({ color })
      return pageIndex
    },
    handleSetShapeColor(color: string): number {
      const { getCurrLayer: currLayer, layerIndex, pageIndex, subLayerIdx } = layerUtils
      if (subLayerIdx === -1) {
        const shapeColor = [...(currLayer as IShape).color]
        shapeColor[0] = color
        layerUtils.updateLayerProps(pageIndex, layerIndex, { color: shapeColor })
      } else {
        const shapeColor = [...(currLayer as IGroup).layers[subLayerIdx].color as string[]]
        shapeColor[0] = color
        layerUtils.updateSelectedLayerProps(pageIndex, subLayerIdx, { color: shapeColor })
      }
      return pageIndex
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-color-palette {
  &__name {
    display: flex;
    align-items: center;
    justify-content: start;
    color: white;
    & > span {
      @include body-MD;
      line-height: 24px;
      height: 24px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  &__colors {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
    gap: 7px 8px;
    &__color-wrapper {
      position: relative;
      width: 100%;
      padding-top: 100%;
      box-sizing: border-box;
      border-radius: 10%;
    }
    &__color {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border-radius: 10%;
    }
  }
}
</style>
