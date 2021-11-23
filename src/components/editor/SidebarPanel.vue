<template lang="pug">
  div(class="panel")
    keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-text']")
      component(v-if="isSidebarPanelOpen"
        class="p-10 border-box"
        :style="panelStyles()"
        :is="panelComponents[currPanel]")
</template>

<script lang="ts">
import Vue from 'vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelBrand from '@/components/editor/panelSidebar/PanelBrand.vue'
import PanelPexels from '@/components/editor/panelSidebar/PanelPexels.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import { mapGetters } from 'vuex'
import { SidebarPanelType } from '@/store/types'
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
    PanelPexels, // for testing purposes
    PanelPage
  },
  props: {
    isSidebarPanelOpen: Boolean
  },
  data() {
    return {
      SidebarPanelType,
      panelComponents: [
        'panel-template',
        'panel-photo',
        'panel-object',
        'panel-background',
        'panel-text',
        'panel-file',
        'panel-brand',
        'panel-pexels',
        'panel-page',
        'panel-group',
        'panel-text-setting',
        'panel-color-picker',
        'panel-page-setting',
        'panel-photo-setting'
      ],
      isActive: true
    }
  },
  computed: {
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType'
    })
  },
  methods: {
    togglePanel() {
      this.isActive = !this.isActive
    },
    panelStyles() {
      return {
        width: this.currPanel === SidebarPanelType.page ? '200px' : '320px'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel {
  position: relative;
  box-sizing: border-box;
  z-index: setZindex("function-panel");
  background-color: setColor(sidebar-panel);
}

.btn-pack {
  width: 15px;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate3d(100%, -70%, 0);
  cursor: pointer;
}
</style>
