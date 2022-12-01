import Vue from 'vue'
import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { getField, updateField } from 'vuex-map-fields'
import store from '..'
import i18n from '@/i18n'
import paymentApi from '@/apis/payment'
import generalUtils from '@/utils/generalUtils'
import gtmUtils from '@/utils/gtmUtils'
import fbPixelUtils from '@/utils/fbPixelUtils'
import * as type from '@/interfaces/payment'

interface IPaymentState {
  isLoading: boolean
  initView: type.IPaymentView
  templateImg: string
  // Constant
  status: string
  plans: Record<string, type.IPlan>
  stripeClientSecret: string
  prime: string
  isPro: boolean
  trialStatus: string
  trialDay: number
  isCancelingPro: boolean
  paymentPaidDate: string
  myPaidDate: string
  myPrice: string
  switchPaidDate: string
  switchPrice: string
  usage: {
    bgrmRemain: number
    diskLoading: boolean
    diskUsed: number
    diskTotal: number
  }
  cardInfo: {
    status: string
    issuer: string
    last4: string
    date: string
  },
  coupon: {
    input: string
    msg: string
    status: string
    discount: number // Amonut of money user save.
    paymentPaidDate: string
  },
  // nextBillingHistoryIndex: number
  billingHistory: Array<type.IBillingHistory>
  // User input
  planSelected: string
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

const ICouponError = [
  'INVALID_COUPON',
  'ALREADY_USED',
  'NOT_TRIAL',
  'NOT_SUBSCRIBED'
]

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

function recordThePlanToGTM(trialStatus: string, isYearlyPlan: boolean) {
  if (trialStatus === 'not used') {
    gtmUtils.startTrail(14)
    fbPixelUtils.startTrail()
  }
  gtmUtils.subscribe(isYearlyPlan)
  fbPixelUtils.subscribe(isYearlyPlan)
}

const getDefaultState = (): IPaymentState => ({
  isLoading: false,
  initView: 'brandkit',
  templateImg: '',
  // Constant
  status: 'Loading',
  plans: {
    '': {
      name: '',
      monthly: {
        original: '',
        now: '',
        nextPaid: 0
      },
      yearly: {
        original: '',
        now: '',
        nextPaid: 0
      }
    }
  },
  stripeClientSecret: '',
  prime: '',
  isPro: false,
  isCancelingPro: false,
  trialStatus: '',
  trialDay: 14,
  // 'payment' means when user trying to scribe a plan,
  // 'my' means /settings/payment plan info
  paymentPaidDate: '',
  myPaidDate: '',
  myPrice: '',
  switchPaidDate: '',
  switchPrice: '',
  usage: {
    bgrmRemain: 0,
    diskLoading: false,
    diskUsed: 0,
    diskTotal: 100
  },
  cardInfo: {
    status: 'none',
    issuer: '',
    last4: '',
    date: ''
  },
  coupon: {
    input: '',
    msg: '',
    status: 'input',
    discount: 0,
    paymentPaidDate: ''
  },
  // nextBillingHistoryIndex: 0,
  billingHistory: [],
  // User input
  planSelected: '',
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

function isLegalGUI(GUI: string) { // Government Uniform Invoice, 統編
  const weight = [1, 2, 1, 2, 1, 2, 4, 1]
  const divisor = 5
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
    ? GUIsum % divisor === 0 || (GUIsum + 1) % divisor === 0
    : GUIsum % divisor === 0
}

function string2Date(time: string) {
  return new Date(time)
    .toLocaleDateString(i18n.global.locale === 'us' ? 'en' : 'zh', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
}

const actions: ActionTree<IPaymentState, unknown> = {
  async getPrice({ commit }, country: string) {
    if (country === '') {
      commit('SET_state', { userCountryUi: i18n.global.locale })
      country = i18n.global.locale
    }

    return paymentApi.planList(country).then((response) => {
      const res = response.data.data
      commit('SET_state', {
        planSelected: res[0].plan_id,
        trialDay: response.data.trial_day,
        plans: res.reduce((acc, item) => ({
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
        }), {}) as type.IPlan
      })
    })
  },
  async getBillingInfo({ commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.billingInfo().then((response) => {
      const data = response.data.data
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
          diskLoading: false,
          diskUsed: data.capacity_current,
          diskTotal: data.capacity
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
    // Bruce said don't do pagination in billing history, so comment pagination code.
    // if (state.nextBillingHistoryIndex === -1) return
    commit('SET_state', { isLoading: true })
    return paymentApi.billingHistory(0/* state.nextBillingHistoryIndex */).then((response) => {
      commit('SET_state', {
        // nextBillingHistoryIndex: response.data.next_page,
        billingHistory: /* state.billingHistory.concat( */response.data.data.map((item: type.IDataBillingInfoHistory) => {
          const date = new Date(item.create_time).toLocaleDateString('en', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          return {
            success: item.success === 1,
            payType: IPayType[item.pay_type as keyof typeof IPayType],
            url: item.signed_url,
            date: date,
            description: item.title,
            price: item.price,
            id: item.order_id,
            name: item.name,
            company: item.company,
            address: item.country !== 'us' ? item.address_line1 : `${item.address_line1}${item.address_line2 ? `, ${item.address_line2}` : ''}\n${item.address_city}, ${item.address_state} ${item.postal_code} US`,
            email: item.email,
            couponCentent: item.coupon_content,
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
  checkBillingInfo({ commit }, key: keyof IPaymentState['billingInfoInvalid']): boolean {
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
        commit('DEL_guiWhiteSpace') // Eat white space
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
    }).then(() => {
      // Vue.notify({ group: 'copy', text: 'Success' })
    }).catch(msg => {
      // Vue.notify({ group: 'error', text: msg })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async init({ commit }) {
    commit('SET_state', {
      // !IMPORTANT! Give stripeCS a promise first, so that stripe init can await for it.
      stripeClientSecret: paymentApi.init().then(({ data }) => {
        if (data.flag) throw Error(data.msg)
        commit('SET_state', {
          // Write real stripeCS to store.
          stripeClientSecret: data.client_secret,
          paymentPaidDate: data.charge_time
        })
      }).then(() => { // Auto fill in email and name if empty.
        const userEmail = state.billingInfo.email || store.getters['user/getEmail']
        const userName = state.billingInfo.name || store.getters['user/getUname']
        commit('SET_state', {
          billingInfo: Object.assign(state.billingInfo, {
            email: userEmail,
            name: userName
          })
        })
      }).catch(msg => {
        // Vue.notify({ group: 'error', text: msg })
      })
    })
  },
  async tappayAdd({ commit, getters }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.tappayAdd({
      country: state.userCountryUi,
      plan_id: state.planSelected,
      is_bundle: Number(state.periodUi === 'yearly'),
      prime: state.prime,
      email: state.billingInfo.email,
      coupon: state.coupon.input
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      recordThePlanToGTM(state.trialStatus, getters.getIsBundle)
    }).then(() => {
      return paymentApi.updateBillingInfo({
        meta: JSON.stringify({
          email: state.billingInfo.email,
          name: state.billingInfo.name,
          phone: state.billingInfo.phone,
          tax_id: state.billingInfo.GUI
        })
      })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async stripeAdd({ commit, getters }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.stripeAdd({
      country: state.userCountryUi,
      plan_id: state.planSelected,
      is_bundle: Number(state.periodUi === 'yearly'),
      email: state.billingInfo.email,
      coupon: state.coupon.input
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      recordThePlanToGTM(state.trialStatus, getters.getIsBundle)
    }).then(() => {
      return paymentApi.updateBillingInfo({
        meta: JSON.stringify({
          email: state.billingInfo.email,
          name: state.billingInfo.name
        })
      })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async tappayUpdate({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.tappayUpdate({
      prime: state.prime
    }).then((response) => {
      dispatch('getBillingInfo')
      // Vue.notify({ group: 'copy', text: i18n.global.t('NN0630') as string })
      return response
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async stripeUpdate({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.stripeUpdate().then((response) => {
      dispatch('getBillingInfo')
      // Vue.notify({ group: 'copy', text: i18n.global.t('NN0630') as string })
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
    }).catch(msg => {
      // Vue.notify({ group: 'error', text: msg })
    })
  },
  async switch({ getters, dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.switch({
      plan_id: state.planSelected,
      is_bundle: 1 - Number(getters.getIsBundle)
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      // Vue.notify({ group: 'copy', text: i18n.global.t('NN0627', { period: getters.getIsBundle ? i18n.global.t('NN0514') : i18n.global.t('NN0515') }) as string })
      dispatch('getBillingInfo')
    }).catch(msg => {
      // Vue.notify({ group: 'error', text: msg })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async cancel({ dispatch, commit }, reason: string) {
    commit('SET_state', { isLoading: true })
    return paymentApi.cancel(reason).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      // Vue.notify({ group: 'copy', text: i18n.global.t('NN0628') as string })
    }).catch(msg => {
      // Vue.notify({ group: 'error', text: msg })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async resume({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.resume().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      // Vue.notify({ group: 'copy', text: i18n.global.t('NN0629') as string })
    }).catch(msg => {
      // Vue.notify({ group: 'error', text: msg })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  async deleteCard({ dispatch, commit }) {
    commit('SET_state', { isLoading: true })
    return paymentApi.deleteCard().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      // Vue.notify({ group: 'copy', text: i18n.global.t('NN0631') as string })
    }).catch(msg => {
      // Vue.notify({ group: 'error', text: msg })
    }).finally(() => { commit('SET_state', { isLoading: false }) })
  },
  reloadDiskCapacity({ commit }) {
    commit('SET_diskLoading', true)
    const userId = store.getters['user/getTeamId']
    const timestamp = generalUtils.generateTimeStamp()
    const procId = `${userId}${timestamp}reloadDiskCapacity`
    const callback = (event: MessageEvent) => {
      const payload = JSON.parse(JSON.parse(event.data).message).payload
      if (payload.flag) {
        // Vue.notify({ group: 'error', text: payload.msg })
      } else {
        commit('SET_state', {
          usage: Object.assign(state.usage, {
            diskUsed: Number(payload.size) / 1024
          })
        })
      }
      commit('SET_diskLoading', false)
    }
    paymentApi.calcUserAsset(procId)
    paymentApi.calcDone(procId, callback)
  },
  verifyCoupon({ commit }) {
    commit('SET_coupon', {
      msg: '',
      status: 'loading'
    })
    paymentApi.verifyCoupon(state.coupon.input).then(({ data }) => {
      commit('SET_coupon', {
        msg: data.flag ? i18n.global.t('NN0698') : data.msg,
        status: data.flag ? 'error' : 'accept'
      })
    })
  },
  applyCoupon({ commit }) {
    if (state.coupon.status !== 'accept') return
    paymentApi.applyCoupon(
      state.coupon.input,
      state.planSelected,
      Number(state.periodUi === 'yearly')
    ).then(({ data }) => {
      commit('SET_coupon', {
        discount: data.price_original - data.price,
        paymentPaidDate: string2Date(data.charge_time)
      })
    }).catch(msg => {
      // Vue.notify({ group: 'error', text: msg })
    })
  },
  resetCouponResult({ commit }) {
    commit('SET_coupon', {
      msg: '',
      status: 'input',
      discount: 0,
      paymentPaidDate: ''
    })
  }
}

const mutations: MutationTree<IPaymentState> = {
  updateField,
  SET_state(state: IPaymentState, data: Partial<IPaymentState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPaymentState>
    keys.forEach(key => {
      if (['paymentPaidDate', 'myPaidDate', 'switchPaidDate'].includes(key) && newState[key]) {
        (state[key] as any) = string2Date(newState[key] as string)
      } else if (key in state) {
        (state[key] as any) = newState[key]
      }
    })
  },
  SET_diskLoading(state: IPaymentState, loading: boolean) {
    state.usage.diskLoading = loading
  },
  REDUCE_bgrmRemain(state: IPaymentState) {
    state.usage.bgrmRemain -= 1
  },
  SET_isLoading(state: IPaymentState, isLoading) {
    state.isLoading = isLoading
  },
  SET_initView(state: IPaymentState, initView: type.IPaymentView) {
    state.initView = initView
  },
  SET_templateImg(state: IPaymentState, templateImg) {
    state.templateImg = templateImg
  },
  DEL_guiWhiteSpace(state: IPaymentState) {
    state.billingInfo.GUI = state.billingInfo.GUI.replace(/\s/g, '')
  },
  SET_prime(state: IPaymentState, prime) {
    state.prime = prime
  },
  SET_coupon(state: IPaymentState, data: Record<string, string>) {
    Object.assign(state.coupon, data)
  }
}

const getters: GetterTree<IPaymentState, unknown> = {
  getField,
  getStatus(): string {
    return state.status
  },
  getDiskPercent(): number {
    return state.usage.diskUsed / state.usage.diskTotal
  },
  getDiskUsedUi() {
    return Number(state.usage.diskUsed.toFixed(2))
  },
  getIsBundle(state) {
    return state.periodInfo === 'yearly'
  },
  isUiTW(state) {
    return state.userCountryUi === 'tw'
  },
  getIsPro(state) {
    return state.isPro
  },
  getPaidDate(state) {
    return state.coupon.paymentPaidDate || state.paymentPaidDate
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IPaymentState>
