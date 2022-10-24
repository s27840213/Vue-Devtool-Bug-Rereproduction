import { EventEmitter } from 'events'

class QueueUtils {
  eventIds: Array<string>
  eventMap: Map<string, () => Promise<void | number>>
  isHandlingAsyncTask: boolean
  batchNum: number

  constructor() {
    this.eventIds = []
    this.eventMap = new Map()
    this.isHandlingAsyncTask = false
    this.batchNum = 1
  }

  push(id: string, callback: () => Promise<void | number>) {
    this.eventMap.set(id, callback)
    this.eventIds.push(id)

    if (!this.isHandlingAsyncTask) {
      if (this.eventIds.length >= this.batchNum) {
        this.handleAsyncTask()
      } else {
        setTimeout(() => {
          this.handleAsyncTask()
        }, 10)
      }
    }
  }

  deleteEvent(eventId: string) {
    if (this.eventMap.has(eventId)) {
      this.eventMap.delete(eventId)
    }
  }

  handleAsyncTask() {
    if (this.eventIds.length === 0) {
      this.isHandlingAsyncTask = false
      return
    }

    this.isHandlingAsyncTask = true

    const promiseArray: Array<Promise<void | number>> = []
    const targetIds: Array<string> = []
    for (let i = 0; i < this.batchNum; i++) {
      const targetId = this.eventIds.shift() as string

      if (targetId !== undefined) {
        targetIds.push(targetId)
        const targetFunc = this.eventMap.get(targetId)
        if (typeof targetFunc === 'function') {
          promiseArray.push(targetFunc())
        }
      } else {
        break
      }
    }

    Promise.all(promiseArray).then(() => {
      targetIds.forEach((id) => {
        this.eventMap.delete(id)
      })
      this.handleAsyncTask()
    })
  }
}

export default new QueueUtils()
