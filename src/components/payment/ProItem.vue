<template lang="pug">
  img(class="pro" :src="require('@/assets/img/svg/pricing/pro.svg')" loading="lazy")
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
  top: 4px;
  left: 4px;
}
</style>
