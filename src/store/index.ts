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
        {
          type: 'text',
          pageIndex: 0,
          active: false,
          shown: false,
          text: 'Tesing Font',
          styles: {
            width: 'auto',
            height: 'auto',
            x: 40,
            y: 100,
            scale: 0,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            font: 'Lobster',
            weight: 'bold',
            align: 'left',
            lineHeight: 20,
            color: '#000000',
            size: 72
          }
        },
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
  currSelectedLayers: {
    pageIndex: -1,
    layers: []
  }
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
  getLayerNum(state: IEditorState, pageIndex: number) {
    return state.pages[pageIndex].layers.length
  },
  getCurrSelectedLayers(state: IEditorState) {
    return state.currSelectedLayers
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
  ADD_newLayer(state: IEditorState, updateInfo: { pageIndex: number, layer: IShape | IText | IImage | IGroup }) {
    state.pages[updateInfo.pageIndex].layers.push(updateInfo.layer)
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
  ADD_selectedLayer(state: IEditorState, { layerIndexs, pageIndex }) {
    let pIndex = state.currSelectedLayers.pageIndex

    // If selected array is empty
    if (pIndex === -1) {
      state.currSelectedLayers.pageIndex = pageIndex
      pIndex = pageIndex
    } else if (pIndex !== pageIndex) {
      console.warn('Warning: Could not manipulate layers in different pages at the same time')
      return
    }
    layerIndexs.forEach((layerIndex: number) => {
      if (!state.currSelectedLayers.layers.includes(layerIndex)) {
        state.pages[pIndex].layers[layerIndex].active = true
        state.currSelectedLayers.layers.push(layerIndex)
      }
    })
  },
  UPDATE_currPageIndex(state, pageIndex) {
    state.currSelectedLayers.pageIndex = pageIndex
  },
  CLEAR_currSelectedLayers(state: IEditorState) {
    const pageIndex = state.currSelectedLayers.pageIndex

    // Set all selected layers' active property to false
    state.currSelectedLayers.layers.forEach((layerIndex) => {
      state.pages[pageIndex].layers[layerIndex].active = false
      state.currSelectedLayers.layers.push(layerIndex)
    })

    state.currSelectedLayers.pageIndex = -1
    state.currSelectedLayers.layers = []
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
