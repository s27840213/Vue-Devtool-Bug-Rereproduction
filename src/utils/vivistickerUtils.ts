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
import editorUtils from './editorUtils'
import imageUtils from './imageUtils'
import controlUtils from './controlUtils'
import layerUtils from './layerUtils'
import textPropUtils from './textPropUtils'

class ViviStickerUtils {
  inDebugMode = false
  loadingFlags = {} as { [key: string]: boolean }
  loadingCallback = undefined as (() => void) | undefined

  get editorType(): string {
    return store.getters['vivisticker/getEditorType']
  }

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
      case 10:
        return `type=svg&id=${item.id}&ver=${item.ver}`
      case 15:
        return `type=svgImage&id=${item.id}&ver=${item.ver}&width=${item.width}&height=${item.height}`
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
      if (asset.type === 15) {
        await assetUtils.addAsset(asset)
        return true
      } else {
        return await assetUtils.addAsset(asset)
      }
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
      if (asset.type === 7) {
        textPropUtils.updateTextPropsState()
      }
    }
  }

  getEmptyCallback(): (jsonData: any) => void {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return (jsonData: any) => {}
  }

  startEditing(editorType: string, initiator: () => Promise<any>, callback: (jsonData: any) => void) {
    const pageWidth = window.innerWidth - 32
    pageUtils.setPages([pageUtils.newPage({
      width: pageWidth,
      height: Math.round(pageWidth * 420 / 358),
      backgroundColor: '#F8F8F8',
      isAutoResizeNeeded: true
    })])
    initiator().then((jsonData?: any) => {
      console.log(jsonData)
      if (jsonData) {
        stepsUtils.reset()
        store.commit('vivisticker/SET_editorType', editorType)
        callback(jsonData)
      }
    })
  }

  endEditing() {
    groupUtils.deselect()
    pageUtils.setPages()
    this.showController()
    store.commit('vivisticker/SET_editorType', 'none')
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

  initLoadingFlagsForOneLayer(callback?: () => void) {
    this.loadingFlags = {}
    this.loadingCallback = callback
    this.loadingFlags[this.makeFlagKey(0, -1)] = false
  }

  setLoadingFlag(layerIndex: number, subLayerIndex = -1) {
    const key = this.makeFlagKey(layerIndex, subLayerIndex)
    if (Object.prototype.hasOwnProperty.call(this.loadingFlags, key)) {
      this.loadingFlags[key] = true
    }
    if (Object.values(this.loadingFlags).length !== 0 && !Object.values(this.loadingFlags).some(f => !f) && this.loadingCallback) {
      this.loadingCallback()
    }
  }

  hideController() {
    console.log('hi')
    store.commit('vivisticker/SET_controllerHidden', true)
  }

  showController() {
    store.commit('vivisticker/SET_controllerHidden', false)
  }

  deselect() {
    if (this.editorType === 'text') {
      groupUtils.deselect()
      editorUtils.setInMultiSelectionMode(false)
      store.commit('SET_currActivePageIndex', 0)
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault(false)
      }
    } else {
      const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
      if (currLayer.type === 'text') {
        layerUtils.updateLayerProps(pageIndex, layerIndex, { contentEditable: false })
      } else if (['group', 'tmp'].includes(currLayer.type) && subLayerIdx !== -1) {
        const subLayer = (currLayer as IGroup).layers[subLayerIdx]
        if (subLayer.type === 'text') {
          layerUtils.updateLayerProps(pageIndex, layerIndex, { contentEditable: false }, subLayerIdx)
        }
      }
      if (imageUtils.isImgControl()) {
        imageUtils.setImgControlDefault(false)
      }
      this.hideController()
    }
  }
}

export default new ViviStickerUtils()
