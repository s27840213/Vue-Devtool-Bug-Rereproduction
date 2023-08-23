import colors from '@/assets/json/colors.json'

type ColorSlip = keyof typeof colors
enum AppColors {
  'transparent' = 'transparent',
  'app-bg' = 'app-bg',
  'app-btn-primary-bg' = 'app-btn-primary-bg',
  'app-btn-primary-pressed' = 'app-btn-primary-pressed',
  'app-btn-primary-text' = 'app-btn-primary-text',
  'app-btn-secondary-bg' = 'app-btn-secondary-bg',
  'app-btn-secondary-pressed' = 'app-btn-secondary-pressed',
  'app-icon-dark' = 'app-icon-dark',
  'app-icon-light' = 'app-icon-light',
  'app-placeholder' = 'app-placeholder',
  'app-selection' = 'app-selection',
  'app-slider-bg' = 'app-slider-bg',
  'app-tab-active' = 'app-tab-active',
  'app-tab-bg' = 'app-tab-bg',
  'app-tab-default' = 'app-tab-default',
  'app-tab-disable' = 'app-tab-disable',
  'app-text-primary' = 'app-text-primary',
  'app-text-secondary' = 'app-text-secondary',
  'app-toast-success' = 'app-toast-success',
  'neutral-dark-active' = 'neutral-dark-active',
  'neutral-dark-hover' = 'neutral-dark-hover',
  'neutral-dark' = 'neutral-dark',
  'neutral-light-active' = 'neutral-light-active',
  'neutral-light-hover' = 'neutral-light-hover',
  'neutral-normal-active' = 'neutral-normal-active',
  'neutral-normal-hover' = 'neutral-normal-hover',
  'neutral-normal' = 'neutral-normal',
  'primary-dark-active' = 'primary-dark-active',
  'primary-dark-hover' = 'primary-dark-hover',
  'primary-dark' = 'primary-dark',
  'primary-darker' = 'primary-darker',
  'primary-light-active' = 'primary-light-active',
  'primary-light-hover' = 'primary-light-hover',
  'primary-light' = 'primary-light',
  'primary-lighter' = 'primary-lighter',
  'primary-normal-active' = 'primary-normal-active',
  'primary-normal-hover' = 'primary-normal-hover',
  'primary-normal' = 'primary-normal',
  'primary-white' = 'primary-white'
}

export { AppColors, colors }

export type { ColorSlip }
