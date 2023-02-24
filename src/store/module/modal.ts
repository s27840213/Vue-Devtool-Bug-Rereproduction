import { IModalInfo } from '@/interfaces/modal'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

interface IModalState {
  modalInfo: IModalInfo,
  modalOpen: boolean,
  pending: boolean
}

const SET_MODAL_INFO = 'SET_MODAL_INFO' as const
const SET_MODAL_OPEN = 'SET_MODAL_OPEN' as const
const SET_IS_PENDING = 'SET_IS_PENDING' as const

const getDefaultState = (): IModalState => ({
  modalInfo: {
    title: '',
    content: [''],
    confirmButton: {
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
  modalOpen: false,
  pending: false
})

const state = getDefaultState()
const getters: GetterTree<IModalState, unknown> = {
  getModalInfo(state): IModalInfo {
    return state.modalInfo
  },
  getModalOpen(state): boolean {
    return state.modalOpen
  },
  getIsPending(state): boolean {
    return state.pending
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
  },
  [SET_IS_PENDING](state: IModalState, pending: boolean) {
    state.pending = pending
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
