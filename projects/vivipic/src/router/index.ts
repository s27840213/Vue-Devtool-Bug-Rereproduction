import store from '@/store'
import { LayerType } from '@nu/vivi-lib/store/types'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import brandkitUtils from '@nu/vivi-lib/utils/brandkitUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import Editor from '@/views/Editor.vue'
import Home from '@/views/Home.vue'
import { RouteRecordRaw } from 'vue-router'
import { editorRouteHandler } from './handler'
import router from '@nu/vivi-lib/router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    name: 'Home',
    component: Home,
    beforeEnter: async (to, from, next) => {
      try {
        next()
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'editor',
    name: 'Editor',
    component: Editor,
    beforeEnter: editorRouteHandler
  },
  // {
  //   path: 'mobile-editor',
  //   name: 'MobileEditor',
  //   component: MobileEditor,
  //   // eslint-disable-next-line space-before-function-paren
  //   beforeEnter: editorRouteHandler
  // },
  {
    path: 'preview',
    name: 'Preview',
    component: () => import('@/views/Preview.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const url = urlParams.get('url')
        const teamId = urlParams.get('team_id')
        const token = urlParams.get('token')
        const dpi = +(urlParams.get('dpi') ?? -1)
        const bleed = !!+(urlParams.get('bleed') ?? 0)
        const trim = !!+(urlParams.get('trim') ?? 0)
        const margin = urlParams.get('margin')
        const margins = margin ? margin.split(',') : []
        const renderForPDF = urlParams.get('renderForPDF')
        const unitScale = urlParams.get('unit_scale')

        store.commit('user/SET_STATE', { renderForPDF: renderForPDF === 'true' })
        store.commit('user/SET_STATE', { unitScale: unitScale === '1' })

        const informBackend = () => {
          console.log('all resize done')
          const div = document.createElement('div')
          div.id = 'vivipic-text-done'
          div.innerHTML = 'xxx'
          div.style.position = 'fixed'
          div.style.top = '100%'
          div.style.left = '100%'
          document.body.appendChild(div)
        }

        if (token && teamId && url) {
          // for new version
          // e.g.: /preview?url=template.vivipic.com%2Fexport%2F<design_team_id>%2F<design_export_id>%2Fpage_<page_index>.json%3Fver%3DJeQnhk9N%26token%3DQT0z7B3D3ZuXVp6R%26team_id%3DPUPPET
          store.commit('user/SET_STATE', { token, teamId, dpi, backendRenderParams: { isBleed: bleed, isTrim: trim, margin: { bottom: +margins[0] || 0, right: +margins[1] || 0 } } })
          store.commit('user/SET_STATE', { userId: 'backendRendering' })
          const response = await (await fetch(`https://${url}`)).json()
          generalUtils.initializeFlags(LayerType.text, [response], informBackend)
          await assetUtils.addTemplate(response, { pageIndex: 0 })
          store.commit('file/SET_setLayersDone')
        } else if (url) {
          // for old version
          // e.g.: /preview?url=template.vivipic.com%2Fexport%2F<design_team_id>%2F<design_export_id>%2Fpage_<page_index>.json%3Fver%3DJeQnhk9N%26token%3DQT0z7B3D3ZuXVp6R%26team_id%3DPUPPET
          const hasToken = url.indexOf('token=') !== -1
          let tokenKey = ''
          let src = url
          if (hasToken) {
            tokenKey = url.match('&token') ? '&token=' : '?token='
            src = url.substring(0, url.indexOf(tokenKey))
            const querys: { [index: string]: string } = {}
            url.split('?')[1].split('&').forEach((query: string) => {
              const [key, val] = query.split('=')
              querys[key] = val
            })
            const token = querys.token
            const teamId = querys.team_id
            const dpi = +(querys.dpi ?? -1)
            const bleed = !!+querys.bleed
            const trim = !!+querys.trim
            const margin = querys.margin
            const margins = margin ? margin.split(',') : []
            store.commit('user/SET_STATE', { token, teamId, dpi, backendRenderParams: { isBleed: bleed, isTrim: trim, margin: { bottom: +margins[0] || 0, right: +margins[1] || 0 } } })
          }
          store.commit('user/SET_STATE', { userId: 'backendRendering' })
          const response = await (await fetch(`https://${src}`)).json()
          generalUtils.initializeFlags(LayerType.text, [response], informBackend)
          await assetUtils.addTemplate(response, { pageIndex: 0 })
          store.commit('file/SET_setLayersDone')
        }
        next()
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'signup',
    name: 'SignUp',
    props: route => ({ redirect: route.query.redirect }),
    component: () => import('@/views/Login/SignUp.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        if (store.getters['user/isLogin']) {
          next({ path: from.query.redirect as string || '/' })
        } else {
          next()
        }
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'login',
    name: 'Login',
    props: route => ({ redirect: route.query.redirect }),
    component: () => import('@/views/Login/Login.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        if (to.query.type) {
          next()
        } else {
          if (store.getters['user/isLogin']) {
            next({ path: from.query.redirect as string || '/' })
          } else {
            next()
          }
        }
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'mydesign/:view?',
    name: 'MyDesign',
    component: () => import('@/views/MyDesign.vue'),
    props: true
  },
  {
    path: 'templates',
    name: 'TemplateCenter',
    component: () => import('@/views/TemplateCenter.vue')
  },
  {
    path: 'settings/:view?',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    props: true
  },
  {
    path: 'mobilewarning',
    name: 'MobileWarning',
    component: () => import('@/views/MobileWarning.vue')
  },
  {
    path: 'browserwarning',
    name: 'BrowserWarning',
    component: () => import('@/views/BrowserWarning.vue')
  },
  {
    path: 'brandkit',
    name: 'BrandKit',
    component: () => import('@/views/BrandKit.vue'),
    beforeEnter: async (to, from, next) => {
      try {
        if (!brandkitUtils.isBrandkitAvailable) {
          next({ path: '/' })
        } else {
          next()
        }
      } catch (error) {
        logUtils.setLogForError(error as Error)
      }
    }
  },
  {
    path: 'pricing',
    name: 'Pricing',
    component: () => import('@/views/Pricing.vue')
  }
]

if (window.location.host !== 'vivipic.com') {
  routes.push({
    path: 'copytool',
    name: 'CopyTool',
    component: () => import('@/views/CopyTool.vue')
  })
  routes.push({
    path: 'nubtnlist',
    name: 'NubtnList',
    component: () => import('@/views/NubtnList.vue')
  })
  routes.push({
    path: 'emoji',
    name: 'EmojiTest',
    component: () => import('@/views/EmojiTest.vue')
  })
}

routes.forEach((route) => {
  router.addRoute('root', route)
})

export default router
