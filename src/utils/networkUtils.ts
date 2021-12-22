import { EventEmitter } from 'events'

class NetworkUtils {
  event: any
  eventHash: { [index: string]: (online: boolean) => void }
  currEvent: string
  onLine: boolean
  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
    this.currEvent = ''
    this.onLine = false
  }

  onNetworkChange(callback: (online: boolean) => void) {
    if (this.eventHash.networkChange) {
      delete this.eventHash.networkChange
    }
    this.event.on('networkChange', callback)
    this.eventHash.networkChange = callback
  }

  offNetworkCahnge() {
    this.event.off('networkChange', this.eventHash.networkChange)
  }

  registerNetworkListener() {
    window.addEventListener('online', () => {
      this.onLine = true
      this.event.emit('networkChange', this.onLine)
    })

    window.addEventListener('offline', () => {
      this.onLine = false
      this.event.emit('networkChange', this.onLine)
    })
  }

  unregisterNetworkListener() {
    window.removeEventListener('online', () => {
      console.log('online')
      this.onLine = true
    })

    window.removeEventListener('offline', () => {
      console.log('offline')
      this.onLine = false
    })
  }
}

const networkUtils = new NetworkUtils()

export default networkUtils
