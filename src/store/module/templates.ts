import list from '@/apis/list'
import { IListServiceParams } from '@/interfaces/api'
import listFactory from './listFactory'

export default listFactory.apply({
  api: (params: IListServiceParams) => list.getTemplate(params)
})
