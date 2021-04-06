import Vue from 'vue';
import VueKonva from 'vue-konva'
import SvgIcon from '@/components/SvgIcon.vue'
import TmpImages from '@/components/TmpImages.vue'
import Btn from '@/components/Btn.vue'
import App from './App.vue';
import router from './router';
import store from './store';

Vue.component('svg-icon', SvgIcon)
Vue.component('tmp-images', TmpImages)
Vue.component('btn', Btn)
Vue.use(VueKonva)
Vue.config.productionTip = false;

const requireAll = (requireContext: any) => requireContext.keys().map(requireContext)
const req = require.context('@/assets/icon', true, /\.svg$/)
requireAll(req)

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app');
