<template lang="pug">
div(class="brand-kit-color-palette")
  div(class="brand-kit-color-palette__header")
    div(class="brand-kit-color-palette__name")
      span(:title="paletteName") {{ paletteName }}
  div(class="brand-kit-color-palette__colors")
    color-btn(v-for="color in colorPalette.colors" :color="color.color"
      :key="color.id"
      :style="backgroundColorStyles"
      @click="handleSetColor(color.color)")
</template>

<script lang="ts">
import ColorBtn from '@/components/global/ColorBtn.vue'
import { IBrandColorPalette } from '@/interfaces/brandkit'
import { IGroup, IShape } from '@/interfaces/layer'
import brandkitUtils from '@/utils/brandkitUtils'
import colorUtils from '@/utils/colorUtils'
import layerUtils from '@/utils/layerUtils'
import stepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { defineComponent, PropType } from 'vue'
import { mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    ColorBtn
  },
  data() {
    return {
    }
  },
  props: {
    colorPalette: {
      type: Object as PropType<IBrandColorPalette>,
      required: true
    }
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
          subLayer = currLayer.layers[subLayerIdx]
          if (subLayer.type === 'text') return 'text'
          if (subLayer.type === 'shape' && ((subLayer as IShape).color?.length ?? 0) === 1) return 'shape'
          return ''
        default:
          return ''
      }
    },
    backgroundColorStyles(): Record<string, string> {
      return { cursor: (this.applicable) !== '' ? 'pointer' : 'not-allowed' }
    }
  },
  methods: {
    ...mapMutations({
      updateDocumentColors: 'UPDATE_documentColors'
    }),
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
    justify-content: flex-start;
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
  }
}
</style>
