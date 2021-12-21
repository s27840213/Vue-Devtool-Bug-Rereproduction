<template lang="pug">
  div(class="function-panel scrollbar-gray"
    :style="functionPanelStyles")
    div(class="function-panel__topbar")
      svg-icon(:class="{'pointer': !isInFirstStep}"
        :iconName="'undo'"
        :iconWidth="'20px'"
        :iconColor="!isInFirstStep ? 'gray-2' : 'gray-4'"
        @click.native="undo"
        v-hint="'復原'")
      svg-icon(:class="{'pointer': !isInLastStep}"
        :iconName="'redo'"
        :iconWidth="'20px'"
        :iconColor="!isInLastStep ? 'gray-2' : 'gray-4'"
        @click.native="redo"
        v-hint="'重做'")
      svg-icon(class="visible-hidden"
        :iconName="'share-alt'"
        :iconWidth="'20px'"
        :iconColor="'gray-4'")
      download-btn
      btn(:hasIcon="true"
        :iconName="'menu'"
        :iconWidth="'25px'"
        :type="'primary-sm'"
        :squared="true"
        class="btn-file rounded full-height"
        @click.native="openFilePopup")
    //- @Todo -> Simplify codes below ORZ
    div(v-if="!isShowPagePreview")
      div(v-if="!isGroup" class="p-20")
        panel-general(v-if="!isFontsPanelOpened && selectedLayerNum!==0")
        panel-text-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('text')"
          @openFontsPanel="openFontsPanel"
          v-on="$listeners")
        panel-photo-setting(v-if="!isFontsPanelOpened && (isFrameImage || currSelectedInfo.types.has('image')) && currSelectedInfo.types.size===1 && !isLocked")
        panel-shape-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('shape') && currSelectedInfo.types.size===1 && !isLocked"  v-on="$listeners")
        panel-page-setting(v-if="!isFontsPanelOpened && selectedLayerNum===0")
        panel-fonts(v-if="isFontsPanelOpened" @closeFontsPanel="closeFontsPanel")
        panel-text-effect-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('text') && !isLocked" v-on="$listeners")
        panel-background-setting(v-if="selectedLayerNum===0" v-on="$listeners")
      //- case for Group layer for handle the sub selected layer
      div(v-else class="function-panel p-20")
        template(v-if="!hasSubSelectedLayer")
          panel-general(v-if="!isFontsPanelOpened && selectedLayerNum!==0")
          panel-text-setting(v-if="!isFontsPanelOpened && groupTypes.has('text') && !isLocked"
            @openFontsPanel="openFontsPanel"
            v-on="$listeners")
          panel-photo-setting(v-if="!isFontsPanelOpened && groupTypes.has('image') && groupTypes.size===1 && !isLocked")
          panel-shape-setting(v-if="!isFontsPanelOpened && groupTypes.has('shape') && groupTypes.size===1 && !isLocked"  v-on="$listeners")
          panel-page-setting(v-if="!isFontsPanelOpened && selectedLayerNum===0")
          panel-fonts(v-if="isFontsPanelOpened" @closeFontsPanel="closeFontsPanel")
          panel-text-effect-setting(v-if="!isFontsPanelOpened && groupTypes.has('text') && !isLocked" v-on="$listeners")
        template(v-else)
          panel-general
          template(v-if="!isFontsPanelOpened && subLayerType === 'text' && !isLocked")
            panel-text-setting(
              @openFontsPanel="openFontsPanel()"
              v-on="$listeners")
            panel-text-effect-setting(v-on="$listeners")
          panel-photo-setting(v-else-if="!isFontsPanelOpened && (isSubLayerFrameImage || subLayerType === 'image') && !isLocked")
          panel-shape-setting(v-else-if="!isFontsPanelOpened && subLayerType === 'shape' && !isLocked"  v-on="$listeners")
          panel-fonts(v-if="isFontsPanelOpened" @closeFontsPanel="closeFontsPanel")
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
import DownloadBtn from '@/components/download/DownloadBtn.vue'
import { mapGetters } from 'vuex'
import LayerUtils from '@/utils/layerUtils'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import shotcutUtils from '@/utils/shortcutUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import tiptapUtils from '@/utils/tiptapUtils'
import textPropUtils from '@/utils/textPropUtils'

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
    DownloadBtn
  },
  data() {
    return {
      isFontsPanelOpened: false
    }
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview'
    }),
    functionPanelStyles(): { [index: string]: string } {
      return this.isShowPagePreview ? {
        'pointer-events': 'none'
      } : {
        'pointer-events': 'auto'
      }
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
      shotcutUtils.undo()
      const currSelectedInfo = this.currSelectedInfo as ICurrSelectedInfo
      if (currSelectedInfo.layers.length === 1 && currSelectedInfo.types.has('text')) {
        this.$nextTick(() => {
          tiptapUtils.agent(editor => {
            const currLayer = LayerUtils.getCurrLayer as IText
            if (!currLayer.active) return
            editor.commands.sync()
            tiptapUtils.prevText = tiptapUtils.getText(editor)
            textPropUtils.updateTextPropsState()
          })
        })
      }
    },
    redo() {
      shotcutUtils.redo()
      const currSelectedInfo = this.currSelectedInfo as ICurrSelectedInfo
      if (currSelectedInfo.layers.length === 1 && currSelectedInfo.types.has('text')) {
        this.$nextTick(() => {
          tiptapUtils.agent(editor => {
            const currLayer = LayerUtils.getCurrLayer as IText
            if (!currLayer.active) return
            editor.commands.sync()
            tiptapUtils.prevText = tiptapUtils.getText(editor)
            textPropUtils.updateTextPropsState()
          })
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.function-panel {
  position: relative;
  @include size(300px, 100%);
  @media (max-width: 1260px) {
    @include size(270px, 100%);
  }
  box-sizing: border-box;
  z-index: setZindex("function-panel");
  box-shadow: 1px 0 4px setColor(blue-1, 0.1);
  overflow-y: scroll;
  overflow-x: hidden;
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
  }
}
</style>
