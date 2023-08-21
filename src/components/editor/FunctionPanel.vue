<template lang="pug">
div(class="function-panel"
  :style="functionPanelStyles")
  div(v-if="!isShowPagePreview"
    class="function-panel__topbar")
    svg-icon(:class="{'pointer': !isInFirstStep}"
      :iconName="'undo'"
      :iconWidth="'20px'"
      :iconColor="(!inBgRemoveMode && !isInFirstStep && !isFontLoading) || (inBgRemoveMode && !InBgRemoveFirstStep) ? 'gray-2' : 'gray-4'"
      @click="undo"
      v-hint="$t('NN0119')"
    )
    svg-icon(:class="{'pointer': !isInLastStep}"
      :iconName="'redo'"
      :iconWidth="'20px'"
      :iconColor="(!inBgRemoveMode && !isInLastStep && !isFontLoading) || (inBgRemoveMode && !InBgRemoveLastStep) ? 'gray-2' : 'gray-4'"
      @click="redo"
      v-hint="$t('NN0120')")
    download-btn
    btn(:hasIcon="true"
      :iconName="'menu'"
      :iconWidth="'25px'"
      :type="!inBgRemoveMode  ? 'primary-sm' : 'inactive-sm'"
      :disabled="inBgRemoveMode"
      :squared="true"
      class="btn-file rounded full-height"
      @click="openFilePopup")
  div(v-if="!isShowPagePreview"
      class="function-panel__content"
      :class="{'dim-background': showMore}")
    panel-bg-remove(v-if="showBgRemove" :currPage="currPage")
    panel-fonts(v-if="showFont" :currPage="currPage" @closeFontsPanel="closeFontsPanel")
    panel-general(v-if="showGeneral" :currPage="currPage")
    panel-page-setting(v-if="showPageSetting" :currPage="currPage")
    panel-background-setting(v-if="showPageSetting" :currPage="currPage")
    panel-shape-setting(v-if="showShapeSetting" :currPage="currPage")
    panel-text-setting(v-if="showTextSetting" :currPage="currPage" @openFontsPanel="openFontsPanel")
    panel-text-effect-setting(v-if="showTextSetting" :currPage="currPage")
    panel-photo-setting(v-if="showPhotoSetting" :currPage="currPage")
    panel-img-ctrl(v-if="isImgCtrl" :currPage="currPage")
</template>
<script lang="ts">
import DownloadBtn from '@/components/download/DownloadBtn.vue'
import PanelBackgroundSetting from '@/components/editor/panelFunction/PanelBackgroundSetting.vue'
import PanelBgRemove from '@/components/editor/panelFunction/PanelBgRemove.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import PanelGeneral from '@/components/editor/panelFunction/PanelGeneral.vue'
import PanelImgCtrl from '@/components/editor/panelFunction/panelImgCtrl.vue'
import PanelPageSetting from '@/components/editor/panelFunction/PanelPageSetting.vue'
import PanelPhotoSetting from '@/components/editor/panelFunction/PanelPhotoSetting.vue'
import PanelShapeSetting from '@/components/editor/panelFunction/PanelShapeSetting.vue'
import PanelTextEffectSetting from '@/components/editor/panelFunction/PanelTextEffectSetting.vue'
import PanelTextSetting from '@/components/editor/panelFunction/PanelTextSetting.vue'
import PanelColorPicker from '@/components/editor/panelMobile/PanelColorPicker.vue'
import { IFrame, IGroup } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { LayerType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import LayerUtils from '@/utils/layerUtils'
import popupUtils from '@/utils/popupUtils'
import shotcutUtils from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  components: {
    PanelGeneral,
    PanelTextSetting,
    PanelBackgroundSetting,
    PanelPhotoSetting,
    PanelPageSetting,
    PanelFonts,
    PanelShapeSetting,
    PanelTextEffectSetting,
    DownloadBtn,
    PanelBgRemove,
    PanelImgCtrl
  },
  emits: ['toggleColorPanel'],
  data() {
    return {
      isFontsPanelOpened: false,
    }
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  computed: {
    ...mapState('fontTag', ['tags', 'showMore']),
    ...mapState('imgControl', ['image']),
    ...mapGetters('imgControl', ['isBgImgCtrl']),
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
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return LayerUtils.getSelectedLayer().locked
    },
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    groupTypes(): Set<string> {
      const groupLayer = this.currSelectedInfo.layers[0] as IGroup
      const types = groupLayer.layers.map((layer) => {
        return layer.type
      })
      return new Set(types)
    },
    hasSubSelectedLayer(): boolean {
      return LayerUtils.subLayerIdx !== -1
      // return this.currSubSelectedInfo.index !== -1
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
        this.selectedLayerNum === 0 && !this.isBgImgCtrl
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
      const typeConditon = [LayerType.shape, LayerType.frame, LayerType.group, LayerType.tmp].includes(getCurrConfig.type as LayerType)
      const haveColorTarget = colorUtils.globalSelectedColor.color !== 'none'
      return stateCondition && typeConditon && haveColorTarget && !this.isImgCtrl
    },
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
    @include hover-scrollbar(light);
    padding: 20px 8px 20px 20px; // padding-right: 20 - 12(scrollbar width)
  }
}
.dim-background {
  background: #a3a4aa;
}
</style>
