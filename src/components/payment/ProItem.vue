<template lang="pug">
  img(class="pro" :src="require('@/assets/img/svg/pricing/pro.svg')" loading="lazy")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
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
