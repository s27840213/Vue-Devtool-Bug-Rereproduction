import Vue from 'vue'
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'
import { IEditorState, PanelType } from './types'
import { IPage } from '@/interfaces/page'
Vue.use(Vuex)

const getDefaultState = (): IEditorState => ({
  pages: [
    {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      name: 'Default Page',
      layers: [
        // {
        //   type: 'text',
        //   pageIndex: 0,
        //   active: false,
        //   shown: false,
        //   text: 'Tesing Font',
        //   styles: {
        //     width: 'auto',
        //     height: 'auto',
        //     x: 40,
        //     y: 100,
        //     scale: 0,
        //     scaleX: 0,
        //     scaleY: 0,
        //     rotate: 0,
        //     font: 'Lobster',
        //     weight: 'bold',
        //     align: 'left',
        //     lineHeight: 20,
        //     color: '#000000',
        //     size: 72
        //   }
        // },
        {
          type: 'text',
          pageIndex: 1,
          active: false,
          shown: false,
          text: 'Tesing Font',
          styles: {
            width: 120,
            height: 120,
            x: 300,
            y: 200,
            scale: 0,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            font: 'Lobster',
            weight: 'bold',
            align: 'left',
            color: '#000000',
            size: 72
          }
        }
      ]
    },
    {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      name: 'Default Page',
      layers: []
    }
  ],
  currPanelType: PanelType.template,
  pageScaleRatio: 100,
  lastSelectedPageIndex: 0,
  currSelectedInfo: {
    pageIndex: -1,
    layersIndex: [],
    layers: []
  },
  clipboard: []
})
const state = getDefaultState()
const getters: GetterTree<IEditorState, unknown> = {
  getPages(state) {
    return state.pages
  },
  getCurrPanelType(state) {
    return state.currPanelType
  },
  getPageScaleRatio(state) {
    return state.pageScaleRatio
  },
  getLayers(state: IEditorState) {
    return (pageIndex: number): Array<IShape | IText | IImage | IGroup> => {
      return state.pages[pageIndex].layers
    }
  },
  getLayersNum(state: IEditorState) {
    return (pageIndex: number): number => {
      return state.pages[pageIndex].layers.length
    }
  },
  getLastSelectedPageIndex(state: IEditorState) {
    return state.lastSelectedPageIndex
  },
  getCurrSelectedInfo(state: IEditorState) {
    return state.currSelectedInfo
  },
  getCurrSelectedLayers(state: IEditorState) {
    return state.currSelectedInfo.layers
  },
  getClipboard(state: IEditorState) {
    return state.clipboard
  }
}

const mutations: MutationTree<IEditorState> = {
  SET_pages(state: IEditorState, newPages: Array<IPage>) {
    state.pages = newPages
  },
  SET_currPanelType(state: IEditorState, type: PanelType) {
    state.currPanelType = type
  },
  SET_pageScaleRatio(state: IEditorState, ratio: number) {
    state.pageScaleRatio = ratio
  },
  SET_lastSelectedPageIndex(state: IEditorState, index: number) {
    state.lastSelectedPageIndex = index
  },
  ADD_newLayers(state: IEditorState, updateInfo: { pageIndex: number, layers: Array<IShape | IText | IImage | IGroup> }) {
    updateInfo.layers.forEach(layer => {
      state.pages[updateInfo.pageIndex].layers.push(layer)
    })
  },
  Update_layerProps(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean } }) {
    /**
     * This Mutation is used to update the layer's properties excluding styles
     */
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex][k] = v
    })
  },
  Update_layerStyles(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, styles: { [key: string]: string | number } }) {
    /**
     * TODO: type check -> To check the properties is in the certain interface or not
     * ex: weight properties is not allowed in Img Layer
     * keywords: user-type-guard in TypeScript or using type predicates
     */
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex].styles[k] = v
    })
  },
  Update_selectedLayerStyles(state: IEditorState, updateInfo: { pageIndex: number, styles: { [key: string]: string | number } }) {
    state.currSelectedInfo.layersIndex.forEach((layerIndex) => {
      Object.entries(updateInfo.styles).forEach(([k, v]) => {
        if (typeof v === 'number') {
          (state.pages[updateInfo.pageIndex].layers[layerIndex].styles[k] as number) += v
        } else {
          state.pages[updateInfo.pageIndex].layers[layerIndex].styles[k] = v
        }
      })
    })
  },
  ADD_selectedLayer(state: IEditorState, updateInfo: { layerIndexs: number[], pageIndex: number }) {
    let pIndex = state.currSelectedInfo.pageIndex
    // If selected array is empty
    if (pIndex === -1) {
      state.currSelectedInfo.pageIndex = updateInfo.pageIndex
      pIndex = updateInfo.pageIndex
    } else if (pIndex !== updateInfo.pageIndex) {
      console.warn('Warning: Could not manipulate layers in different pages at the same time')
      return
    }
    updateInfo.layerIndexs.forEach((layerIndex: number) => {
      if (!state.currSelectedInfo.layersIndex.includes(layerIndex)) {
        state.pages[pIndex].layers[layerIndex].active = true
        state.currSelectedInfo.layersIndex.push(layerIndex)
        state.currSelectedInfo.layers.push(state.pages[pIndex].layers[layerIndex])
      }
    })

    state.lastSelectedPageIndex = updateInfo.pageIndex
  },
  UPDATE_currPageIndex(state, pageIndex) {
    state.currSelectedInfo.pageIndex = pageIndex
  },
  CLEAR_currSelectedInfo(state: IEditorState) {
    const pageIndex = state.currSelectedInfo.pageIndex

    // Set all selected layers' active property to false
    state.currSelectedInfo.layersIndex.forEach((layerIndex) => {
      state.pages[pageIndex].layers[layerIndex].active = false
      state.currSelectedInfo.layersIndex.push(layerIndex)
    })

    state.currSelectedInfo.pageIndex = -1
    state.currSelectedInfo.layersIndex = []
    state.currSelectedInfo.layers = []
  },
  SET_clipboard(state: IEditorState, layersInfo) {
    state.clipboard = JSON.parse(JSON.stringify(layersInfo))
  },
  CLEAR_clipboard(state: IEditorState) {
    state.clipboard = []
  }
}

const actions: ActionTree<IEditorState, unknown> = {

}

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions
})
