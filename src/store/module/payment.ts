import Vue from 'vue'
import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { getField, updateField } from 'vuex-map-fields'
import i18n from '@/i18n'
import paymentApi from '@/apis/payment'
import popupUtils from '@/utils/popupUtils'

interface IPaymentState {
  isLoading: boolean
  initView: string
  // Constant
  status: string
  plans: Record<string, Record<string, Record<string, string>|string>>
  stripeClientSecret: string
  prime: string
  isPro: boolean
  trialStatus: string
  isCancelingPro: boolean
  paymentPaidDate: string
  myPaidDate: string
  myPrice: string
  switchPaidDate: string
  switchPrice: string
  usage: {
    bgrmRemain: number
    bgrmTotal: number
    bgrmOver: boolean
    diskUsed: number
    diskTotal: number
    diskPercent: number
  }
  cardInfo: {
    status: string
    issuer: string
    last4: string
    date: string
  }
  nextBillingHistoryIndex: number
  billingHistory: {
    date: string
    description: string
    price: number
    id: string
    name: string
    address: string
    email: string
    success: boolean
    items: [{
      description: string
      date: string
      price: string
    }]
  }[]
  // User input
  planSelected: string
  userPlan: string
  periodUi: string
  periodInfo: string
  userCountryUi: string
  userCountryInfo: string
  billingInfo: {
    // general
    email: string
    name: string
    // non-TW only
    company: string
    address1: string
    // US only
    address2: string
    city: string
    state: string
    zip: string
    // TW only
    phone: string
    GUI: string
  }
  billingInfoInvalid: {
    email: boolean
    zip: boolean
    phone: boolean
    GUI: boolean
  }
}

const ICardStatue = {
  0: 'invalid',
  1: 'valid',
  2: 'none'
}

const ITrialStatue = {
  0: 'not used',
  1: 'using',
  2: 'ended'
}

const IPayType = {
  0: '',
  1: 'tappay',
  2: 'stripe'
}

function getStatus(isPro: number, isCancelingPro: number, cardStatus: number) {
  if (!isPro && !isCancelingPro && cardStatus === 2) return '-1'
  else if (!isPro && !isCancelingPro && cardStatus === 0) return 'Fail'
  else if (!isPro && !isCancelingPro && cardStatus === 1) return 'Transient'
  else if (!isPro && isCancelingPro && cardStatus === 2) return 'Initial'
  else if (!isPro && isCancelingPro && cardStatus === 0) return 'Leave'
  else if (!isPro && isCancelingPro && cardStatus === 1) return 'Abort'
  else if (isPro && !isCancelingPro && cardStatus === 2) return '-2'
  else if (isPro && !isCancelingPro && cardStatus === 0) return '-3'
  else if (isPro && !isCancelingPro && cardStatus === 1) return 'Subscribed'
  else if (isPro && isCancelingPro && cardStatus === 2) return 'Deleted'
  else if (isPro && isCancelingPro && cardStatus === 0) return '-4'
  else if (isPro && isCancelingPro && cardStatus === 1) return 'Canceled'
  return '-?'
}

const getDefaultState = (): IPaymentState => ({
  isLoading: false,
  initView: '',
  // Constant
  status: 'Loading',
  plans: {
    '': {
      name: '',
      monthly: {
        original: '',
        now: '',
        nextPaid: ''
      },
      yearly: {
        original: '',
        now: '',
        nextPaid: ''
      }
    }
  },
  stripeClientSecret: '',
  prime: '',
  isPro: false,
  isCancelingPro: false,
  trialStatus: '',
  // 'payment' means when user trying to scribe a plan,
  // 'my' means /settings/payment plan info
  paymentPaidDate: '',
  myPaidDate: '',
  myPrice: '',
  switchPaidDate: '',
  switchPrice: '',
  usage: {
    bgrmRemain: 0,
    bgrmTotal: 100,
    bgrmOver: false,
    diskUsed: 0,
    diskTotal: 100,
    diskPercent: 0
  },
  cardInfo: {
    status: 'none',
    issuer: '',
    last4: '',
    date: ''
  },
  nextBillingHistoryIndex: 0,
  billingHistory: [],
  // User input
  planSelected: '',
  userPlan: '',
  periodUi: 'yearly',
  periodInfo: 'monthly',
  userCountryUi: '',
  userCountryInfo: '',
  billingInfo: {
    email: '',
    name: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    GUI: ''
  },
  billingInfoInvalid: {
    email: false,
    zip: false,
    phone: false,
    GUI: false
  }
})

const state = getDefaultState()

function isLegalGUI(GUI :string) { // Government Uniform Invoice, 統編
  const weight = [1, 2, 1, 2, 1, 2, 4, 1]
  if (GUI === '') return true // Special case, because GUI is option field.
  else if (GUI.length !== 8) return false

  const GUIsum = GUI.split('').map((item, index) => {
    return parseInt(item) * weight[index] // Multipy by weight each
  }).map((item) => {
    return (item / 10 >> 0) + item % 10 // Sum of tens and units digit
  }).reduce((sum, cur) => {
    return sum + cur // Sum of all
  })

  return GUI[6] === '7' // Check if divisible by 5
    ? GUIsum % 5 === 0 || (GUIsum + 1) % 5 === 0
    : GUIsum % 5 === 0
}

