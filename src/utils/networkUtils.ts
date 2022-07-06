import i18n from '@/i18n'
import { vueRouterInstrumentation } from '@sentry/vue'
import { EventEmitter } from 'events'
import Vue from 'vue'
import VueNotification from 'vue-notification'

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

  onNetworkChange(name: string, callback: (online: boolean) => void) {
    if (this.eventHash[name]) {
      this.offNetworkChange(name)
      delete this.eventHash[name]
    }
    this.event.on('networkChange', callback)
    this.eventHash[name] = callback
  }

  offNetworkChange(name: string) {
    this.event.off('networkChange', this.eventHash[name])
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

  notifyNetworkError() {
    Vue.notify({ group: 'error', text: `${i18n.t('NN0351')}` })
  }
}

const networkUtils = new NetworkUtils()

export default networkUtils
