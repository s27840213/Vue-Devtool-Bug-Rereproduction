<template lang="pug">
  div(class="panel-opacity")
    mobile-slider(:title="`${$t('NN0030')}`"
      :value="opacity"
      :min="0"
      :max="100"
      @update="updateLayerOpacity")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import { mapGetters, mapMutations } from 'vuex'
export default Vue.extend({
  components: {
    MobileSlider
  },
  computed: {
    ...mapGetters({
      currSidebarPanel: 'getCurrFunctionPanelType',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      isShowPagePreview: 'page/getIsShowPagePreview',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      InBgRemoveFirstStep: 'bgRemove/inFirstStep',
      InBgRemoveLastStep: 'bgRemove/inLastStep',
      inBgSettingMode: 'mobileEditor/getInBgSettingMode'
    }),
    opacity(): number {
      return this.inBgSettingMode ? this.backgroundOpacity : layerUtils.getCurrOpacity
    },
    backgroundOpacity(): number {
      const { styles: { opacity } } = pageUtils.getPage(pageUtils.currFocusPageIndex).backgroundImage.config
      return opacity
    }
  },
  methods: {
    ...mapMutations({
      setBgOpacity: 'SET_backgroundOpacity'
    }),
    updateLayerOpacity(val: number) {
      this.inBgSettingMode ? this.setBgOpacity({
        pageIndex: pageUtils.currFocusPageIndex,
        // opacity: `${opacity}`
        opacity: val
      }) : layerUtils.updateLayerOpacity(val)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-opacity {
  width: 100%;
  padding-bottom: 12px;
}
</style>
