<template lang="pug">
  div(class="category-fonts pointer feature-button"
    :class="{ active: props.font === item.id }"
    draggable="false"
    @click="setFont()")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="fallbackSrc || `${getPreview()}`"
        @error="handleNotFound")
    div(class="category-fonts__item-wrapper")
      img(class="category-fonts__item"
        :src="fallbackSrc || `${getPreview2()}`"
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
import { IGroup, IParagraph, IText } from '@/interfaces/layer'
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
      // eslint-disable-next-line indent
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
      // TODO: if private, refetch signedUrl for 3 times before using fallbackSrc
      console.warn(this.item)
    },
    async setFont() {
      if (this.pending) return
      tiptapUtils.agent(editor => editor.setEditable(false))
      const isRanged = this.isRanged()
      const sel = isRanged ? tiptapUtils.getSelection() as { start: ISelection, end: ISelection } : undefined
      const start = sel?.start || TextUtils.getNullSel() as ISelection
      const end = sel?.end || TextUtils.getNullSel() as ISelection
      try {
        const { id, type } = layerUtils.getCurrLayer
        const preLayerIndex = layerUtils.layerIndex
        const subLayerIdx = layerUtils.subLayerIdx
        let contentEditable = false
        if (type === 'text') {
          contentEditable = layerUtils.getCurrLayer.contentEditable as boolean
        } else {
          contentEditable = subLayerIdx === -1 ? false
            : (layerUtils.getCurrLayer as IGroup).layers[subLayerIdx].contentEditable as boolean
        }
        this.updateLayerProps(preLayerIndex, subLayerIdx, { loadFontEdited: false })

        const updateItem = {
          type: this.item.src || this.item.fontType, // public fonts in list-design don't have src
          fontUrl: this.item.fontUrl ?? '',
          userId: this.item.userId ?? '',
          assetId: this.item.assetId ?? '',
          font: this.item.id
        }

        await this.$store.dispatch('text/addFont', {
          type: this.item.src || this.item.fontType, // public fonts in list-design don't have src
          url: this.item.fontUrl,
          userId: this.item.userId,
          assetId: this.item.assetId,
          face: this.item.id,
          ver: this.item.ver
        })

        const currLayerIndex = layerUtils.getCurrPage.layers
          .findIndex(l => l.id === id)
        const config = subLayerIdx === -1 ? layerUtils.getLayer(layerUtils.pageIndex, currLayerIndex) as IText
          : (layerUtils.getLayer(layerUtils.pageIndex, currLayerIndex) as IGroup).layers[subLayerIdx] as IText

        if (currLayerIndex === -1 || config.loadFontEdited) {
          console.warn('The selected text layer is unaviliable')
          return
        }

        if (['tmp', 'group'].includes(type) && !contentEditable && currLayerIndex !== -1) {
          TextPropUtils.applyPropsToAll('span', updateItem, currLayerIndex, subLayerIdx)
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
            src: this.item.src || this.item.fontType,
            ver: this.item.ver,
            signed_url: this.item.signed_url,
            urls: {
              prev: '',
              full: '',
              larg: '',
              original: '',
              json: ''
            }
          })
          StepsUtils.record()
          TextPropUtils.updateTextPropsState({ font: this.item.id })
          return
        }

        const currLayer = layerUtils.getCurrLayer
        if ((!currLayer.active || currLayer.id !== id || (currLayer.type === 'group' && !(currLayer as IGroup).layers[subLayerIdx].active))) {
          // if (!sel) {
          //   Object.assign(start, TextUtils.selectAll(config).start)
          //   Object.assign(end, TextUtils.selectAll(config).end)
          // }
          const newConfig = TextPropUtils.spanPropertyHandler('fontFamily', updateItem, start, end, config as IText)
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
          const { start } = tiptapUtils.getSelection() as { start: ISelection }
          /**
           * Check if the caret is focus at <br>.
           * if so, apply the font data to the spanStyle of the corresponding p.
           */
          const paragraphs = generalUtils.deepCopy(config.paragraphs) as IParagraph[]
          if (start.sIndex === 0 && !config.paragraphs[start.pIndex].spans[start.sIndex].text) {
            const sStyles = tiptapUtils.generateSpanStyle(paragraphs[start.pIndex].spanStyle as string)
            Object.assign(sStyles, updateItem)
            Object.assign(paragraphs[start.pIndex].spans[start.sIndex].styles, updateItem)
            Object.assign(paragraphs[start.pIndex].styles, updateItem)
            paragraphs[start.pIndex].spanStyle = tiptapUtils.textStyles(sStyles)
            this.updateLayerProps(layerUtils.layerIndex, subLayerIdx, { paragraphs })
            tiptapUtils.updateHtml(paragraphs)
            tiptapUtils.focus()
          } else {
            tiptapUtils.agent(editor => {
              const ranges = editor.state.selection.ranges
              if (ranges.length > 0 && ranges[0].$from.pos !== ranges[0].$to.pos) {
                tiptapUtils.applySpanStyle('font', this.item.id, undefined, updateItem) // font: item.id will be assigned twice but it is OK.
              } else {
                /**
                 * Fix problem: caret at the end of a paragraph, the returned sIndex is not as expected.
                 */
                if (start.sIndex >= config.paragraphs[start.pIndex].spans.length) {
                  start.sIndex = paragraphs[start.pIndex].spans.length - 1
                }
                Object.assign(paragraphs[start.pIndex].spans[start.sIndex].styles, updateItem)
                layerUtils.updatecCurrTypeLayerProp({ paragraphs })
                tiptapUtils.updateHtml(paragraphs)
              }
            })
            isRanged && tiptapUtils.focus()
          }
        }

        AssetUtils.addAssetToRecentlyUsed({
          id: this.item.id,
          type: 0,
          user_id: this.item.userId,
          asset_id: this.item.assetId,
          asset_index: this.item.asset_index,
          src: this.item.src || this.item.fontType,
          ver: this.item.ver,
          signed_url: this.item.signed_url,
          urls: {
            prev: '',
            full: '',
            larg: '',
            original: '',
            json: ''
          }
        })
        StepsUtils.record()
        TextPropUtils.updateTextPropsState({ font: this.item.id })
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
    },
    getPreviewUrl(postfix: string): string {
      switch (this.item.src || this.item.fontType) {
        case 'public':
          return `${this.host}/${this.item.id}/${postfix}?ver=${this.item.ver}`
        case 'admin':
          return `https://template.vivipic.com/admin/${this.item.userId}/asset/font/${this.item.assetId}/${postfix}?ver=${this.item.ver}`
        case 'private':
          return this.item.signed_url?.[postfix]
      }
      return ''
    },
    getPreview(): string {
      return this.getPreviewUrl(this.preview)
    },
    getPreview2(): string {
      return this.getPreviewUrl(this.preview2)
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
