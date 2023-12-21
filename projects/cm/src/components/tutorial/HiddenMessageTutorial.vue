
<template lang="pug">
div(class="hidden-message-tutorial w-screen h-screen")
  div(v-if="step < 4" class="relative w-fit flex-center flex-col gap-19 mx-auto top-[20%] self-center")
    div(class="flex gap-8")
      div(class="w-full flex flex-col gap-8 items-end")
        img(
          class="w-100 h-100 rounded-full border-solid border-3 border-white object-cover object-center"
          :src="imgA")
        svg-icon(
          iconName="tutorial-arrow-right-primary"
          iconWidth="55px")
      div(class="flex flex-col items-end")
        div(class="h-79")
        img(
          class="w-100 h-100 rounded-full border-solid border-3 border-white object-cover object-center"
          :src="imgB")
    span(class="text-white typo-h6 text-left") {{ text }}
    nubtn(
      class="max-w-96"
      size="sm-full"
      @click="emit('nextStep')") {{ nextBtnText }}
  div(v-else class="w-full absolute grid grid-rows-2 grid-cols-3 gap-y-8" :style="tutorialStyles")
    span(class="text-white typo-h6 text-left col-start-2 self-end justify-self-center") {{ text }}
    div(class="justify-self-end row-start-2")
      svg-icon(
        iconName="tutorial-arrow-down"
        iconWidth="35px"
        iconHeight="61px"
      )
    nubtn(
      class="max-w-96 justify-self-center relative top-9 row-start-2"
      size="sm-full"
      @click="emit('nextStep')") {{ nextBtnText }}
</template>

<script setup lang="ts">
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import { toRefs } from 'vue' // Workaround for https://github.com/vuejs/eslint-plugin-vue/issues/2322

defineOptions({ name: 'hidden-message-tutorial' })
const emit = defineEmits(['nextStep'])
const props = defineProps({
  // current step
  step: {
    type: Number,
    required: true
  },
  // current highlight elements
  elHighlight: {
    type: Array<HTMLElement>,
    required: true
  },
  // current tracking frame, watch this value to update component during animation
  trackingFrame: {
    type: Number,
    required: true
  }
})
const { step, elHighlight, trackingFrame } = toRefs(props)

const { t } = useI18n()
const tutorialStyles = ref({})
const updateStyles = () => {
  if (!elHighlight.value.length) return
  const elTopItem = elHighlight.value.reduce((prev, curr) => prev.getBoundingClientRect().top < curr.getBoundingClientRect().top ? prev : curr);
  const { top } = elTopItem.getBoundingClientRect()
  if (step.value === 4) {
    tutorialStyles.value = {
      bottom: `calc(100% - ${top}px)`,
    }
  }
}

const imgA = computed(() => {
  if (step.value === 4) return ''
  return require(`demo/hidden-message-help-demo-${step.value - 1}a.jpeg`)
})

const imgB = computed(() => {
  if (step.value === 4) return ''
  return require(`demo/hidden-message-help-demo-${step.value - 1}b.png`)
})

const text = computed(() => {
  switch (step.value) {
    case 1:
      return t('CM0104')
    case 2:
      return t('CM0105')
    case 3:
      return t('CM0106')
    case 4:
      return t('CM0107')
    default:
      return ''
  }
})

const nextBtnText = computed(() => {
  return step.value === 4 ? t('CM0057') : t('CM0012')
})

watch(() => trackingFrame.value, updateStyles)

</script>

<style lang="scss">
</style>
