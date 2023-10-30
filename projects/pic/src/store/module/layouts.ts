import list from '@nu/vivi-lib/apis/list'
import { IListServiceParams } from '@nu/vivi-lib/interfaces/api'
import listFactory from '@nu/vivi-lib/store/module/listFactory'

export default listFactory.apply({
  api: (params: IListServiceParams) => list.getLayout(params),
  namespace: 'layouts'
})
