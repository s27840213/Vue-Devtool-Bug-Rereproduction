import list from '@/apis/list'
import { IListServiceParams } from '@/interfaces/api'
import { MutationTree } from 'vuex'
import listFactory from './listFactory'

interface ITemplatesState {
  igLayout: string
}
const getDefaultState = (): ITemplatesState => ({ igLayout: 'story' })
const mutations: MutationTree<ITemplatesState> = {
  SET_igLayout(state: ITemplatesState, igLayout: string) {
    state.igLayout = igLayout
  }
}

const story = listFactory.apply({
  api: (params: IListServiceParams) => list.getTemplate(params),
  namespace: 'templates',
  igLayout: 'story'
})

const post = listFactory.apply({
  api: (params: IListServiceParams) => list.getTemplate(params),
  namespace: 'templates',
  igLayout: 'post'
})

export default {
  namespaced: true,
  state: getDefaultState,
  mutations,
  modules: {
    story,
    post
  }
}
