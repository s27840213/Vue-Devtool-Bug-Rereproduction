import { ICurrSelectedInfo } from '@/interfaces/editor'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp } from '@/interfaces/layer'
import store from '@/store'
import { LayerType } from '@/store/types'
import GeneralUtils from '@/utils/generalUtils'
import LayerFactary from '@/utils/layerFactary'
import LayerUtils from '@/utils/layerUtils'
import MappingUtils from '@/utils/mappingUtils'
import MathUtils from '@/utils/mathUtils'
import ZindexUtils from '@/utils/zindexUtils'
import _ from 'lodash'
import backgroundUtils from './backgroundUtils'
import editorUtils from './editorUtils'
import ImageUtils from './imageUtils'
import pageUtils from './pageUtils'
import ShapeUtils from './shapeUtils'
import stepsUtils from './stepsUtils'
import textUtils from './textUtils'

export function calcTmpProps(layers: Array<IShape | IText | IImage | IGroup | IFrame>, scale = 1): ICalculatedGroupStyle {
  let minX = Number.MAX_SAFE_INTEGER
  let minY = Number.MAX_SAFE_INTEGER
  let maxWidth = Number.MIN_SAFE_INTEGER
  let maxHeight = Number.MIN_SAFE_INTEGER
  layers = JSON.parse(JSON.stringify(layers))

  layers.forEach((layer: IShape | IText | IImage | IGroup | IFrame) => {
    if (layer.styles.rotate === 0) {
      minX = Math.min(minX, layer.styles.x)
      minY = Math.min(minY, layer.styles.y)
    } else {
      const layerBouding = MathUtils.getBounding(layer)
      minX = Math.min(minX, layerBouding.x)
      minY = Math.min(minY, layerBouding.y)
    }
  })

  layers.forEach((layer: IShape | IText | IImage | IGroup | IFrame) => {
    if (layer.styles.rotate === 0) {
      maxWidth = Math.max(maxWidth, layer.styles.x + (layer.styles.width as number) - minX)
      maxHeight = Math.max(maxHeight, layer.styles.y + (layer.styles.height as number) - minY)
    } else {
      const layerBouding = MathUtils.getBounding(layer)
      maxWidth = Math.max(maxWidth, layerBouding.x + (layerBouding.width as number) - minX)
      maxHeight = Math.max(maxHeight, layerBouding.y + (layerBouding.height as number) - minY)
    }
  })

  return {
    x: minX,
    y: minY,
    width: maxWidth * scale,
    height: maxHeight * scale,
    initWidth: maxWidth * scale,
    initHeight: maxHeight * scale
  } as ICalculatedGroupStyle
}

