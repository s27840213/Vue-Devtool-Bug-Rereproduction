import { IStkProFeatures } from "./payment"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFullPageNoneConfigParams { }

export interface IFullPageNoneConfig {
  type: 'none',
  params: IFullPageNoneConfigParams
}

export interface IFullPageVideoConfigParams {
  video: string,
  thumbnail: string,
  delayedClose?: number, // -1 means close btn only shows after video is finished.
  mediaPos?: 'top' | 'bottom' | 'center',
}

export interface IFullPageVideoConfig {
  type: 'video',
  params: IFullPageVideoConfigParams
}

export interface IFullPagePaymentConfigParams {
  target?: IStkProFeatures
}

export interface IFullPagePaymentConfig {
  type: 'payment',
  params: IFullPagePaymentConfigParams
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFullPageWelcomeConfigParams { }

export interface IFullPageWelcomeConfig {
  type: 'welcome',
  params: IFullPageWelcomeConfigParams
}

export type IFullPageConfig = IFullPageNoneConfig | IFullPageVideoConfig | IFullPagePaymentConfig | IFullPageWelcomeConfig
