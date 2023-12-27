<template lang="pug">
div(
  class="feature-card relative flex items-end box-border py-16 overflow-hidden"
  :class="{'h-230 justify-center rounded-20': theme === 'default', 'h-305 px-16 rounded-16': theme === 'lg'}"
  :style="cardStyles")
  compare-image(
    v-if="bgImgB"
    class="feature-card__compare-image absolute top-0 left-0"
    :srcA="require(bgImg)"
    :srcB="require(bgImgB)"
  )
  div(
    class="relative w-full flex flex-col gap-8 z-[1]"
    :class="{'text-left': theme === 'lg'}")
    span(:class="theme === 'lg' ? 'typo-h4 text-yellow-0' : 'typo-h5 text-white'") {{ title }}
    span(v-if="subTitle" class="typo-body-md text-white") {{ subTitle }}
    svg-icon(
      v-if="theme === 'lg'"
      class="absolute bottom-9 right-0"
      iconName="cm_arrow-right"
      iconColor="yellow-0"
    )
</template>
<script setup lang="ts">

const props = withDefaults(defineProps<{
  bgImg: string
  bgImgB?: string
  title: string
  subTitle?: string
  theme?: 'default' | 'lg'
}>(), {
  bgImgB: '',
  subTitle: '',
  theme: 'default'
})

const cardStyles = computed(() => {
  if (props.bgImgB) return {}
  return {
    backgroundImage: `linear-gradient(0deg, rgba(0%, 0%, 0%, 0.85) 3%, transparent 40%), url(${require(props.bgImg)}`
  }
})
</script>
<style lang="scss">
.feature-card {
  background-repeat: no-repeat;
  background-size: cover;
  &__compare-image::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;  
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.12) 7.99%, rgba(0, 0, 0, 0.34) 75.64%, rgba(0, 0, 0, 0.40) 93.44%);
  }
}
</style>
