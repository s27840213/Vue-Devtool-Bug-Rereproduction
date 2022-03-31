<template lang="pug">
  div(class="mobile-panel p-10")
    div(class="mobile-panel__drag-bar")
    keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-text', 'panel-file']")
      component(v-show="!isShowPagePreview && !bgRemoveMode"
        class="border-box"
        :is="currActivePanel")
</template>
<script lang="ts">
import Vue from 'vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import ColorPanel from '@/components/editor/ColorPanel.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelBrand from '@/components/editor/panelSidebar/PanelBrand.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    }
  },
  components: {
    PanelTemplate,
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelFile,
    PanelBrand,
    PanelPage,
    ColorPanel
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode'
    })
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.mobile-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  box-sizing: border-box;
  background-color: setColor(sidebar-panel);
  z-index: setZindex(mobile-panel);
  border-radius: 10px 10px 0 0;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  row-gap: 24px;
  justify-items: center;

  &__drag-bar {
    height: 2px;
    width: 24px;
    // margin: 6px auto 32px auto;
    border-radius: 5px;
    background-color: setColor(gray-4);
  }
}
</style>
