// 'Data' means from api
export interface IDataCouponCheck {
  flag: 0 | 1
  msg: 'INVALID_COUPON' | 'ALREADY_USED' | 'NOT_TRIAL' | 'NOT_SUBSCRIBED' | string
}

export interface IDataCoupon extends IDataCouponCheck {
  price_original: number
  price: number
  change_time: number
}
