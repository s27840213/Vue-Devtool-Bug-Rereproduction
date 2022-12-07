import i18n from '@/i18n'
import { EventEmitter } from 'events'
import Vue from 'vue'

class NetworkUtils {
  event: any
  online: boolean
  constructor() {
    this.event = new EventEmitter()
    this.event.on('networkChange', (online: boolean) => {
      this.online = online
      if (!online) {
        this.notifyNetworkError()
      }
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
    // Vue.notify({ group: 'error', text: `${i18n.t('NN0351')}` })
  }
}

const networkUtils = new NetworkUtils()

export default networkUtils
