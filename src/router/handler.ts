import { Route, NavigationGuardNext } from 'vue-router'
import uploadUtils from '@/utils/uploadUtils'
import { SidebarPanelType } from '@/store/types'
import store from '@/store'

export async function editorRouteHandler (_to: Route, _from: Route, next: NavigationGuardNext<Vue>) {
  try {
    next()
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    const designId = urlParams.get('design_id')
    const panelIndex = urlParams.get('panel_index')
    const headless = urlParams.get('headless')

    if (type && designId) {
      type === 'export'
        ? uploadUtils.getExport(urlParams)
        : uploadUtils.getDesign(type, designId)
    }
    if (panelIndex && +panelIndex in SidebarPanelType) {
      store.commit('SET_currSidebarPanelType', +panelIndex)
    }
    if (headless === '1') {
      store.commit('SET_currSidebarPanelType', -1)
    } else {
      (() => import('@/assets/scss/components/tmpFonts.scss'))()
    }
  } catch (error) {
    console.log(error)
  }
}
