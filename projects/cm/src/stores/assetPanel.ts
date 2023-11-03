import { defineStore } from 'pinia'

export type AssetPanelType = 'none' | 'panel-text' | 'panel-object'

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
