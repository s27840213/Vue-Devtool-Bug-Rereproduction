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
      try {
        const fontStore = this.fontStore as Array<IFont>
        const { config, layerIndex, subLayerIndex } = TextPropUtils.getTextInfo
        const pageIndex = layerUtils.pageIndex
        const { type, id } = layerUtils.getCurrLayer
        let { start, end } = generalUtils.deepCopy(this.sel)
        // Non selection applied
        if (!TextUtils.isSel(start)) {
          switch (type) {
            case 'text': {
              const currLayer = layerUtils.getLayer(pageIndex, layerIndex) as IText
              const endPidx = currLayer.paragraphs.length - 1
              const endSidx = currLayer.paragraphs[endPidx].spans.length - 1
              const endOff = currLayer.paragraphs[endPidx].spans[endSidx].text.length

              start = { pIndex: 0, sIndex: 0, offset: 0 }
              end = { pIndex: endPidx, sIndex: endSidx, offset: endOff }
              break
            }
            default: {
              if (typeof subLayerIndex === 'undefined' || type === 'tmp') {
                break
              }
              if (typeof subLayerIndex === 'number' || type === 'group') {
                const primaryLayer = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
                const target = primaryLayer.layers[subLayerIndex] as IText
                const endPidx = target.paragraphs.length - 1
                const endSidx = target.paragraphs[endPidx].spans.length - 1
                const endOff = target.paragraphs[endPidx].spans[endSidx].text.length

                start = { pIndex: 0, sIndex: 0, offset: 0 }
                end = { pIndex: endPidx, sIndex: endSidx, offset: endOff }
              }
            }
          }
        }

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

        const handler = (config: IText, start: ISelection, end: ISelection): {
          config: IText,
          start: ISelection,
          end: ISelection
        } => {
          return {
            config: TextPropUtils.spanPropertyHandler('fontFamily', { font: this.item.id }, start, end, config as IText),
            ...(generalUtils.deepCopy(this.sel) as { start: ISelection, end: ISelection })
          }
        }

        if (type === 'text' && id === layerUtils.getLayer(pageIndex, layerIndex).id) {
          StepsUtils.record()
          tiptapUtils.agent(editor => editor.chain().focus().setSpanProps({ 'font-family': tiptapUtils.getFontFamily(this.item.id) }).run())
        }

        if ((type === 'group' || type === 'tmp') && id === layerUtils.getLayer(pageIndex, layerIndex).id) {
          if (typeof subLayerIndex === 'undefined') {
            const layers = (config as IGroup).layers
            layers.forEach((l, idx) => {
              if (l.type === 'text') {
                start = TextUtils.selectAll(l as IText).start
                end = TextUtils.selectAll(l as IText).end
                const { config: newConfig } = handler(l as IText, start, end)
                layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, idx, { paragraphs: newConfig.paragraphs })
              }
            })
          }
          if (typeof subLayerIndex === 'number') {
            // console.log('start: p: ', start.pIndex, ' s: ', start.sIndex, 'off: ', start.offset)
            // console.log('end: p: ', end.pIndex, ' s: ', end.sIndex, 'off: ', end.offset)
            const { config: newConfig, start: newStart, end: newEnd } = handler(config as IText, start, end)
            layerUtils.updateSubLayerProps(layerUtils.pageIndex, layerIndex, subLayerIndex, { paragraphs: newConfig.paragraphs })
            // TextUtils.focus(newStart, newEnd, subLayerIndex, layerIndex)
          }
        }

        TextPropUtils.updateTextPropsState({ font: this.item.id })
        AssetUtils.addAssetToRecentlyUsed(this.item)
        StepsUtils.record()
      } catch (error: any) {
        const code = error.message === 'timeout' ? 'timeout' : error.code
        this.$notify({
          group: 'error',
          text: `網路異常，請確認網路正常後再嘗試。(ErrorCode: ${code})`
        })
      } finally {
        this.updateTextState({ pending: '' })
        const sel = window.getSelection()
        if (sel) sel.removeAllRanges()
      }
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
