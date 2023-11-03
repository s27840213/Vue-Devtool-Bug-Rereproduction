import store from "@/store"

export default new (class AssetPanelUtils{
  get currActiveTab(): string {
    return store.getters['assetPanel/getCurrActiveTab']
  }

  get showActiveTab(): boolean {
    return store.getters['assetPanel/getShowActiveTab']
  }

  get currIsInCategory(): boolean {
    return store.getters['assetPanel/getIsInCategory'](this.currActiveTab)
  }

  get currShowAllRecently(): boolean {
    return store.getters['assetPanel/getShowAllRecently'](this.currActiveTab)
  }

  setCurrActiveTab(tab: string) {
    store.commit('assetPanel/SET_currActiveTab', tab)
  }

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('assetPanel/SET_isInCategory', { tab, bool })
  }

  setCurrIsInCategory(bool: boolean) {
    store.commit('assetPanel/SET_isInCategory', { tab: this.currActiveTab, bool })
  }

  setShowAllRecently(tab: string, bool: boolean) {
    store.commit('assetPanel/SET_showAllRecently', { tab, bool })
  }

  setCurrShowAllRecently(bool: boolean) {
    store.commit('assetPanel/SET_showAllRecently', { tab: this.currActiveTab, bool })
  }
})()
