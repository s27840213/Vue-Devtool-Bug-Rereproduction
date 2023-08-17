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
// const components: Record<string, DefineComponent> = import.meta.glob('./components/*.vue', {
//   eager: true
// })
// const componentDefinitions = {}
// for (const path in components) {
//   const component = components[path].default
//   Object.assign(componentDefinitions, { [component.name]: component })
// }

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    Btn: typeof Btn
    Checkbox: typeof Checkbox
    CollapseTitle: typeof CollapseTitle
    ColorBtn: typeof ColorBtn
    Dropdown: typeof Dropdown
    ImageCarousel: typeof ImageCarousel
    MarkerIcon: typeof MarkerIcon
    PropertyBar: typeof PropertyBar
    RadioBtn: typeof RadioBtn
    Test: typeof Test
    ToggleBtn: typeof ToggleBtn
    SvgIcon: typeof SvgIcon
    Url: typeof Url
  }
}
