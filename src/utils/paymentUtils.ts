import Vue from 'vue'
import store from '@/store'
import i18n from '@/i18n'
import modalUtils from './modalUtils'
import popupUtils from './popupUtils'

class PaymentUtils {
  showHint: boolean

  constructor() {
    this.showHint = false
  }

  checkIsPro(initView: string) {
    if (!store.getters['payment/getIsPro']) {
      store.commit('payment/SET_initView', initView)
      popupUtils.openPopup('payment')
      return false
    }
    return true
  }

  errorHandler(msg?: string, initView = 'brandkit') {
    switch (msg) {
      case 'EXCEED_SIZE_LIMIT':
        modalUtils.setModalInfo(i18n.t('NN0137') as string, [i18n.t('TMP0141') as string], '')
        modalUtils.setIsModalOpen(true)
        break
      case 'EXCEED_CAPACITY':
        modalUtils.setModalInfo(i18n.t('NN0137') as string, [i18n.t('TMP0140') as string], '')
        modalUtils.setIsModalOpen(true)
        break
      case 'NOT_SUBSCRIBED':
        store.commit('payment/SET_initView', initView)
        popupUtils.openPopup('payment')
        break
      default:
        Vue.notify({ group: 'error', text: msg })
    }
  }
}

export default new PaymentUtils()
