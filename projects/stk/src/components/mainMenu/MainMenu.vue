<template lang="pug">
div(class="main-menu"
    ref="panel")
  div(class="main-menu__bottom-section")
    keep-alive(:include="['panel-object', 'panel-object-us', 'panel-template-us', 'panel-background', 'panel-background-us', 'panel-text', 'panel-text-us', 'panel-template']")
      component(class="border-box"
                :is="currTab"
                @openColorPicker="handleOpenColorPicker")
</template>

<script lang="ts">
import PanelBackground from '@/components/editor/panelMobile/PanelBackground.vue'
import PanelRemoveBg from '@/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelTemplate from '@/components/editor/panelMobile/PanelTemplate.vue'
import PanelBackgroundUs from '@/components/editor/panelMobileUs/PanelBackground.vue'
import PanelTemplateUs from '@/components/editor/panelMobileUs/PanelTemplate.vue'
import PanelObject from '@nu/vivi-lib/components/editor/panelMobile/PanelObject.vue'
import PanelText from '@nu/vivi-lib/components/editor/panelMobile/PanelText.vue'
import PanelObjectUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelObject.vue'
import PanelTextUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelText.vue'

import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'main-menu',
  emits: ['openColorPicker'],
  components: {
    PanelObject,
    PanelObjectUs,
    PanelBackground,
    PanelBackgroundUs,
    PanelText,
    PanelTextUs,
    PanelTemplate,
    PanelTemplateUs,
    PanelRemoveBg
  },
  computed: {
    ...mapGetters({
      currActiveTab: 'vivisticker/getCurrActiveTab'
    }),
    currTab(): string {
      if (!this.$options.components) return ''
      const currTab = `panel-${this.currActiveTab}`
      if (this.$i18n.locale !== 'us') return currTab

      const currTabUs = currTab + '-us'
      const compNames = Object.entries(this.$options.components).map(([key, comp]) => comp.name)
      return compNames.includes(currTabUs) ? currTabUs : currTab
    }
  },
  watch: {
    currActiveTab(newVal: string) {
      stkWVUtils.setState('recentPanel', { value: newVal })
    }
  },
  methods: {
    handleOpenColorPicker() {
      this.$emit('openColorPicker')
    }
  }
})
</script>

<style lang="scss" scoped>
.main-menu {
  position: relative;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: setColor(black-2);

  &__bottom-section {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    @include no-scrollbar;
  }
}
</style>
