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
    layers: []
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
