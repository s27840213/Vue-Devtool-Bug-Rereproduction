<template lang="pug">
div(
  class="feature-card flex-center-end box-border py-16 rounded-20"
  :style="cardStyles")
  span(class="typo-h5 text-white") {{ title }}
</template>
<script setup lang="ts">
const props = defineProps<{
  bgImg: string
  title: string
}>()

const cardStyles = computed(() => {
  const targetUrl = require(`${props.bgImg}.png`)
  return {
    backgroundImage: `linear-gradient(0deg, rgba(0%, 0%, 0%, 0.85) 3%, transparent 40%), url(${targetUrl}`
  }
})
</script>
<style lang="scss">
.feature-card {
  background-repeat: no-repeat;
  background-size: cover;
  height: 230px;
}
</style>
