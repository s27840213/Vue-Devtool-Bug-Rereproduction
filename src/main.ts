import Vue from 'vue'
import '@/globalComponents'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

const requireAll = (requireContext: __WebpackModuleApi.RequireContext) => requireContext.keys().map(requireContext)
const req = require.context('@/assets/icon', true, /\.svg$/)
requireAll(req)

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
