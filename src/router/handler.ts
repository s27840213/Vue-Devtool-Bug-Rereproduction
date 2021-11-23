import { Route, NavigationGuardNext } from 'vue-router'
import uploadUtils from '@/utils/uploadUtils'
import assetUtils from '@/utils/assetUtils'
import { SidebarPanelType } from '@/store/types'
import store from '@/store'
import themeUtils from '@/utils/themeUtils'

export async function editorRouteHandler(_to: Route, from: Route, next: NavigationGuardNext<Vue>) {
  try {
    if (from.name === 'Home') {
      themeUtils.setTemplateThemes([])
    }
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      next({ name: 'Home', query: { isMobile: 'true' } })
      return
    }
    if (window.screen.height > window.screen.width) {
      next({ name: 'Home', query: { isMobile: 'true' } })
      return
    }
    next()
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    const designId = urlParams.get('design_id')
    const panelIndex = urlParams.get('panel_index')
    const url = urlParams.get('url')
    const width = urlParams.get('width')
    const height = urlParams.get('height')
    if (type && designId) {
      type === 'export'
        ? uploadUtils.getExport(urlParams)
        : await uploadUtils.getDesign(type, designId, { width, height })
    } else if (!url && from.name !== 'Home') {
      themeUtils.refreshTemplateState()
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
