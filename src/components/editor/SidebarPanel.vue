<template lang="pug">
div(class="panel")
  transition(name="panel-up")
    div(v-if="isColorPanelOpen"
    class="panel__color-panel")
      color-panel(@toggleColorPanel="toggleColorPanel"
        :alignLeft="false")
  keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-text', 'panel-file', 'panel-brand']")
    component(v-show="isSidebarPanelOpen && !isShowPagePreview && !bgRemoveMode"
      class="p-10 border-box"
      :style="panelStyles()"
      @toggleColorPanel="toggleColorPanel"
      :is="showPagePanel ? 'panel-page' : panelComponents[currPanel]")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import ColorPanel from '@/components/editor/ColorSlips.vue'
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelBrand from '@/components/editor/panelSidebar/PanelBrand.vue'
import PanelPexels from '@/components/editor/panelSidebar/PanelPexels.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import { mapGetters } from 'vuex'
import { SidebarPanelType } from '@/store/types'
// import { CartType } from '@/store/types'

export default defineComponent({
  components: {
    PanelTemplate,
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelFile,
    PanelBrand,
    PanelPexels, // for testing purposes
    PanelPage,
    ColorPanel
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
      isActive: true,
      isColorPanelOpen: false
    }
  },
  computed: {
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType',
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode'
    })
  },
  methods: {
    togglePanel() {
      this.isActive = !this.isActive
    },
    toggleColorPanel(bool: boolean) {
      this.isColorPanelOpen = bool
    },
    panelStyles() {
      return {
        width: matchMedia('screen and (max-width: 767px)').matches ? 'calc(100vw - 75px)' : (this.showPagePanel ? '200px' : '320px')
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel {
  height: 100%;
  position: relative;
  box-sizing: border-box;
  z-index: setZindex("function-panel");
  background-color: setColor(sidebar-panel);
  &__color-panel {
    height: 50%;
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: setZindex("color-panel");
  }
}
</style>
