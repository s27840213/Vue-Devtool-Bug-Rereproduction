import Vue from 'vue'
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IEditorState, PanelType } from '../types'

Vue.use(Vuex)

const getDefaultState = (): IEditorState => ({
  pages: [{
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    name: 'Default Page',
    layers: [
      {
        type: 'text',
        text: 'Tesing Font',
        styles: {
          width: 'auto',
          height: 'auto',
          x: 20,
          y: 0,
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
        text: 'Tesing Font',
        styles: {
          width: 'auto',
          height: 'auto',
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
  pageScaleRatio: 50
})
const state = getDefaultState()
const getters: GetterTree<IEditorState, any> = {
  getPages(state) {
    return state.pages
  },
  getCurrPanelType(state) {
    return state.currPanelType
  },
  getPageScaleRatio(state) {
    return state.pageScaleRatio
  }
}

const mutations: MutationTree<IEditorState> = {
  SET_currPanelType(state, type) {
    state.currPanelType = type
  },
  SET_pageScaleRatio(state, ratio) {
    state.pageScaleRatio = ratio
  }
}

const actions: ActionTree<IEditorState, any> = {

}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
