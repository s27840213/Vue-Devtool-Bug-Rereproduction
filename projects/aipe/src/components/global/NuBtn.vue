<template lang="pug">
div(
  class="transition-colors duration-300 flex items-center justify-center"
  :class="`${btnColor} nu-btn__${theme}${size ? `--${size}` : ''} ${full ? 'w-full' : 'w-fit'}`"
  ref="btnRef"
  @click="click"
  @contextmenu.prevent)
  svg-icon(
    v-if="hasIcon"
    :iconName="iconName"
    :iconWidth="iconSize"
    :iconColor="iconColor")
  span(v-if="!theme.includes('icon')")
    slot
</template>

<script setup lang="ts">
// https://www.figma.com/file/nO7n8qAcowXguD9znn1JGt/AI-PhotoEditor?node-id=378%3A168384&mode=dev
import useTapTransition from '@/composable/useTapTransition'
import { useColorStore } from '@/stores/color'
import type { INubtnSize, INubtnState, INubtnThemes } from '@/types/btn'
import { computed } from 'vue'

// #region static
const { theme, size, disabled, iconName, active, full } = withDefaults(
  defineProps<{
    theme: INubtnThemes
    size?: INubtnSize
    disabled?: boolean
    iconName?: string
    hasIcon?: boolean
    active?: boolean
    full?: boolean
  }>(),
  {
    size: '',
    hasIcon: false,
    disabled: false,
    active: false,
    full: false
  }
)

const emits = defineEmits(['clickBtn', 'update:active'])

const btnRef = ref<HTMLElement | null>(null)
const pressed = ref(active)

useTapTransition(btnRef, pressed)

const { btnColorMap } = useColorStore()
// #endregion

// #region btnSetting
const status = computed<INubtnState>(() => {
  return disabled ? 'disabled' : pressed.value ? 'pressed' : 'default'
})

const btnColor = computed<string>(() => {
  return `bg-${btnColorMap[theme][status.value].btn} text-${btnColorMap[theme][status.value].text}`
})
const iconSize = '24px'

const iconColor = computed<string>(() => {
  return btnColorMap[theme][status.value].icon
})
// #endregion

const click = (e: MouseEvent) => {
  if (status.value === 'disabled') return
  emits('clickBtn', e)
}
</script>

<style lang="scss">
.nu-btn {
  &__primary,
  &__secondary {
    @apply py-10 px-16 rounded-[50px];
    > span {
      @apply typo-btn-lg;
    }

    &--md {
      @apply px-16 py-8 rounded-[50px];
      > span {
        @apply typo-btn-md;
      }
    }
  }
}
</style>
