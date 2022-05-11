import Vue from 'vue'
import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { getField, updateField } from 'vuex-map-fields'
import i18n from '@/i18n'
import paymentApi from '@/apis/payment'

interface IPaymentState {
  // Constant
  plans: Record<string, Record<string, Record<string, string>|string>>
  stripeClientSecret: string
  prime: string
  isPro: boolean
  isCancelingPro: boolean
  nextPaidDate: string
  nextPrice: string
  usage: {
    bgrmRemain: number
    bgrmTotal: number
    diskUsed: number
    diskTotal: number
  }
  cardInfo: {
    issuer: string
    last4: string
    date: string
  }
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

const getDefaultState = (): IPaymentState => ({
  // Constant
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
  nextPaidDate: '',
  nextPrice: '',
  usage: {
    bgrmRemain: 0,
    bgrmTotal: 100,
    diskUsed: 0,
    diskTotal: 100
  },
  cardInfo: {
    issuer: '',
    last4: '',
    date: ''
  },
  billingHistory: [{
    date: '',
    description: '',
    price: 0,
    id: '',
    name: '',
    address: '',
    email: '',
    success: true,
    items: [{
      description: '',
      date: '',
      price: ''
    }]
  }],
  // User input
  planSelected: '',
  userPlan: '',
  periodUi: 'monthly',
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
  if (GUI.length !== 8) {
    return false
  }

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
  async getPrice({ commit }, country: string) {
    if (state.userCountryUi === '') {
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
    return paymentApi.billingInfo().then((response) => {
      const data = response.data.data
      console.log('bill info', data) // todelete
      commit('SET_state', {
        isPro: data.plan_subscribe === 1,
        periodInfo: data.plan_next_bundle ? 'yearly' : 'monthly',
        isCancelingPro: data.plan_stop_subscribe === 1,
        nextPrice: '$' + data.price,
        nextPaidDate: data.plan_due_time,
        userCountryInfo: data.country,
        usage: {
          bgrmRemain: data.bg_credit_current,
          bgrmTotal: data.bg_credit,
          diskUsed: Number(data.capacity_current.toFixed(2)),
          diskTotal: data.capacity
        },
        cardInfo: {
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
    })
  },
  async getBillingHistroy({ commit }) {
    return paymentApi.billingHistory().then((response) => {
      console.log('his', response) // todelete
      commit('SET_state', {
        // todo filter unsuccessful history
        billingHistory: response.data.data.map((item:Record<string, string|number>) => {
          const date = new Date(item.create_time).toLocaleDateString('en', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          return {
            date: date,
            description: item.title,
            price: item.price,
            id: item.order_id,
            name: item.name,
            address: item.country !== 'us' ? item.address_line1 : `${item.address_line1}${item.address_line2}${item.address_city}${item.address_state}${item.postal_code}`,
            email: item.email,
            success: item.success === 1,
            items: [{
              description: item.title,
              date: date,
              price: item.price
            }]
          }
        })
      })
    })
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
  async updateBillingInfo() {
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
  },
  async tappayAdd() {
    return paymentApi.tappayAdd({
      country: state.userCountryUi,
      plan_id: state.planSelected,
      is_bundle: Number(state.periodUi === 'yearly'),
      prime: state.prime
    })
  },
  async tappayUpdate({ dispatch }) {
    return paymentApi.tappayUpdate({
      prime: state.prime
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
    }).then(() => Vue.notify({ group: 'copy', text: '更新卡片成功' }))
      .catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async stripeInit({ commit }) {
    commit('SET_state', {
      stripeClientSecret: paymentApi.stripeInit().then(({ data }) => {
        if (data.flag) throw Error(data.msg)
        commit('SET_state', {
          stripeClientSecret: data.client_secret
        })
      }).catch(msg => Vue.notify({ group: 'error', text: msg }))
    })
  },
  async stripeAdd() {
    return paymentApi.stripeAdd({
      country: state.userCountryUi,
      plan_id: state.planSelected,
      is_bundle: Number(state.periodUi === 'yearly')
    })
  },
  async stripeUpdate({ dispatch }) {
    return paymentApi.stripeUpdate().then((response) => {
      if (response.data.flag) throw Error(response.data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: '更新卡片成功' })
      return response
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async getSwitchPrice({ getters }) {
    return paymentApi.getSwitchPrice({
      plan_id: state.planSelected,
      is_bundle: 1 - Number(getters.getIsBundle)
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async switch({ getters, dispatch }) {
    return paymentApi.switch({
      plan_id: state.planSelected,
      is_bundle: 1 - Number(getters.getIsBundle)
    }).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: '切換成功' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async cancel({ dispatch }, reason: string) {
    return paymentApi.cancel(reason).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: '取消成功' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async resume({ dispatch }) {
    return paymentApi.resume().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: '恢復成功' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async deleteCard({ dispatch }) {
    return paymentApi.deleteCard().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: '刪除成功' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  async deletePlanCompletely({ dispatch }) {
    return paymentApi.deletePlanCompletely().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      dispatch('getBillingInfo')
      Vue.notify({ group: 'copy', text: '完全刪除成功' })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  }
}

const mutations: MutationTree<IPaymentState> = {
  updateField,
  SET_plans(state: IPaymentState, plans) {
    state.plans = plans
  },
  UPDATE(state: IPaymentState, data) {
    state = Object.assign(state, data)
  },
  SET_state(state: IPaymentState, data: Partial<IPaymentState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPaymentState>
    keys.forEach(key => {
      if (key === 'nextPaidDate') {
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
  // old
  SET_prime(state: IPaymentState, prime) {
    state.prime = prime
  },
  // SET_isBundle(state: IPaymentState, isBundle: number) {
  //   state.isBundle = isBundle
  // },
  // SET_invoice(state: IPaymentState, invoice) {
  //   state.invoice = invoice
  // },
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
