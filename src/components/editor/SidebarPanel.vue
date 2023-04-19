<template lang="pug">
div(class="panel")
  keep-alive(:include="['PanelTemplate', 'PanelPhoto', 'PanelObject', 'PanelBackground', 'PanelText', 'PanelFile', 'PanelBrand']")
    component(v-show="isSidebarPanelOpen && !isShowPagePreview && !bgRemoveMode"
      class="p-10 border-box"
      :style="panelStyles()"
      :is="showPagePanel ? 'panel-page' : panelComponents[currPanel]"
      :currPage="currPage")
</template>

<script lang="ts">
import PanelBackground from '@/components/editor/panelSidebar/PanelBackground.vue'
import PanelBrand from '@/components/editor/panelSidebar/PanelBrand.vue'
import PanelFile from '@/components/editor/panelSidebar/PanelFile.vue'
import PanelObject from '@/components/editor/panelSidebar/PanelObject.vue'
import PanelPage from '@/components/editor/panelSidebar/PanelPage.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import PanelTemplate from '@/components/editor/panelSidebar/PanelTemplate.vue'
import PanelText from '@/components/editor/panelSidebar/PanelText.vue'
import { IPage } from '@/interfaces/page'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapState } from 'vuex'
// import { CartType } from '@/store/types'

export default defineComponent({
  emits: [],
  components: {
    PanelTemplate,
    PanelPhoto,
    PanelObject,
    PanelBackground,
    PanelText,
    PanelFile,
    PanelBrand,
    PanelPage
  },
  props: {
    isSidebarPanelOpen: {
      type: Boolean,
      required: true
    },
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  data() {
    return {
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
    }
  },
  computed: {
    ...mapState({
      isMobile: 'isMobile'
    }),
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType',
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      bgRemoveMode: 'bgRemove/getInBgRemoveMode'
    })
  },
  methods: {
    panelStyles() {
      return {
        width: this.isMobile ? 'calc(100vw - 75px)' : (this.showPagePanel ? '200px' : '320px')
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
