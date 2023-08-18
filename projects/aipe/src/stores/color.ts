import colors from '@/assets/json/colors.json'
import { defineStore } from 'pinia'
export type ColorSlip = keyof typeof colors
export const useColorStore = defineStore('color', () => {
  const colorSlips = Object.keys(colors) as ColorSlip[]
  const colorMap = new Map<string, ColorSlip>(Object.entries(colors) as [string, ColorSlip][])

  return { colorSlips, colorMap }
})