class GroupUtils {
  get pageIndex(): number { return store.getters.getCurrSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get getLayer() { return store.getters.getLayer }
  get getCurrLayer() { return store.getters.getLayer(this.pageIndex, this.layerIndex) }
  get getPage() { return store.getters.getPage }
  get currSubSelectedInfo() { return store.getters.getCurrSubSelectedInfo }
  get tmpLayer() { return store.getters.getLayer(store.getters.getCurrSelectedPageIndex, store.getters.getCurrSelectedIndex) }
  get inMultiSelecitonMode() { return store.getters['mobileEditor/getInMultiSelectionMode'] }

  calcType(layers: Array<IShape | IText | IImage | IGroup | IFrame>): Set<string> {
    const typeSet = new Set<string>()
    if (layers.length === 0) {
      return typeSet
    }
    if (layers.length === 1) {
      typeSet.add(layers[0].type)
      return typeSet
    } else {
      layers.forEach((layer: IShape | IText | IImage | IGroup | IFrame) => {
        if (!typeSet.has(layer.type)) {
          typeSet.add(layer.type)
        }
      })
      return typeSet
    }
  }

  group() {
    const currSelectedInfo = GeneralUtils.deepCopy(store.getters.getCurrSelectedInfo)
    if (currSelectedInfo.layers.length < 2) {
      console.log('You need to select at least 2 layers!')
      return
    }

    if (this.currSelectedInfo.types.has('group')) {
      this.ungroupInnerGroup()
    }

    const tmpPageIndex = currSelectedInfo.pageIndex
    const tmpIndex = currSelectedInfo.index
    LayerUtils.updateLayerProps(tmpPageIndex, tmpIndex, {
      type: 'group',
      active: false,
      shown: false
    })

    this.reset()
    this.select(tmpPageIndex, [tmpIndex])
    ZindexUtils.reassignZindex(tmpPageIndex)

    const group = LayerUtils.getLayer(tmpPageIndex, tmpIndex) as IGroup
    group.layers
      .forEach((l, idx) => {
        if (l.type === 'text') {
          const { width, height, writingMode } = l.styles
          LayerUtils.updateSubLayerProps(tmpPageIndex, tmpIndex, idx, {
            widthLimit: (writingMode as string).includes('vertical') ? height : width,
            isTyping: false
          })
          LayerUtils.updateSubLayerProps(tmpPageIndex, tmpIndex, idx, {
            shown: false,
            moved: false
          })
        }
      })
    stepsUtils.record()
  }

  ungroup() {
    const { pageIndex, index: layerIndex } = this.currSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    if (targetLayer.type === 'group') {
      targetLayer.layers.forEach((layer: ILayer | IText, index: number) => {
        layer.styles.zindex = targetLayer.styles.zindex + index
        layer.active = false
      })
      LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        type: 'tmp',
        active: true
      })
      LayerUtils.updateLayerStyles(pageIndex, layerIndex, {
        zindex: 0
      })
      const tmpPageIndex = this.currSelectedInfo.pageIndex
      const tmpIndex = this.currSelectedInfo.index
      this.reset()
      this.set(tmpPageIndex, tmpIndex, targetLayer.layers)
      stepsUtils.record()
    }
  }

  private ungroupInnerGroup() {
    while (this.currSelectedInfo.types.has('group')) {
      const groupLayerIndex = this.currSelectedInfo.layers.findIndex((layer) => layer.type === 'group')
      const selectedLayers = GeneralUtils.deepCopy(this.currSelectedInfo.layers)
      selectedLayers.splice(groupLayerIndex, 1, ...this.mapGroupLayersToTmp(this.currSelectedInfo.layers[groupLayerIndex] as IGroup))
      LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
        layers: selectedLayers
      })
      this.set(this.currSelectedInfo.pageIndex, this.currSelectedInfo.index, selectedLayers)
    }
  }

  select(pageIndex: number, layerIndexs: Array<number>) {
    // currSelectedIndex is smaller than 0 means there isn't any selected layer
    if (this.currSelectedInfo.index < 0) {
      // When we only select one layer
      if (layerIndexs.length === 1) {
        LayerUtils.updateLayerProps(pageIndex, layerIndexs[0], {
          active: true
        })
        const currSelectedLayers = [...MappingUtils.mappingLayers(pageIndex, layerIndexs)]
        /**
         * @Note this line make all controller update when select/deselect
         */
        this.set(pageIndex, layerIndexs[0], currSelectedLayers)
      } else {
        // when we select multiple layer
        const layers = MappingUtils.mappingLayers(pageIndex, layerIndexs)
          .filter(l => !l?.locked)
        const tmpStyles = calcTmpProps(layers)
        const currSelectedLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...layerIndexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(pageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !layerIndexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        /**
         * Set the non-selected layers as the frontest layes,
         * then, insert the tmp layer
         */
        store.commit('SET_layers', {
          pageIndex: pageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(pageIndex, [tmp], currSelectedIndex)
        this.set(pageIndex, currSelectedIndex, currSelectedLayers)
      }
    } else { // when we already have selected layers
      if (store.getters.getCurrSelectedLayers.length === 1) {
        const indexs = [this.currSelectedInfo.index, ...layerIndexs]
        this.deselect()
        const layers = MappingUtils.mappingLayers(pageIndex, indexs)
        const tmpStyles = calcTmpProps(layers)
        const currSelectedLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...indexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        // this.set(pageIndex, currSelectedIndex, currSelectedLayers)
        const newLayers = store.getters.getLayers(pageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: pageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(pageIndex, [tmp], currSelectedIndex)
        this.set(pageIndex, currSelectedIndex, currSelectedLayers)
      } else {
        const layers = MappingUtils.mappingLayers(pageIndex, layerIndexs)
        const tmpLayer = this.tmpLayer
        const tmpStyles = calcTmpProps([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, this.tmpLayer), ...layers])
        const currSelectedLayers = this.mapLayersToTmp([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, tmpLayer), ...layers], tmpStyles)
        const topIndex = Math.max(this.currSelectedInfo.index, ...layerIndexs)
        const newLayersNum = 1 + layerIndexs.length
        const indexs = [this.currSelectedInfo.index, ...layerIndexs]
        const currSelectedIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(pageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: pageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(pageIndex, [tmp], currSelectedIndex)
        this.set(pageIndex, currSelectedIndex, currSelectedLayers)
      }
    }

    if (backgroundUtils.inBgSettingMode) {
      editorUtils.setInBgSettingMode(false)
    }
    store.commit('SET_currActivePageIndex', pageIndex)
  }

  selectAll() {
    this.deselect()
    const indices = [...Array(store.getters.getLayersNum(pageUtils.currFocusPageIndex)).keys()]
      .filter(i => !pageUtils.currFocusPage.layers[i].locked)
    if (indices.length === 0) return
    this.select(pageUtils.currFocusPageIndex, indices)
  }

  deselect() {
    const tmpPageIndex = this.currSelectedInfo.pageIndex

    if (this.currSelectedInfo.index !== -1) {
      const currSelectedLayers = store.getters.getCurrSelectedLayers
      if (currSelectedLayers.length === 1) {
        const { pageIndex, index: layerIndex } = this.currSelectedInfo
        if (currSelectedLayers[0].type === 'text' && textUtils.isEmptyText(currSelectedLayers[0])) {
          store.commit('DELETE_selectedLayer')
          store.commit('SET_lastSelectedLayerIndex', -1)
        } else {
          LayerUtils.updateLayerProps(pageIndex, layerIndex, {
            active: false
          })
          ImageUtils.setImgControlDefault()
        }
      } else {
        const tmpLayer = this.tmpLayer as ITmp
        tmpLayer.layers
          .forEach((l, i) => {
            if (l.type === LayerType.image) {
              LayerUtils.updateLayerStyles(this.pageIndex, LayerUtils.layerIndex, {
                scale: l.styles.scale * tmpLayer.styles.scale
              }, i)
            }
            LayerUtils.updateLayerProps(this.pageIndex, LayerUtils.layerIndex, {
              parentLayerStyles: undefined
            }, i)
          })
        store.commit('DELETE_selectedLayer')
        store.commit('SET_lastSelectedLayerIndex', -1)
        LayerUtils.addLayersToPos(this.currSelectedInfo.pageIndex,
          [...this.mapLayersToPage(store.getters.getCurrSelectedLayers, tmpLayer)],
          store.getters.getCurrSelectedIndex)
        LayerUtils.updateLayersOrder(this.currSelectedInfo.pageIndex)
      }
      this.reset()
      ZindexUtils.reassignZindex(tmpPageIndex)
    }
  }

  deselectTargetLayer(targetIndex: number) {
    /**
     * This function is only used when we have sub-controller (i.e. we have Tmp or Group layer)
     * The purpose of this function is to deselect one of the layer in Tmp layer when we press shift/cmd/ctrl key + click
     *
     * Steps:
     *  1. Used currSelectedInfo and targetIndex to get the target layer we want to remove
     *  2. Remove the target layer from the tmp layer
     *  3. Add the target layer to the page
     *  4. Update Layer order
     */
    const { index, pageIndex, layers } = this.currSelectedInfo
    const tmpLayer = LayerUtils.getSelectedLayer() as ITmp

    /**
     * @param targetLayer - the layer we want to remove from tmp
     */
    const targetLayer = this.mapLayersToPage(
      [GeneralUtils.deepCopy(this.currSelectedInfo.layers[targetIndex])],
      tmpLayer
    )

    const shift = targetLayer[0].styles.zindex > (index + 1) ? 0 : 1

    LayerUtils.deleteSubLayer(pageIndex, index, targetIndex)
    if (layers.length === 1) {
      const tmp = this.mapLayersToPage(layers, tmpLayer)[0]
      tmp.active = true
      LayerUtils.replaceLayer(pageIndex, index, tmp)
      LayerUtils.addLayersToPos(pageIndex, targetLayer, 0)
      LayerUtils.updateLayersOrder(pageIndex)
      this.set(pageIndex, tmp.styles.zindex - 1, layers)
    } else {
      LayerUtils.addLayersToPos(pageIndex, targetLayer, 0)
      LayerUtils.updateLayersOrder(pageIndex)
      this.set(pageIndex, 0, layers)
      this.reselect()
    }

    // now I use lazy mode to complete this part, need to be optimized
  }

  reselect() {
    const selectedIndexs = this.currSelectedInfo.layers.map((layer, index: number) => {
      return layer.styles.zindex - 1
    })
    const tmpPageIndex = this.currSelectedInfo.pageIndex
    this.deselect()
    this.select(tmpPageIndex, [...selectedIndexs])
  }

  set(currSelectedPageIndex: number, currSelectedIndex: number, currSelectedLayers: Array<IShape | IText | IImage | IGroup | IFrame>) {
    store.commit('SET_currSelectedInfo', {
      pageIndex: currSelectedPageIndex,
      index: currSelectedIndex,
      layers: currSelectedLayers,
      types: this.calcType(currSelectedLayers),
      id: LayerUtils.getLayer(currSelectedPageIndex, currSelectedIndex).id || ''
    })
  }

  reset() {
    store.commit('SET_currSelectedInfo', {
      pageIndex: -1,
      index: -1,
      layers: [],
      types: new Set<string>(),
      id: ''
    })
    store.commit('SET_currSubSelectedInfo', {
      index: -1,
      type: ''
    })
  }

  movingTmp(pageIndex: number, styles: { [index: string]: number }) {
    store.commit('UPDATE_tmpLayerStyles', {
      pageIndex: pageIndex,
      styles
    })
  }

  mapLayersToTmp(layers: Array<IShape | IText | IImage | IGroup>, styles: ICalculatedGroupStyle): Array<IShape | IText | IImage | IGroup> {
    layers = GeneralUtils.deepCopy(layers.sort((a, b) => a.styles.zindex - b.styles.zindex))

    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      layer.styles.x -= styles.x
      layer.styles.y -= styles.y
    })

    return layers
  }

  /**
   * @param layers - all selected layers in tmp layer
   * @param styles - the styles of tmp layer
   * @returns calculated layers in tmp layer
   */
  mapLayersToPage(layers: Array<IShape | IText | IImage | IFrame | IGroup>, tmpLayer: ITmp | IFrame | IGroup): Array<IShape | IText | IImage | IFrame | IGroup> {
    layers = JSON.parse(JSON.stringify(layers))
    layers.forEach((layer: IShape | IText | IImage | IGroup | IFrame) => {
      // calculate scale offset
      if (layer.type === 'image') {
        layer = layer as IImage

        layer.styles.width = layer.styles.width as number * tmpLayer.styles.scale
        layer.styles.height = layer.styles.height as number * tmpLayer.styles.scale
        layer.styles.imgHeight *= tmpLayer.styles.scale
        layer.styles.imgWidth *= tmpLayer.styles.scale
        layer.styles.imgX *= tmpLayer.styles.scale
        layer.styles.imgY *= tmpLayer.styles.scale

        // const ratio = tmpLayer.styles.width / tmpLayer.styles.initWidth
        // const ratio = tmpLayer.styles.scale
        // const [x1, y1] = [layer.styles.x, layer.styles.y]
        // const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
        // layer.styles.x = shiftX
        // layer.styles.y = shiftY
      } else if (layer.type === 'shape') {
        if (layer.category === 'D') {
          const [lineWidth] = (layer as IShape).size ?? [1]
          const point = (layer as IShape).point ?? []

          const newLineWidth = _.round(lineWidth * tmpLayer.styles.scale, 2)
          layer.size = [newLineWidth]

          const { width, height } = ShapeUtils.lineDimension(point)
          const [targetWidth, targetHeight] = [width * tmpLayer.styles.scale, height * tmpLayer.styles.scale]
          const { point: newPoint, realWidth, realHeight } = ShapeUtils.computePointForDimensions(ShapeUtils.getLineQuadrant(point), newLineWidth, targetWidth, targetHeight)
          layer.point = newPoint
          layer.styles.width = realWidth
          layer.styles.height = realHeight
          layer.styles.initWidth = realWidth
          layer.styles.initHeight = realHeight
          layer.styles.scale = 1

          // const ratio = tmpLayer.styles.width / tmpLayer.styles.initWidth
          const ratio = tmpLayer.styles.scale
          const [x1, y1] = [layer.styles.x, layer.styles.y]
          const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
          layer.styles.x = shiftX
          layer.styles.y = shiftY
        } else if (layer.category === 'E') {
          layer.styles.width = layer.styles.width as number * tmpLayer.styles.scale
          layer.styles.height = layer.styles.height as number * tmpLayer.styles.scale
          layer.styles.initWidth = layer.styles.width
          layer.styles.initHeight = layer.styles.height
          layer.vSize = [layer.styles.width, layer.styles.height]
          const [lineWidth, corRad] = (layer as IShape).size ?? [1, 0]
          layer.size = [_.round(lineWidth * tmpLayer.styles.scale, 2), corRad * tmpLayer.styles.scale]
          layer.styles.scale = 1

          // const ratio = tmpLayer.styles.width / tmpLayer.styles.initWidth
          const ratio = tmpLayer.styles.scale
          const [x1, y1] = [layer.styles.x, layer.styles.y]
          const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
          layer.styles.x = shiftX
          layer.styles.y = shiftY
        } else {
          layer.styles.width = layer.styles.width as number * tmpLayer.styles.scale
          layer.styles.height = layer.styles.height as number * tmpLayer.styles.scale
          layer.styles.scale *= tmpLayer.styles.scale
        }
      } else {
        layer.styles.width = layer.styles.width as number * tmpLayer.styles.scale
        layer.styles.height = layer.styles.height as number * tmpLayer.styles.scale
        layer.styles.scale *= tmpLayer.styles.scale
        if (layer.type === LayerType.frame && (layer as IFrame).clips[0].isFrameImg) {
          const img = (layer as IFrame).clips[0]
          img.styles.width = layer.styles.width
          img.styles.height = layer.styles.height
          img.styles.imgWidth *= tmpLayer.styles.scale
          img.styles.imgHeight *= tmpLayer.styles.scale
          img.styles.imgX *= tmpLayer.styles.scale
          img.styles.imgY *= tmpLayer.styles.scale
        }
        if (layer.type === 'text') {
          const { widthLimit, styles } = layer as IText
          if (widthLimit === -1) {
            layer.widthLimit = (styles.writingMode as string).includes('vertical') ? styles.height : styles.width
          } else {
            layer.widthLimit = (layer as IText).widthLimit * tmpLayer.styles.scale
          }
        }
      }

      // calculate the center shift of scaled image
      if (layer.styles.scale !== 1) {
        // const ratio = tmpLayer.styles.width / tmpLayer.styles.initWidth
        const ratio = tmpLayer.styles.scale
        const [x1, y1] = [layer.styles.x, layer.styles.y]
        const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
        layer.styles.x = shiftX
        layer.styles.y = shiftY
      }

      const tmpOffset = { x: layer.styles.x + layer.styles.width / 2, y: layer.styles.y + layer.styles.height / 2 }

      // map to original coordinate system
      layer.styles.x += tmpLayer.styles.x
      layer.styles.y += tmpLayer.styles.y

      // calculate rotation offset
      const centerOffset = MathUtils.getRotatedPoint(tmpLayer.styles.rotate, MathUtils.getCenter(tmpLayer.styles), MathUtils.getCenter(layer.styles))
      layer.styles.x = centerOffset.x - (layer.styles.width as number) / 2
      layer.styles.y = centerOffset.y - (layer.styles.height as number) / 2

      if (layer.type === 'shape' && layer.category === 'D') {
        const { point, realWidth, realHeight, dx, dy } = ShapeUtils.lineCenterRotate((layer as IShape).point ?? [], tmpLayer.styles.rotate, (layer as IShape).size?.[0] ?? 1)
        layer.point = point
        layer.styles.width = realWidth
        layer.styles.height = realHeight
        layer.styles.initWidth = realWidth
        layer.styles.initHeight = realHeight
        layer.styles.x += dx
        layer.styles.y += dy
      } else {
        layer.styles.rotate = (layer.styles.rotate + tmpLayer.styles.rotate) % 360
      }

      const rotateRad = tmpLayer.styles.rotate / 180 * Math.PI

      if (tmpLayer.styles.horizontalFlip) {
        const offset = tmpLayer.styles.width - 2 * tmpOffset.x
        const [dx, dy] = [offset * Math.cos(rotateRad), offset * Math.sin(rotateRad)]
        layer.styles.x += dx
        layer.styles.y += dy
        if (layer.type === 'shape' && layer.category === 'D') {
          const shapeLayer = layer as IShape
          const { angle } = ShapeUtils.lineDimension(shapeLayer.point ?? [])
          const { point, realWidth, realHeight, dx, dy } = ShapeUtils.lineCenterRotate(shapeLayer.point ?? [], (180 - (angle / Math.PI * 180) + 2 * tmpLayer.styles.rotate), shapeLayer.size?.[0] ?? 1, false)
          layer.point = point
          layer.styles.width = realWidth
          layer.styles.height = realHeight
          layer.styles.initWidth = realWidth
          layer.styles.initHeight = realHeight
          layer.styles.x += dx
          layer.styles.y += dy
        } else {
          layer.styles.horizontalFlip = !layer.styles.horizontalFlip
          layer.styles.rotate = 360 - layer.styles.rotate + 2 * tmpLayer.styles.rotate
        }
      }

      if (tmpLayer.styles.verticalFlip) {
        const offset = tmpLayer.styles.height - 2 * tmpOffset.y
        const [dx, dy] = [-offset * Math.sin(rotateRad), offset * Math.cos(rotateRad)]
        layer.styles.x += dx
        layer.styles.y += dy
        if (layer.type === 'shape' && layer.category === 'D') {
          const shapeLayer = layer as IShape
          const { angle } = ShapeUtils.lineDimension(shapeLayer.point ?? [])
          const { point, realWidth, realHeight, dx, dy } = ShapeUtils.lineCenterRotate(shapeLayer.point ?? [], (360 - (angle / Math.PI * 180) + 2 * tmpLayer.styles.rotate), shapeLayer.size?.[0] ?? 1, false)
          layer.point = point
          layer.styles.width = realWidth
          layer.styles.height = realHeight
          layer.styles.initWidth = realWidth
          layer.styles.initHeight = realHeight
          layer.styles.x += dx
          layer.styles.y += dy
        } else {
          layer.styles.verticalFlip = !layer.styles.verticalFlip
          layer.styles.rotate = 360 - layer.styles.rotate + 2 * tmpLayer.styles.rotate
        }
      }

      layer.shown = false
      layer.locked = tmpLayer.locked
      layer.moved = tmpLayer.moved
    })

    return layers
  }

  mapGroupLayersToTmp(groupLayer: IGroup): Array<IShape | IText | IImage | IGroup> {
    const layers = JSON.parse(JSON.stringify(groupLayer.layers))
    layers.forEach((layer: IShape | IText | IImage | IGroup | IFrame) => {
      // calculate scale offset
      if (layer.type === 'image') {
        layer = layer as IImage
        const width = layer.styles.width as number * groupLayer.styles.scale
        const height = layer.styles.height as number * groupLayer.styles.scale

        layer.styles.width = width
        layer.styles.height = height
        layer.styles.imgHeight *= groupLayer.styles.scale
        layer.styles.imgWidth *= groupLayer.styles.scale
        layer.styles.imgX *= groupLayer.styles.scale
        layer.styles.imgY *= groupLayer.styles.scale

        layer.clipPath = `M0,0h${width}v${height}h${-width}z`
        // const ratio = groupLayer.styles.width / groupLayer.styles.initWidth
        const ratio = groupLayer.styles.scale
        const [x1, y1] = [layer.styles.x, layer.styles.y]
        const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
        layer.styles.x = shiftX
        layer.styles.y = shiftY
      } else if (layer.type === 'shape') {
        if (layer.category === 'D') {
          const [lineWidth] = (layer as IShape).size ?? [1]
          const point = (layer as IShape).point ?? []

          const newLineWidth = _.round(lineWidth * groupLayer.styles.scale, 2)
          layer.size = [newLineWidth]

          const { width, height } = ShapeUtils.lineDimension(point)
          const [targetWidth, targetHeight] = [width * groupLayer.styles.scale, height * groupLayer.styles.scale]
          const { point: newPoint, realWidth, realHeight } = ShapeUtils.computePointForDimensions(ShapeUtils.getLineQuadrant(point), newLineWidth, targetWidth, targetHeight)
          layer.point = newPoint
          layer.styles.width = realWidth
          layer.styles.height = realHeight
          layer.styles.initWidth = realWidth
          layer.styles.initHeight = realHeight
          layer.styles.scale = 1

          // const ratio = groupLayer.styles.width / groupLayer.styles.initWidth
          const ratio = groupLayer.styles.scale
          const [x1, y1] = [layer.styles.x, layer.styles.y]
          const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
          layer.styles.x = shiftX
          layer.styles.y = shiftY
        } else if (layer.category === 'E') {
          layer.styles.width = layer.styles.width as number * groupLayer.styles.scale
          layer.styles.height = layer.styles.height as number * groupLayer.styles.scale
          layer.styles.initWidth = layer.styles.width
          layer.styles.initHeight = layer.styles.height
          layer.vSize = [layer.styles.width, layer.styles.height]
          const [lineWidth, corRad] = (layer as IShape).size ?? [1, 0]
          layer.size = [_.round(lineWidth * groupLayer.styles.scale, 2), corRad * groupLayer.styles.scale]
          layer.styles.scale = 1

          // const ratio = groupLayer.styles.width / groupLayer.styles.initWidth
          const ratio = groupLayer.styles.scale
          const [x1, y1] = [layer.styles.x, layer.styles.y]
          const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
          layer.styles.x = shiftX
          layer.styles.y = shiftY
        } else {
          layer.styles.width = layer.styles.width as number * groupLayer.styles.scale
          layer.styles.height = layer.styles.height as number * groupLayer.styles.scale
          layer.styles.scale *= groupLayer.styles.scale
        }
      } else {
        layer.styles.width = layer.styles.width as number * groupLayer.styles.scale
        layer.styles.height = layer.styles.height as number * groupLayer.styles.scale
        layer.styles.scale *= groupLayer.styles.scale
      }

      // calculate the center shift of scaled image
      if (layer.styles.scale !== 1) {
        // const ratio = groupLayer.styles.width / groupLayer.styles.initWidth
        const ratio = groupLayer.styles.scale
        const [x1, y1] = [layer.styles.x, layer.styles.y]
        const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
        layer.styles.x = shiftX
        layer.styles.y = shiftY
      }

      const tmpOffset = { x: layer.styles.x + layer.styles.width / 2, y: layer.styles.y + layer.styles.height / 2 }

      // map to original coordinate system
      layer.styles.x += groupLayer.styles.x
      layer.styles.y += groupLayer.styles.y

      // calculate rotation offset
      const centerOffset = MathUtils.getRotatedPoint(groupLayer.styles.rotate, MathUtils.getCenter(groupLayer.styles), MathUtils.getCenter(layer.styles))
      layer.styles.x = centerOffset.x - (layer.styles.width as number) / 2
      layer.styles.y = centerOffset.y - (layer.styles.height as number) / 2

      if (layer.type === 'shape' && layer.category === 'D') {
        const { point, realWidth, realHeight, dx, dy } = ShapeUtils.lineCenterRotate((layer as IShape).point ?? [], groupLayer.styles.rotate, (layer as IShape).size?.[0] ?? 1)
        layer.point = point
        layer.styles.width = realWidth
        layer.styles.height = realHeight
        layer.styles.initWidth = realWidth
        layer.styles.initHeight = realHeight
        layer.styles.x += dx
        layer.styles.y += dy
      } else {
        layer.styles.rotate = (layer.styles.rotate + groupLayer.styles.rotate) % 360
      }

      const rotateRad = groupLayer.styles.rotate / 180 * Math.PI

      if (groupLayer.styles.horizontalFlip) {
        const offset = groupLayer.styles.width - 2 * tmpOffset.x
        const [dx, dy] = [offset * Math.cos(rotateRad), offset * Math.sin(rotateRad)]
        layer.styles.x += dx
        layer.styles.y += dy
        if (layer.type === 'shape' && layer.category === 'D') {
          const shapeLayer = layer as IShape
          const { angle } = ShapeUtils.lineDimension(shapeLayer.point ?? [])
          const { point, realWidth, realHeight, dx, dy } = ShapeUtils.lineCenterRotate(shapeLayer.point ?? [], (180 - (angle / Math.PI * 180) + 2 * groupLayer.styles.rotate), shapeLayer.size?.[0] ?? 1, false)
          layer.point = point
          layer.styles.width = realWidth
          layer.styles.height = realHeight
          layer.styles.initWidth = realWidth
          layer.styles.initHeight = realHeight
          layer.styles.x += dx
          layer.styles.y += dy
        } else {
          layer.styles.horizontalFlip = !layer.styles.horizontalFlip
          layer.styles.rotate = 360 - layer.styles.rotate + 2 * groupLayer.styles.rotate
        }
      }

      if (groupLayer.styles.verticalFlip) {
        const offset = groupLayer.styles.height - 2 * tmpOffset.y
        const [dx, dy] = [-offset * Math.sin(rotateRad), offset * Math.cos(rotateRad)]
        layer.styles.x += dx
        layer.styles.y += dy
        if (layer.type === 'shape' && layer.category === 'D') {
          const shapeLayer = layer as IShape
          const { angle } = ShapeUtils.lineDimension(shapeLayer.point ?? [])
          const { point, realWidth, realHeight, dx, dy } = ShapeUtils.lineCenterRotate(shapeLayer.point ?? [], (360 - (angle / Math.PI * 180) + 2 * groupLayer.styles.rotate), shapeLayer.size?.[0] ?? 1, false)
          layer.point = point
          layer.styles.width = realWidth
          layer.styles.height = realHeight
          layer.styles.initWidth = realWidth
          layer.styles.initHeight = realHeight
          layer.styles.x += dx
          layer.styles.y += dy
        } else {
          layer.styles.verticalFlip = !layer.styles.verticalFlip
          layer.styles.rotate = 360 - layer.styles.rotate + 2 * groupLayer.styles.rotate
        }
      }

      layer.shown = false
      layer.locked = groupLayer.locked
      layer.moved = groupLayer.moved
    })

    return layers
  }
}

const groupUtils = new GroupUtils()
export default groupUtils
