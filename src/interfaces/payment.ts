export interface IApiBasic {
  flag: number
  msg: string
}

export interface IDataBillingInfoList {
  plan_id: string
  title: string
  bg_credit: string
  capacity: number
  price_month_original: number
  price_month_discount: number
  price_month_bundle_original: number
  price_month_bundle_discount: number
  price_bundle_original: number
  price_bundle_discount: number
  bundle_period: number
  currency : string
}

export interface IDataBillingInfoCommon {
  price: number
  currency: string
  pay_type : 0 | 1 | 2
  brand: 'AMEX' | 'DinersClub' | 'Discover' | 'JCB' | 'MasterCard' | 'UnionPay' | 'VISA' | 'Unknown'
  last4: string
  valid_thru: string
  country: string
  name: string
  email: string
  phone: string
  company: string
  tax_id: string
  address_state: string
  address_city: string
  address_line1: string
  address_line2: string
  postal_code: string
}

export interface IDataBillingInfoStatus extends IDataBillingInfoCommon {
  plan_subscribe: 0 | 1
  plan_stop_subscribe: 0 | 1
  plan_due_time: string
  plan_title: string
  plan_bundle: 0 | 1
  plan_next_bundle: 0 | 1
  bg_credit_current: number
  bg_credit: number
  capacity_current: number
  capacity: number
  card_valid: 0 | 1 | 2
  trial_status: 0 | 1 | 2
}

export interface IDataBillingInfoHistory extends IDataBillingInfoCommon {
  order_id : string
  period : number
  title : string
  receipt : string
  create_time : string
  success : 0 | 1
  signed_url : string
  coupon_content : string
}

// for API billing-info
export interface IApiBillingInfoList extends IApiBasic {
  trial_day: number
  data: Array<IDataBillingInfoList>
}

export interface IApiBillingInfoStatus extends IApiBasic {
  data: IDataBillingInfoStatus
}

export interface IApiBillingInfoHistory extends IApiBasic {
  next_page: number
  data: Array<IDataBillingInfoHistory>
}

// for API /payment
export interface IApiPaymentInit extends IApiBasic {
  client_secret: string
  charge_time: string
}

export interface IApiPaymentSwitch extends IApiBasic {
  price: number
  currency: string
  charge_time: string | null
}

export interface IApiCouponCheck {
  flag: 0 | 1
  msg: 'INVALID_COUPON' | 'ALREADY_USED' | 'NOT_TRIAL' | 'NOT_SUBSCRIBED' | string
}

export interface IApiCoupon extends IApiCouponCheck {
  price_original: number
  price: number
  charge_time: string
}

// For API function params, not equal to API document params.
export interface IParamMeta {
  meta: string
}

export interface IParamStripeAdd {
  country: string
  plan_id: string
  is_bundle: 0 | 1 | number
  email: string
  coupon: string
}

export interface IParamTappayAdd extends IParamStripeAdd {
  prime: string
}

export interface IParamPrime {
  prime: string
}

export interface IParamSwitch {
  plan_id: string
  is_bundle: 0 | 1 | number
}

// For store data
export interface IPlan {
  name: string
  monthly: {
    original: string
    now: string
    nextPaid: number
  },
  yearly: {
    original: string
    now: string
    nextPaid: number
  }
}

export interface IBillingHistory {
  date: string
  description: string
  price: number
  success: boolean
  payType: string
  url: string
  id: string
  name: string
  company: string
  address: string
  email: string
  couponCentent: string
  items: [{
    description: string
    date: string
    price: number
  }]
}

// Union type with string array value, https://github.com/microsoft/TypeScript/issues/28046#issuecomment-962656602
export const _IPaymentWarningView = [
  'brandkit', 'bgrm', 'pro-template', 'pro-object', 'page-resize', 'export-pdf-print'
] as const
export type IPaymentWarningView = typeof _IPaymentWarningView[number]

export const _IPaymentPayingView = [
  'step1-coupon', 'step1', 'step2-coupon', 'step2', 'finish',
  'switch1', 'switch2', 'cancel1', 'cancel2'
] as const
export type IPaymentPayingView = typeof _IPaymentPayingView[number]

export type IPaymentView = IPaymentWarningView|IPaymentPayingView
