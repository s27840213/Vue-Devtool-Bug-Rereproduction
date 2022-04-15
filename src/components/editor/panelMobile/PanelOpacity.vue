<template lang="pug">
  div(class="panel-opacity")
    mobile-slider(:propName="'opacity'")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
export default Vue.extend({
  components: {
    MobileSlider
  }
})
</script>

<style lang="scss" scoped>
.panel-opacity {
  width: 100%;
}
</style>
