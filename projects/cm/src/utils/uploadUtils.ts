import { useUserStore } from '@/stores/user'
import type { UploadMap } from '@/types/api'
import { generalUtils } from '@nu/shared-lib'
import staticApis from '@/apis/static'

export default new (class UploadUtils {
  uploadMap: UploadMap | undefined

  async getUrlMap() {
    const res = (await staticApis.getStatic()).data
    if (res.flag !== 0) return
    this.uploadMap = res.ul_map
  }

  getFileName(path: string): string {
    return path.split('/').pop()!
  }

  async uploadImage(file: Blob | string, path: string, filename?: string): Promise<void> {
    if (this.uploadMap === undefined) {
      throw new Error('Upload map is not defined')
    }
    const { userId } = useUserStore()

    const isFile = typeof file !== 'string'
    const formData = new FormData()

    for (const key of Object.keys(this.uploadMap.fields)) {
      formData.append(key, this.uploadMap.fields[key])
    }

    formData.append('key', `${this.uploadMap.path}${path}`)

    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename || this.getFileName(path))}`)
    formData.append('x-amz-meta-tn', userId)

    const target = isFile ? file : generalUtils.dataURLtoBlob(file as string)
    if (formData.has('file')) {
      formData.set('file', target)
    } else {
      formData.append('file', target)
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', this.uploadMap.url, true)
    return new Promise<void>((resolve, reject) => {
      xhr.onload = () => {
        resolve()
      }
      xhr.onerror = reject
      xhr.send(formData)
    })
  }

  async polling<T>(url: string) {
    return new Promise<T>((resolve, reject) => {
      let pollingTimes = 0
      const interval = window.setInterval(async () => {
        if (pollingTimes >= 60) {
          clearInterval(interval)
          reject(new Error('Polling Timeout'))
          return
        }
        pollingTimes++
        const pollingTargetSrc = `${url}?ver=${generalUtils.generateRandomString(6)}`
        const response = await fetch(pollingTargetSrc)
        if (response.status === 200) {
          clearInterval(interval)
          const json: T = await response.json()
          resolve(json)
        }
      }, 2000)
    })
  }
})()
