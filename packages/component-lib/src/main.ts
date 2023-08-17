import { DefineComponent, createApp } from 'vue'
import App from './App.vue'
import index from './index'

const components: Record<string, DefineComponent> = import.meta.glob('./components/*.vue', {
  eager: true
})
const componentDefinitions = {}
for (const path in components) {
  const component = components[path].default
  Object.assign(componentDefinitions, { [component.name]: component })
}
console.log(componentDefinitions)

createApp(App).use(index).mount('#app')
