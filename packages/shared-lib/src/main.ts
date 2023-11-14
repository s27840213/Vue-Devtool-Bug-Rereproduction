// import '@/assets/css/main.css'
import App from '@/App.vue'
import { createApp } from 'vue'

const components = import.meta.glob('./components/*.vue', {
  eager: true,
})
// To prevent compiler skip exports
!window && console.log(components)

createApp(App).mount('#app')
