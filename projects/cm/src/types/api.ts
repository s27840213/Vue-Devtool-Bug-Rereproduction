export type FailedResponse = {
  flag: 1
  msg?: string
}

export type SuccessResponse = {
  flag: 0
}

export type ApiResponse<T> = (SuccessResponse & T) | FailedResponse

export type UploadMap = {
  fields: {[key: string]: string}
} & {
  [key: string]: string
}

export type StaticResponse = ApiResponse<{
  ul_map: UploadMap
}>

export type GenImageResult = ApiResponse<{
  url: string
}>

export type GenPowerfulFillParams = {
  action: 'powerful-fill'
  prompt?: string
}

export type GenHiddenMessageParams = {
  action: 'hidden-light' | 'hidden-blend'
  prompt?: string
  guidance_scale?: number
  weight?: number
  guidance_start?: number
  guidance_end?: number
}

export type GenImageParams = GenPowerfulFillParams | GenHiddenMessageParams
