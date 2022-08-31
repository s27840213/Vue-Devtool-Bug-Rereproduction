import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import assetUtils from './assetUtils'
import groupUtils from './groupUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import uploadUtils from './uploadUtils'
import eventUtils, { PanelEvent } from './eventUtils'
import { ColorEventType, LayerType } from '@/store/types'
import { IGroup, ILayer } from '@/interfaces/layer'

class ViviStickerUtils {
  inDebugMode = false
  loadingFlags = {} as { [key: string]: boolean }
  loadingCallback = undefined as (() => void) | undefined

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

  sendDoneLoading(width: number, height: number, options: string) {
    console.log(width, height, options)
    this.sendToIOS('DONE_LOADING', { width, height, options })
  }

  sendScreenshotUrl(query: string, action = 'copy') {
    this.sendToIOS('SCREENSHOT', { params: query, action })
    if (this.inDebugMode) {
      const url = `${window.location.origin}/screenshot/?${query}`
      console.log(url)
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

  createUrlForJSON(): string {
    const page = pageUtils.getPage(0)
    return `type=json&id=${encodeURIComponent(JSON.stringify(uploadUtils.getSinglePageJson(page)))}`
  }

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_isInCategory', { tab, bool })
  }

  debugMode() {
    this.inDebugMode = true
  }

  getAssetInitiator(asset: IAsset): () => Promise<any> {
    return async () => {
      console.log('start editing', asset)
      return await assetUtils.addAsset(asset)
    }
  }

  getAssetCallback(asset: IAsset): (jsonData: any) => void {
    return (jsonData: any) => {
      if ([5, 11].includes(asset.type)) {
        if (jsonData.color && jsonData.color.length > 0) {
          eventUtils.emit(PanelEvent.switchTab, 'color', { currColorEvent: ColorEventType.shape })
        } else {
          eventUtils.emit(PanelEvent.switchTab, 'opacity')
        }
      }
    }
  }

  startEditing(initiator: () => Promise<any>, callback: (jsonData: any) => void) {
    const pageWidth = window.innerWidth - 32
    pageUtils.setPages([pageUtils.newPage({
      width: pageWidth,
      height: Math.round(pageWidth * 420 / 358),
      backgroundColor: '#F8F8F8'
    })])
    initiator().then((jsonData?: any) => {
      if (jsonData) {
        stepsUtils.reset()
        store.commit('vivisticker/SET_isInEditor', true)
        callback(jsonData)
      }
    })
  }

  endEditing() {
    groupUtils.deselect()
    pageUtils.setPages()
    store.commit('vivisticker/SET_isInEditor', false)
  }

  initLoadingFlags(page: IPage, callback?: () => void) {
    this.loadingFlags = {}
    this.loadingCallback = callback
    for (const [index, layer] of page.layers.entries()) {
      this.initLoadingFlagsForLayer(layer, index)
    }
  }

  makeFlagKey(layerIndex: number, subLayerIndex = -1) {
    return subLayerIndex === -1 ? `i${layerIndex}` : `i${layerIndex}_s${subLayerIndex}`
  }

  initLoadingFlagsForLayer(layer: ILayer, layerIndex: number, subLayerIndex = -1) {
    switch (layer.type) {
      case LayerType.group:
        for (const [subIndex, subLayer] of (layer as IGroup).layers.entries()) {
          this.initLoadingFlagsForLayer(subLayer, layerIndex, subIndex)
        }
        break
      default:
        this.loadingFlags[this.makeFlagKey(layerIndex, subLayerIndex)] = false
    }
  }

  setLoadingFlag(layerIndex: number, subLayerIndex = -1) {
    this.loadingFlags[this.makeFlagKey(layerIndex, subLayerIndex)] = true
    if (!Object.values(this.loadingFlags).some(f => !f) && this.loadingCallback) {
      this.loadingCallback()
    }
  }
}

export default new ViviStickerUtils()
