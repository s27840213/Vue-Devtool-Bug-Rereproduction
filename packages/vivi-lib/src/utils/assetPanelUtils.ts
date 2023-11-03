import store from "@/store"

export default new (class AssetPanelUtils{
  setCurrActiveTab(tab: string) {
    store.commit('assetPanel/SET_currActiveTab', tab)
  }

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('assetPanel/SET_isInCategory', { tab, bool })
  }

  setShowAllRecently(tab: string, bool: boolean) {
    store.commit('assetPanel/SET_showAllRecently', { tab, bool })
  }
})()
