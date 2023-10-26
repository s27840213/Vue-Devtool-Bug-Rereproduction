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
