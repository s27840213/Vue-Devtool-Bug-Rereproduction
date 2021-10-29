import store from '@/store'
import download from '@/apis/download'
import { IDownloadTypeAttrs, IDownloadServiceParams } from '@/interfaces/download'

class DownloadUtil {
  private fileAttrs = {
    jpg: {
      scale: 1,
      quality: 80
    },
    png: {
      scale: 1,
      omitBackground: 0
    },
    pdf_standard: {},
    pdf_print: {
      mark: false
    },
    svg: {
      omitBackground: 0
    },
    mp4: {},
    gif: {}
  } as { [key: string]: IDownloadTypeAttrs }

  get userId(): string { return store.getters['user/getUserId'] }

  getTypeAttrs (type: string): IDownloadTypeAttrs {
    return { ...this.fileAttrs[type] }
  }

  async getFileUrl (params: IDownloadServiceParams) {
    params.teamId = params.teamId || this.userId
    try {
      const { data } = await download.createFile(params)
      const fileResult = await this.getFileStatus(data.url)
      return fileResult
    } catch (error) {
      console.log('getFileUrl error: ', error)
      return { flag: 1, url: '' }
    }
  }

  async getFileStatus (url: string) {
    try {
      const { data: fileResult } = await download.getFileUrl(url)
      return fileResult
    } catch (error) {
      console.log('getFileStatus error: ', error)
      return { flag: 1, url: '' }
    }
  }

  downloadByUrl (url: string) {
    const element = document.createElement('a')
    element.setAttribute('href', url)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
}

export default new DownloadUtil()
