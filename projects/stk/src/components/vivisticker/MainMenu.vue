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
import PanelBackground from '@/components/vivisticker/PanelBackground.vue'
import PanelObject from '@/components/vivisticker/PanelObject.vue'
import PanelRemoveBg from '@/components/vivisticker/PanelRemoveBg.vue'
import PanelText from '@/components/vivisticker/PanelText.vue'
import PanelBackgroundUs from '@/components/vivisticker/us/PanelBackground.vue'
import PanelObjectUs from '@/components/vivisticker/us/PanelObject.vue'
import PanelTextUs from '@/components/vivisticker/us/PanelText.vue'
import PanelTemplate from '@/components/vivisticker/PanelTemplate.vue'
import PanelTemplateUs from '@/components/vivisticker/us/PanelTemplate.vue'

import vivistickerUtils from '@/utils/vivistickerUtils'
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
      vivistickerUtils.setState('recentPanel', { value: newVal })
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
