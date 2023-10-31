import store, { IStoreRoot } from '@nu/vivi-lib/store'
import { Store } from 'vuex'
import giphy from '@/store/module/giphy'
import vivisticker from '@/store/module/vivisticker'

store.registerModule('giphy', giphy)
store.registerModule('vivisticker', vivisticker)

const newStore = store as Store<IStoreRoot & {
  giphy: typeof giphy.state
  vivisticker: typeof vivisticker.state
}>

export default newStore
