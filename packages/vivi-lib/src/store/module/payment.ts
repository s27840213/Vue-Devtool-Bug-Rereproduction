import { IPayment, IPaymentPending } from "@/interfaces/payment";
import constantData from "@/utils/constantData";
import paymentUtils from "@/utils/paymentUtils";
import { GetterTree, MutationTree } from "vuex";

const getDefaultState = (): IPayment => ({
  subscribe: false,
  prices: {
    currency: '',
    monthly: {
      value: NaN,
      text: ''
    },
    annually: {
      value: NaN,
      text: ''
    },
    annuallyFree0: {
      value: NaN,
      text: ''
    },
    annuallyOriginal: {
      value: NaN,
      text: ''
    },
    annuallyFree0Original: {
      value: NaN,
      text: ''
    }
  },
  defaultPrices: {},
  trialDays: NaN,
  trialCountry: [],
  pending: {
    info: true,
    purchase: false,
    restore: false
  },
  planId: {
    monthly: constantData.planId.monthly,
    annually: constantData.planId.annually,
    annuallyFree0: constantData.planId.annuallyFree0,
    annuallyOriginal: constantData.planId.annually,
    annuallyFree0Original: constantData.planId.annuallyFree0
  },
  promote: []
})

const state = getDefaultState()

const getters: GetterTree<IPayment, unknown> = {
  getPayment(state: IPayment): IPayment {
    return state
  },
  getPrices(state: IPayment) {
    return state.prices
  },
  getPaymentPending(state: IPayment) {
    return state.pending
  },
  getIsPaymentPending(state: IPayment) {
    return Object.entries(state.pending).some(([key, value]) => value)
  },
  getPromote(state: IPayment): string[] {
    return state.promote
  }
}

const mutations: MutationTree<IPayment> = {
  UPDATE_payment(state: IPayment, data: Partial<IPayment>) {
    Object.entries(data).forEach(([key, value]) => {
      (state as any)[key] = value
    })
  },
  SET_paymentPending(state: IPayment, data: Record<keyof IPaymentPending, boolean>) {
    for (const item of Object.entries(data)) {
      state.pending[item[0] as keyof IPaymentPending] = item[1]
    }
  },
  SET_promote(state: IPayment, value: string[]) {
    state.promote = value
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
