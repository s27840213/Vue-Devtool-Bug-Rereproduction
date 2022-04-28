import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { getField, updateField } from 'vuex-map-fields'
import payment from '@/apis/payment'

interface IPaymentState {
  userCountry: string
  isBundle: number
  prime: string
  invoice: {
    email: string
    name: string
    phone: string
    GUI: string
  }
  isPro: boolean,
  nextPrice: string
  nextPaidDate: string
  bgrmCredit: number
  lastFour: string
  expireDate: string
}

const getDefaultState = (): IPaymentState => ({
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
  nextPrice: '$8.99',
  nextPaidDate: 'May 14, 2022',
  bgrmCredit: 88,
  lastFour: '4242',
  expireDate: '06/2028'
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
  tappayAdd() {
    // payment.tappayAdd({
    //   country: state.userCountry.value,
    //   plan_id: '',
    //   is_bundle: state.isBundle,
    //   prime: state.prime
    // })
  },
  stripeInit() {
    payment.stripeInit({ country: state.userCountry })
  },
  stripeAdd() {
    payment.stripeAdd({
      country: state.userCountry,
      plan_id: '',
      is_bundle: state.isBundle
    })
  },
  switchToBundle({ commit }) {
    console.log('switchToBundle')
    commit('SET_isBundle', 1 - state.isBundle)
  },
  cancleSubscription() {
    console.log('cancel')
  },
  togglePro({ commit }) { // todelete
    commit('SET_isPro', !state.isPro)
  }
}

const mutations: MutationTree<IPaymentState> = {
  updateField,
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IPaymentState>
