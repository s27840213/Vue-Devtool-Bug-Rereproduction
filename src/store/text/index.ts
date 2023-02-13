import { IGroup, IParagraph, IText } from '@/interfaces/layer'
import { IFont, ISelection } from '@/interfaces/text'
import router from '@/router'
import brandkitUtils from '@/utils/brandkitUtils'
import errorHandleUtils from '@/utils/errorHandleUtils'
import generalUtils from '@/utils/generalUtils'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

const UPDATE_STATE = 'UPDATE_STATE' as const
const UPDATE_FONTFACE = 'UPDATE_FONTFACE' as const
const UPDATE_DEFAULT_FONT = 'UPDATE_DEFAULT_FONT' as const
export interface ITextState {
  sel: { start: ISelection, end: ISelection },
  props: {
    [key: string]: string | boolean | number,
    textAlign: string,
    fontSize: string,
    fontSpacing: string,
    lineHeight: string,
    font: string,
    color: string,
    weight: string,
    style: string,
    decoration: string,
    isVertical: boolean,
    type: string,
    assetId: string,
    userId: string
  },
  pending: string,
  fontStore: Array<IFont>,
  defaultFonts: Array<IFont>,
  currTextInfo: {
    config: IText | IGroup,
    layerIndex: number,
    subLayerIndex?: number
  },
  paragraphs: Array<IParagraph>,
  firstLoad: boolean,
  isFontLoading: boolean
}

const getDefaultState = (): ITextState => ({
  sel: {
    start: {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    },
    end: {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    }
  },
  props: {
    textAlign: 'center',
    fontSize: '--',
    fontSpacing: '--',
    lineHeight: '--',
    font: 'multi-fonts',
    color: '#000000',
    weight: 'normal',
    style: 'normal',
    decoration: 'none',
    isVertical: false,
    type: 'public',
    assetId: '',
    userId: ''
  },
  currTextInfo: {
    config: {} as IText,
    layerIndex: -1,
    subLayerIndex: undefined
  },
  pending: '',
  fontStore: [],
  defaultFonts: [],
  paragraphs: [],
  firstLoad: false,
  isFontLoading: false
})
const state = getDefaultState()

const getters: GetterTree<ITextState, unknown> = {
  getDefaultFonts(state): string {
    return state.defaultFonts
      .map(font => font.face).join(',')
  },
  getDefaultFontsList(state): IFont[] {
    return state.defaultFonts
  },
  paragraphs(state): Array<IParagraph> {
    return state.paragraphs
  },
  getIsFontLoading(state): boolean {
    return state.isFontLoading
  }
}

const mutations: MutationTree<ITextState> = {
  UPDATE_selection(state: ITextState, data: { start: ISelection, end: ISelection }) {
    Object.assign(state.sel.start, data.start)
    Object.assign(state.sel.end, data.end)
  },
  [UPDATE_STATE](state: ITextState, data: Partial<ITextState>) {
    const keys = Object.keys(data) as Array<keyof ITextState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as unknown) = data[key]
        }
      })
  },
  UPDATE_props(state: ITextState, data: { [key: string]: string | boolean | number }) {
    Object.entries(data).forEach(([k, v]) => {
      state.props[k] = v
    })
  },
  [UPDATE_FONTFACE](state: ITextState, payload: IFont) {
    const font = state.fontStore.find(font => font.face === payload.face)
    if (font) {
      Object.assign(font, payload)
    } else {
      state.fontStore.push(payload)
    }
  },
  [UPDATE_DEFAULT_FONT](state: ITextState, payload: { font: IFont, priority?: number }) {
    if (payload.priority) {
      state.defaultFonts.splice(payload.priority, 0, payload.font)
    } else {
      state.defaultFonts.push(payload.font)
    }
  },
  SET_default(state: ITextState) {
    const defaultState = getDefaultState()
    Object.entries(defaultState.props).forEach(([k, v]) => {
      state.props[k] = v
    })
    const nan = {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    }
    Object.assign(state.sel.start, nan)
    Object.assign(state.sel.end, nan)
  },
  SET_textInfo(state: ITextState, data: { config?: IText, layerIndex?: number, subLayerIndex?: number }) {
    Object.entries(data)
      .forEach(([k, v]) => {
        if (Object.keys(state.currTextInfo).includes(k)) {
          Object.assign(state.currTextInfo, { [k]: v })
        }
      })
  },
  SET_firstLoad(state: ITextState, firstLoad: boolean) {
    state.firstLoad = firstLoad
  },
  SET_isFontLoading(state: ITextState, isFontLoading: boolean) {
    state.isFontLoading = isFontLoading
  }
}

