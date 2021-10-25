export interface IDownloadTypeAttrs {
  scale?: number
  quality?: number
  omitBackground?: 0 | 1
  mark?: boolean
}

export interface ITypeOption {
  value: string
  name: string
  desc: string
}

export interface IDownloadServiceParams {
  teamId: string
  exportId: string
  pageIndex?: string
  format: string
  compress?: 0 | 1
  omitBackground?: 0 | 1
  quality?: number
  scale?: number
  pdfQuality?: 0 | 1
}

export interface IDownloadServiceResponse {
  url: string
  flag: number
}
