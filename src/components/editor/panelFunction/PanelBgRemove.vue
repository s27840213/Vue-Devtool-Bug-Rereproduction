<template lang="pug">
div(class="panel-background-remove")
  div(class="panel-background-remove__grid mb-5")
    btn( class="full-width"
      :type="clearMode ? 'gray-active-mid' :'gray-mid'"
      ref="btn"
      :hasIcon="true"
      :iconName="'clear'"
      :iconMargin="8"
      @click.native="setClearMode(true)") {{ $t('NN0385') }}
    btn(class="full-width"
      :type="clearMode ? 'gray-mid' :'gray-active-mid'"
      ref="btn"
      :hasIcon="true"
      :iconName="'preserve'"
      :iconMargin="8"
      @click.native="setClearMode(false)") {{ $t('NN0386') }}
    div(class="panel-background-remove__slider full")
      div(class="text-left")
        span(class="label-mid") {{ $t('NN0387') }}
      div(class="flex")
        input(class="input__slider--range"
          v-model.number="brushSize"
          :max="maxBrushSize"
          :min="minBrushSize"
          type="range")
        input(class="input__slider--text body-2 text-gray-2"
          type="number"
          v-model.number="brushSize")
    div(class="full flex items-center")
      svg-icon(class="mr-5"
        :iconColor="showInitImage ? 'blue-1' : 'light-gray'"
        :iconName="showInitImage ? 'checkbox-checked' : 'checkbox'"
        :iconWidth="'16px'"
        @click.native="toggleShowInitImage(showInitImage)")
      span(class="label-mid") {{$t('NN0388')}}
    btn(class="btn-recover full-width"
      type="gray-mid"
      ref="btn"
      @click.native="restoreInitState()") {{$t('NN0389')}}
    btn( class="full-width"
      type="gray-mid"
      ref="btn"
      @click.native="cancel()") {{ $t('NN0203') }}
    btn( class="full-width"
      type="primary-mid"
      ref="btn"
      @click.native="save()") {{ $tc('NN0133',1) }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import store from '@/store'
import layerUtils from '@/utils/layerUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IBgRemoveInfo } from '@/interfaces/image'
import stepsUtils from '@/utils/stepsUtils'
import pageUtils from '@/utils/pageUtils'
import { IUploadAssetResponse } from '@/interfaces/upload'
import uploadUtils from '@/utils/uploadUtils'
import { LayerType, SidebarPanelType } from '@/store/types'
import { IImage } from '@/interfaces/layer'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import imageShadowUtils from '@/utils/imageShadowUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import i18n from '@/i18n'

export default defineComponent({
  data() {
    return {
      minBrushSize: 1,
      maxBrushSize: 300
    }
  },
  components: {
    PopupAdjust
  },
  computed: {
    ...mapGetters({
      clearMode: 'bgRemove/getClearMode',
      showInitImage: 'bgRemove/getShowInitImage',
      canvas: 'bgRemove/getCanvas',
      modifiedFlag: 'bgRemove/getModifiedFlag',
      currSelectedInfo: 'getCurrSelectedInfo',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      isAdmin: 'user/isAdmin',
      prevPageScaleRatio: 'bgRemove/getPrevPageScaleRatio',
      bgRemoveIdInfo: 'bgRemove/getIdInfo',
      isProcessing: 'bgRemove/getIsProcessing'
    }),
    brushSize: {
      get: () => {
        return store.getters['bgRemove/getBrushSize']
      },
      set(val: number): void {
        this.setBrushSize(val)
      }
    }
  },
  methods: {
    ...mapMutations({
      setPageScaleRatio: 'SET_pageScaleRatio',
      setInBgRemoveMode: 'bgRemove/SET_inBgRemoveMode',
      setBrushSize: 'bgRemove/SET_brushSize',
      setRestoreInitState: 'bgRemove/SET_restoreInitState',
      setClearMode: 'bgRemove/SET_clearMode',
      setShowInitImage: 'bgRemove/SET_showInitImage',
      setLoading: 'bgRemove/SET_loading',
      setIsProcessing: 'bgRemove/SET_isProcessing',
      setCurrSidebarPanel: 'SET_currSidebarPanelType'
    }),
    toggleShowInitImage(val: boolean): void {
      this.setShowInitImage(!val)
    },
    restoreInitState() {
      this.setRestoreInitState(true)
    },
    save() {
      const { index, pageIndex } = this.currSelectedInfo as ICurrSelectedInfo
      imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex: index }, { type: 'after-bg-remove', userId: '', assetId: '' })
      imageShadowUtils.updateEffectProps({ pageIndex, layerIndex: index }, { isTransparent: true })
      if (!this.modifiedFlag) {
        layerUtils.updateLayerProps(pageIndex, index, {
          srcObj: {
            type: this.isAdmin ? 'public' : 'private',
            userId: (this.autoRemoveResult as IBgRemoveInfo).teamId,
            assetId: this.isAdmin ? (this.autoRemoveResult as IBgRemoveInfo).id : (this.autoRemoveResult as IBgRemoveInfo).assetIndex
          },
          trace: 1
        })
        const image = layerUtils.getLayer(pageIndex, index) as IImage
        if (image.type === LayerType.image) {
          if (image.styles.shadow.currentEffect !== ShadowEffectType.none) {
            const layerInfo = { pageIndex, layerIndex: index }
            const layerData = {
              config: image,
              layerInfo
            }
            imageShadowPanelUtils.handleShadowUpload(layerData, true)
            // Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
          }
        }
        this.setInBgRemoveMode(false)
        this.setIsProcessing(false)
        this.setPageScaleRatio(this.prevPageScaleRatio)
        stepsUtils.record()
      } else {
        const { teamId, id } = (this.autoRemoveResult as IBgRemoveInfo)
        const previewSrc = this.canvas.toDataURL('image/png;base64')
        const { pageId, layerId } = this.bgRemoveIdInfo
        layerUtils.updateLayerProps(pageIndex, index, {
          previewSrc,
          trace: 1
        })
        this.setInBgRemoveMode(false)
        this.setPageScaleRatio(this.prevPageScaleRatio)
        // If the result image is still uploading, we need to prevent the bg-remove btn from being clicked.
        // The reason is if the image is still uploading, then the image in the page is dataUrl.
        // So we need to set isProcessing to true
        this.setIsProcessing(true)
        this.setCurrSidebarPanel(SidebarPanelType.file)
        const targetPageIndex = pageUtils.getPageIndexById(pageId)
        const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, layerId)
        layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
          tmpId: id
        })
        uploadUtils.uploadAsset('image', [previewSrc], {
          addToPage: false,
          pollingCallback: (json: IUploadAssetResponse) => {
            const targetPageIndex = pageUtils.getPageIndexById(pageId)
            const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, layerId)
            const srcObj = {
              type: this.isAdmin ? 'public' : 'private',
              userId: teamId,
              assetId: this.isAdmin ? json.data.id : json.data.asset_index
            }
            layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
              srcObj,
              trace: 1
            })
            const image = layerUtils.getLayer(pageIndex, index) as IImage
            if (image.type === LayerType.image) {
              if (image.styles.shadow.currentEffect !== ShadowEffectType.none) {
                const layerInfo = { pageIndex: targetPageIndex, layerIndex: targetLayerIndex }
                const layerData = {
                  config: image,
                  layerInfo
                }
                imageShadowPanelUtils.handleShadowUpload(layerData, true)
                // Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
              }
            }
            stepsUtils.record()
            this.setLoading(false)
            this.setIsProcessing(false)
          },
          id,
          needCompressed: false
        })
      }
    },
    cancel() {
      this.setIsProcessing(false)
      this.setInBgRemoveMode(false)
      this.setPageScaleRatio(this.prevPageScaleRatio)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-background-remove {
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
      &.active {
        border: 2px solid setColor(blue-1);
        color: setColor(blue-1);
        padding: 8px 20px;
      }
    }
  }

  &__slider {
    font-size: 14px;
    font-weight: bold;
    > div:nth-child(2) {
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: 0.75fr 0.25fr;
      column-gap: 25px;
    }
  }
}

.full {
  grid-column: 1 / 3;
}

.btn-recover {
  grid-column: 1 / 3;
}
</style>
