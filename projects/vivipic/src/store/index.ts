import store, { IStoreRoot } from '@nu/vivi-lib/store'
import cypress from '@/store/module/cypress'
import design from '@/store/module/design'
import file from '@/store/module/file'
import homeTemplate from '@/store/module/homeTemplate'
import layouts from '@/store/module/layouts'
import payment from '@/store/module/payment'
import brandkit from '@/store/module/brandkit'
import { Store } from 'vuex'
import { IListModuleState } from '@nu/vivi-lib/interfaces/module'
// From listFactory, need merge:
import font from '@nu/vivi-lib/store/module/font'
import objects from '@nu/vivi-lib/store/module/objects'
import templates from '@nu/vivi-lib/store/module/templates'
import textStock from '@nu/vivi-lib/store/module/text'
import background from '@nu/vivi-lib/store/module/background'
import markers from '@nu/vivi-lib/store/module/markers'
// Other need merge:
import text from '@nu/vivi-lib/store/text'

store.registerModule('homeTemplate', homeTemplate)
store.registerModule('design', design)
store.registerModule('layouts', layouts)
store.registerModule('brandkit', brandkit)
store.registerModule('file', file)
store.registerModule('payment', payment)
store.registerModule('cypress', cypress)
// From listFactory
store.registerModule('font', font)
store.registerModule('objects', objects)
store.registerModule('templates', templates)
store.registerModule('textStock', textStock)
store.registerModule('background', background)
store.registerModule('markers', markers)
// Other need merge:
store.registerModule('text', text)

const newStore = store as Store<IStoreRoot & {
  homeTemplate: typeof homeTemplate.state
  design: typeof design.state
  layouts: IListModuleState
  brandkit: typeof brandkit.state
  file: typeof file.state
  payment: typeof payment.state
  cypress: typeof cypress.state
  // From listFactory
  font: IListModuleState
  objects: IListModuleState
  templates: IListModuleState
  textStock: IListModuleState
  background: IListModuleState
  markers: IListModuleState
  // Other need merge
  // text: typeof text.state
}>

export default newStore
