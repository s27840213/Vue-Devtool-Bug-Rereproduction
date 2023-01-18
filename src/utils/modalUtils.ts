import { IModalButton, IModalInfo } from '@/interfaces/modal'
import store from '@/store'

interface ModalOptions {
  imgSrc?: string,
  noClose?: boolean,
  noCloseIcon?: boolean,
  backdropStyle?: unknown,
  cardStyle?: unknown,
  checkboxText?: string,
  checked?: boolean,
  onCheckedChange?: (checked: boolean) => void
}
class ModalUtils {
  setModalInfo(title?: string, content?: Array<string> | string, confirmButton?: IModalButton, cancelButton?: IModalButton, options?: ModalOptions) {
    const { imgSrc = '', noClose = false, noCloseIcon = false, backdropStyle = {}, cardStyle = {}, checkboxText = '', checked = false, onCheckedChange = undefined } = options || {}

    if (typeof content === 'string') content = [content]
    store.commit('modal/SET_MODAL_INFO', {
      title,
      content,
      confirmButton: confirmButton === undefined ? this.generateIModalTemplate() : confirmButton,
      cancelButton: cancelButton === undefined ? this.generateIModalTemplate() : cancelButton,
      imgSrc,
      noClose,
      noCloseIcon,
      backdropStyle,
      cardStyle,
      checkboxText,
      checked,
      onCheckedChange: onCheckedChange === undefined ? this.generateOnCheckedChangeTemplate() : onCheckedChange
    })
    store.commit('modal/SET_MODAL_OPEN', true)
  }

  setIsPending(pending: boolean) {
    store.commit('modal/SET_IS_PENDING', pending)
  }

  setIsModalOpen(open: boolean) {
    store.commit('modal/SET_MODAL_OPEN', open)
  }

  updateModalInfo(info: Partial<IModalInfo>) {
    store.commit('modal/SET_MODAL_INFO', info)
  }

  updateButton(type: string, button: Partial<IModalButton>) {
    store.commit('modal/UPDATE_BUTTON', { type, button })
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

  private generateOnCheckedChangeTemplate() {
    return (checked: boolean) => { console.log(checked) }
  }
}

const modalUtils = new ModalUtils()
export default modalUtils
