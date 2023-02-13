import { EventEmitter } from 'events'
import generalUtils from './generalUtils'

/**
 * 2021.11.5
 * Currently, this utils is only used for uploading asset feature
 * It's not general enough to use in every case now
 */
class ColorUtils {
  event: any
  eventHash: { [index: string]: (color: string) => void }
  progressHash: { [index: string]: number }
  increaseIntervalHash: { [index: string]: number }
  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
    this.progressHash = {}
    this.increaseIntervalHash = {}
  }

  on(type: string, callback: (color: string) => void) {
    // replace origin event
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  onUploadProgress(xhr: XMLHttpRequest, id?: number) {
    /**
     * 0% ~ 50% is the uploading progress
     * 51% ~ 100% is the polling progress. It just a random number progress below 90%
     * Once the polling is down, the progress will reach 100%, and close the progress event
     */
    const hashId = id || generalUtils.generateRandomString(20)
    xhr.upload.onprogress = (event) => {
      const uploadProgress = Math.floor(event.loaded / event.total * 100)
      // store.commit('file/UPDATE_PROGRESS', {
      //   assetId: assetId,
      //   progress: uploadProgress / 2
      // })
    }
    xhr.upload.onloadend = (event) => {
      this.increaseIntervalHash[hashId] = window.setTimeout(() => {
        const curr = this.progressHash[hashId]
        const increaseNum = (90 - curr) * 0.05
        this.progressHash[hashId] = curr + increaseNum
      }, 10)
    }

    return hashId
  }

  closeProgress(id: number) {
    clearInterval(this.increaseIntervalHash[id])
    delete this.increaseIntervalHash[id]
  }
}

export default new ColorUtils()
