import type { App, DefineComponent } from 'vue'
import { Component } from 'vue'

const components: Record<string, DefineComponent> = import.meta.glob('./components/*.vue', {
  eager: true
})
const componentDefinitions: { [index: string]: Component } = {}
for (const path in components) {
  const component = components[path].default as Component
  Object.assign(componentDefinitions, { [component.name as string]: component })
}
export default {
  install: (app: App) => {
    Object.entries(componentDefinitions).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}
