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

  checkBgrmCredit() {
    if (!store.getters['payment/canBgrm'] && !store.getters['payment/getIsPro']) {
      this.errorHandler('NOT_SUBSCRIBED', 'bgrm')
      return false
    } else if (!store.getters['payment/canBgrm']) {
      this.errorHandler('QUOTA_DEPLETED')
      return false
    }
    return true
  }

  contactUs() {
    location.href = i18n.locale === 'tw'
      ? 'mailto:tw@vivipic.com'
      : i18n.locale === 'jp'
        ? 'mailto:jp@vivipic.com'
        : 'mailto:service@vivipic.com '
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
      case 'Quota depleted': // to-delete
      case 'QUOTA_DEPLETED':
        if (store.getters['payment/getIsBundle']) {
          modalUtils.setModalInfo(i18n.t('TMP0142') as string,
            (i18n.t('TMP0144') as string).split('<br>'), '', {
              msg: i18n.t('TMP0138') as string,
              style: { width: '230px', height: '44px' },
              action: this.contactUs
            })
        } else {
          modalUtils.setModalInfo(i18n.t('TMP0142') as string,
            (i18n.t('TMP0143') as string).split('<br>'), '',
            {
              msg: i18n.t('TMP0138') as string,
              class: 'btn-light-mid',
              style: { width: '160px', height: '44px', border: '1px solid #4EABE6' },
              action: this.contactUs
            }, {
              msg: i18n.t('TMP0060', { period: i18n.t('TMP0011') }) as string,
              style: { width: '230px', height: '44px' },
              action: () => {
                store.commit('payment/SET_initView', 'switch1')
                popupUtils.openPopup('payment')
              }
            })
        }
        modalUtils.setIsModalOpen(true)
        break
      default:
        Vue.notify({ group: 'error', text: msg })
    }
  }
}

export default new PaymentUtils()
