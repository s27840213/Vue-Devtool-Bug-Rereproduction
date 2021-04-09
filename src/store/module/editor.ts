import Vue from 'vue';
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IEditorState, PanelType } from '../types';

Vue.use(Vuex);

const getDefaultState = (): IEditorState => ({
  pages: [{
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff',
    name: 'Default Page',
    layers: [
      // {
      //   type: 'text',
      //   text: 'Tesing Font',
      //   styles: {
      //     width: 200,
      //     height: 40,
      //     fontFamily: 'Lobster',
      //     fontWeight: 'bold',
      //     textAlign: 'left',
      //     lineHeight: 20,
      //     color: '#000000',
      //     fontSize: 72,
      //     x: 600,
      //     y: 806,
      //     scaleX: 0,
      //     scaleY: 0,
      //     rotate: 0
      //   }
      // }
    ]
  }],
  currPanelType: PanelType.template
})
const state = getDefaultState()
const getters: GetterTree<IEditorState, any> = {
  getPages(state) {
    return state.pages
  },
  getCurrPanelType(state) {
    return state.currPanelType
  }
}

const mutations: MutationTree<IEditorState> = {
  DELETE_frame(state) {
    return state
  },
  ADD_frame(state) {
    return state
  },
  COPY_frame(state) {
    return state
  },
  SET_currPanelType(state, type) {
    state.currPanelType = type
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
};
