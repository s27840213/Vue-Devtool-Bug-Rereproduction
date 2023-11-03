import { IPaymentPending, IPrices } from "@/interfaces/payment";
import constantData from "@/utils/constantData";
import { GetterTree, MutationTree } from "vuex";

interface IPaymentState {
  subscribe: boolean,
  prices: IPrices,
  defaultPrices: { [key: string]: IPrices },
  trialDays: number,
  trialCountry: string[],
  pending: IPaymentPending,
  planId: {
    monthly: string,
    annually: string,
    annuallyFree0: string
  },
}

const getDefaultState = (): IPaymentState => ({
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
    annuallyFree0: constantData.planId.annuallyFree0
  }
})

const state = getDefaultState()

const getters: GetterTree<IPaymentState, unknown> = {
  getPayment(state: IPaymentState): IPaymentState {
    return state
  },
  getIsPaymentPending(state) {
    return Object.entries(state.pending).some(([key, value]) => value)
  },
}

const mutations: MutationTree<IPaymentState> = {
  UPDATE_payment(state: IPaymentState, data: Partial<IPaymentState>) {
    Object.entries(data).forEach(([key, value]) => {
      (state as any)[key] = value
    })
  },
  SET_paymentPending(state: IPaymentState, data: Record<keyof IPaymentPending, boolean>) {
    for (const item of Object.entries(data)) {
      state.pending[item[0] as keyof IPaymentPending] = item[1]
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
