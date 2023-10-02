import { IModalButton, IModalInfo } from '@/interfaces/modal'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

export interface IModalState {
  modalInfo: IModalInfo,
  modalOpen: boolean,
  pending: boolean
}

const SET_MODAL_INFO = 'SET_MODAL_INFO' as const
const SET_MODAL_OPEN = 'SET_MODAL_OPEN' as const
const SET_IS_PENDING = 'SET_IS_PENDING' as const
const UPDATE_BUTTON = 'UPDATE_BUTTON' as const

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
    },
    imgSrc: '',
    noClose: false,
    noCloseIcon: false,
    backdropStyle: {},
    cardStyle: {},
    checkboxText: '',
    checked: false,
    onCheckedChange: (checked) => {
      return false
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
  },
  [UPDATE_BUTTON](state: IModalState, updateInfo: { type: string, button: Partial<IModalButton> }) {
    if (!state.modalInfo) return
    switch (updateInfo.type) {
      case 'confirm':
        Object.entries(updateInfo.button).forEach(([k, v]) => {
          (state.modalInfo.confirmButton as { [key: string]: any })[k] = v
        })
        break
      case 'cancel':
        Object.entries(updateInfo.button).forEach(([k, v]) => {
          (state.modalInfo.cancelButton as { [key: string]: any })[k] = v
        })
        break
    }
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
