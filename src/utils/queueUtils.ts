import { EventEmitter } from 'events'

class QueueUtils {
  eventIds: Array<string>
  eventMap: Map<string, () => Promise<void | number>>
  isHandlingAsyncTask: boolean

  constructor() {
    this.eventIds = []
    this.eventMap = new Map()
    this.isHandlingAsyncTask = false
  }

  push(id: string, callback: () => Promise<void | number>) {
    this.eventMap.set(id, callback)
    this.eventIds.push(id)

    if (!this.isHandlingAsyncTask) {
      this.isHandlingAsyncTask = true
      this.handleAsyncTask()
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
    const targetId = this.eventIds.shift() as string
    const targetFunc = this.eventMap.get(targetId)
    typeof targetFunc === 'function' && targetFunc().then(() => {
      // setTimeout(() => {
      this.eventMap.delete(targetId)
      this.handleAsyncTask()
      // }, 100)
    })
  }
}

export default new QueueUtils()
