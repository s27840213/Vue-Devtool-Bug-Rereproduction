import type { INuBtnColorMap } from '@/types/btn'
import { AppColors, colors, type ColorSlip } from '@/types/color'
import { defineStore } from 'pinia'

export const useColorStore = defineStore('color', () => {
  const colorSlips = Object.keys(colors) as ColorSlip[]
  const colorMap = new Map<string, ColorSlip>(Object.entries(colors) as [string, ColorSlip][])
  const btnColorMap: INuBtnColorMap = {
    primary: {
      default: {
        icon: AppColors['neutral-normal'],
        text: AppColors['neutral-normal'],
        btn: AppColors['app-btn-primary-bg']
      },
      pressed: {
        icon: AppColors['neutral-normal'],
        text: AppColors['neutral-normal'],
        btn: AppColors['app-btn-primary-pressed']
      },
      disabled: {
        icon: AppColors['primary-white'],
        text: AppColors['primary-white'],
        btn: AppColors['app-tab-disable']
      }
    },
    secondary: {
      default: {
        icon: AppColors['neutral-normal'],
        text: AppColors['neutral-normal'],
        btn: AppColors['primary-light-active']
      },
      pressed: {
        icon: AppColors['neutral-normal'],
        text: AppColors['neutral-normal'],
        btn: AppColors['primary-normal-active']
      },
      disabled: {
        icon: AppColors['app-text-primary'],
        text: AppColors['app-text-primary'],
        btn: AppColors['app-tab-disable']
      }
    },
    icon_dark: {
      default: {
        icon: AppColors['app-tab-default'],
        text: AppColors['transparent'],
        btn: AppColors['transparent']
      },
      pressed: {
        icon: AppColors['primary-light-active'],
        text: AppColors['transparent'],
        btn: AppColors['transparent']
      },
      disabled: {
        icon: AppColors['app-tab-disable'],
        text: AppColors['transparent'],
        btn: AppColors['transparent']
      }
    },
    icon_light: {
      default: {
        icon: AppColors['app-icon-dark'],
        text: AppColors['transparent'],
        btn: AppColors['transparent']
      },
      pressed: {
        icon: AppColors['neutral-light-active'],
        text: AppColors['transparent'],
        btn: AppColors['transparent']
      },
      disabled: {
        icon: AppColors['app-tab-disable'],
        text: AppColors['transparent'],
        btn: AppColors['transparent']
      }
    },
    text: {
      default: {
        icon: AppColors['transparent'],
        text: AppColors['app-text-primary'],
        btn: AppColors['transparent']
      },
      pressed: {
        icon: AppColors['transparent'],
        text: AppColors['neutral-light-active'],
        btn: AppColors['transparent']
      },
      disabled: {
        icon: AppColors['transparent'],
        text: AppColors['app-tab-disable'],
        btn: AppColors['transparent']
      }
    }
  }
  return { colorSlips, colorMap, btnColorMap }
})
