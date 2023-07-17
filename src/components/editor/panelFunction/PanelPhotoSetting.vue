<template lang="pug">
div(class="photo-setting")
  span(class="photo-setting__title text-blue-1 text-H6") {{$t('NN0039')}}
  div(class="photo-setting__grid mb-10")
    template(v-for="btn in btns")
      nubtn(v-if="!btn.condition || btn.condition()"
        :key="btn.name"
        theme="edit"
        size="mid-full"
        :active="activeBtn(btn)"
        :disabled="disableBtn(btn)"
        v-hint="disableBtn(btn) ? btn.hint : ''"
        @click="handleShow(btn.show)") {{ btn.label }}
    nubtn(v-if="isImage && !isFrame && !inReviewMode"
      theme="edit"
      size="mid-full"
      :disabled="hasPreviewSrc || isHandleShadow || isSvgImage || show === 'panel-photo-shadow'"
      @click="handleShow(bgRemoveBtn.show)") {{ bgRemoveBtn.label }}
  component(:is="show || 'div'"
    ref="popup"
    :imageAdjust="currLayerAdjust"
    @update="handleAdjust")
</template>

<script lang="ts">
import PanelPhotoShadow from '@/components/editor/panelFunction/PanelPhotoShadow.vue'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IFrame, IGroup, IImage } from '@/interfaces/layer'
import store from '@/store'
import { FunctionPanelType, LayerType } from '@/store/types'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import frameUtils from '@/utils/frameUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import picWVUtils from '@/utils/picWVUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

interface IBtn {
  name: string
  label: string
  show: string
  condition?: () => boolean
  hint?: string
}

