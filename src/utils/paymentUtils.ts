import Vue from 'vue'
import store from '@/store'
import i18n from '@/i18n'
import modalUtils from './modalUtils'
import popupUtils from './popupUtils'

class PaymentUtils {
  contactUs() { // This function must be excuted during click event, or it will be treated as open a popup window.
    switch (i18n.locale) {
      case 'tw':
        window.open('https://blog.vivipic.com/tw/contactus/', '_blank')
        break
      case 'jp':
        window.open('https://blog.vivipic.com/jp/help/', '_blank')
        break
      default:
        window.open('https://blog.vivipic.com/us/contact/', '_blank')
    }
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
      case 'BG_DEPLETED_FREE':
        store.commit('payment/SET_initView', 'bgrm')
        popupUtils.openPopup('payment')
        break
      case 'BG_DEPLETED_TRIAL':
      case 'BG_DEPLETED_YEAR':
        modalUtils.setModalInfo(i18n.t('TMP0142') as string,
          [i18n.t('TMP0144') as string], '', {
            msg: i18n.t('TMP0138') as string,
            style: { width: '230px', height: '44px' },
            action: this.contactUs
          })
        modalUtils.setIsModalOpen(true)
        break
      case 'BG_DEPLETED_MONTH':
        modalUtils.setModalInfo(i18n.t('TMP0142') as string,
          [i18n.t('TMP0143') as string], '',
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
        modalUtils.setIsModalOpen(true)
        break
      default:
        Vue.notify({ group: 'error', text: msg })
    }
  }
}

export default new PaymentUtils()
