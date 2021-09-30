<template lang="pug">
  div(v-if="!isGroup" class="function-panel p-20")
    panel-general(v-if="!isFontsPanelOpened && selectedLayerNum!==0")
    panel-text-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('text') && !isLocked"
      @openFontsPanel="openFontsPanel()"
      v-on="$listeners")
    panel-photo-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('image') && currSelectedInfo.types.size===1 && !isLocked")
    panel-shape-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('shape') && currSelectedInfo.types.size===1 && !isLocked")
    //- panel-background-setting(v-if="selectedLayerNum===0")
    panel-page-setting(v-if="!isFontsPanelOpened && selectedLayerNum===0")
    panel-fonts(v-if="isFontsPanelOpened" @closeFontsPanel="closeFontsPanel")
    panel-text-effect-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('text') && !isLocked" v-on="$listeners")
  div(v-else class="function-panel p-20")
    template(v-if="!hasSubSelectedLayer")
      panel-general(v-if="!isFontsPanelOpened && selectedLayerNum!==0")
      panel-text-setting(v-if="!isFontsPanelOpened && groupTypes.has('text') && !isLocked"
        @openFontsPanel="openFontsPanel()"
        v-on="$listeners")
      panel-photo-setting(v-if="!isFontsPanelOpened && groupTypes.has('image') && groupTypes.size===1 && !isLocked")
      panel-shape-setting(v-if="!isFontsPanelOpened && groupTypes.has('shape') && groupTypes.size===1 && !isLocked")
      //- panel-background-setting(v-if="selectedLayerNum===0")
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
      panel-photo-setting(v-else-if="!isFontsPanelOpened && subLayerType === 'image' && !isLocked")
      panel-shape-setting(v-else-if="!isFontsPanelOpened && subLayerType === 'shape' && !isLocked")
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
import { mapGetters } from 'vuex'
import GroupUtils from '@/utils/groupUtils'
import LayerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IShape, IText } from '@/interfaces/layer'

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
    PanelTextEffectSetting
  },
  data() {
    return {
      GroupUtils,
      isFontsPanelOpened: false
    }
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo'
    }),
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
    }
  }
})
</script>

<style lang="scss" scoped>
.function-panel {
  position: relative;
  @include size(300px, 100%);
  box-sizing: border-box;
  z-index: setZindex("function-panel");
  box-shadow: 1px 0 4px setColor(blue-1, 0.1);
  overflow-y: scroll;
  box-sizing: border-box;
  > div {
    // margin-bottom: 25px;
  }
}
</style>
