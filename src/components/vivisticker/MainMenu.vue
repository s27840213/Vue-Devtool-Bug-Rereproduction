<template lang="pug">
div(class="main-menu"
    ref="panel")
  div(class="main-menu__bottom-section")
    keep-alive(:include="['panel-object', 'panel-background', 'panel-text']")
      component(class="border-box"
                :is="`panel-${currActiveTab}`"
                @openColorPicker="handleOpenColorPicker")
</template>

<script lang="ts">
import PanelBackground from '@/components/vivisticker/PanelBackground.vue'
import PanelObject from '@/components/vivisticker/PanelObject.vue'
import PanelText from '@/components/vivisticker/PanelText.vue'

import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'main-menu',
  emits: ['openColorPicker'],
  components: {
    PanelObject,
    PanelBackground,
    PanelText
  },
  computed: {
    ...mapGetters({
      currActiveTab: 'vivisticker/getCurrActiveTab'
    })
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
