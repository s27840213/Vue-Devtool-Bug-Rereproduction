<template lang="pug">
  div(class="photo-setting")
    span(class="photo-setting__title text-blue-1 subtitle-1") {{$t('NN0039')}}
    div(class="photo-setting__grid mb-5")
      btn(v-for="btn in btns"
        class="full-width"
        :class="show === btn.show || (btn.name === 'crop' && isCropping) || (btn.name==='remove-bg' && inBgRemoveMode) ? 'active' : ''"
        type="gray-mid"
        ref="btn"
        :key="btn.name"
        @click.native="handleShow(btn.show)") {{ btn.label }}
      btn(v-if="isImage && isAdmin && !isFrame"
        class="full-width"
        type="gray-mid"
        ref="btn"
        @click.native="handleShow(bgRemoveBtn.show)") {{ bgRemoveBtn.label }}
    component(:is="show || 'div'"
      v-click-outside="handleOutside"
      :imageAdjust="currLayerAdjust"
      @update="handleAdjust")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame, IImage } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import pageUtils from '@/utils/pageUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  data() {
    return {
      show: '',
      btns: [
        { name: 'crop', label: `${this.$t('NN0040')}`, show: 'crop' },
        // { name: 'preset', label: `${this.$t('NN0041')}`, show: '' },
        { name: 'adjust', label: `${this.$t('NN0042')}`, show: 'popup-adjust' }
      ],
      bgRemoveBtn: { label: `${this.$t('NN0043')}`, show: 'remove-bg' }
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    PopupAdjust
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isAdmin: 'user/isAdmin'
    }),
    isCropping(): boolean {
      return imageUtils.isImgControl()
    },
    isFrame(): boolean {
      const { layers, types } = this.currSelectedInfo as ICurrSelectedInfo
      return types.has('frame') && layers.length === 1
    },
    isImage(): boolean {
      const { layers, types } = this.currSelectedInfo as ICurrSelectedInfo
      return types.has('image') && layers.length === 1
    },
    currLayer(): any {
      const layers = this.currSelectedLayers as any[]
      const { index, type } = this.currSubSelectedInfo
      const imageLayers = layers.flatMap(layer => {
        if (layer.type === 'image') return layer
        if (layer.type === 'frame') {
          const frame = layer as IFrame
          return frame.clips[Math.max(0, index)]
        }
        if (layer.type === 'group') {
          if (type === 'image') return layer.layers[index]
          if (type === 'frame') {
            const frameLayer = (layer.layers as IFrame[])[index]
            return frameLayer.active ? frameLayer.clips[0] : null
          }
          // if no subSelectedLayer, it must be a group of all image layers
          if (layer.layers[0].type === 'image') {
            return layer.layers[0]
          }
        }
        return null
      })
      return { ...imageLayers.find(layer => !!layer) }
    },
    currLayerAdjust(): any {
      return this.currLayer.styles?.adjust ?? {}
    },
    selectedLayersNum(): number {
      return this.currSelectedInfo.layers.length
    }
  },
  methods: {
    ...mapMutations({
      updateLayerStyles: 'UPDATE_layerStyles',
      setInBgRemoveMode: 'bgRemove/SET_inBgRemoveMode',
      setAutoRemoveResult: 'bgRemove/SET_autoRemoveResult',
      setPrevScrollPos: 'bgRemove/SET_prevScrollPos'
    }),
    ...mapActions({
      removeBg: 'user/removeBg'
    }),
    handleShow(name: string) {
      this.show = this.show.includes(name) ? '' : name
      if (name === 'crop') {
        if (this.isCropping) {
          imageUtils.setImgControlDefault()
        } else {
          let index
          switch (layerUtils.getCurrLayer.type) {
            case 'image':
              layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true })
              break
            case 'frame':
              index = (layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === 'image')
              if (index >= 0) {
                frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
              }
              break
          }
        }
        this.show = ''
      } else if (name === 'remove-bg') {
        const { layers, pageIndex, index } = this.currSelectedInfo as ICurrSelectedInfo

        layerUtils.updateLayerProps(pageIndex, index, {
          inProcess: true
        })

        const targetLayer = layers[0] as IImage
        const type = targetLayer.srcObj.type

        const { imgWidth, imgHeight } = targetLayer.styles
        const aspect = imgWidth >= imgHeight ? 0 : 1
        const isThirdPartyImage = type === 'unsplash' || type === 'pexels'
        const initSrc = imageUtils.getSrc((this.currSelectedInfo as ICurrSelectedInfo).layers[0] as IImage, 'larg')
        this.removeBg({ srcObj: targetLayer.srcObj, ...(isThirdPartyImage && { aspect }) }).then((data) => {
          if (data.flag === 0) {
            uploadUtils.polling(data.url, (json: any) => {
              if (json.flag === 0 && json.data) {
                layerUtils.updateLayerProps(pageIndex, index, {
                  inProcess: false
                })
                const editorView = document.querySelector('.editor-view')
                const { scrollTop, scrollLeft } = editorView as HTMLElement

                this.setPrevScrollPos({
                  top: scrollTop,
                  left: scrollLeft
                })

                this.setAutoRemoveResult(imageUtils.getBgRemoveInfo(json.data, initSrc))
                this.setInBgRemoveMode(true)
                return true
              }
              if (json.flag === 1) {
                return true
              }

              return false
            })
          }
        })
        this.show = ''
      }
    },
    handleOutside(event: PointerEvent) {
      this.show = ''
      // const target = event.target as HTMLButtonElement
      // const btn = this.$refs.btn as HTMLDivElement
      // if (!btns.contains(target)) {}
    },
    handleAdjust(adjust: any) {
      const { types } = this.currSelectedInfo
      const { index, type } = this.currSubSelectedInfo
      if (types.has('frame') || (types.has('group') && type === 'frame')) {
        if (types.has('frame')) {
          if (index >= 0) {
            // case 1: one clip in one frame layer, index = clip index
            return frameUtils.updateFrameLayerStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              index,
              { adjust: { ...adjust } }
            )
          } else {
            // case 2: one frame layer w/o selected clip, index = -1
            return frameUtils.updateFrameLayerAllClipsStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              { adjust: { ...adjust } }
            )
          }
        }
        // case 3: one frame in a group layer, index = frame index in the group
        return frameUtils.updateSubFrameLayerAllClipsStyles(
          pageUtils.currFocusPageIndex,
          this.currSelectedIndex,
          index,
          { adjust: { ...adjust } }
        )
      }
      if (types.has('image') || types.has('group')) {
        // case 4: one image layer, layerIndex = image layer index, subLayerIndex = undefined
        // case 5: multiple image layers, layerIndex = tmp layer index, subLayerIndex = undefined
        // case 6: one image in a group layer, layerIndex = group layer index, subLayerIndex = sublayer index
        // case 7: whole group of images, layerIndex = group layer index, subLayerIndex = undefined
        return imageAdjustUtil.setAdjust({
          adjust: { ...adjust },
          pageIndex: pageUtils.currFocusPageIndex,
          layerIndex: this.currSelectedIndex,
          subLayerIndex: index >= 0 ? index : undefined
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.photo-setting {
  position: relative;
  text-align: center;
  &__grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
    > button {
      border-radius: 4px;
      &.active {
        border: 2px solid setColor(blue-1);
        color: setColor(blue-1);
        padding: 8px 20px;
      }
    }
  }
}
</style>
