import { IListServiceContentDataItem } from '@/interfaces/api'
import { AllLayerTypes, IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { IStep } from '@/interfaces/steps'
import store from '@/store'
import { FunctionPanelType } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import GroupUtils, { calcTmpProps } from '@/utils/groupUtils'
import { nextTick, reactive } from 'vue'
import assetUtils from './assetUtils'
import layerFactary from './layerFactary'
import layerUtils from './layerUtils'
import pageUtils from './pageUtils'
import popupUtils from './popupUtils'
import shapeUtils from './shapeUtils'
import stkWVUtils from './stkWVUtils'
import TextPropUtils from './textPropUtils'
import textShapeUtils from './textShapeUtils'
import textUtils from './textUtils'
import uploadUtils from './uploadUtils'

class StepsUtils {
  steps: Array<IStep>
  // /**
  //  * @param {Array<number>} pageSteps  used to record the changed page for template update when we're update group template
  //  */
  // pageSteps: Array<number>
  currStep: number
  MAX_STORAGE_COUNT: number
  checkpointStep: number
  get isPopupOpen(): boolean {
    return popupUtils.isPopupOpen
  }

  get isInFirstStep(): boolean {
    return (this.currStep === 0) || this.currStep === this.checkpointStep
  }

  get isInLastStep(): boolean {
    return (this.currStep === (this.steps.length - 1))
  }

  timers: { [key: string]: number }
  constructor() {
    this.steps = []
    // this.pageSteps = []
    this.currStep = -1
    this.MAX_STORAGE_COUNT = 30
    this.timers = {}
    this.checkpointStep = -1
  }

  filterDataForLayer(layer: AllLayerTypes): AllLayerTypes {
    let typedLayer: AllLayerTypes
    let newLayers: Exclude<AllLayerTypes, ITmp>[]
    switch (layer.type) {
      case 'shape':
        typedLayer = layer
        if ((!typedLayer.designId || typedLayer.designId === '') && !['D', 'E'].includes(typedLayer.category)) return typedLayer
        typedLayer.svg = ''
        return typedLayer
      case 'tmp':
      case 'group':
        typedLayer = layer
        newLayers = typedLayer.layers.map(layer => this.filterDataForLayer(layer) as Exclude<AllLayerTypes, ITmp>)
        typedLayer.layers = newLayers
        return typedLayer
      case 'frame':
        typedLayer = layer
        if (!typedLayer.designId || typedLayer.designId === '') return typedLayer
        if (typedLayer.decoration) {
          typedLayer.decoration.svg = ''
        }
        if (typedLayer.decorationTop) {
          typedLayer.decorationTop.svg = ''
        }
        return typedLayer
      case 'text':
        if (!generalUtils.isTouchDevice()) return layer
        typedLayer = layer
        typedLayer.contentEditable = false
        return typedLayer
      default:
        return layer
    }
  }

  async refetchForShape(layer: IShape): Promise<any> {
    let shape
    switch (layer.category) {
      case 'D':
        await shapeUtils.addComputableInfo(layer)
        return layer
      case 'E':
        await shapeUtils.addComputableInfo(layer)
        return layer
      default:
        if (layer.designId && layer.designId !== '') {
          shape = await shapeUtils.fetchSvg(layer) as any
          layer.color && layer.color.length && (shape.color = layer.color)
          !layer.className && (layer.className = shapeUtils.classGenerator())
          const vSize = shape.vSize as number[]
          delete shape.styles
          Object.assign(layer, shape)
          Object.assign(layer.styles, {
            initWidth: vSize?.[0] ?? 0,
            initHeight: vSize?.[1] ?? 0
          })
        }
        return layer
    }
  }

  async refetchForFrame(layer: any): Promise<any> {
    if (!layer.designId || layer.designId === '') return layer
    const asset = {
      type: 8,
      id: layer.designId,
      ver: store.getters['user/getVerUni']
    } as IListServiceContentDataItem

    const res = await assetUtils.get(asset)
    const json = res.jsonData as IFrame

    (layer.clips as IImage[]).forEach((img, idx) => {
      if (json.clips[idx]) {
        img.clipPath = json.clips[idx].clipPath
      }
    })

    if (layer.decoration && json.decoration) {
      json.decoration.color = [...layer.decoration.color] as [string]
      layer.decoration = layerFactary.newShape({
        ...json.decoration,
        vSize: [layer.styles.initWidth, layer.styles.initHeight],
        styles: {
          width: layer.styles.initWidth,
          height: layer.styles.initHeight,
          initWidth: layer.styles.initWidth,
          initHeight: layer.styles.initHeight
        }
      })
    }
    if (layer.decorationTop && json.decorationTop) {
      json.decorationTop.color = [...layer.decorationTop.color] as [string]
      layer.decorationTop = layerFactary.newShape({
        ...json.decorationTop,
        vSize: [layer.styles.initWidth, layer.styles.initHeight],
        styles: {
          width: layer.styles.initWidth,
          height: layer.styles.initHeight,
          initWidth: layer.styles.initWidth,
          initHeight: layer.styles.initHeight
        }
      })
    }
    return layer
  }

  async fillLoadingSize(layer: IText, inGroupOrTmp = false): Promise<IText> {
    if (textShapeUtils.isCurvedText(layer.styles.textShape)) return layer
    const dimension = layer.styles.writingMode.includes('vertical') ? layer.styles.height : layer.styles.width
    const initSize = {
      width: layer.styles.width,
      height: layer.styles.height,
      widthLimit: layer.widthLimit === -1 ? -1 : dimension,
      spanDataList: layer.spanDataList
    }
    layer.widthLimit = await textUtils.autoResize(layer, initSize)
    const textHW = await textUtils.getTextHWAsync(layer, layer.widthLimit)
    if (!inGroupOrTmp && layer.widthLimit === -1) {
      if (layer.styles.writingMode.includes('vertical')) {
        layer.styles.y = layer.styles.y - (textHW.height - layer.styles.height) / 2
      } else {
        layer.styles.x = layer.styles.x - (textHW.width - layer.styles.width) / 2
      }
    }
    layer.styles.width = textHW.width
    layer.styles.height = textHW.height
    layer.spanDataList = textHW.spanDataList
    return layer
  }

  async fillDataForLayer(layer: ILayer, inGroupOrTmp = false): Promise<any> {
    let typedLayer
    const newLayers = []
    switch (layer.type) {
      case 'shape':
        typedLayer = layer as IShape
        return await this.refetchForShape(typedLayer)
      case 'text':
        typedLayer = layer as IText
        return await this.fillLoadingSize(typedLayer, inGroupOrTmp)
      case 'tmp':
      case 'group':
        typedLayer = layer as IGroup
        for (const subLayer of typedLayer.layers) {
          newLayers.push(await this.fillDataForLayer(subLayer, true))
        }
        typedLayer.layers = newLayers
        // eslint-disable-next-line no-case-declarations
        const { width, height } = calcTmpProps(typedLayer.layers, typedLayer.styles.scale)
        typedLayer.styles.width = width
        typedLayer.styles.height = height
        return typedLayer
      case 'frame':
        typedLayer = layer as any
        return await this.refetchForFrame(typedLayer)
      default:
        return layer
    }
  }

  filterDataForLayersInPages(pages: IPage[]): IPage[] {
    for (const page of pages) {
      const newLayers = page.layers.map(layer => this.filterDataForLayer(layer))
      page.layers = newLayers
    }
    return pages
  }

  async fillDataForLayersInPages(pages: IPage[]): Promise<IPage[]> {
    const pagePromises = []
    for (const [pageIndex, page] of pages.entries()) {
      if ((generalUtils.isPic || generalUtils.isCm) && pageIndex === layerUtils.pageIndex) {
        page.x = pageUtils.getCurrPage.x
        page.y = pageUtils.getCurrPage.y
        page.initPos = pageUtils.getCurrPage.initPos
        page.contentScaleRatio = pageUtils.getCurrPage.contentScaleRatio
      }
      if (pageUtils.isOutOfBound(pageIndex)) continue
      pagePromises.push(new Promise((resolve, reject) => {
        try {
          const layerPromises = []
          for (const layer of page.layers) {
            layerPromises.push(this.fillDataForLayer(layer))
          }
          Promise.all(layerPromises).then((layers) => {
            page.layers = layers
            resolve(page)
          })
        } catch (error) {
          reject(error)
        }
      }))
    }
    await Promise.all(pagePromises)
    return pages
  }

  record() {
    const lastSelectedLayerIndex = store.getters.getLastSelectedLayerIndex
    // const modifiedPage = pageUtils.getPage(middlemostPageIndex) as IPage
    // if (modifiedPage.designId.length !== 0) {
    //   store.commit('SET_pageIsModified', {
    //     pageIndex: middlemostPageIndex,
    //     modified: modifiedPage.modified !== undefined
    //   })
    // }
    const pages = this.filterDataForLayersInPages(generalUtils.deepCopy(store.getters.getPages))
    // Watch out! The deep cody method we use won't work on Set/Map object
    const currSelectedInfo = generalUtils.deepCopy(store.getters.getCurrSelectedInfo)

    // There's not any steps before, create the initial step first
    if (this.currStep < 0) {
      this.steps.push({ pages, lastSelectedLayerIndex, currSelectedInfo, currActivePageIndex: store.getters.getCurrActivePageIndex })
      // this.pageSteps.push(middlemostPageIndex)
      this.currStep++
    } else {
      // if step isn't in last step and we record new step, we need to remove all steps larger than curr step
      this.steps.length = this.currStep + 1
      if (this.steps.length === this.MAX_STORAGE_COUNT) {
        this.steps.shift()
      }
      this.steps.push({ pages, lastSelectedLayerIndex, currSelectedInfo, currActivePageIndex: store.getters.getCurrActivePageIndex })
      this.currStep = this.steps.length - 1
      // Don't upload the design when initialize the steps
      if (generalUtils.isPic) {
        if (uploadUtils.isLogin) {
          uploadUtils.uploadDesign()
        }
      } else if (generalUtils.isStk) {
        stkWVUtils.saveDesign()
      }
    }
    // console.warn(generalUtils.deepCopy(this.steps))
  }

  setCheckpoint(step?: number) {
    this.checkpointStep = step ?? this.currStep
  }

  async undo() {
    if (this.steps.length === 0 || this.currStep === 0 || textUtils.isFontLoading) {
      return
    }
    if (this.isPopupOpen) {
      popupUtils.closePopup()
    }
    this.currStep--
    await this.goToCurrStep()
  }

  async redo() {
    if (this.currStep === this.steps.length - 1 || textUtils.isFontLoading) {
      return
    }
    if (this.isPopupOpen) {
      popupUtils.closePopup()
    }
    this.currStep++
    await this.goToCurrStep()
  }

  async goToCheckpoint() {
    if (this.checkpointStep === -1) {
      return
    }
    if (this.isPopupOpen) {
      popupUtils.closePopup()
    }
    this.currStep = this.checkpointStep
    this.steps.length = this.currStep + 1
    // @TODO: need to review with Daniel
    this.checkpointStep = -1
    await this.goToCurrStep()
  }

  async goToCurrStep() {
    const activePageIndex = this.steps[this.currStep].currActivePageIndex
    // const activePageIndex = pageUtils.currActivePageIndex
    const pages = await this.fillDataForLayersInPages(generalUtils.deepCopy(this.steps[this.currStep].pages))
    store.commit('SET_pages', pages)
    store.commit('SET_lastSelectedLayerIndex', this.steps[this.currStep].lastSelectedLayerIndex)
    if (generalUtils.isPic) {
      const { pageIndex, index } = this.steps[this.currStep].currSelectedInfo
      let layers: (IShape | IText | IImage | IGroup | IFrame)[]
      if (pages[pageIndex]) {
        const selectedLayer = pages[pageIndex].layers[index]
        if (selectedLayer) {
          if (selectedLayer.type === 'tmp') {
            layers = (selectedLayer as ITmp).layers
          } else {
            layers = [selectedLayer]
          }
        } else {
          layers = []
        }
      } else {
        layers = []
      }

      if (pageIndex >= 0 && pageIndex !== pageUtils.currFocusPageIndex) {
        store.commit('SET_currActivePageIndex', pageIndex)
        pageUtils.scrollIntoPage(pageIndex)
      } else if (pageIndex === -1) {
        // If the pageIndex be reset e.g. deleting the background-Img,
        // however, the activePageIndex should remain the same for a better UX
        store.commit('SET_currActivePageIndex', activePageIndex)
      }
      GroupUtils.set(pageIndex, index, layers)
    } else {
      if (generalUtils.isStk) stkWVUtils.scrollIntoPage(activePageIndex, 300)
      GroupUtils.setBySelectedInfo(this.steps[this.currStep].currSelectedInfo, pages, activePageIndex)
    }
    if (this.currStep > 0) {
      nextTick(() => {
        if (store.state.currFunctionPanelType === FunctionPanelType.textSetting) {
          TextPropUtils.updateTextPropsState()
        }
      })
    }

    if (generalUtils.isPic) {
      if (uploadUtils.isLogin) {
        uploadUtils.uploadDesign()
      }
    } else if (generalUtils.isStk) {
      stkWVUtils.saveDesign()
    }
  }

  updateHead(pageIndex: number, layerIndex: number, props: any, subLayerIdx = -1) {
    if (this.currStep < 0) return
    const pages = this.steps[this.currStep].pages
    const layer = subLayerIdx === -1
      ? pages[pageIndex]?.layers?.[layerIndex] : (pages[pageIndex]?.layers?.[layerIndex] as IGroup)?.layers[subLayerIdx]
    if (!layer) return
    for (const [key, value] of Object.entries(props)) {
      layer[key] = value
    }
  }

  getPrevPages() {
    return this.steps[this.currStep].pages
  }

  reset() {
    this.clearSteps()
    this.record()
  }

  // When leave the route of editor, we may use this function alone without creating a new step
  clearSteps() {
    this.steps = []
    this.currStep = -1
  }

  clearCurrStep() {
    this.steps.splice(this.currStep--, 1)
  }
}

const stepsUtils = new StepsUtils()

export default reactive(stepsUtils)
