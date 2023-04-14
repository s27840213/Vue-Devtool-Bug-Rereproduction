export interface IDownloadTypeAttrs {
  [key: string]: number | undefined
  scale?: number
  quality?: number
  omitBackground?: 0 | 1
  bleed?: 0 | 1 | 2
  outline?: 0 | 1 | 2
  cmyk?: 0 | 1
}

export type IOutputType = 'pdf_standard' | 'pdf_print' | 'jpg' | 'png'

export interface ITypeOption {
  value: IOutputType
  name: string
  desc: string
  tag?: string
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
  merge?: 0 | 1
  splitSize?: number
  bleed?: 0 | 1 | 2
  outline?: 0 | 1 | 2
  cmyk?: 0 | 1
}

export interface IDownloadServiceResponse {
  flag: number
  url?: string
  msg?: string
  progress?: number
}

export type PanelDownloadState = 'setting' | 'type' | 'size' | 'selectPage' | 'colorMode' | 'downloaded' | 'polling'
