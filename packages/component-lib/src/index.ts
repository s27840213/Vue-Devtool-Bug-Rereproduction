import type { App } from 'vue'
import Btn from './components/Btn.vue'
import Checkbox from './components/Checkbox.vue'
import CollapseTitle from './components/CollapseTitle.vue'
import ColorBtn from './components/ColorBtn.vue'
import Dropdown from './components/Dropdown.vue'
import ImageCarousel from './components/ImageCarousel.vue'
import MarkerIcon from './components/MarkerIcon.vue'
import PropertyBar from './components/PropertyBar.vue'
import RadioBtn from './components/RadioBtn.vue'
import SvgIcon from './components/SvgIcon.vue'
import Test from './components/Test.vue'
import ToggleBtn from './components/ToggleBtn.vue'
import Url from './components/Url.vue'
export default {
  install: (app: App) => {
    app.component('Btn', Btn)
    app.component('Checkbox', Checkbox)
    app.component('CollapseTitle', CollapseTitle)
    app.component('Dropdown', Dropdown)
    app.component('ImageCarousel', ImageCarousel)
    app.component('MarkerIcon', MarkerIcon)
    app.component('PropertyBar', PropertyBar)
    app.component('RadioBtn', RadioBtn)
    app.component('Test', Test)
    app.component('ToggleBtn', ToggleBtn)
    app.component('SvgIcon', SvgIcon)
    app.component('ColorBtn', ColorBtn)
    app.component('Url', Url)
  }
}

export {
  Btn,
  Checkbox,
  CollapseTitle,
  ColorBtn,
  Dropdown,
  ImageCarousel,
  MarkerIcon,
  PropertyBar,
  RadioBtn,
  SvgIcon,
  Test,
  ToggleBtn,
  Url
}

// https://medium.com/@jogarcia/dynamically-register-vue3-vite-components-54954b8fafea
// export default {
//   install(app: App) {
//     const components: Record<string, DefineComponent> = import.meta.glob('./src/**/*.vue,
//       eager: true
//     })
//     for (const path in components) {
//       const component = components[path].default
//       app.component(component.name, component)
//     }
//   }
// }