const actions: ActionTree<ITextState, unknown> = {
  async addFont({ state, commit }, data: { type: string, face: string, url: string, userId: string, assetId: string, ver: number }): Promise<void> {
    const { face, type, url, userId, assetId, ver } = data
    if (face && face !== 'undefined' && !state.fontStore.some(font => font.face === face && font.loaded)) {
      const font = state.fontStore.find(font => font.face === face)
      if (!font) {
        state.pending = face
        commit(UPDATE_FONTFACE, { name: face, face, loaded: false })
        const cssUrl = await getFontUrl(type, url, face, userId, assetId, ver ?? 0)
        if (cssUrl !== '') {
          const link = document.createElement('link')
          link.href = cssUrl
          link.rel = 'stylesheet'
          document.head.appendChild(link)
          return new Promise<void>(resolve => {
            const checkLoaded = window.setTimeout(() => {
              if (Array.from(document.styleSheets).find(s => s.href === cssUrl)) {
                clearInterval(checkLoaded)
                commit(UPDATE_FONTFACE, { name: face, face, loaded: true })
                state.pending = ''
                resolve()
              }
            }, 100)
          })
        } else {
          commit(UPDATE_FONTFACE, { name: face, face, loaded: true })
          state.pending = ''
        }
        // await new Promise(resolve => setTimeout(resolve, 10000))
        // return new Promise<void>(resolve => {
        //   newFont.load()
        //     .then(newFont => {
        //       document.fonts.add(newFont)
        //       commit(UPDATE_FONTFACE, { name: newFont.family, face: newFont.family, loaded: true })
        //       resolve()
        //       state.pending = ''
        //     })
        // })
      } else {
        return new Promise<void>(resolve => {
          const checkLoaded = window.setTimeout(() => {
            if (font.loaded) {
              clearInterval(checkLoaded)
              resolve()
            }
          }, 100)
        })
      }
    }
  },
  async checkFontLoaded({ state }, face: string): Promise<boolean> {
    return Promise.race([
      new Promise<boolean>(resolve => {
        const check = () => {
          const font = state.fontStore.find(font => font.face === face)
          return font?.loaded
        }
        if (check()) {
          resolve(true)
        } else {
          const checkLoaded = window.setTimeout(() => {
            if (check()) {
              clearInterval(checkLoaded)
              resolve(true)
            }
          }, 100)
        }
      }),
      new Promise<boolean>(resolve => {
        setTimeout(() => {
          resolve(false)
        }, 60000)
      })
    ])
  }
}

const getFontUrl = async (type: string, url: string, face: string, userId: string, assetId: string, ver = 0): Promise<string> => {
  let cssUrl
  let response
  const isInPrevew = router.currentRoute.value.name === 'Preview'
  switch (type) {
    case 'public':
      cssUrl = addPlatform(`https://template.vivipic.com/font/${face}/subset/font.css?ver=${ver}&origin=true`)
      if (isInPrevew) return cssUrl
      try {
        response = await fetch(randomizeVer(cssUrl))
        if (response.ok) return cssUrl
        throw Error(response.status.toString())
      } catch (error) {
        if (error instanceof Error && error.message === '404') {
          errorHandleUtils.addMissingDesign('font', face)
        }
        console.log(error)
      }
      return ''
    case 'admin':
      cssUrl = addPlatform(`https://template.vivipic.com/admin/${userId}/asset/font/${assetId}/subset/font.css?ver=${ver}&origin=true`)
      if (isInPrevew) return cssUrl
      try {
        response = await fetch(randomizeVer(cssUrl))
        if (response.ok) return cssUrl
        throw Error(response.status.toString())
      } catch (error) {
        if (error instanceof Error && error.message === '404') {
          errorHandleUtils.addMissingDesign('asset-font', assetId)
        }
        console.log(error)
      }
      return ''
    case 'private': {
      let urlMap = brandkitUtils.getFontUrlMap(assetId)
      if (urlMap) { // if font is in font-list or has been seen before
        cssUrl = getCssUrl(urlMap, ver)
        if (isInPrevew) return cssUrl
        response = await fetch(randomizeVer(cssUrl)) // check if the url is still valid
        if (response.ok) return cssUrl
        urlMap = await brandkitUtils.refreshFontAsset(assetId)
        return getCssUrl(urlMap, ver)
      } else { // font is not seen before, fetch it
        urlMap = await brandkitUtils.refreshFontAsset(assetId)
        return getCssUrl(urlMap, ver)
      }
    }
    case 'URL':
      return url
  }
  cssUrl = `https://template.vivipic.com/font/${face}/subset/font.css?ver=${ver}&origin=true`
  if (isInPrevew) return cssUrl
  try {
    response = await fetch(cssUrl)
    if (response.ok) return cssUrl
    throw Error(response.status.toString())
  } catch (error) {
    if (error instanceof Error && error.message === '404') {
      errorHandleUtils.addMissingDesign('font', face)
    }
    console.log(error)
  }
  return ''
}

const randomizeVer = (url: string): string => {
  return url.replace(/ver=[0-9a-zA-Z]+/g, `ver=${generalUtils.generateRandomString(6)}`)
}

const getCssUrl = (urlMap: { [key: string]: string }, ver: number) => {
  const cssUrl = urlMap.css
  return cssUrl ? addPlatform(`${cssUrl}&ver=${ver}&origin=true`) : ''
}

const addPlatform = (url: string): string => {
  if (url.includes('?')) {
    return `${url}&platform=${window.location.hostname}`
  } else {
    return `${url}?platform=${window.location.hostname}`
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
