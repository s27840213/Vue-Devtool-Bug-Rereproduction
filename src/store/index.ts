import Vue from 'vue'
import Vuex from 'vuex'
import editor from './module/editor'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    layerStyle: Object
  },
  mutations: {
    updateStyle(state, style) {
      state.layerStyle = style
    }
  },
  actions: {
  },
  modules: {
    editor
  }
})
