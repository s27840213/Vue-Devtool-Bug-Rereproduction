import axios from '@/apis'
import authToken from './auth-token'
import { IDownloadServiceParams, IDownloadServiceResponse } from '@/interfaces/download'
import { AxiosError } from 'axios'

class DownloadService {
  createFile (params: IDownloadServiceParams, useDev = -1) {
    const data = {
      token: authToken().token || '',
      team_id: params.teamId,
      export_id: params.exportId,
      page_index: params.pageIndex,
      format: params.format,
      compress: params.compress,
      omit_background: params.omitBackground,
      quality: params.quality,
      scale: params.scale,
      pdf_quality: params.pdfQuality,
      merge: params.merge,
      split_size: params.splitSize,
      new_test: useDev + 1
    }
    return axios.request<IDownloadServiceResponse>({
      url: '/export-template',
      method: 'POST',
      data
    })
  }

  getFileUrl (url: string) {
    axios.interceptors.response.use(undefined, (error: AxiosError) => {
      const { config, response } = error
      const isExportUrl = /export\/(\w+)\/(\w+).json/g.test(config.url || '')
      if (isExportUrl && response?.status === 404) {
        return new Promise(resolve => {
          setTimeout(() => resolve(axios(config)), 3000)
        })
      }
      return Promise.reject(error)
    })
    return axios.request<IDownloadServiceResponse>({
      url,
      method: 'GET'
    })
  }
}

export default new DownloadService()
