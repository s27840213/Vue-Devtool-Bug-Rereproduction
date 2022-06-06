import Vue from 'vue'
import store from '@/store'
import i18n from '@/i18n'
import modalUtils from './modalUtils'
import popupUtils from './popupUtils'

class PaymentUtils {
  openPayment(initView: string) {
    store.commit('brandkit/SET_isSettingsOpen', false)
    store.commit('payment/SET_initView', initView)
    popupUtils.openPopup('payment')
  }

  contactUsUrl() {
    switch (i18n.locale) {
      case 'tw':
        return 'https://blog.vivipic.com/tw/contactus/'
      case 'jp':
        return 'https://blog.vivipic.com/jp/help/'
      default:
        return 'https://blog.vivipic.com/us/contact/'
    }
  }

  contactUs() { // This function must be excuted during click event, or it will be treated as open a popup window.
    window.open(this.contactUsUrl(), '_blank')
  }

  errorHandler(msg?: string, initView = 'brandkit') {
    switch (msg) {
      case 'EXCEED_SIZE_LIMIT':
        modalUtils.setModalInfo(i18n.t('NN0137') as string, [i18n.t('NN0645') as string], '')
        modalUtils.setIsModalOpen(true)
        break
      case 'EXCEED_CAPACITY':
        modalUtils.setModalInfo(i18n.t('NN0137') as string, [i18n.t('NN0644') as string], '')
        modalUtils.setIsModalOpen(true)
        break
      case 'NOT_SUBSCRIBED':
        this.openPayment(initView)
        break
      case 'BG_DEPLETED_FREE':
        this.openPayment('bgrm')
        break
      case 'BG_DEPLETED_TRIAL':
      case 'BG_DEPLETED_YEAR':
        modalUtils.setModalInfo(i18n.t('NN0646') as string,
          [i18n.t('NN0648') as string], '', {
            msg: i18n.t('NN0642') as string,
            style: { width: '230px', height: '44px' },
            action: this.contactUs
          })
        modalUtils.setIsModalOpen(true)
        break
      case 'BG_DEPLETED_MONTH':
        modalUtils.setModalInfo(i18n.t('NN0646') as string,
          [i18n.t('NN0647') as string], '',
          {
            msg: i18n.t('NN0642') as string,
            class: 'btn-light-mid',
            style: { width: '140px', height: '44px', border: '1px solid #4EABE6' },
            action: this.contactUs
          }, {
            msg: i18n.t('NN0564', { period: i18n.t('NN0515') }) as string,
            style: { width: '243px', height: '44px' },
            action: () => {
              this.openPayment('switch1')
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
