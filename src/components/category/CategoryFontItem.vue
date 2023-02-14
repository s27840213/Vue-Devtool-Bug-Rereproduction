<template lang="pug">
  div(class="category-fonts pointer feature-button"
    :class="{ active: props.font === item.id }"
    draggable="false"
    @click="setFont()")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="fallbackSrc || `${getPreview}`"
        @error="handleNotFound")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="fallbackSrc || `${getPreview2}`"
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
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import TextUtils from '@/utils/textUtils'
import TextPropUtils from '@/utils/textPropUtils'
import StepsUtils from '@/utils/stepsUtils'
import { ISelection } from '@/interfaces/text'
import AssetUtils from '@/utils/assetUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IParagraph, IText } from '@/interfaces/layer'
import tiptapUtils from '@/utils/tiptapUtils'
import brandkitUtils from '@/utils/brandkitUtils'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  props: {
    // host: String,
    // preview: String,
    // preview2: String,
    item: Object,
    textStyleType: String
  },
  data() {
    return {
      fallbackSrc: ''
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'fontStore', 'pending']),
    ...mapGetters('brandkit', {
      isSettingsOpen: 'getIsSettingsOpen'
    }),
    getPreview(): string {
      return brandkitUtils.getFontPrevUrlByFontFamily(this.item.id, this.itemFontType, this.item.userId, this.item.assetId, 'prev-name')
    },
    getPreview2(): string {
      return brandkitUtils.getFontPrevUrlByFontFamily(this.item.id, this.itemFontType, this.item.userId, this.item.assetId, 'prev-sample')
    },
    getCurrLayerInfo(): {
      layer: IText,
      layerIndex: number,
      primaryLayerIndex?: number
      pageIndex: number
      // eslint-disable-next-line indent
    } {
      const { getCurrLayer: currLayer, layerIndex } = layerUtils
      switch (currLayer.type) {
        case 'group': {
          const activeIdx = currLayer.layers
            .findIndex(l => l.type === 'text' && l.active)
          if (activeIdx !== -1) {
            return {
              layer: currLayer.layers[activeIdx] as IText,
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
    },
    itemFontType(): string {
      return this.item.src || this.item.fontType
    }
  },
  methods: {
    ...mapActions('brandkit', {
      refreshFontAsset: 'refreshFontAsset'
    }),
    ...mapMutations('text', {
      updateTextState: 'UPDATE_STATE'
    }),
    handleNotFound() {
      if (this.itemFontType === 'private') {
        this.refreshFontAsset({
          id: this.item.assetId,
          asset_index: this.item.asset_index
        })
        return
      }
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
      console.warn(this.item)
    },
    setFont() {
      if (this.$route.name === 'BrandKit' || (this.$route.name === 'Editor' && this.isSettingsOpen)) {
        this.setBrandkitFont()
      } else {
        this.setEditorFont()
      }
    },
    async setBrandkitFont() {
      await this.$store.dispatch('text/addFont', {
        type: this.itemFontType, // public fonts in list-design don't have src
        url: this.item.fontUrl,
        userId: this.item.userId,
        assetId: this.item.assetId,
        face: this.item.id,
        ver: this.item.ver
      })
      brandkitUtils.updateTextStyle(this.textStyleType, {
        fontId: this.item.id,
        fontUserId: this.item.userId,
        fontAssetId: this.item.assetId,
        fontType: this.itemFontType,
        fontName: this.item.name
      })
      AssetUtils.addAssetToRecentlyUsed({
        id: this.item.id,
        type: 0,
        user_id: this.item.userId,
        asset_id: this.item.assetId,
        asset_index: this.item.asset_index,
        src: this.itemFontType,
        ver: this.item.ver,
        signed_url: this.item.signed_url,
        urls: {
          prev: '',
          full: '',
          larg: '',
          original: '',
          json: ''
        }
      }, 'font')
    },
    async setEditorFont() {
      if (this.pending) return
      tiptapUtils.agent(editor => editor.setEditable(false))
      const isRanged = this.isRanged()
      const sel = isRanged ? tiptapUtils.getSelection() as { start: ISelection, end: ISelection } : undefined
      const start = sel?.start || TextUtils.getNullSel() as ISelection
      const end = sel?.end || TextUtils.getNullSel() as ISelection
      try {
        const pageId = layerUtils.getCurrPage.id
        const { id, type } = layerUtils.getCurrLayer
        const preLayerIndex = layerUtils.layerIndex
        const subLayerIdx = layerUtils.subLayerIdx
        const subLayerId = subLayerIdx === -1 ? '' : (layerUtils.getCurrLayer as IGroup).layers[subLayerIdx].id

        let contentEditable = false
        if (type === 'text') {
          contentEditable = layerUtils.getCurrLayer.contentEditable as boolean
        } else {
          contentEditable = subLayerIdx === -1 ? false
            : (layerUtils.getCurrLayer as IGroup).layers[subLayerIdx].contentEditable as boolean
        }
        this.updateLayerProps(preLayerIndex, subLayerIdx, { loadFontEdited: false })

        const updateItem = {
          type: this.itemFontType, // public fonts in list-design don't have src
          fontUrl: this.item.fontUrl ?? '',
          userId: this.item.userId ?? '',
          assetId: this.item.assetId ?? '',
          font: this.item.id
        }

        await this.$store.dispatch('text/addFont', {
          type: this.itemFontType, // public fonts in list-design don't have src
          url: this.item.fontUrl,
          userId: this.item.userId,
          assetId: this.item.assetId,
          face: this.item.id,
          ver: this.item.ver
        })

        vivistickerUtils.setState('recentFont', updateItem)

        const currLayerIndex = layerUtils.getCurrPage.layers
          .findIndex(l => l.id === id)
        const config = subLayerIdx === -1 ? layerUtils.getLayer(layerUtils.pageIndex, currLayerIndex) as IText
          : (layerUtils.getLayer(layerUtils.pageIndex, currLayerIndex) as IGroup).layers[subLayerIdx] as IText

        if (currLayerIndex === -1 || config.loadFontEdited) {
          console.warn('The selected text layer is unaviliable')
          return
        }

        if (['tmp', 'group'].includes(type) && !contentEditable && currLayerIndex !== -1) {
          TextPropUtils.applyPropsToAll('span,paragraph', updateItem, currLayerIndex, subLayerIdx)
          tiptapUtils.updateHtml()
          layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { active: false })
          this.$nextTick(() => {
            layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { active: true })
            if (subLayerIdx === -1) {
              (layerUtils.getLayer(layerUtils.pageIndex, currLayerIndex) as IGroup).layers.forEach((l, index) => {
                if (l.type !== 'text') return
                TextUtils.updateGroupLayerSizeByShape(layerUtils.pageIndex, currLayerIndex, index, true)
              })
            } else {
              TextUtils.updateGroupLayerSizeByShape(layerUtils.pageIndex, currLayerIndex, subLayerIdx, true)
            }
          })

          AssetUtils.addAssetToRecentlyUsed({
            id: this.item.id,
            type: 0,
            user_id: this.item.userId,
            asset_id: this.item.assetId,
            asset_index: this.item.asset_index,
            src: this.itemFontType,
            ver: this.item.ver,
            signed_url: this.item.signed_url,
            urls: {
              prev: '',
              full: '',
              larg: '',
              original: '',
              json: ''
            }
          }, 'font')
          // StepsUtils.record()
          if (subLayerIdx === -1) { // no sub layer is selected
            const group = layerUtils.getLayer(layerUtils.pageIndex, currLayerIndex) as IGroup
            const subIds = group.layers.filter(l => l.type === 'text').map(l => l.id)
            TextUtils.waitGroupFontLoadingAndRecord(group, () => {
              for (const subId of subIds) {
                const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, id as string, subId)
                if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
                TextUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
              }
            })
          } else {
            TextUtils.waitFontLoadingAndRecord(config.paragraphs, () => {
              const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, id as string, subLayerId)
              if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
              TextUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
            })
          }
          TextPropUtils.updateTextPropsState({
            font: this.item.id,
            type: this.itemFontType,
            assetId: this.item.assetId,
            userId: this.item.userId
          })
          return
        }

        const currLayer = layerUtils.getCurrLayer
        if ((!currLayer.active || currLayer.id !== id || (currLayer.type === 'group' && !currLayer.layers[subLayerIdx].active))) {
          const newConfig = TextPropUtils.spanParagraphPropertyHandler('fontFamily', updateItem, start, end, config as IText)
          this.updateLayerProps(currLayerIndex, subLayerIdx, { paragraphs: newConfig.paragraphs })
          if (currLayer.active) {
            tiptapUtils.updateHtml(newConfig.paragraphs)
          }
          if (subLayerIdx === -1) {
            layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { active: false })
          } else if (layerUtils.subLayerIdx !== -1) {
            layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, layerUtils.subLayerIdx, { active: false })
          }
        } else {
          const { start, end } = tiptapUtils.getSelection() as { start: ISelection, end: ISelection }
          /**
           * Check if the caret is focus at <br>.
           * if so, apply the font data to the spanStyle of the corresponding p.
           */
          const newConfig = TextPropUtils.spanParagraphPropertyHandler('fontFamily', updateItem, start, end, config as IText)
          this.updateLayerProps(layerUtils.layerIndex, subLayerIdx, { paragraphs: newConfig.paragraphs })
          tiptapUtils.updateHtml(newConfig.paragraphs)
          !generalUtils.isTouchDevice() && tiptapUtils.focus()
        }

        AssetUtils.addAssetToRecentlyUsed({
          id: this.item.id,
          type: 0,
          user_id: this.item.userId,
          asset_id: this.item.assetId,
          asset_index: this.item.asset_index,
          src: this.itemFontType,
          ver: this.item.ver,
          signed_url: this.item.signed_url,
          urls: {
            prev: '',
            full: '',
            larg: '',
            original: '',
            json: ''
          }
        }, 'font')
        TextUtils.waitFontLoadingAndRecord(config.paragraphs, () => {
          const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, id as string, subLayerId)
          if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
          TextUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
        })
        TextPropUtils.updateTextPropsState({
          font: this.item.id,
          type: this.itemFontType,
          assetId: this.item.assetId,
          userId: this.item.userId
        })
      } catch (error: any) {
        const code = error.message === 'timeout' ? 'timeout' : error.code
        console.error(error)
        this.$notify({
          group: 'error',
          text: `${this.$t('NN0248')} (ErrorCode: ${code})`
        })
      } finally {
        tiptapUtils.agent(editor => editor.setEditable(true))
        const sel = window.getSelection()
        if (sel) sel.removeAllRanges()
      }
    },
    updateLayerProps(layerIndex: number, subLayerIdx: number, prop: { [key: string]: IParagraph[] | boolean }) {
      if (subLayerIdx === -1) {
        layerUtils.updateLayerProps(layerUtils.pageIndex, layerIndex, prop)
      } else {
        layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, subLayerIdx, prop)
      }
    },
    isRanged(): any {
      const sel = window.getSelection()
      if (sel?.rangeCount) {
        return sel.getRangeAt(0).toString()
      }
      return false
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