export default defineComponent({
  name: 'PanelPhotoSetting',
  emits: ['toggleColorPanel'],
  data() {
    return {
      show: '',
      isSvgImage: false,
      btns: [
        {
          name: 'crop',
          label: `${this.$t('NN0040')}`,
          show: 'crop',
          condition: (): boolean => {
            const currTargetLayer = layerUtils.getCurrConfig
            return currTargetLayer.type === LayerType.image ||
              (currTargetLayer.type === LayerType.frame && (currTargetLayer as IFrame).clips.length === 1)
          }
        },
        // { name: 'preset', label: `${this.$t('NN0041')}`, show: '' },
        {
          name: 'sliders',
          label: `${this.$t('NN0042')}`,
          show: 'popup-adjust'
        },
        {
          name: 'shadow',
          label: `${this.$t('NN0429')}`,
          show: 'panel-photo-shadow',
          hint: this.$t('NN0500'),
          condition: (): boolean => {
            const { getCurrLayer: currLayer, subLayerIdx } = layerUtils
            if (currLayer.type === LayerType.group && subLayerIdx !== -1) {
              return (currLayer as IGroup).layers[subLayerIdx].type === LayerType.image
            }
            return currLayer.type === LayerType.image
          }
        }
      ] as IBtn[],
      bgRemoveBtn: { label: `${this.$t('NN0043')}`, show: 'remove-bg' }
    }
  },
  mounted() {
    document.addEventListener('mouseup', this.handleClick)
    eventUtils.on(PanelEvent.showPhotoShadow, (val) => {
      if (typeof val !== 'undefined') {
        this.show = val as string
      } else {
        this.show = this.show === 'panel-photo-shadow' ? '' : 'panel-photo-shadow'
      }
    })
    this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.photoSetting)
  },
  unmounted() {
    eventUtils.off(PanelEvent.showPhotoShadow)
    document.removeEventListener('mouseup', this.handleClick)
    this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.none)
  },
  components: {
    PopupAdjust,
    PanelPhotoShadow
  },
  computed: {
    ...mapState('imgControl', {
      imageControlConfig: 'image'
    }),
    ...mapGetters({
      currFunctionPanelType: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isProcessing: 'bgRemove/getIsProcessing',
      isProcessImgShadow: 'shadow/isProcessing',
      isUploadImgShadow: 'shadow/isUploading',
      isHandleShadow: 'shadow/isHandling'
    }),
    ...mapState('shadow', {
      handleId: 'handleId'
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
    inReviewMode(): boolean {
      return picWVUtils.inReviewMode
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
    hasPreviewSrc(): boolean {
      return this.currLayer.previewSrc !== undefined
    }
  },
  watch: {
    currSelectedLayers: {
      immediate: true,
      async handler() {
        const { layers, types, index } = this.currSelectedInfo as ICurrSelectedInfo
        if (types.has('image') && layers.length === 1) {
          const src = imageUtils.getSrc(layers[0] as IImage, 'tiny')
          const isSvg = await imageShadowPanelUtils.isSVG(src, layers[0] as IImage)
          this.isSvgImage = isSvg
        } else {
          this.isSvgImage = false
        }
      }
    }
  },
  methods: {
    ...mapMutations({
      updateImgCtrlConfig: 'imgControl/UPDATE_CONFIG'
    }),
    disableBtn(btn: IBtn): boolean {
      const currLayer = layerUtils.getCurrConfig as IImage
      if (!currLayer.styles) return false
      const { shadow } = currLayer.styles
      if (shadow) {
        const isCurrLayerHanlingShadow = [this.handleId.layerId, this.handleId.subLayerId].includes(currLayer.id)
        const isLayerNeedRedraw = shadow.currentEffect === ShadowEffectType.imageMatched || shadow.isTransparent
        const isShadowPanelOpen = this.currFunctionPanelType === FunctionPanelType.photoShadow
        if (btn.name === 'shadow') {
          return (isCurrLayerHanlingShadow && !isShadowPanelOpen) ||
            this.isUploadImgShadow ||
            currLayer.previewSrc?.includes('data:image/png;base64') ||
            (store.state as any).file.uploadingAssets.some((e: { id: string }) => e.id === (layerUtils.getCurrConfig as IImage).tmpId)
        } else if (['remove-bg', 'crop'].includes(btn.name) && (isLayerNeedRedraw && this.isHandleShadow)) {
          return true
        }
      }

      if (btn.name === 'remove-bg') {
        return this.hasPreviewSrc
      }

      return false
    },
    activeBtn(btn: IBtn): boolean {
      if (this.show === btn.show) return true
      if (btn.name === 'crop' && this.isCropping) return true
      if (btn.name === 'remove-bg' && this.inBgRemoveMode) return true
      return false
    },
    handleShow(name: string) {
      switch (name) {
        case this.btns.find(b => b.name === 'shadow')?.show || '': {
          if (this.isUploadImgShadow) {
            return
          }
          break
        }
        case 'crop':
          if (this.isCropping) {
            imageUtils.setImgControlDefault()
          } else {
            let index
            const currLayer = layerUtils.getCurrLayer
            switch (currLayer.type) {
              case LayerType.group: {
                const target = (currLayer as IGroup).layers.find(l => l.type === LayerType.image && l.active)
                if (target && target.type === LayerType.image) {
                  const { shadow } = (target as IImage).styles
                  const needRedrawShadow = shadow.currentEffect === ShadowEffectType.imageMatched || shadow.isTransparent
                  if (!(this.isHandleShadow && needRedrawShadow)) {
                    layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true }, layerUtils.subLayerIdx)
                  }
                }
                break
              }
              case LayerType.image: {
                const { shadow } = (currLayer as IImage).styles
                const needRedrawShadow = shadow.currentEffect === ShadowEffectType.imageMatched || shadow.isTransparent
                if (!(this.isHandleShadow && needRedrawShadow)) {
                  layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { imgControl: true })
                }
                break
              }
              case LayerType.frame:
                index = Math.max((layerUtils.getCurrLayer as IFrame).clips.findIndex(l => l.type === LayerType.image && l.active), 0)
                if (index >= 0) {
                  frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, index, { imgControl: true })
                }
                break
            }
          }
          this.show = ''
          return
        case 'remove-bg': {
          bgRemoveUtils.removeBg()
          this.show = ''
        }
      }
      this.show = name
    },
    handleOutside() {
      this.show = ''
    },
    handleClick(e: MouseEvent) {
      if (this.show === '') return
      if (!this.$refs.popup) return
      const colorPanel = document.querySelector('.color-panel')
      if (colorPanel && colorPanel.contains(e.target as Node)) {
        return
      }
      if (!(this.$refs.popup as any).$el.contains(e.target as Node)) {
        if (!this.isHandleShadow) {
          this.handleOutside()
        }
      }
    },
    handleAdjust(adjust: any) {
      const { types } = this.currSelectedInfo
      const { index, type } = this.currSubSelectedInfo
      const newAdjust = { ...adjust }
      if (this.imageControlConfig) {
        this.updateImgCtrlConfig({ adjust: newAdjust })
      }

      if (layerUtils.getCurrLayer.type === 'frame' && (layerUtils.getCurrLayer as IFrame).clips[0].isFrameImg) {
        frameUtils.updateFrameLayerStyles(
          pageUtils.currFocusPageIndex,
          this.currSelectedIndex,
          0,
          { adjust: newAdjust }
        )
      }

      if (types.has('frame') || (types.has('group') && type === 'frame')) {
        if (types.has('frame')) {
          if (index >= 0) {
            // case 1: one clip in one frame layer, index = clip index
            return frameUtils.updateFrameLayerStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              index,
              { adjust: newAdjust }
            )
          } else {
            // case 2: one frame layer w/o selected clip, index = -1
            return frameUtils.updateFrameLayerAllClipsStyles(
              pageUtils.currFocusPageIndex,
              this.currSelectedIndex,
              { adjust: newAdjust }
            )
          }
        }
        // case 3: one frame in a group layer, index = frame index in the group
        return frameUtils.updateSubFrameLayerAllClipsStyles(
          pageUtils.currFocusPageIndex,
          this.currSelectedIndex,
          index,
          { adjust: newAdjust }
        )
      }
      if (types.has('image') || types.has('group')) {
        // case 4: one image layer, layerIndex = image layer index, subLayerIndex = undefined
        // case 5: multiple image layers, layerIndex = tmp layer index, subLayerIndex = undefined
        // case 6: one image in a group layer, layerIndex = group layer index, subLayerIndex = sublayer index
        // case 7: whole group of images, layerIndex = group layer index, subLayerIndex = undefined
        return imageAdjustUtil.setAdjust({
          adjust: newAdjust,
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
  text-align: left;
  &__grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
}
</style>
