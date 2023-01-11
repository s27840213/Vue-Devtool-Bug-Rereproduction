<template lang="pug">
div(class="photo-setting")
  span(class="photo-setting__title text-blue-1 text-H6") {{$t('NN0039')}}
  div(class="photo-setting__grid mb-10")
    template(v-for="btn in btns")
      btn(v-if="!btn.condition || btn.condition()"
        class="full-width"
        :class="[activeBtn(btn) ? 'active' : '']"
        type="gray-mid"
        ref="btn"
        :disabled="disableBtn(btn)"
        :key="btn.name"
        v-hint="disableBtn(btn) ? btn.hint : ''"
        @click.native="handleShow(btn.show)") {{ btn.label }}
    btn(v-if="isImage && !isFrame"
      class="full-width"
      type="gray-mid"
      ref="btn"
      :disabled="isHandleShadow || show === 'panel-photo-shadow'"
      @click.native="handleShow(bgRemoveBtn.show)") {{ bgRemoveBtn.label }}
  component(:is="show || 'div'"
    ref="popup"
    :imageAdjust="currLayerAdjust"
    @update="handleAdjust")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import { IFrame, IGroup, IImage } from '@/interfaces/layer'
import frameUtils from '@/utils/frameUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import pageUtils from '@/utils/pageUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import uploadUtils from '@/utils/uploadUtils'
import PanelPhotoShadow from '@/components/editor/panelFunction/PanelPhotoShadow.vue'
import paymentUtils from '@/utils/paymentUtils'
import { FunctionPanelType, LayerProcessType, LayerType } from '@/store/types'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  name: 'PanelPhotoSetting',
  emits: ['toggleColorPanel'],
  data() {
    return {
      show: '',
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
      ],
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
      getLayer: 'getLayer',
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
    // isHandleShadow(): boolean {
    //   return this.isProcessImgShadow || this.isUploadImgShadow
    // },
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
      setPrevScrollPos: 'bgRemove/SET_prevScrollPos',
      setIsProcessing: 'bgRemove/SET_isProcessing',
      setIdInfo: 'bgRemove/SET_idInfo',
      recudeBgrmRemain: 'payment/REDUCE_bgrmRemain',
      updateImgCtrlConfig: 'imgControl/UPDATE_CONFIG'
    }),
    ...mapActions({
      removeBg: 'user/removeBg'
    }),
    disableBtn(btn: { [key: string]: string }): boolean {
      const currLayer = layerUtils.getCurrConfig as IImage
      const { shadow } = currLayer.styles
      if (shadow) {
        const isCurrLayerHanlingShadow = [this.handleId.layerId, this.handleId.subLayerId].includes(currLayer.id)
        const isLayerNeedRedraw = shadow.currentEffect === ShadowEffectType.imageMatched || shadow.isTransparent
        const isShadowPanelOpen = this.currFunctionPanelType === FunctionPanelType.photoShadow
        if (btn.name === 'shadow') {
          return (isCurrLayerHanlingShadow && !isShadowPanelOpen) ||
            this.isUploadImgShadow ||
            this.isHandleShadow ||
            (store.state as any).file.uploadingAssets.some((e: { id: string }) => e.id === (layerUtils.getCurrConfig as IImage).tmpId)
          // return (isCurrLayerHanlingShadow && !isShadowPanelOpen) || this.isUploadImgShadow
        } else if (['remove-bg', 'crop'].includes(btn.name) && (isLayerNeedRedraw && this.isHandleShadow)) {
          return true
        }
      }
      return false
    },
    activeBtn(btn: { [key: string]: string }): boolean {
      if (this.show === btn.show) return true
      if (btn.name === 'crop' && this.isCropping) return true
      if (btn.name === 'remove-bg' && this.inBgRemoveMode) return true
      return false
    },
    handleShow(name: string) {
      const { pageIndex, layerIndex, subLayerIdx, getCurrLayer: currLayer } = layerUtils
      switch (name) {
        case this.btns.find(b => b.name === 'shadow')?.show || '': {
          const target = (currLayer.type === LayerType.group && subLayerIdx !== -1
            ? (currLayer as IGroup).layers[subLayerIdx] : currLayer) as IImage
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
          console.log(this.inBgRemoveMode, this.isProcessing)
          const { layers, pageIndex, index } = this.currSelectedInfo as ICurrSelectedInfo

          this.setIsProcessing(true)
          layerUtils.updateLayerProps(pageIndex, index, {
            inProcess: LayerProcessType.bgRemove
          })

          const targetLayer = layers[0] as IImage
          const targetPageId = pageUtils.currFocusPage.id
          const targetLayerId = targetLayer.id

          this.setIdInfo({
            pageId: targetPageId,
            layerId: targetLayerId
          })

          const type = targetLayer.srcObj.type

          const { imgWidth, imgHeight } = targetLayer.styles
          const aspect = imgWidth >= imgHeight ? 0 : 1
          const isThirdPartyImage = type === 'unsplash' || type === 'pexels'
          const initSrc = imageUtils.getSrc((this.currSelectedInfo as ICurrSelectedInfo).layers[0] as IImage, 'larg', undefined, true)
          console.log('remove bg')
          this.removeBg({ srcObj: targetLayer.srcObj, ...(isThirdPartyImage && { aspect }) }).then((data) => {
            console.log(data)
            if (data.flag === 0) {
              uploadUtils.polling(data.url, (json: any) => {
                console.log(json)
                if (json.flag === 0 && json.data) {
                  console.log('polling success')
                  this.recudeBgrmRemain()
                  const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
                  const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')

                  if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
                    layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
                      inProcess: LayerProcessType.none
                    })
                    const editorView = document.querySelector('.editor-view')
                    const { scrollTop, scrollLeft } = editorView as HTMLElement

                    this.setPrevScrollPos({
                      top: scrollTop,
                      left: scrollLeft
                    })

                    this.setAutoRemoveResult(imageUtils.getBgRemoveInfo(json.data, initSrc))
                    this.setInBgRemoveMode(true)
                    console.log(this.inBgRemoveMode, this.isProcessing)
                  }
                  return true
                }
                if (json.flag === 1) {
                  const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
                  const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')

                  if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
                    layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
                      inProcess: LayerProcessType.none
                    })

                    // this.$notify({ group: 'error', text: `${this.$t('NN0349')}` })
                  }

                  return true
                }

                return false
              })
            } else {
              const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
              const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')

              if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
                layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
                  inProcess: false
                })
              }

              this.setIsProcessing(false)
              paymentUtils.errorHandler(data.msg)
            }
          })
          this.show = ''
        }
      }
      this.show = this.show.includes(name) || name === 'remove-bg' ? '' : name
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
    > button {
      border-radius: 4px;
      &.active {
        border: 2px solid setColor(blue-1);
        color: setColor(blue-1);
        padding: 8px 20px;
      }
      &.displayNone {
        display: none;
      }
    }
  }
}
</style>
