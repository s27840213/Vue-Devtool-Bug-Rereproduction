<template lang="pug">
  div(class="function-panel p-20")
    panel-group(v-show="currSelectedInfo.layers.length!==0")
    panel-text-setting(v-if="currSelectedInfo.types.has('text')")
    panel-photo-setting(v-if="currSelectedInfo.types.has('image') && currSelectedInfo.types.size===1")
    //- panel-background-setting(v-if="currSelectedInfo.layers.length===0")
    panel-page-setting(v-if="currSelectedInfo.layers.length===0")
</template>

<script lang="ts">
import Vue from 'vue'
import PanelGroup from '@/components/editor/panelFunction/PanelGroup.vue'
import PanelTextSetting from '@/components/editor/panelFunction/PanelTextSetting.vue'
import PanelColorPicker from '@/components/editor/panelFunction/PanelColorPicker.vue'
import PanelBackgroundSetting from '@/components/editor/panelFunction/PanelBackgroundSetting.vue'
import PanelPhotoSetting from '@/components/editor/panelFunction/PanelPhotoSetting.vue'
import PanelPageSetting from '@/components/editor/panelFunction/PanelPageSetting.vue'
import { mapGetters } from 'vuex'
import GroupUtils from '@/utils/groupUtils'

export default Vue.extend({
  components: {
    PanelGroup,
    PanelTextSetting,
    PanelColorPicker,
    PanelBackgroundSetting,
    PanelPhotoSetting,
    PanelPageSetting
  },
  data() {
    return {
      GroupUtils,
      panelComponents: [
        'none',
        'panel-group',
        'panel-text-setting',
        'panel-color-picker',
        'panel-page-setting',
        'panel-photo-setting',
        'panel-page-setting'
      ]
    }
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo'
    })
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
