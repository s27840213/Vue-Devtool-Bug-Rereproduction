// import '@nu/tailwind-lib/index.css'
import { createApp } from 'vue'
import App from './App.vue'; // Use relative path to avoid build alias error

const components = import.meta.glob('./components/*.vue', {
  eager: true,
})
// To prevent compiler skip exports
!window && console.log(components)

createApp(App).mount('#app')
