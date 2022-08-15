import { IAsset } from '@/interfaces/module'

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

  sendDoneLoading() {
    this.sendToIOS('DONE_LOADING', '{}')
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
}

export default new ViviStickerUtils()
