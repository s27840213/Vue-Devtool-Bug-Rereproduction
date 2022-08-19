import Vue from 'vue'

class QueueUtils {
  queue: Array<() => Promise<void>>
  isHandlingAsyncTask: boolean

  constructor() {
    this.queue = []
    this.isHandlingAsyncTask = false
  }

  push(callback: () => Promise<void>) {
    this.queue.push(callback)
    if (!this.isHandlingAsyncTask) {
      this.isHandlingAsyncTask = true
      this.handleAsyncTask()
    }
  }

  handleAsyncTask() {
    const func = this.queue.shift()
    typeof func === 'function' && func().then(() => {
      if (this.queue.length === 0) {
        this.isHandlingAsyncTask = false
        return
      }
      setTimeout(() => {
        this.handleAsyncTask()
      }, 300)
    })
  }
}

export default new QueueUtils()
