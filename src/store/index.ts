import Vue from 'vue'
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'
import { IEditorState, PanelType } from './types'
Vue.use(Vuex)

const getDefaultState = (): IEditorState => ({
  pages: [{
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
  }],
  currPanelType: PanelType.template,
  pageScaleRatio: 100
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
  }
}

const mutations: MutationTree<IEditorState> = {
  SET_currPanelType(state: IEditorState, type: PanelType) {
    state.currPanelType = type
  },
  SET_pageScaleRatio(state: IEditorState, ratio: number) {
    state.pageScaleRatio = ratio
  },
  ADD_newLayer(state: IEditorState, updateInfo: { pageIndex: number, layer: IShape | IText | IImage | IGroup }) {
    state.pages[updateInfo.pageIndex].layers.push(updateInfo.layer)
  },
  Update_LayerPos(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, x: number, y: number }) {
    Object.assign(state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex], updateInfo.x, updateInfo.y)
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
