import Vue from 'vue'

import SvgIcon from '@/components/global/SvgIcon.vue'
import TmpImages from '@/components/TmpImages.vue'
import ActionBar from '@/components/global/ActionBar.vue'
import PropertyBar from '@/components/global/PropertyBar.vue'
import Btn from '@/components/global/Btn.vue'
import NuPage from '@/components/editor/global/NuPage.vue'
import NuLayer from '@/components/editor/global/NuLayer.vue'
import NuImage from '@/components/editor/global/NuImage.vue'
import NuText from '@/components/editor/global/NuText.vue'
import NuGroup from '@/components/editor/global/NuGroup.vue'
import NuClipper from '@/components/editor/global/NuClipper.vue'
import NuHighlighter from '@/components/editor/global/NuHighlighter.vue'
import NuController from '@/components/editor/global/NuController.vue'

Vue.component('svg-icon', SvgIcon)
Vue.component('tmp-images', TmpImages)
Vue.component('btn', Btn)
Vue.component('action-bar', ActionBar)
Vue.component('property-bar', PropertyBar)
Vue.component('nu-page', NuPage)
Vue.component('nu-image', NuImage)
Vue.component('nu-layer', NuLayer)
Vue.component('nu-text', NuText)
Vue.component('nu-group', NuGroup)
Vue.component('nu-highlighter', NuHighlighter)
Vue.component('nu-clipper', NuClipper)
Vue.component('nu-Controller', NuController)
