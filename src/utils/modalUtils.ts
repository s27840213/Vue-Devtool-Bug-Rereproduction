import { IModalButton } from '@/interfaces/modal'
import store from '@/store'

class ModalUtils {
  setModalInfo(title: string, content: Array<string>, component: string, confirmButton?: IModalButton, cancelButton?: IModalButton) {
    store.commit('modal/SET_MODAL_INFO', {
      title,
      content,
      component,
      confirmButton: confirmButton === undefined ? this.generateIModalTemplate() : confirmButton,
      cancelButton: cancelButton === undefined ? this.generateIModalTemplate() : cancelButton
    })
  }

  setIsPending(pending: boolean) {
    store.commit('modal/SET_IS_PENDING', pending)
  }

  setIsModalOpen(open: boolean) {
    store.commit('modal/SET_MODAL_OPEN', open)
  }

  clearModalInfo() {
    store.commit('modal/SET_MODAL_INFO', {
      title: '',
      content: [''],
      component: '',
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
    })
  }

  private generateIModalTemplate() {
    return {
      msg: '',
      action: () => {
        return false
      }
    }
  }
}

const modalUtils = new ModalUtils()
export default modalUtils
