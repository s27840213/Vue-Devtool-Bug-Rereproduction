import { defineStore } from 'pinia'

export type AssetPanelType = 'none' | 'text' | 'object'

export const useAssetPanelStore = defineStore('assetPanel', () => {
  const assetPanelType = ref('none' as AssetPanelType)
  const setAssetPanelType = (type: AssetPanelType) => {
    assetPanelType.value = type
  }
  const showAssetPanel = computed(() => assetPanelType.value !== 'none')

  return {
    assetPanelType,
    setAssetPanelType,
    showAssetPanel,
  }
})
