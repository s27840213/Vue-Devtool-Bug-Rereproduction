import { IAsset } from '@/interfaces/module'
import store from '@/store'

class ViviStickerUtils {
  inDebugMode = false

  sendToIOS(messageType: string, message: any) {
    try {
      const webkit = (window as any).webkit
      if (!webkit) {
        throw new Error('WebKit is not available!')
      }
      const messageHandler = webkit.messageHandlers[messageType]
      if (!messageHandler) {
        throw new Error(`message type: ${messageType} does not exist!`)
      }
      messageHandler.postMessage(message)
    } catch (error) {
      console.log(error)
    }
  }

  sendDoneLoading(width: number, height: number) {
    console.log(width, height)
    this.sendToIOS('DONE_LOADING', { width, height })
  }

  sendScreenshotUrl(query: string) {
    console.log(query)
    const url = `${window.location.origin}/screenshot/?${query}`
    this.sendToIOS('SCREENSHOT', { url, params: query })
    if (this.inDebugMode) {
      window.open(url, '_blank')
    }
  }

  createUrl(item: IAsset): string {
    console.log(item)
    switch (item.type) {
      case 5:
      case 11:
        return `type=svg&id=${item.id}&ver=${item.ver}`
      case 1:
        return `type=background&id=${item.id}&ver=${item.ver}`
      default:
        return ''
    }
  }

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_isInCategory', { tab, bool })
  }

  debugMode() {
    this.inDebugMode = true
  }
}

export default new ViviStickerUtils()
