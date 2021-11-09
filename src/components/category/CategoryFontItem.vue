<template lang="pug">
  div(class="category-fonts pointer" draggable="false" @click="setFont()")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${item.id}/${preview}`"
        @error="handleNotFound")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="`${host}/${item.id}/${preview2}`"
        @error="handleNotFound")
    div(class="category-fonts__icon")
      svg-icon(v-if="props.font === item.id"
        iconName="done"
        iconColor="gray-2"
        iconWidth="25px")
      svg-icon(v-else-if="pending && pending === item.id"
        iconName="loading"
        iconColor="gray-1"
        iconWidth="20px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import TextPropUtils from '@/utils/textPropUtils'
import StepsUtils from '@/utils/stepsUtils'
import { IFont } from '@/interfaces/text'
import AssetUtils from '@/utils/assetUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IText } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  props: {
    host: String,
    preview: String,
    preview2: String,
    item: Object
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'fontStore', 'pending']),
    getCurrLayerInfo(): {
      layer: IText,
      layerIndex: number,
      primaryLayerIndex?: number
      pageIndex: number
      } {
      const { getCurrLayer: currLayer, layerIndex } = layerUtils
      switch (currLayer.type) {
        case 'group': {
          const activeIdx = (currLayer as IGroup).layers
            .findIndex(l => l.type === 'text' && l.active)
          if (activeIdx !== -1) {
            return {
              layer: (currLayer as IGroup).layers[activeIdx] as IText,
              layerIndex: activeIdx,
              primaryLayerIndex: layerIndex,
              pageIndex: layerUtils.pageIndex
            }
          } else throw new Error('Wrong subLayer state')
        }
        case 'text':
          return {
            layer: currLayer as IText,
            layerIndex,
            primaryLayerIndex: undefined,
            pageIndex: layerUtils.pageIndex
          }
        default:
          throw new Error('Wrong layer type as Font Item applied')
      }
    }
  },
  methods: {
    ...mapMutations('text', {
      updateState: 'UPDATE_STATE'
    }),
    handleNotFound(event: Event) {
      (event.target as HTMLImageElement).src = require('@/assets/img/svg/image-preview.svg')
    },
    async setFont() {
      if (this.pending) return

      const fontStore = this.fontStore as Array<IFont>
      const { layer, primaryLayerIndex, layerIndex, pageIndex } = this.getCurrLayerInfo
      let { start, end } = generalUtils.deepCopy(this.sel)

      if (!fontStore.some(font => font.face === this.item.id)) {
        this.updateState({ pending: this.item.id })
        const newFont = new FontFace(this.item.id, this.getFontUrl(this.item.id))

        const load = newFont.load()
          .then(newFont => {
            document.fonts.add(newFont)
            TextUtils.updateFontFace({ name: newFont.family, face: newFont.family })
          })
        await load
      }

      if (!TextUtils.isSel(end)) {
        start = TextUtils.selectAll(layer).start
        end = TextUtils.selectAll(layer).end
      }

      const newConfig = TextPropUtils._spanPropertyHandler('fontFamily',
        { font: this.item.id }, start, end, layer)

      if (typeof primaryLayerIndex !== 'undefined') {
        layerUtils.updateSubLayerProps(pageIndex, primaryLayerIndex, layerIndex, { paragraphs: newConfig.paragraphs })
      } else {
        layerUtils.updateLayerProps(pageIndex, layerIndex, { paragraphs: newConfig.paragraphs })
      }

      TextPropUtils.updateTextPropsState({ font: this.item.id })
      AssetUtils.addAssetToRecentlyUsed(this.item)
      this.updateState({ pending: '' })
      StepsUtils.record()
    },
    getFontUrl(fontID: string): string {
      console.log(fontID)
      return `url("https://template.vivipic.com/font/${fontID}/font")`
    }
  }
})
</script>

<style lang="scss" scoped>
  .category-fonts {
    display: grid;
    grid-template-columns: 7fr 4fr 1fr;
    grid-gap: 10px;
    &__item-wrapper {
      overflow: hidden;
      position: relative;
      text-align: left;
    }
    &__item {
    height: 25px;
    object-fit: contain;
    }
    &__icon {
      position: absolute;
      right: 0;
    }
  }
</style>

function mapMutation(arg0: string, arg1: string[]): any {
  throw new Error('Function not implemented.')
}
