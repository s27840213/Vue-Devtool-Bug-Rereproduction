import { EventEmitter } from 'events'

class EventQueue {
  eventIds: Array<string>
  eventMap: Map<string, () => Promise<void | number>>
  isHandlingAsyncTask: boolean
  batchNum: number

  constructor(batchNum?: number) {
    this.eventIds = []
    this.eventMap = new Map()
    this.isHandlingAsyncTask = false
    this.batchNum = batchNum ?? 3
    // this.batchNum = batchNum ?? 999
  }

  push(id: string, callback: () => Promise<void | number>, index?: number): void {
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

  deleteEvent(eventId: string, index?: number): void {
    if (this.eventMap.has(eventId)) {
      this.eventMap.delete(eventId)
      this.eventIds.splice(this.eventIds.indexOf(eventId), 1)
    }
  }

  handleAsyncTask(): void {
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

const globalQueue = new EventQueue()

export { globalQueue, EventQueue }
