// 'Data' means from api
export interface IDataCouponCheck {
  flag: 0 | 1
  msg: 'INVALID_COUPON' | 'ALREADY_USED' | 'NOT_TRIAL' | 'NOT_SUBSCRIBED' | string
}

export interface IDataCoupon extends IDataCouponCheck {
  price_original: number
  price: number
  charge_time: string
}

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
