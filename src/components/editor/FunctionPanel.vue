<template lang="pug">
  div(class="panel p-20")
    component(:is="panelComponents[currPanel]")
    img(class="btn-pack" :src="require('@/assets/img/svg/pack-up.svg')")
</template>

<script lang="ts">
import Vue from 'vue'
import PanelTemplate from '@/components/editor/panel/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panel/PanelPhoto.vue'
import PanelObject from '@/components/editor/panel/PanelObject.vue'
import PanelBackground from '@/components/editor/panel/PanelBackground.vue'
import PanelText from '@/components/editor/panel/PanelText.vue'
import PanelFile from '@/components/editor/panel/PanelFile.vue'
import PanelGroup from '@/components/editor/panel/PanelGroup.vue'
import PanelTextSetting from '@/components/editor/panel/PanelTextSetting.vue'
import PanelColorPicker from '@/components/editor/panel/PanelColorPicker.vue'
import PanelPageSetting from '@/components/editor/panel/PanelPageSetting.vue'
import PanelPhotoSetting from '@/components/editor/panel/PanelPhotoSetting.vue'
import { mapGetters } from 'vuex'
import { PanelType } from '@/store/types';
// import { CartType } from '@/store/types'

export default Vue.extend({
  components: {
    PanelTemplate,
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelFile,
    PanelGroup,
    PanelTextSetting,
    PanelColorPicker,
    PanelPageSetting,
    PanelPhotoSetting
  },
  data() {
    return {
      PanelType,
      panelComponents: [
        'panel-template',
        'panel-photo',
        'panel-object',
        'panel-background',
        'panel-text',
        'panel-file',
        'panel-group',
        'panel-text-setting',
        'panel-color-picker',
        'panel-page-setting',
        'panel-photo-setting'
      ]
    }
  },
  mounted () {
    console.log(this.currPanel)
  },
  computed: {
    ...mapGetters({
      currPanel: 'editor/getCurrPanelType'
    })
  }
})
</script>

<style lang="scss" scoped>
.panel {
  position: relative;
  @include size(320px, 100%);
  box-sizing: border-box;
  z-index: setZindex("function-panel");
  box-shadow: 1px 0 4px setColor(blue-1, 0.1);
}

.btn-pack {
  width: 25px;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate3d(100%, -70%, 0);
  filter: drop-shadow(3px 0 1px setColor(blue-1, 0.05));
  cursor: pointer;
}
</style>
