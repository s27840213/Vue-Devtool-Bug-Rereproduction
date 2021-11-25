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
        : await uploadUtils.getDesign(type, { designId }, { width, height })
    } else if (!url && from.name !== 'Home') {
      themeUtils.refreshTemplateState()
    }

    if (panelIndex && +panelIndex in SidebarPanelType) {
      store.commit('SET_currSidebarPanelType', +panelIndex)
    }
    if (url) {
      store.commit('SET_currSidebarPanelType', -1)
      // e.g.: https://test.vivipic.com/editor?url=template.vivipic.com%2Fexport%2F9XBAb9yoKlJbzLiWNUVM%2F211123164456873giej3iKR%2Fpage_0.json%3Fver%3DJeQnhk9N%26token%3DVtOldDgVuwPIWP0Y%26team_id%3D9XBAb9yoKlJbzLiWNUVM
      const hasToken = url.indexOf('&token=') !== -1
      const src = url.substring(0, hasToken ? url.indexOf('&token=') : undefined)
      if (hasToken) {
        const token = url.substring((src + '&token=').length, url.indexOf('&team_id='))
        const teamId = url.substr((src + '&token=' + token + '&team_id=').length)
        store.commit('user/SET_STATE', { token, teamId })
      }
      console.log(src)
      fetch(`https://${src}`)
        .then(response => response.json())
        .then(json => { assetUtils.addTemplate(json) })
    } else {
      (() => import('@/assets/scss/components/tmpFonts.scss'))()
    }
  } catch (error) {
    console.log(error)
  }
}
