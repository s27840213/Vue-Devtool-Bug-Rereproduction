import staticApis from '@/apis/static'
import { useUploadStore } from '@/stores/upload'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import { useStore } from 'vuex'

class PollingController {
  polling: boolean
  constructor() {
    this.polling = true
  }

  cancelAll() {
    this.polling = false
  }

  checkIfCancelled() {
    return !this.polling
  }
}

const useUpload = () => {
  const uploadStore = useUploadStore()
  const { setUploadMap } = uploadStore
  const { uploadMap, useUsBucket } = storeToRefs(uploadStore)
  const store = useStore()
  const userId = computed(() => store.getters['user/getUserId'])

  const getUrlMap = async () => {
    const res = (await staticApis.getStatic(useUsBucket.value)).data
    if (res.flag !== 0) return
    setUploadMap(res.ul_map)
  }

  const getFileName = (path: string): string => {
    return path.split('/').pop()!
  }

  const uploadImage = async (
    file: Blob | string,
    path: string,
    filename?: string,
  ): Promise<void> => {
    if (uploadMap.value === undefined) {
      throw new Error('Upload map is not defined')
    }

    const isFile = typeof file !== 'string'
    const formData = new FormData()

    for (const key of Object.keys(uploadMap.value.fields)) {
      formData.append(key, uploadMap.value.fields[key])
    }

    formData.append('key', `${uploadMap.value.path}${path}`)

    formData.append(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename || getFileName(path))}`,
    )
    formData.append('x-amz-meta-tn', userId.value)

    const target = isFile ? file : generalUtils.dataURLtoBlob(file as string)
    if (formData.has('file')) {
      formData.set('file', target)
    } else {
      formData.append('file', target)
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadMap.value.url, true)
    return new Promise<void>((resolve, reject) => {
      xhr.onload = () => {
        resolve()
      }
      xhr.onerror = reject
      xhr.send(formData)
    })
  }

  const getPollingController = () => {
    return new PollingController()
  }

  const polling = async <T extends object>(
    url: string,
    {
      timeInterval = 500,
      timeout = 180000,
      isJson = true,
      useVer = true,
      pollingController = undefined,
    }: {
      timeInterval?: number
      timeout?: number
      isJson?: boolean
      useVer?: boolean
      pollingController?: PollingController
    } = {},
  ) => {
    return new Promise<T>((resolve, reject) => {
      let accPollingTime = 0
      const interval = window.setInterval(async () => {
        if (accPollingTime >= timeout) {
          clearInterval(interval)
          reject(new Error('Polling Timeout'))
          return
        }
        if (pollingController?.checkIfCancelled()) {
          clearInterval(interval)
          reject(new Error('Polling Cancelled'))
          return
        }
        accPollingTime += timeInterval
        const pollingTargetSrc = useVer
          ? imageUtils.appendQuery(url, 'ver', generalUtils.generateRandomString(6))
          : url
        const response = await fetch(pollingTargetSrc)
        if (response.status === 200) {
          clearInterval(interval)
          if (isJson) {
            const json: T = await response.json()
            resolve(json)
          } else {
            resolve({} as T)
          }
        }
      }, timeInterval)
    })
  }

  return {
    getUrlMap,
    uploadImage,
    polling,
    getPollingController,
  }
}

export default useUpload
