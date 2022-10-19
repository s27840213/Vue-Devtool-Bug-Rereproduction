<template lang="pug">
  div(class="main-menu"
      ref="panel")
    div(class="main-menu__bottom-section")
      keep-alive(:include="['panel-object', 'panel-background', 'panel-text']")
        component(class="border-box"
                  :is="`panel-${this.currActiveTab}`"
                  @openColorPicker="handleOpenColorPicker")
</template>

<script lang="ts">
import Vue from 'vue'
import PanelObject from '@/components/vivisticker/PanelObject.vue'
import PanelBackground from '@/components/vivisticker/PanelBackground.vue'
import PanelText from '@/components/vivisticker/PanelText.vue'

import { mapGetters } from 'vuex'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  name: 'main-menu',
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
    currActiveTab(newVal) {
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
