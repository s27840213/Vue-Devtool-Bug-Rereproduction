import NuSvgIcon from '@/components/global/NuSvgIcon.vue'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    NuSvgIcon: typeof NuSvgIcon
  }
}
