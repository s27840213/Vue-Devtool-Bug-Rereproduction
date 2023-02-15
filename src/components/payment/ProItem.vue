<template lang="pug">
img(class="pro" :src="require('@/assets/img/svg/pricing/vivisticker_pro.svg')" loading="lazy")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'ProItem'
})
</script>

<style lang="scss" scoped>
.pro {
  position: absolute;
  top: -1px; // (2px - 3px). The img contains spaces (3px in top and bottom, so to compensate the space, the top should be reduced by 3px)
  left: 2px;
}
</style>
