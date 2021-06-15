import Vue, { VueConstructor } from 'vue'
import '@/globalComponents'
import VueRecyclerviewNew from 'vue-recyclerview'
import App from './App.vue'
import router from './router'
import store from './store'
import vueColor from 'vue-color'
import { Store } from 'vuex'
import { IEditorState } from './store/types'
import { RecycleScroller } from 'vue-virtual-scroller'

Vue.config.productionTip = false
Vue.use(VueRecyclerviewNew, vueColor)
Vue.component('RecycleScroller', RecycleScroller)
const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
const req = require.context('@/assets/icon', true, /\.svg$/)
requireAll(req)

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')

// Here is a testing code to export whole porject as a Library
export default {
  install(Vue: { component: (arg0: string, arg1: VueConstructor<Vue>) => void }, options: { store: { registerModule: (arg0: string, arg1: Store<IEditorState>) => void } }): void {
    if (!options || !options.store) {
      throw new Error('Please initialise plugin with a Vuex store.')
    }
    options.store.registerModule('nu-editor', store)
    Vue.component('nu-editor', App as VueConstructor<Vue>)
  }
}
