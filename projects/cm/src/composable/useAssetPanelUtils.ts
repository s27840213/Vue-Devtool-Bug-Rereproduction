import { useAssetPanelStore } from "@/stores/assetPanel"
import { useStore } from "vuex"

const useAssetPanelUtils = () => {
  const store = useStore()
  
  const { assetPanelType } = storeToRefs(useAssetPanelStore())

  const isInCategory = computed(() => {
    return store.getters['assetPanel/getIsInCategory'](assetPanelType.value) as boolean
  })

  const showAllRecently = computed(() => {
    return store.getters['assetPanel/getShowAllRecently'](assetPanelType.value) as boolean
  })

  return {
    isInCategory,
    showAllRecently
  }
}

export default useAssetPanelUtils
