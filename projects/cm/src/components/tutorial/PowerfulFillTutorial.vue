
import type { emit } from 'process';
<template lang="pug">
div(class="w-screen h-screen")
  div(class="w-full h-full grid")
    div(v-if="[1, 2, 4].includes(step)" class="relative w-fit flex flex-col items-center" :style="tutorialStyles")
      span(class="text-primary-white typo-h6") {{ tutorialDescription }}
      div(:class="`grid grid-flow-col grid-cols-${hasNextBtn ? 3 : 2} w-full`")
        div(class="justify-self-center")
          cm-svg-icon(
            v-if="leftIconName"
            :iconName="leftIconName"
            :iconWidth="iconSize.width"
            :iconHeight="iconSize.height"
          )
        cm-btn(
          v-if="hasNextBtn"
          class="self-start justify-self-center"
          theme="primary"
          size="md"
          @click="emit('nextStep')") {{ nextBtnText }}
        div(class="justify-self-end")
          cm-svg-icon(
            v-if="rightIconName"
            :iconName="rightIconName"
            :iconWidth="iconSize.width"
            :iconHeight="iconSize.height"
          )
    Transition(name='slide')
      img(v-if="step === 2" class="absolute w-52 h-66" src="@/assets/img/touch.png" :style="touchStyles")
</template>

<script setup lang="ts">
defineOptions({ name: 'powerful-fill-tutorial' })
const emit = defineEmits(['nextStep'])
const props = defineProps({
  step: {
    type: Number,
    required: true
  },
  elHighlight: {
    type: Array<HTMLElement>,
    required: true
  },
  trackingFrame: {
    type: Number,
    required: true
  }
})
const { step, elHighlight, trackingFrame } = toRefs(props)

const { t } = useI18n()
const tutorialStyles = ref({})
const touchStyles = ref({})
const updateStyles = () => {
  if (step.value === 3) return
  if (!elHighlight.value.length) return
  const elTopItem = elHighlight.value.reduce((prev, curr) => prev.getBoundingClientRect().top < curr.getBoundingClientRect().top ? prev : curr);
  const { top, left, bottom, width } = elTopItem.getBoundingClientRect()
  if (step.value === 1) {
    tutorialStyles.value = {
      justifySelf: 'end',
      top: `${top - 10}px`,
      right: `calc(100% - ${left - 10}px)`,
      gap: '15px'
    }
  }
  if (step.value === 2) {
    tutorialStyles.value = {
      justifySelf: 'end',
      top: `${top - 22}px`,
      right: `calc(100% - ${left - 10}px)`,
      gap: '2px',
    }
    touchStyles.value = {
      top: `${bottom - 8}px`,
      left: `${left + width / 2 - 8}px`
    }
  }
  if (step.value === 4) {
    tutorialStyles.value = {
      justifySelf: 'center',
      alignSelf: 'end',
      bottom: `calc(100% - ${top - 25}px)`,
      gap: '15px'
    }
  }
}
const hasNextBtn = computed(() => {
  return [1, 4].includes(step.value)
})
const nextBtnText = computed(() => {
  return step.value === 1 ? t('CM0012') : t('CM0057')
})
const tutorialDescription = computed(() => {
  switch (step.value) {
    case 1:
      return t('CM0054')
    case 2:
      return t('CM0055')
    case 4:
      return t('CM0056')
    default:
      return ''
  }
})
const leftIconName = computed(() => {
  switch (step.value) {
    case 4:
      return 'tutorial-arrow-down'
    default:
      return ''
  }
})
const rightIconName = computed(() => {
  switch (step.value) {
    case 1:
    case 2:
      return 'tutorial-arrow-right'
    default:
      return ''
  }
})
const iconSize = computed(() => {
  switch (step.value) {
    case 1:
      return { width: '69px', height: '67px' }
    case 2:
      return { width: '32px', height: '30px' }
    case 4:
      return { width: '35px', height: '61px' }
    default:
      return { width: '0px', height: '0px' }
  }
})
watch(() => step.value, (newVal) => nextTick(() => {
  if (newVal === 3) window.setTimeout(() => {
    if (newVal !== 3) return
    emit('nextStep')
  }, 1500)
}), { immediate: true })
watch(() => trackingFrame.value, updateStyles)

</script>

<style lang="scss">
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
