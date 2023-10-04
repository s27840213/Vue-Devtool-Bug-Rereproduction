import list from '@nu/vivi-lib/apis/list'
import { IListServiceParams } from '@nu/vivi-lib/interfaces/api'
import listFactory from './listFactory'

export default listFactory.apply({
  api: (params: IListServiceParams) => list.getMarker(params),
  namespace: 'markers'
})
