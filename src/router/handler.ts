import { Route, NavigationGuardNext } from 'vue-router'
import uploadUtils from '@/utils/uploadUtils'
import assetUtils from '@/utils/assetUtils'
import { SidebarPanelType } from '@/store/types'
import store from '@/store'

export async function editorRouteHandler (_to: Route, _from: Route, next: NavigationGuardNext<Vue>) {
  try {
    next()
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    const designId = urlParams.get('design_id')
    const panelIndex = urlParams.get('panel_index')
    const url = urlParams.get('url')

    if (type && designId) {
      type === 'export'
        ? uploadUtils.getExport(urlParams)
        : uploadUtils.getDesign(type, designId)
    }
    if (panelIndex && +panelIndex in SidebarPanelType) {
      store.commit('SET_currSidebarPanelType', +panelIndex)
    }
    if (url) {
      store.commit('SET_currSidebarPanelType', -1)
      fetch(`https://${url}`)
        .then(response => response.json())
        .then(json => { assetUtils.addTemplate(json) })
    } else {
      (() => import('@/assets/scss/components/tmpFonts.scss'))()
    }
  } catch (error) {
    console.log(error)
  }
}
