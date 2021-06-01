<template lang="pug">
  div(class="function-panel p-20")
    panel-group(v-if="!isFontsPanelOpened && selectedLayerNum!==0")
    panel-text-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('text') && !isLocked"
      @openFontsPanel="openFontsPanel()")
    panel-photo-setting(v-if="!isFontsPanelOpened && currSelectedInfo.types.has('image') && currSelectedInfo.types.size===1 && !isLocked")
    //- panel-background-setting(v-if="selectedLayerNum===0")
    panel-page-setting(v-if="!isFontsPanelOpened && selectedLayerNum===0")
    panel-fonts(v-if="isFontsPanelOpened" @closeFontsPanel="closeFontsPanel")
</template>

<script lang="ts">
import Vue from 'vue'
import PanelGroup from '@/components/editor/panelFunction/PanelGroup.vue'
import PanelTextSetting from '@/components/editor/panelFunction/PanelTextSetting.vue'
import PanelColorPicker from '@/components/editor/panelFunction/PanelColorPicker.vue'
import PanelBackgroundSetting from '@/components/editor/panelFunction/PanelBackgroundSetting.vue'
import PanelPhotoSetting from '@/components/editor/panelFunction/PanelPhotoSetting.vue'
import PanelPageSetting from '@/components/editor/panelFunction/PanelPageSetting.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import { mapGetters } from 'vuex'
import GroupUtils from '@/utils/groupUtils'
import LayerUtils from '@/utils/layerUtils'

export default Vue.extend({
  components: {
    PanelGroup,
    PanelTextSetting,
    PanelColorPicker,
    PanelBackgroundSetting,
    PanelPhotoSetting,
    PanelPageSetting,
    PanelFonts
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
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    selectedLayerNum(): number {
      return this.currSelectedInfo.layers.length
    },
    isLocked(): boolean {
      return LayerUtils.getTmpLayer().locked
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
  @include size(330px, 100%);
  box-sizing: border-box;
  z-index: setZindex("function-panel");
  box-shadow: 1px 0 4px setColor(blue-1, 0.1);
  overflow-y: scroll;
  > div {
    margin-bottom: 25px;
  }
}
</style>
