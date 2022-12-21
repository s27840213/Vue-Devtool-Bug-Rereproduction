export interface IDownloadTypeAttrs {
  scale?: number
  quality?: number
  omitBackground?: 0 | 1
  mark?: 0 | 1,
  bleed?: 0 | 1,
  outline?: 0 | 1,
  cmyk?: 0 | 1
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
  merge?: 1 | undefined
  splitSize?: number
  bleed?: 0 | 1,
  outline?: 0 | 1,
  cmyk?: 0 | 1
}

export interface IDownloadServiceResponse {
  flag: number
  url?: string
  msg?: string
  progress?: number
}
