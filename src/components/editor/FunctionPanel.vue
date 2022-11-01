<template lang="pug">
  div(class="function-panel"
    :style="functionPanelStyles")
    //- span {{pageUtils._3dEnabledPageIndex}},
    //- span {{pageUtils.currFocusPageIndex}},
    //- span {{pageUtils._3dEnabledPageIndex === pageUtils.currFocusPageIndex}}
    div(class="function-panel__topbar")
      svg-icon(:class="{'pointer': !isInFirstStep}"
        :iconName="'undo'"
        :iconWidth="'20px'"
        :iconColor="(!inBgRemoveMode && !isInFirstStep && !isFontLoading) || (inBgRemoveMode && !InBgRemoveFirstStep) ? 'gray-2' : 'gray-4'"
        @click.native="undo"
        v-hint="$t('NN0119')"
      )
      svg-icon(:class="{'pointer': !isInLastStep}"
        :iconName="'redo'"
        :iconWidth="'20px'"
        :iconColor="(!inBgRemoveMode && !isInLastStep && !isFontLoading) || (inBgRemoveMode && !InBgRemoveLastStep) ? 'gray-2' : 'gray-4'"
        @click.native="redo"
        v-hint="$t('NN0120')")
      download-btn
      btn(:hasIcon="true"
        :iconName="'menu'"
        :iconWidth="'25px'"
        :type="!inBgRemoveMode  ? 'primary-sm' : 'inactive-sm'"
        :disabled="inBgRemoveMode"
        :squared="true"
        class="btn-file rounded full-height"
        @click.native="openFilePopup")
    div(v-if="!isShowPagePreview"
        class="function-panel__content"
        :class="{'dim-background': showMore}")
      panel-bg-remove(v-if="showBgRemove")
      panel-fonts(v-if="showFont" @closeFontsPanel="closeFontsPanel")
      panel-general(v-if="showGeneral")
      panel-page-setting(v-if="showPageSetting")
      panel-background-setting(v-if="showPageSetting" v-on="$listeners")
      panel-text-setting(v-if="showTextSetting" @openFontsPanel="openFontsPanel" v-on="$listeners")
      panel-text-effect-setting(v-if="showTextSetting" v-on="$listeners")
      panel-photo-setting(v-if="showPhotoSetting" v-on="$listeners")
      panel-shape-setting(v-if="showShapeSetting" v-on="$listeners")
      panel-img-ctrl(v-if="isImgCtrl" v-on="$listeners")
</template>

