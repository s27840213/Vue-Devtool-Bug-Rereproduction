<template lang="pug">
router-link(
  custom
  v-slot="{ navigate }"
  :to="`/description?target=${target}`")
  div(
    class="feature-card flex items-end justify-center box-border py-16 rounded-[20px]"
    :style="cardStyles"
    @click="() => target && navigate()")
    span(class="typo-h5 text-primary-white") {{ title }}
</template>
<script setup lang="ts">
import type { EditorType } from '@/types/editor';

const props = defineProps<{
  bgImg: string
  title: string
  target?: EditorType
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
