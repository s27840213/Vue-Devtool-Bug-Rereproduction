<template lang="pug">
svg(
  v-if="iconName === 'loading'"
  :class="classes"
  viewBox="0 0 120 30"
  :style="iconStyles"
  v-html="loadingSvg")
svg(
  v-else
  :class="classes"
  :style="iconStyles")
  use(
    :xlink:href="`#${iconName}`"
    ref="useRef")
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import self from './SvgIcon.vue'
import colorTable from '@nu/tailwind-lib/colors.json'

declare module 'vue' {
  export interface GlobalComponents {
    SvgIcon: typeof self
  }
}

const props = withDefaults(
  defineProps<{
    iconName: string
    iconWidth?: string
    iconColor?: keyof typeof colorTable
    iconHeight?: string
    // only used for those who alread has stroke
    strokeColor?: keyof typeof colorTable
    sameSize?: boolean
  }>(),
  {
    iconWidth: '24px',
    sameSize: true,
  },
)
const loadingSvg = `
        <circle cx="15" cy="15" r="15">
            <animate attributeName="r" from="15" to="15"
                    begin="0s" dur="0.8s"
                    values="15;9;15" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="1" to="1"
                    begin="0s" dur="0.8s"
                    values="1;.5;1" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="15" r="9" fill-opacity="0.3">
            <animate attributeName="r" from="9" to="9"
                    begin="0s" dur="0.8s"
                    values="9;15;9" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="0.5" to="0.5"
                    begin="0s" dur="0.8s"
                    values=".5;1;.5" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
        <circle cx="105" cy="15" r="15">
            <animate attributeName="r" from="15" to="15"
                    begin="0s" dur="0.8s"
                    values="15;9;15" calcMode="linear"
                    repeatCount="indefinite" />
            <animate attributeName="fill-opacity" from="1" to="1"
                    begin="0s" dur="0.8s"
                    values="1;.5;1" calcMode="linear"
                    repeatCount="indefinite" />
        </circle>
      `

const classes = computed(() => {
  return {
    'svg-icon': true,
    [`svg-${props.iconName}`]: true,
    [`text-${props.iconColor}`]: props.iconColor,
    [`stroke-${props.strokeColor}`]: props.strokeColor,
  }
})

const iconStyles = computed(() => {
  let width = props.iconWidth
  let height = props.iconHeight

  if (!props.sameSize) {
    if (!props.iconWidth && props.iconHeight) {
      width = `${parseInt(props.iconHeight?.split('px')[0]) * iconAspectRatio.value}px`
    }

    if (props.iconWidth && !props.iconHeight) {
      height = `${parseInt(props.iconWidth?.split('px')[0]) / iconAspectRatio.value}px`
    }
  }
  return {
    width: width || (props.sameSize && height) || '40px',
    height: height || (props.sameSize && width) || '40px',
    // For debug, to find missing svg icon files.
    ...missingUse.value && { background: 'red' },
  }
})

const iconAspectRatio = computed(() => {
  if (props.sameSize) return 1

  if (useRef.value) {
    const { width, height } = useRef.value.getBoundingClientRect()
    return width / height
  }

  return 1
})
const useRef = ref<SVGGraphicsElement | null>(null)
const missingUse = computed(() => {
  if (!useRef.value) return
  const missing = !document.querySelector(`symbol#${props.iconName}`)
  if (missing) console.error(`Missing svg icon: ${props.iconName}.`)
  // return missing
  return true // Temporarily prevent false alarms.
})
</script>

<style lang="scss" scoped>
.svg-icon {
  transition:
    background-color 0.4s,
    color 0.4s,
    stroke 0.4s;
  fill: currentColor;
  &:focus {
    outline: none;
  }
}
</style>
