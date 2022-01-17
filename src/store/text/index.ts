import { IGroup, IParagraph, ISpanStyle, IText } from '@/interfaces/layer'
import { ISelection, IFont } from '@/interfaces/text'
import { ModuleTree, MutationTree, GetterTree, ActionTree } from 'vuex'

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
    opacity: number,
    weight: string,
    style: string,
    decoration: string,
    isVertical: boolean
  },
  pending: string,
  fontStore: Array<IFont>,
  defaultFonts: Array<IFont>,
  currTextInfo: {
    config: IText | IGroup,
    layerIndex: number,
    subLayerIndex?: number
  },
  paragraphs: Array<IParagraph>
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
  fontStore: [],
  defaultFonts: [],
  paragraphs: []
})
const state = getDefaultState()

const getters: GetterTree<ITextState, unknown> = {
  getDefaultFonts (state): string {
    return state.defaultFonts
      .map(font => font.face).join(',')
  },
  paragraphs (state): Array<IParagraph> {
    return state.paragraphs
  }
}

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
  [UPDATE_FONTFACE] (state: ITextState, payload: IFont) {
    const font = state.fontStore.find(font => font.face === payload.face)
    if (font) {
      Object.assign(font, payload)
    } else {
      state.fontStore.push(payload)
    }
  },
  [UPDATE_DEFAULT_FONT] (state: ITextState, payload: { font: IFont, priority?: number }) {
    if (payload.priority) {
      state.defaultFonts.splice(payload.priority, 0, payload.font)
    } else {
      state.defaultFonts.push(payload.font)
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
  async addFont ({ state, commit }, data: { type: string, face: string, url: string, ver: number }): Promise<void> {
    const { face, type, url, ver } = data
    if (face && !state.fontStore.some(font => font.face === face && font.loaded)) {
      const font = state.fontStore.find(font => font.face === face)
      if (!font) {
        state.pending = face
        const newFont = new FontFace(face, getFontUrl(type, url || face, ver ?? 0))
        commit(UPDATE_FONTFACE, { name: newFont.family, face: newFont.family, loaded: false })
        return new Promise<void>(resolve => {
          newFont.load()
            .then(newFont => {
              document.fonts.add(newFont)
              commit(UPDATE_FONTFACE, { name: newFont.family, face: newFont.family, loaded: true })
              resolve()
              state.pending = ''
            })
        })
      } else {
        return new Promise<void>(resolve => {
          const checkLoaded = setInterval(() => {
            console.log('check if loaded', font.face)
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

const getFontUrl = (type: string, id: string, ver = 0): string => {
  switch (type) {
    case 'public':
      return `url("https://template.vivipic.com/font/${id}/font?ver=${ver}")`
    case 'private':
      return ''
    case 'URL':
      return 'url("' + id + '")'
  }
  return `url("https://template.vivipic.com/font/${id}/font?ver=${ver}")`
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<ITextState>
