import store, { IStoreRoot } from '@nu/vivi-lib/store'
import cypress, { ICypressState } from '@/store/module/cypress'
import design, { IDesignState } from '@/store/module/design'
import file, { IFileState } from '@/store/module/file'
import homeTemplate, { IHomeTemplateState } from '@/store/module/homeTemplate'
import layouts from '@/store/module/layouts'
import payment, { IPaymentState } from '@/store/module/payment'
import brandkit, { IBrandKitState } from '@/store/module/brandkit'
import { Store } from 'vuex'
import { IListModuleState } from '@nu/vivi-lib/interfaces/module'

store.registerModule('homeTemplate', homeTemplate)
store.registerModule('design', design)
store.registerModule('layouts', layouts)
store.registerModule('brandkit', brandkit)
store.registerModule('file', file)
store.registerModule('payment', payment)
store.registerModule('cypress', cypress)

const newStore = store as Store<IStoreRoot & {
  homeTemplate: IHomeTemplateState
  design: IDesignState
  layouts: IListModuleState
  brandkit: IBrandKitState
  file: IFileState
  payment: IPaymentState
  cypress: ICypressState
}>

export default newStore
