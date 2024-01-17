import i18n from '@/i18n'
import { notify } from '@kyvg/vue3-notification'
import { EventEmitter } from 'events'

class NetworkUtils {
  event: any
  online: boolean
  constructor() {
    this.event = new EventEmitter()
    this.event.on('networkChange', (online: boolean) => {
      this.online = online
      // TODO: Improve the display of network error statuses.
      // if (!online) {
      //   this.notifyNetworkError()
      // }
    })
    this.online = navigator.onLine
  }

  registerNetworkListener() {
    window.addEventListener('online', () => {
      this.online = true
      this.event.emit('networkChange', this.online)
    })

    window.addEventListener('offline', () => {
      this.online = false
      this.event.emit('networkChange', this.online)
    })
  }

  unregisterNetworkListener() {
    window.removeEventListener('online', () => {
      console.log('online')
      this.online = true
    })

    window.removeEventListener('offline', () => {
      console.log('offline')
      this.online = false
    })
  }

  check() {
    return this.online
  }

  notifyNetworkError() {
    notify({ group: 'error', text: `${i18n.global.t('NN0351')}` })
  }
}

const networkUtils = new NetworkUtils()

export default networkUtils
