import brandkit from '@/store/module/brandkit'
import cypress from '@/store/module/cypress'
import design from '@/store/module/design'
import file from '@/store/module/file'
import hashtag from '@/store/module/hashtag'
import homeTemplate from '@/store/module/homeTemplate'
import layouts from '@/store/module/layouts'
import payment from '@/store/module/payment'
import { IListModuleState } from '@nu/vivi-lib/interfaces/module'
import store, { IStoreRoot } from '@nu/vivi-lib/store'
import { Store } from 'vuex'

store.registerModule('homeTemplate', homeTemplate)
store.registerModule('design', design)
store.registerModule('layouts', layouts)
store.registerModule('brandkit', brandkit)
store.registerModule('file', file)
store.registerModule('payment', payment)
store.registerModule('cypress', cypress)
store.registerModule('hashtag', hashtag)

const newStore = store as Store<IStoreRoot & {
  homeTemplate: typeof homeTemplate.state
  design: typeof design.state
  layouts: IListModuleState
  brandkit: typeof brandkit.state
  file: typeof file.state
  payment: typeof payment.state
  cypress: typeof cypress.state
}>

export default newStore
