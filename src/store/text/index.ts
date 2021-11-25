import { IGroup, ISpanStyle, IText } from '@/interfaces/layer'
import { ISelection, IFont } from '@/interfaces/text'
import { ModuleTree, MutationTree, GetterTree, ActionTree } from 'vuex'

const UPDATE_STATE = 'UPDATE_STATE' as const
const UPDATE_FONTFACE = 'UPDATE_FONTFACE' as const
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
    opacity: number,
    weight: string,
    style: string,
    decoration: string,
    isVertical: boolean
  },
  pending: string,
  fontStore: Array<IFont>,
  currTextInfo: {
    config: IText | IGroup,
    layerIndex: number,
    subLayerIndex?: number
  }
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
    opacity: 100,
    weight: 'normal',
    style: 'normal',
    decoration: 'none',
    isVertical: false
  },
  currTextInfo: {
    config: {} as IText,
    layerIndex: -1,
    subLayerIndex: undefined
  },
  pending: '',
  fontStore: [
    {
      name: '思源黑體',
      face: 'NotoSansTC',
      loaded: true
    },
    {
      name: '標楷體',
      face: 'cwTeXKai',
      loaded: true
    },
    {
      name: '獅尾四季春',
      face: 'SweiSpringCJKtc-Regular',
      loaded: true
    },
    {
      name: '裝甲明朝',
      face: 'SoukouMincho',
      loaded: true
    },
    {
      name: '瀨戶字體',
      face: 'SetoFont',
      loaded: true
    },
    {
      name: '思源柔體',
      face: 'GenJyuuGothicX-P-Regular',
      loaded: true
    }
  ]
})
const state = getDefaultState()
const mutations: MutationTree<ITextState> = {
  UPDATE_selection (state: ITextState, data: { start: ISelection, end: ISelection }) {
    Object.assign(state.sel.start, data.start)
    Object.assign(state.sel.end, data.end)
  },
  [UPDATE_STATE] (state: ITextState, data: Partial<ITextState>) {
    const keys = Object.keys(data) as Array<keyof ITextState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = data[key]
        }
      })
  },
  UPDATE_props (state: ITextState, data: { [key: string]: string | boolean | number }) {
    Object.entries(data).forEach(([k, v]) => {
      state.props[k] = v
    })
  },
  [UPDATE_FONTFACE] (state: ITextState, data: IFont) {
    const font = state.fontStore.find(font => font.face === data.face)
    if (font) {
      Object.assign(font, data)
    } else {
      state.fontStore.push(data)
    }
  },
  SET_default (state: ITextState) {
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
  }
}

const actions: ActionTree<ITextState, unknown> = {
  async addFont ({ state, commit }, data: { type: string, face: string, url: string }): Promise<void> {
    const { face, type, url } = data
    if (!state.fontStore.some(font => font.face === face && font.loaded)) {
      const font = state.fontStore.find(font => font.face === face)
      if (!font) {
        const newFont = new FontFace(face, getFontUrl(type, url || face))
        commit(UPDATE_FONTFACE, { name: newFont.family, face: newFont.family, loaded: false })
        return new Promise<void>(resolve => {
          newFont.load()
            .then(newFont => {
              document.fonts.add(newFont)
              commit(UPDATE_FONTFACE, { name: newFont.family, face: newFont.family, loaded: true })
              resolve()
            })
        })
      } else {
        return new Promise<void>(resolve => {
          const checkLoaded = setInterval(() => {
            console.log('check if loaded')
            if (font.loaded) {
              clearInterval(checkLoaded)
              resolve()
            }
          }, 100)
        })
      }
    }
  }
}

const getFontUrl = (type: string, id: string): string => {
  switch (type) {
    case 'public':
      return `url("https://template.vivipic.com/font/${id}/font")`
    case 'private':
      return ''
    case 'URL':
      return 'url("' + id + '")'
  }
  return `url("https://template.vivipic.com/font/${id}/font")`
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
} as ModuleTree<ITextState>
