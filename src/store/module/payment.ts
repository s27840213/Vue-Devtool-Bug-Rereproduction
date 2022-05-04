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
  invoice: {
    email: string
    name: string
    phone: string
    GUI: string
  }
  isPro: boolean
  isCancelingPro: boolean
  nextPaidDate: string
  nextPrice: string
  bgrmCredit: number
  lastFour: string
  expireDate: string
}

const getDefaultState = (): IPaymentState => ({
  // Constant
  plans: [{}, {}],
  // User data
  userCountry: '',
  isBundle: 0,
  prime: '',
  invoice: {
    email: '',
    name: '',
    phone: '',
    GUI: ''
  },
  isPro: false,
  isCancelingPro: false,
  nextPaidDate: 'May 14, 2022',
  nextPrice: '$8.99',
  bgrmCredit: 88,
  lastFour: '4242',
  expireDate: '06/2028'
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
    console.log('switchToBundle')
    commit('SET_isBundle', 1 - state.isBundle)
  },
  cancel(context, reason: string) {
    // if (!reason) throw Error('No canceling reason')
    return paymentApi.cancel(reason).then(({ data }) => {
      if (data.flag) throw Error(data.msg)
    })
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
  INIT(state: IPaymentState, data) {
    state = Object.assign(state, data)
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
  SET_invoice(state: IPaymentState, invoice) {
    state.invoice = invoice
  },
  SET_isPro(state: IPaymentState, isPro) {
    state.isPro = isPro
  }
}

const getters: GetterTree<IPaymentState, any> = {
  getField,
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
  getInvoice(state) {
    return state.invoice
  },
  getGUIvalid(state) {
    return isLegalGUI(state.invoice.GUI)
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
