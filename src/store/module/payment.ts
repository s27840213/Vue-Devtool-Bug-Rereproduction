import Vue from 'vue'
import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { getField, updateField } from 'vuex-map-fields'
import i18n from '@/i18n'
import paymentApi from '@/apis/payment'

interface IPaymentState {
  // Constant
  plans: Array<Record<string, string>>
  // User data
  userCountry: string
  isBundle: number
  prime: string
  isPro: boolean
  isCancelingPro: boolean
  nextPaidDate: string
  nextPrice: string
  usage: {
    bgrmUsed: number
    bgrmTotal: number
    diskUsed: number
    diskTotal: number
  }
  cardInfo: {
    brand: string
    last4: string
    date: string
  }
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
  billingHistory: Array<Record<string, string>>
}

const getDefaultState = (): IPaymentState => ({
  // Constant
  plans: [{}, {}],
  // User data
  userCountry: '',
  isBundle: 0,
  prime: '',
  isPro: false,
  isCancelingPro: false,
  nextPaidDate: '',
  nextPrice: '',
  usage: {
    bgrmUsed: 0,
    bgrmTotal: 100,
    diskUsed: 0,
    diskTotal: 100
  },
  cardInfo: {
    brand: '',
    last4: '',
    date: ''
  },
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
  billingHistory: []
})

const state = getDefaultState()

switch (i18n.locale) {
  case 'tw':
    state.userCountry = 'TW'
    break
  case 'jp':
    state.userCountry = 'JP'
    break
  case 'us':
    state.userCountry = 'US'
    break
}

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

// function keyTranslate(obj: Record<string, string>):Record<string, string> {
//   const newKeys = {
//     valid_thru: 'date',
//     address_line1: 'address1',
//     address_line2: 'address2',
//     address_city: 'ciry',
//     address_state: 'state',
//     postal_code: 'zip',
//     tax_id: 'GUI'
//   } as Record<string, string>
//   const keyValues = Object.keys(obj).map(key => {
//     const newKey = newKeys[key] || key
//     return { [newKey]: obj[key] }
//   })
//   return Object.assign({}, ...keyValues)
// }

const actions: ActionTree<IPaymentState, unknown> = {
  getPrice({ commit }) {
    paymentApi.planList().then((response) => {
      const res = response.data.data
      commit('SET_plans', [{
        original: res[0].price_month_original,
        now: res[0].price_month_discount
      }, {
        original: res[0].price_month_bundle_original,
        now: res[0].price_month_bundle_discount
      }])
    })
  },
  getBillingInfo({ commit }) {
    paymentApi.billingInfo().then((response) => {
      const data = response.data.data
      console.log('aa', data)
      commit('SET_state', {
        isPro: data.plan_subscribe === 1,
        isCancelingPro: data.plan_stop_subscribe === 1,
        nextPaidDate: data.plan_due_time,
        country: data.country.toUpperCase(),
        usage: {
          bgrmUsed: data.bg_credit_current,
          bgrmTotal: data.bg_credit,
          diskUsed: data.capacity,
          diskTotal: data.capacity_current
        },
        cardInfo: {
          brand: data.brand,
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
  getBillingHistroy({ commit }) {
    paymentApi.billingHistory().then((response) => {
      console.log('his', response)
      commit('SET_state', {
        billingHistory: response.data.data
      })
    })
  },
  tappayAdd() {
    // paymentApi.tappayAdd({
    //   country: state.userCountry.value,
    //   plan_id: '',
    //   is_bundle: state.isBundle,
    //   prime: state.prime
    // })
  },
  stripeInit() {
    return paymentApi.stripeInit().then((response) => {
      return response.data.client_secret
    })
  },
  stripeAdd() {
    return paymentApi.stripeAdd({
      country: state.userCountry,
      plan_id: 'sample_us',
      is_bundle: state.isBundle
    })
  },
  switchToBundle({ commit }) {
    commit('SET_isBundle', 1 - state.isBundle)
  },
  cancel({ commit }, reason: string) {
    // if (!reason) throw Error('No canceling reason')
    return paymentApi.cancel(reason).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      commit('SET_state', { isCancelingPro: true })
    })
  },
  resume({ commit }) {
    paymentApi.resume().then(({ data }) => {
      if (data.flag) throw Error(data.msg)
      commit('SET_state', { isCancelingPro: false })
    }).catch(msg => Vue.notify({ group: 'error', text: msg }))
  },
  togglePro({ commit }) { // todelete
    commit('SET_isPro', !state.isPro)
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
      if (key in state) {
        (state[key] as any) = newState[key]
      }
    })
  },
  // old
  SET_userCountry(state: IPaymentState, userCountry) {
    state.userCountry = userCountry
  },
  SET_prime(state: IPaymentState, prime) {
    state.prime = prime
  },
  SET_isBundle(state: IPaymentState, isBundle: number) {
    state.isBundle = isBundle
  },
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
  // old
  getUserCountry(state) {
    return state.userCountry
  },
  getPrime(state) {
    return state.prime
  },
  getIsBundle(state) {
    return state.isBundle
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
  isTW(state) {
    return state.userCountry === 'TW'
  },
  isUS(state) {
    return state.userCountry === 'US'
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IPaymentState>
