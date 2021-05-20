<template lang="pug">
  div(class="function-panel p-20")
    panel-group
    panel-text-setting
    panel-photo-setting
</template>

<script lang="ts">
import Vue from 'vue'
import PanelTemplate from '@/components/editor/panel/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panel/PanelPhoto.vue'
import PanelObject from '@/components/editor/panel/PanelObject.vue'
import PanelBackground from '@/components/editor/panel/PanelBackground.vue'
import PanelText from '@/components/editor/panel/PanelText.vue'
import PanelFile from '@/components/editor/panel/PanelFile.vue'
import PanelBrand from '@/components/editor/panel/PanelBrand.vue'
import PanelGroup from '@/components/editor/panel/PanelGroup.vue'
import PanelTextSetting from '@/components/editor/panel/PanelTextSetting.vue'
import PanelColorPicker from '@/components/editor/panel/PanelColorPicker.vue'
import PanelPageSetting from '@/components/editor/panel/PanelPageSetting.vue'
import PanelPhotoSetting from '@/components/editor/panel/PanelPhotoSetting.vue'
import { mapGetters } from 'vuex'
import { FunctionPanelType } from '@/store/types'
// import { CartType } from '@/store/types'

export default Vue.extend({
  components: {
    PanelTemplate,
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelFile,
    PanelBrand,
    PanelGroup,
    PanelTextSetting,
    PanelColorPicker,
    PanelPageSetting,
    PanelPhotoSetting
  },
  data() {
    return {
      FunctionPanelType,
      panelComponents: [
        'none',
        'panel-group',
        'panel-text-setting',
        'panel-color-picker',
        'panel-page-setting',
        'panel-photo-setting'
      ]
    }
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType'
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
