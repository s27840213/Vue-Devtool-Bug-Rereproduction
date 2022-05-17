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
export default Vue.extend({
  components: {
    MobileSlider
  },
  computed: {
    opacity(): number {
      return layerUtils.getCurrOpacity
    }
  },
  methods: {
    updateLayerOpacity(val: number) {
      console.log('update')
      layerUtils.updateLayerOpacity(val)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-opacity {
  width: 100%;
}
</style>
