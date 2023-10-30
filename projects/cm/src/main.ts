import '@/assets/css/main.css';
import componentPlugin from '@nu/shared-lib/plugin';
import libType from '@nu/shared-lib/types';
import { initApp } from '@nu/vivi-lib/main';

import Notifications from '@kyvg/vue3-notification';
import '@nu/vivi-lib/css'; // Import all CSS rules from vivi-lib
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import i18n from './i18n';
import router from './router';
import vuex from './vuex';

const svgs = import.meta.glob('./assets/icon/**/*.svg', { eager: true })
const viviSvgs = import.meta.glob('../../../packages/vivi-lib/dist/src/assets/icon/**/*.svg', { eager: true })

const app = initApp(createApp(App))

// Implement require for vite. YOU CANNOT USE require BEFORE ASSIGN TO WINDOW.
// Usage1: require('@img/...'), get img from lib.
// Usage2: require('...'), get img from cm.
window.require = ((src: string) => {
  if (src.startsWith('@img/')) {
    src = src.replace('@img/', '')
    return new URL(`../../../packages/vivi-lib/dist/src/assets/img/${src}`, import.meta.url).href
  }
  return new URL(`./assets/img/${src}`, import.meta.url).href
}) as unknown as NodeRequire

// Call variable to prevent it be clear, no any other meaning.
function keepVar(v: unknown) {
  !true && console.log(v)
}

// the *.d.ts file for the global components in shared-lib
keepVar(libType)
keepVar(svgs)
keepVar(viviSvgs)

app.use(createPinia())
app.use(vuex)
app.use(router)
app.use(i18n)
app.use(componentPlugin)
app.use(Notifications)
app.mount('#app')
