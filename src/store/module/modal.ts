import { IModalInfo } from '@/interfaces/modal'
import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IModalState {
  modalInfo: IModalInfo,
  modalOpen: boolean
}

const SET_MODAL_INFO = 'SET_MODAL_INFO' as const
const SET_MODAL_OPEN = 'SET_MODAL_OPEN' as const

const getDefaultState = (): IModalState => ({
  modalInfo: {
    title: '',
    content: [''],
    comfirmButton: {
      msg: '',
      action: () => {
        return false
      }
    },
    cancelButton: {
      msg: '',
      action: () => {
        return false
      }
    }
  },
  modalOpen: false
})

const state = getDefaultState()
const getters: GetterTree<IModalState, unknown> = {
  getModalInfo(state): IModalInfo {
    return state.modalInfo
  },
  getModalOpen(state): boolean {
    return state.modalOpen
  }
}

const mutations: MutationTree<IModalState> = {
  [SET_MODAL_INFO](state: IModalState, props: { [key: string]: string | Array<string> }) {
    Object.entries(props).forEach(([k, v]) => {
      state.modalInfo[k] = v
    })
  },
  [SET_MODAL_OPEN](state: IModalState, open: boolean) {
    state.modalOpen = open
  }
}

const actions: ActionTree<IModalState, unknown> = {
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