const actions: ActionTree<IPaymentState, unknown> = {
  checkIsPro({ commit }, initView) {
    if (!state.isPro) {
      commit('SET_initView', initView)
      popupUtils.openPopup('payment')
      return false
    }
    return true
  },
  async getPrice({ commit }, country: string) {
    if (country === '') {
      commit('SET_state', { userCountryUi: i18n.locale })
      country = i18n.locale
    }

    return paymentApi.planList(country).then((response) => {
      const res = response.data.data
      commit('SET_state', {
        planSelected: res[0].plan_id,
        plans: res.reduce((acc: Record<string, Record<string, string|number>>, item: Record<string, string|number>) => ({
          ...acc,
          [item.plan_id]: {
            name: item.plan_id,
            monthly: {
              original: item.price_month_original,
              now: item.price_month_discount,
              nextPaid: item.price_month_discount
            },
            yearly: {
              original: item.price_month_bundle_original,
              now: item.price_month_bundle_discount,
              nextPaid: item.price_bundle_discount
            }
          }
        }), {})
      })
    })
  },
  async getBillingInfo({ commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.billingInfo().then((response) => {
      const data = response.data.data
      console.log('bill info', data) // todelete
      commit('SET_state', {
        status: getStatus(data.plan_subscribe, data.plan_stop_subscribe, data.card_valid),
        isPro: data.plan_subscribe === 1,
        periodInfo: data.plan_next_bundle ? 'yearly' : 'monthly',
        isCancelingPro: data.plan_stop_subscribe === 1,
        trialStatus: ITrialStatue[data.trial_status as keyof typeof ITrialStatue],
        myPrice: '$' + data.price,
        myPaidDate: data.plan_due_time,
        userCountryInfo: data.country,
        usage: {
          bgrmRemain: data.bg_credit_current,
          bgrmTotal: data.bg_credit,
          bgrmOver: data.bg_credit_current <= 0,
          diskUsed: Number(data.capacity_current.toFixed(2)),
          diskTotal: data.capacity,
          // diskPercent: 0.85
          diskPercent: data.capacity_current / data.capacity
        },
        cardInfo: {
          status: ICardStatue[data.card_valid as keyof typeof ICardStatue],
          issuer: data.brand,
          last4: data.last4,
          date: data.valid_thru
        },
        billingInfo: {
          email: data.email,
          name: data.name,
          company: data.company,
          address1: data.address_line1,
          address2: data.address_line2,
          city: data.address_city,
          state: data.address_state,
          zip: data.postal_code,
          phone: data.phone,
          GUI: data.tax_id
        }
      })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async getBillingHistroy({ commit }) {
    // Bruce said don't do pagination in billing history.
    // if (state.nextBillingHistoryIndex === -1) return
    commit('SET_state', { isLoading: true })
    return paymentApi.billingHistory(0/* state.nextBillingHistoryIndex */).then((response) => {
      commit('SET_state', {
        nextBillingHistoryIndex: response.data.next_page,
        billingHistory: /* state.billingHistory.concat( */response.data.data.map((item:Record<string, string|number>) => {
          const date = new Date(item.create_time).toLocaleDateString('en', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          return {
            success: item.success === 1,
            payType: IPayType[item.pay_type as keyof typeof IPayType],
            date: date,
            description: item.title,
            price: item.price,
            id: item.order_id,
            name: item.name,
            company: item.company,
            address: item.country !== 'us' ? item.address_line1 : `${item.address_line1}${item.address_line2 ? `, ${item.address_line2}` : ''}\n${item.address_city}, ${item.address_state} ${item.postal_code} US`,
            email: item.email,
            items: [{
              description: item.title,
              date: date,
              price: item.price
            }]
          }
        })/* ) */
      })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  checkBillingInfo({ commit }, key: keyof IPaymentState['billingInfoInvalid']):boolean {
    let value
    switch (key) {
      case 'email':
        value = !state.billingInfo.email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
        break
      case 'zip':
        value = !state.billingInfo.zip.match(/^([0-9]{5}|[0-9]{9})$/)
        break
      case 'phone':
        value = !state.billingInfo.phone.match(/^[-0-9]{9,12}$/)
        break
      case 'GUI':
        value = !isLegalGUI(state.billingInfo.GUI)
        break
    }
    commit('SET_state', {
      billingInfoInvalid: {
        [key]: value
      }
    })
    return state.billingInfoInvalid[key]
  },
  async updateBillingInfo({ commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.updateBillingInfo({
      meta: JSON.stringify({
        country: state.userCountryInfo,
        email: state.billingInfo.email,
        name: state.billingInfo.name,
        company: state.billingInfo.company,
        address_line1: state.billingInfo.address1,
        address_line2: state.billingInfo.address2,
        address_city: state.billingInfo.city,
        address_state: state.billingInfo.state,
        postal_code: state.billingInfo.zip,
        phone: state.billingInfo.phone,
        tax_id: state.billingInfo.GUI
      })
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
    }).then(() => Vue.notify({ group: 'copy', text: 'Success' }))
      .catch(msg => Vue.notify({ group: 'error', text: msg }))
      .finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async init({ commit }) {
    commit('SET_state', {
      stripeClientSecret: paymentApi.init().then(({ data }) => {
        if (data.flag) throw Error(data.msg)
        commit('SET_state', {
          stripeClientSecret: data.client_secret,
          paymentPaidDate: data.charge_time
        })
      }).catch(msg => Vue.notify({ group: 'error', text: msg }))
    })
  },
  async tappayAdd({ commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.tappayAdd({
      country: state.userCountryUi,
      plan_id: state.planSelected,
      is_bundle: Number(state.periodUi === 'yearly'),
      prime: state.prime
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
    }).then(() => {
      return paymentApi.updateBillingInfo({
        meta: JSON.stringify({
          email: state.billingInfo.email,
          name: state.billingInfo.name,
          phone: state.billingInfo.phone,
          tax_id: state.billingInfo.GUI
        })
      })
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
      .finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async stripeAdd({ commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.stripeAdd({
      country: state.userCountryUi,
      plan_id: state.planSelected,
      is_bundle: Number(state.periodUi === 'yearly')
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async tappayUpdate({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.tappayUpdate({
      prime: state.prime
    }).then((response) => {
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: i18n.t('TMP0128') as string })
      return response
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async stripeUpdate({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.stripeUpdate().then((response) => {
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: i18n.t('TMP0128') as string })
      return response
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async getSwitchPrice({ commit, getters }) {
    return paymentApi.getSwitchPrice({
      plan_id: state.planSelected,
      is_bundle: 1 - Number(getters.getIsBundle)
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      commit('SET_state', {
        switchPaidDate: data.charge_time,
        switchPrice: data.price
      })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async switch({ getters, dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.switch({
      plan_id: state.planSelected,
      is_bundle: 1 - Number(getters.getIsBundle)
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      Vue.notify({ group: 'copy', text: i18n.t('TMP0125', { period: getters.getIsBundle ? i18n.t('TMP0010') : i18n.t('TMP0011') }) as string })
      dispatch('getBillingInfo')
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
      .finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async cancel({ dispatch, commit }, reason: string) {
    commit('SET_state', { isLoading: true })
    return paymentApi.cancel(reason).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: i18n.t('TMP0126') as string })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
      .finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async resume({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.resume().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: i18n.t('TMP0127') as string })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
      .finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async deleteCard({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.deleteCard().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: i18n.t('TMP0129') as string })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
      .finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async reloadDiskCapacity() {
    console.log('store reload')
  },
  async toAbort({ dispatch }) {
    return paymentApi.toAbort().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: 'goto Abort' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async toInitial({ dispatch }) {
    return paymentApi.toInitial().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: 'goto Initial' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async toFail({ dispatch }) {
    return paymentApi.toFail().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: 'goto Fail' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async modifyCapacity({ dispatch }, capacity) {
    return paymentApi.modifyCapacity(capacity).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: 'disk capacity update' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  }
}

const mutations: MutationTree<IPaymentState> = {
  updateField,
  SET_state(state: IPaymentState, data: Partial<IPaymentState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPaymentState>
    keys.forEach(key => {
      if (['paymentPaidDate', 'myPaidDate', 'switchPaidDate'].includes(key) && newState[key]) {
        (state[key] as any) = new Date(newState[key] as string)
          .toLocaleDateString(i18n.locale === 'us' ? 'en' : 'zh', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
      } else if (key in state) {
        (state[key] as any) = newState[key]
      }
    })
  },
  SET_isLoading(state: IPaymentState, isLoading) {
    state.isLoading = isLoading
  },
  SET_plans(state: IPaymentState, plans) {
    state.plans = plans
  },
  SET_initView(state: IPaymentState, initView) {
    state.initView = initView
  },
  // UPDATE(state: IPaymentState, data) {
  //   state = Object.assign(state, data)
  // },
  // old
  SET_prime(state: IPaymentState, prime) {
    state.prime = prime
  },
  SET_isPro(state: IPaymentState, isPro) {
    state.isPro = isPro
  }
}

const getters: GetterTree<IPaymentState, any> = {
  getField,
  // getUserType(state) {
  //   if (state.isPro && state.isCancelingPro) return 'canceling'
  //   else if (state.isPro) return 'subscribing'
  //   else return 'free'
  // },
  // getPlans(state) {
  //   return state.plans
  // },
  getIsBundle(state) {
    return state.periodInfo === 'yearly'
  },
  canUploadAsset(state) {
    return state.usage.diskPercent <= 1
  },
  // old
  getPrime(state) {
    return state.prime
  },
  // getPeriod(state) {
  //   return state.isBundle ? 'yearly' : 'monthly'
  // },
  // getInvoice(state) {
  //   return state.invoice
  // },
  getGUIvalid(state) {
    return isLegalGUI(state.billingInfo.GUI)
  },
  isUiTW(state) {
    return state.userCountryUi === 'tw'
  }
  // isUiUS(state) {
  //   return state.userCountryUi === 'US'
  // }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IPaymentState>
