import { Route, NavigationGuardNext } from 'vue-router'
import uploadUtils from '@/utils/uploadUtils'
import assetUtils from '@/utils/assetUtils'
import { SidebarPanelType } from '@/store/types'
import store from '@/store'
import themeUtils from '@/utils/themeUtils'
import designUtils from '@/utils/designUtils'
import generalUtils from '@/utils/generalUtils'
import pageUtils from '@/utils/pageUtils'

export async function editorRouteHandler(_to: Route, from: Route, next: NavigationGuardNext<Vue>) {
  try {
    next()
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    const designId = urlParams.get('design_id')
    const teamId = urlParams.get('team_id')
    const panel = urlParams.get('panel')
    const url = urlParams.get('url')
    const width = urlParams.get('width')
    const height = urlParams.get('height')
    const unit = urlParams.get('unit')
    const themeId = urlParams.get('themeId')
    const groupId = urlParams.get('group_id')
    const path = urlParams.get('path')
    const folderName = urlParams.get('folderName')

    if (type && designId) {
      switch (type) {
        case 'export': {
          uploadUtils.getExport(urlParams)
          break
        }
        case 'design': {
          if (teamId) {
            designUtils.fetchDesign(teamId, designId, { width, height })
          }
          break
        }
        default: {
          await uploadUtils.getDesign(type, { designId }, { width, height, groupId: groupId ?? '' })
          store.commit('file/SET_setLayersDone')
        }
      }
    } else if (type === 'new-design-size' && width && height) {
      designUtils.newDesign(
        parseInt(width),
        parseInt(height === '0' ? width : height),
        unit || 'px',
        parseInt(themeId as string),
        path === null ? undefined : path,
        folderName === null ? undefined : folderName
      )
      if (themeId === '7') {
        store.commit('SET_groupType', 1)
        if (generalUtils.isTouchDevice()) {
          pageUtils.fillPage()
        }
      }
    } else if (!url && (!from.name || ['Login'].includes(from.name))) {
      // refresh /editor page
      store.commit('file/SET_setLayersDone')
      themeUtils.refreshTemplateState()
    }

    if (panel && panel in SidebarPanelType) {
      store.commit('SET_currSidebarPanelType', SidebarPanelType[panel as any])
    }

    // reset (close) page preview mode
    store.commit('page/SET_isShowPagePreview', false)
    store.commit('page/SET_showPagePanel', false)

    if (url) {
      const hasToken = url.indexOf('token=') !== -1
      let tokenKey = ''
      let src = url
      if (hasToken) {
        tokenKey = url.match('&token') ? '&token=' : '?token='
        src = url.substring(0, hasToken ? url.indexOf(tokenKey) : undefined)
        const token = url.substring((src + tokenKey).length, url.indexOf('&team_id='))
        const teamId = url.substr((src + tokenKey + token + '&team_id=').length)
        store.commit('user/SET_STATE', { token, teamId })
      }
      fetch(`https://${src}`)
        .then(response => response.json())
        .then(json => { assetUtils.addTemplate(json) })

      store.commit('user/SET_STATE', { userId: 'backendRendering' })
      store.commit('SET_currSidebarPanelType', -1)
    }
  } catch (error) {
    console.log(error)
  }
}
