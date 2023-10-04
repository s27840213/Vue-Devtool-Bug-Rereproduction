import store, { IStoreRoot } from '@nu/vivi-lib/store'
import { Store } from 'vuex'
import giphy from '@/store/module/giphy'
import vivisticker from '@/store/module/vivisticker'
// From listFactory
import font from '@/store/module/font'
import objects from '@/store/module/objects'
import templates from '@/store/module/templates'
import textStock from '@/store/module/text'
import background from '@/store/module/background'
import markers from '@/store/module/markers'
import { IListModuleState } from '@/interfaces/module'
// Other need merge:
import text from '@nu/vivi-lib/store/text'

store.registerModule('giphy', giphy)
store.registerModule('vivisticker', vivisticker)
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
  giphy: typeof giphy.state
  vivisticker: typeof vivisticker.state
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
