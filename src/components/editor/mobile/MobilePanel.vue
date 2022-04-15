<template lang="pug">
  div(class="mobile-panel p-10"
      :style="panelStyle")
    div(class="mobile-panel__top-section")
      div(class="mobile-panel__drag-bar"
        :class="{'visible-hidden': panelTitle !== ''}")
      div
        svg-icon(class="mobile-panel__left-btn"
          :class="{'visible-hidden': showLeftBtn}"
          iconName="check-circle"
          :iconColor="'white'"
          :iconWidth="'20px'")
        span(class="mobile-panel__title"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        svg-icon(class="mobile-panel__right-btn"
          :class="{'visible-hidden': showLeftBtn}"
          :iconName="'check-circle'"
          :iconColor="'white'"
          :iconWidth="'20px'")
    keep-alive(:include="['panel-template', 'panel-photo', 'panel-object', 'panel-background', 'panel-text', 'panel-file']")
      component(v-if="!isShowPagePreview && !bgRemoveMode && !hideDynamicComp"
        class="border-box"
        :is="`panel-${currActivePanel}`")
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
import PanelPosition from '@/components/editor/panelMobile/PanelPosition.vue'
import PanelFlip from '@/components/editor/panelMobile/PanelFlip.vue'
import PanelOpacity from '@/components/editor/panelMobile/PanelOpacity.vue'
import { mapGetters } from 'vuex'
import vClickOutside from 'v-click-outside'

export default Vue.extend({
  props: {
    currActivePanel: {
      default: 'none',
      type: String
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
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
    ColorPanel,
    PanelPosition,
    PanelFlip,
    PanelOpacity
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
    }),
    whiteTheme(): boolean {
      return ['replace', 'crop', 'bgRemove', 'position', 'flip', 'opacity'].includes(this.currActivePanel)
    },
    fixSize(): boolean {
      return ['replace', 'crop', 'bgRemove', 'position', 'flip', 'opacity'].includes(this.currActivePanel)
    },
    panelTitle(): string {
      switch (this.currActivePanel) {
        case 'crop': {
          return `${this.$t('NN0496')}`
        }
        default: {
          return ''
        }
      }
    },
    showRightBtn(): boolean {
      return !this.whiteTheme
    },
    showLeftBtn(): boolean {
      return !this.whiteTheme
    },
    hideDynamicComp(): boolean {
      return this.currActivePanel === 'crop'
    },
    panelStyle(): { [index: string]: string } {
      return {
        height: this.fixSize ? 'initial' : '100%',
        'row-gap': this.hideDynamicComp ? '0px' : '20px',
        backgroundColor: this.whiteTheme ? 'white' : '#2C2F43'
      }
    }
  },
  methods: {
    // closeMobilePanel() {
    //   this.$emit('switchTab', 'none')
    // }
  }
})
</script>

<style lang="scss" scoped>
.mobile-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  background-color: setColor(sidebar-panel);
  z-index: setZindex(mobile-panel);
  border-radius: 10px 10px 0 0;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  justify-items: center;

  &__top-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    > div:nth-child(2) {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  &__title {
    font-weight: bold;
  }

  &__drag-bar {
    height: 3px;
    width: 24px;
    // margin: 6px auto 32px auto;
    border-radius: 5px;
    background-color: setColor(gray-4);
  }
}
</style>
