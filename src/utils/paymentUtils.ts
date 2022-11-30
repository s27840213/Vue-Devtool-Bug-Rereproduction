import Vue from 'vue'
import store from '@/store'
import i18n from '@/i18n'
import { IPaymentView, IPaymentWarningView } from '@/interfaces/payment'
import modalUtils from './modalUtils'
import popupUtils from './popupUtils'
import router from '@/router'

class PaymentUtils {
  get status(): string { return store.getters['payment/getStatus'] }
  get isAdmin(): string { return store.getters['user/isAdmin'] }
  get isPro(): boolean { return store.getters['payment/getIsPro'] }

  // initView is defined in PopupPayment.vue method changeView.
  // Set initView and open corresponding layout in PopupPayment.
  openPayment(initView: IPaymentView, templateImg = '') {
    store.commit('brandkit/SET_isSettingsOpen', false)
    store.commit('payment/SET_initView', initView)
    store.commit('payment/SET_templateImg', templateImg)
    popupUtils.openPopup('payment')
  }

  checkPro(item: {plan: number}, target: IPaymentWarningView) {
    // if (this.isAdmin) return true
    if (item.plan === 1 && !this.isPro) {
      this.openPayment(target)
      return false
    }
    return true
  }

  checkProGroupTemplate(group: {plan: number}, template: {id:string, ver:number}) {
    const url = `https://template.vivipic.com/template/${template.id}/prev_4x?ver=${template.ver}`
    return this._checkProTemplate(group.plan, url)
  }

  checkProTemplate(template: {plan: number, url: string}) {
    if (template.url) {
      return this._checkProTemplate(template.plan, template.url)
    } else {
      return this.checkProGroupTemplate(template, template as unknown as {id:string, ver:number})
    }
  }

  private _checkProTemplate(plan:number, url: string) {
    if (this.isAdmin) return true
    if (plan === 1 && !this.isPro) {
      this.openPayment('pro-template', url)
      return false
    }
    return true
  }

  checkCoupon() {
    const modal = (desc: string) => {
      modalUtils.setModalInfo(
        i18n.tc('NN0709'),
        i18n.tc(desc), {
          msg: i18n.tc('NN0518'),
          style: { width: '300px' },
          action: () => { router.push('/settings/payment') }
        }
      )
    }

    if (['Fail', 'Subscribed'].includes(this.status)) {
      modal('NN0711')
      return false
    } else if (['Leave', 'Abort', 'Canceled'].includes(this.status)) {
      modal('NN0710')
      return false
    } else {
      return true
    }
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

  errorHandler(msg?: string, initView = 'brandkit' as IPaymentView) {
    switch (msg) {
      case 'EXCEED_SIZE_LIMIT':
        modalUtils.setModalInfo(i18n.t('NN0137') as string, [i18n.t('NN0645') as string])
        break
      case 'EXCEED_CAPACITY':
        modalUtils.setModalInfo(i18n.t('NN0137') as string, [i18n.t('NN0644') as string])
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
          [i18n.t('NN0648') as string], {
            msg: i18n.t('NN0642') as string,
            style: { width: '230px', height: '44px' },
            action: this.contactUs
          })
        break
      case 'BG_DEPLETED_MONTH':
        modalUtils.setModalInfo(i18n.t('NN0646') as string,
          [i18n.t('NN0647') as string],
          {
            msg: i18n.t('NN0642') as string,
            class: 'btn-light-mid',
            style: { width: '140px', height: '44px', border: '1px solid #4EABE6' },
            action: this.contactUs
          }, {
            msg: i18n.t('NN0564', { period: i18n.t('NN0515') }) as string,
            style: { width: '243px', height: '44px' },
            action: () => { this.openPayment('switch1') }
          })
        break
      default:
        Vue.notify({ group: 'error', text: msg })
    }
  }
}

export default new PaymentUtils()