<script lang="ts">
import Vue from 'vue'
import PanelGeneral from '@/components/editor/panelFunction/PanelGeneral.vue'
import PanelTextSetting from '@/components/editor/panelFunction/PanelTextSetting.vue'
import PanelColorPicker from '@/components/editor/panelFunction/PanelColorPicker.vue'
import PanelBackgroundSetting from '@/components/editor/panelFunction/PanelBackgroundSetting.vue'
import PanelPhotoSetting from '@/components/editor/panelFunction/PanelPhotoSetting.vue'
import PanelPageSetting from '@/components/editor/panelFunction/PanelPageSetting.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import PanelShapeSetting from '@/components/editor/panelFunction/PanelShapeSetting.vue'
import PanelTextEffectSetting from '@/components/editor/panelFunction/PanelTextEffectSetting.vue'
import PanelBgRemove from '@/components/editor/panelFunction/PanelBgRemove.vue'
import PanelPhotoShadow from '@/components/editor/panelFunction/PanelPhotoShadow.vue'
import PanelImgCtrl from '@/components/editor/panelFunction/panelImgCtrl.vue'
import DownloadBtn from '@/components/download/DownloadBtn.vue'
import { mapGetters, mapState } from 'vuex'
import LayerUtils from '@/utils/layerUtils'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import shotcutUtils from '@/utils/shortcutUtils'
import { FunctionPanelType, LayerType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: {
    PanelGeneral,
    PanelTextSetting,
    PanelColorPicker,
    PanelBackgroundSetting,
    PanelPhotoSetting,
    PanelPageSetting,
    PanelFonts,
    PanelShapeSetting,
    PanelTextEffectSetting,
    DownloadBtn,
    PanelBgRemove,
    PanelPhotoShadow,
    PanelImgCtrl
  },
  data() {
    return {
      isFontsPanelOpened: false,
      pageUtils
    }
  },
  computed: {
    ...mapState('fontTag', ['tags', 'showMore']),
    ...mapState(['isMoving']),
    ...mapState('imgControl', ['image']),
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType',
      isProcessImgShadow: 'shadow/isProcessing',
      isUploadImgShadow: 'shadow/isUploading',
      isFontLoading: 'text/getIsFontLoading'
    }),
    functionPanelStyles(): { [index: string]: string } {
      const result = {
        'overflow-y': this.showFont ? 'hidden' : 'auto',
        'pointer-events': this.isShowPagePreview ? 'none' : 'auto'
      }
      return result
    },
    isHandleShadow(): boolean {
      return this.isProcessImgShadow || this.isUploadImgShadow
    },
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return LayerUtils.getTmpLayer().locked
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer: IImage | IText | IShape | IGroup, index: number) => {
        return layer.type
      })
      return new Set(types)
    },
    hasSubSelectedLayer(): boolean {
      return this.currSubSelectedInfo.index !== -1
    },
    subLayerType(): string {
      return this.currSubSelectedInfo.type
    },
    isInFirstStep(): boolean {
      return stepsUtils.isInFirstStep
    },
    isInLastStep(): boolean {
      return stepsUtils.isInLastStep
    },
    isFrameImage(): boolean {
      const { layers, types } = this.currSelectedInfo
      const frameLayer = layers[0] as IFrame
      return layers.length === 1 && types.has('frame') && frameLayer.clips[0].srcObj.assetId
    },
    isSubLayerFrameImage(): boolean {
      const { index } = this.currSubSelectedInfo
      const { clips, type } = this.currSelectedInfo.layers[0].layers[index]
      return type === 'frame' && clips[0].srcObj.assetId
    },
    showBgRemove(): boolean {
      return this.inBgRemoveMode
    },
    showFont(): boolean {
      return !this.inBgRemoveMode &&
        this.isFontsPanelOpened
    },
    showGeneral(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum !== 0 && !this.isImgCtrl
    },
    isImgCtrl(): boolean {
      return this.image !== undefined
    },
    showPageSetting(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened &&
        this.selectedLayerNum === 0
    },
    showTextSetting(): boolean {
      return !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked &&
        this.targetIs('text')
    },
    showPhotoSetting(): boolean {
      return (!this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked &&
        this.targetIs('image') && this.singleTargetType()) && !this.isImgCtrl
    },
    showShapeSetting(): boolean {
      const { getCurrConfig } = LayerUtils
      const stateCondition = !this.inBgRemoveMode && !this.isFontsPanelOpened && !this.isLocked
      const typeConditon = (this.targetIs('shape') && this.singleTargetType()) || getCurrConfig.type === LayerType.frame
      return stateCondition && typeConditon
    },
    isSuperUser(): boolean {
      return generalUtils.isSuperUser
    },
    layerType(): { [key: string]: string } {
      const { getCurrLayer: currLayer, subLayerIdx } = LayerUtils
      return {
        currLayerType: currLayer.type,
        targetLayerType: (() => {
          if (subLayerIdx !== -1) {
            return currLayer.type === LayerType.group
              ? (currLayer as IGroup).layers[subLayerIdx].type : LayerType.image
          }
          return currLayer.type
        })()
      }
    }
  },
  watch: {
    selectedLayerNum(newVal, oldVal) {
      if ((newVal === 0) && this.isFontsPanelOpened) {
        this.closeFontsPanel()
      }
    }
  },
  methods: {
    targetIs(type: string): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return this.subLayerType === type
        } else {
          return this.groupTypes.has(type)
        }
      } else {
        if (this.currSelectedInfo.types.has('frame') && type === 'image') {
          return this.isFrameImage
        }
        return this.currSelectedInfo.types.has(type)
      }
    },
    singleTargetType(): boolean {
      if (this.isGroup) {
        if (this.hasSubSelectedLayer) {
          return true
        } else {
          return this.groupTypes.size === 1
        }
      } else {
        return this.currSelectedInfo.types.size === 1
      }
    },
    openFontsPanel() {
      this.isFontsPanelOpened = true
    },
    closeFontsPanel() {
      this.isFontsPanelOpened = false
    },
    openFilePopup() {
      popupUtils.openPopup('file', {
        posX: 'right'
      })
    },
    undo() {
      if (this.inBgRemoveMode) {
        // BgRemoveArea will listen to Ctrl/Cmd + Z event, so I dispatch an event to make the undo function in BgRemoveArea.vue conducted
        const event = new KeyboardEvent('keydown', {
          ctrlKey: true,
          metaKey: true,
          shiftKey: false,
          key: 'z',
          repeat: false
        })
        window.dispatchEvent(event)
      } else {
        shotcutUtils.undo()
        // const currSelectedInfo = this.currSelectedInfo as ICurrSelectedInfo
        // if (currSelectedInfo.layers.length === 1 && currSelectedInfo.types.has('text')) {
        //   this.$nextTick(() => {
        //     tiptapUtils.agent(editor => {
        //       const currLayer = LayerUtils.getCurrLayer as IText
        //       if (!currLayer.active || currLayer.type !== 'text') return
        //       editor.chain().sync().focus().run()
        //       tiptapUtils.prevText = tiptapUtils.getText(editor)
        //       textPropUtils.updateTextPropsState()
        //     })
        //   })
        // }
      }
    },
    redo() {
      if (this.inBgRemoveMode) {
        const event = new KeyboardEvent('keydown', {
          ctrlKey: true,
          metaKey: true,
          shiftKey: true,
          key: 'z',
          repeat: false
        })
        window.dispatchEvent(event)
      } else {
        shotcutUtils.redo()
        // const currSelectedInfo = this.currSelectedInfo as ICurrSelectedInfo
        // if (currSelectedInfo.layers.length === 1 && currSelectedInfo.types.has('text')) {
        //   this.$nextTick(() => {
        //     tiptapUtils.agent(editor => {
        //       const currLayer = LayerUtils.getCurrLayer as IText
        //       if (!currLayer.active || currLayer.type !== 'text') return
        //       editor.chain().sync().focus().run()
        //       tiptapUtils.prevText = tiptapUtils.getText(editor)
        //       textPropUtils.updateTextPropsState()
        //     })
        //   })
        // }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.function-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  position: relative;
  @include size(300px, 100%);
  @media (max-width: 1260px) {
    @include size(270px, 100%);
  }
  box-sizing: border-box;
  z-index: setZindex("function-panel");
  box-shadow: 1px 0 4px setColor(blue-1, 0.1);
  &__topbar {
    height: 60px;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: setColor(blue-5);
    border-bottom: 2px solid setColor(gray-6);
    pointer-events: auto;
    position: relative;
    z-index: 20;
  }
  &__content {
    @include hover-scrollbar(setColor(gray-3), none);
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    padding: 0 12px 0 20px; // padding-right: 20 - 8(scrollbar width)
  }
}
.dim-background {
  background: #a3a4aa;
}
</style>
