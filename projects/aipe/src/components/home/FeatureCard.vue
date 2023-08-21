<template lang="pug">
router-link(
  custom
  v-slot="{ navigate }"
  to="/")
  div(
    class="feature-card flex items-end justify-center box-border py-16 rounded-[20px]"
    :style="cardStyles"
    @click="navigate")
    span(class="typo-h5 text-primary-white") {{ title }}
</template>
<script setup lang="ts">
const props = defineProps<{
  bgImg: string
  title: string
}>()

const cardStyles = computed(() => {
  const targetUrl = getImageUrl()
  return {
    background: `linear-gradient(0deg, rgba(0%, 0%, 0%, 0.85) 3%, transparent 40%), url(${targetUrl}`
  }
})

const getImageUrl = () => {
  const targetUrl = `../../assets/img/${props.bgImg}.png`
  const res = new URL(targetUrl, import.meta.url).href
  return res
}
</script>
<style lang="scss">
.feature-card {
  background-repeat: no-repeat;
  background-size: cover;
  height: 230px;
  // background: linear-gradient(0deg, rgba(#000000, 0.85) 3%, transparent 40%),
  //   url('src/assets/img/tmp.png');
}
</style>
