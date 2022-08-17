import { IAsset } from '@/interfaces/module'
import store from '@/store'

class ViviStickerUtils {
  sendToIOS(messageType: string, message: string) {
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
    this.sendToIOS('DONE_LOADING', JSON.stringify({ width, height }))
  }

  sendScreenshotUrl(url: string) {
    console.log(url)
    this.sendToIOS('SCREENSHOT', JSON.stringify({ url }))
    window.open(url, '_blank')
  }

  createUrl(item: IAsset): string {
    console.log(item)
    switch (item.type) {
      case 5:
      case 11:
        return `${window.location.origin}/screenshot/?type=svg&id=${item.id}&ver=${item.ver}`
      default:
        return ''
    }
  }

  setIsInCategory(bool: boolean) {
    store.commit('vivisticker/SET_isInCategory', bool)
  }
}

export default new ViviStickerUtils()
