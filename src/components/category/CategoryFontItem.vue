<template lang="pug">
  div(class="category-fonts pointer" draggable="false" @click="setFont()")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="fallbackSrc || `${host}/${item.id}/${preview}`"
        @error="handleNotFound")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="fallbackSrc || `${host}/${item.id}/${preview2}`"
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
import { IFont, ISelection } from '@/interfaces/text'
import AssetUtils from '@/utils/assetUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IText } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import text from '@/store/text'
import tiptapUtils from '@/utils/tiptapUtils'

export default Vue.extend({
  props: {
    host: String,
    preview: String,
    preview2: String,
    item: Object
  },
  data() {
    return {
      fallbackSrc: ''
    }
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
      updateTextState: 'UPDATE_STATE'
    }),
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
      console.warn(this.item)
    },
    async setFont() {
      if (this.pending) return
      tiptapUtils.agent(editor => editor.setEditable(false))
      try {
        const fontStore = this.fontStore as Array<IFont>
        const { type, id } = layerUtils.getCurrLayer
        const subLayerIdx = layerUtils.subLayerIdx
        const isRanged = tiptapUtils.isRanged

        if (!fontStore.some(font => font.face === this.item.id)) {
          this.updateTextState({ pending: this.item.id })
          const newFont = new FontFace(this.item.id, this.getFontUrl(this.item.id))
          await Promise.race([
            newFont.load(),
            new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
          ]).then(() => {
            document.fonts.add(newFont)
            TextUtils.updateFontFace({ name: newFont.family, face: newFont.family, loaded: true })
          }).catch((error) => {
            throw error
          })
        }

        const layerIndex = layerUtils.getCurrPage.layers
          .findIndex(l => l.id === id)

        if (layerIndex === -1) {
          console.warn('The selected text layer is unavilable')
          return
        }

        if (isRanged) {
          StepsUtils.record()
          tiptapUtils.applySpanStyle('font', this.item.id)
          AssetUtils.addAssetToRecentlyUsed(this.item)
          StepsUtils.record()
        } else {
          tiptapUtils.focus()
        }
        TextPropUtils.updateTextPropsState({ font: this.item.id })
      } catch (error: any) {
        const code = error.message === 'timeout' ? 'timeout' : error.code
        this.$notify({
          group: 'error',
          text: `網路異常，請確認網路正常後再嘗試。(ErrorCode: ${code})`
        })
      } finally {
        tiptapUtils.agent(editor => editor.setEditable(true))
        this.updateTextState({ pending: '' })
        const sel = window.getSelection()
        if (sel) sel.removeAllRanges()
      }
    },
    getFontUrl(fontID: string): string {
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
