import { IModalButton } from '@/interfaces/modal'
import store from '@/store'

class ModalUtils {
  setModalInfo(title?: string, content?: Array<string> | string, confirmButton?: IModalButton, cancelButton?: IModalButton, imgSrc = '', noClose = false, backdropStyle = {}, cardStyle = {}) {
    if (typeof content === 'string') content = [content]
    store.commit('modal/SET_MODAL_INFO', {
      title,
      content,
      confirmButton: confirmButton === undefined ? this.generateIModalTemplate() : confirmButton,
      cancelButton: cancelButton === undefined ? this.generateIModalTemplate() : cancelButton,
      imgSrc,
      noClose,
      backdropStyle,
      cardStyle
    })
    store.commit('modal/SET_MODAL_OPEN', true)
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
      backdropStyle: {},
      cardStyle: {}
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
