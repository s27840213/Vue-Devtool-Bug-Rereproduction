
import store from '@/store'
import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import MathUtils from '@/utils/mathUtils'
import { IConsideredEdges, ISnaplineInfo, ISnaplinePos, ISnapline, ISnapAngle } from '@/interfaces/snap'
import LayerUtils from '@/utils/layerUtils'
import shapeUtils from '@/utils/shapeUtils'
import generalUtils from './generalUtils'
import pageUtils from './pageUtils'
class SnapUtils {
  pageIndex: number
  GUIDELINE_OFFSET: number
  GUIDEANGLE_OFFSET: number
  closestSnaplines: {
    v: Array<ISnapline>,
    h: Array<ISnapline>
  }

  closestSnapAngle: number

  constructor(pageIndex: number) {
    this.pageIndex = pageIndex
    this.GUIDELINE_OFFSET = 5
    this.GUIDEANGLE_OFFSET = 1
    this.closestSnaplines = {
      v: [],
      h: []
    }
    this.closestSnapAngle = -1
  }

  get guidelinePos(): { [index: string]: Array<number> } {
    return pageUtils.currFocusPage.guidelines
  }

  getSnaplinePos(): ISnaplinePos {
    const page = store.getters.getPages[this.pageIndex] as IPage
    /**
     * Push page edge and center snapline first
     */
    const v = [0, page.width / 2, page.width, ...this.guidelinePos.v]
    const h = [0, page.height / 2, page.height, ...this.guidelinePos.h]

    /**
     * Then push all bounding edges and center line of layers
     */
    const layers = store.getters.getLayers(this.pageIndex)
    layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
      if (!layer.active) {
        const rect = MathUtils.getBounding(layer)

        v.push(...[rect.x, rect.x + rect.width / 2, rect.x + rect.width])
        h.push(...[rect.y, rect.y + rect.height / 2, rect.y + rect.height])
      }
    })
    return {
      v,
      h
    }
  }

  /**
   * Get the edges and center that will trigger snapping
   */
  getLayerSnappingPos(layer: IShape | IText | IImage | IGroup | ITmp, type: string): ISnaplineInfo {
    const layerBounding = MathUtils.getBounding(layer)
    const layerStyles = {
      x: layer.styles.x,
      y: layer.styles.y,
      width: layer.styles.width,
      height: layer.styles.height
    }

    return type === 'move' ? {
      v: [
        {
          pos: layerBounding.x,
          offset: layerStyles.x - layerBounding.x
        },
        {
          pos: layerBounding.x + layerBounding.width / 2,
          offset: layerStyles.x - layerBounding.x - layerBounding.width / 2
        },
        {
          pos: layerBounding.x + layerBounding.width,
          offset: layerStyles.x - layerBounding.x - layerBounding.width
        }
      ],
      h: [
        {
          pos: layerBounding.y,
          offset: layerStyles.y - layerBounding.y
        },
        {
          pos: layerBounding.y + layerBounding.height / 2,
          offset: layerStyles.y - layerBounding.y - layerBounding.height / 2
        },
        {
          pos: layerBounding.y + layerBounding.height,
          offset: layerStyles.y - layerBounding.y - layerBounding.height
        }
      ]
    } : {
      v: [
        {
          pos: layerBounding.x,
          offset: layerStyles.x - layerBounding.x
        },
        {
          pos: layerBounding.x + layerBounding.width,
          offset: layerStyles.x - layerBounding.x - layerBounding.width
        }
      ],
      h: [
        {
          pos: layerBounding.y,
          offset: layerStyles.y - layerBounding.y
        },
        {
          pos: layerBounding.y + layerBounding.height,
          offset: layerStyles.y - layerBounding.y - layerBounding.height
        }
      ]
    }
  }

  // find all snapping possibilities
  getClosestSnaplines(snaplinesPos: ISnaplinePos, layerSnappingInfos: ISnaplineInfo): ISnaplineInfo {
    const resultV: Array<IConsideredEdges> = []
    const resultH: Array<IConsideredEdges> = []
    snaplinesPos.v.forEach((pos: number) => {
      layerSnappingInfos.v.forEach((layerSnappingInfo: ISnapline) => {
        // if the distance between snapline and layer snap edge is close, we can consider this edge for snapping
        const diff = Math.abs(pos - layerSnappingInfo.pos)
        if (diff < generalUtils.fixSize(this.GUIDELINE_OFFSET)) {
          resultV.push({
            pos: pos,
            diff: diff,
            offset: layerSnappingInfo.offset
          })
        }
      })
    })

    snaplinesPos.h.forEach((pos: number) => {
      layerSnappingInfos.h.forEach((layerSnappingInfo: ISnapline) => {
        const diff = Math.abs(pos - layerSnappingInfo.pos)
        if (diff < generalUtils.fixSize(this.GUIDELINE_OFFSET)) {
          resultH.push({
            pos: pos,
            diff: diff,
            offset: layerSnappingInfo.offset
          })
        }
      })
    })

    const closestSnaplineV: Array<ISnapline> = []
    const closestSnaplineH: Array<ISnapline> = []

    // find closest snap
    const minV = resultV.sort((a: IConsideredEdges, b: IConsideredEdges) => a.diff - b.diff)[0]
    const minH = resultH.sort((a: IConsideredEdges, b: IConsideredEdges) => a.diff - b.diff)[0]
    if (minV) {
      closestSnaplineV.push({
        pos: minV.pos,
        orientation: 'V',
        offset: minV.offset
      })
    }
    if (minH) {
      closestSnaplineH.push({
        pos: minH.pos,
        orientation: 'H',
        offset: minH.offset
      })
    }
    this.closestSnaplines.v = [...closestSnaplineV]
    this.closestSnaplines.h = [...closestSnaplineH]
    return {
      v: this.closestSnaplines.v,
      h: this.closestSnaplines.h
    }
  }

  getClosestSnapAngle(markerIndex: number, point: number[], multipleOf: number, allowedOffset: number = this.GUIDEANGLE_OFFSET): { lineLength: number, lineAngle: number } {
    const { xDiff, yDiff, width, height } = shapeUtils.lineDimension(point)
    let lineAngle = (Math.atan2(yDiff, xDiff) / Math.PI * 180 + 360) % 360
    const hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
    if (markerIndex === 0) {
      lineAngle = (lineAngle + 180) % 360
    }
    const quotient = Math.floor(lineAngle / multipleOf)
    let candidateAngle = quotient * multipleOf
    if ((lineAngle - candidateAngle) > multipleOf / 2) {
      candidateAngle += multipleOf
    }
    if (Math.abs(lineAngle - candidateAngle) < allowedOffset) {
      this.closestSnapAngle = candidateAngle % 360
    } else {
      this.closestSnapAngle = -1
    }
    return {
      lineLength: hypotenuse,
      lineAngle: lineAngle
    }
  }

  calcMoveSnap(layer: ITmp | IGroup | IShape | IText | IImage, layerIndex: number): { x: number, y: number } {
    const snaplinePos = this.getSnaplinePos()
    const layerSnapInfo = this.getLayerSnappingPos(layer, 'move')
    const targetSnapLines = this.getClosestSnaplines(snaplinePos, layerSnapInfo)

    const snaplines = [...targetSnapLines.v, ...targetSnapLines.h]
    const snapResult = { x: layer.styles.x, y: layer.styles.y }
    /**
     * @param {x:number, y:number} offset - The difference of snapped layer pos and original layer pos
     * It's used to prevent the layer from always snapping to the snapline if the mouse move offset is too small
     * It will force the mouse move offset being higher to prevent the problem
     */
    const offset = {
      x: 0,
      y: 0
    }
    if (snaplines.length === 0) {
      return offset
    }

    snaplines.forEach((snapline: ISnapline) => {
      if (snapline.orientation === 'V') {
        snapResult.x = snapline.pos + snapline.offset
        offset.x = snapResult.x - layer.styles.x
      } else {
        snapResult.y = snapline.pos + snapline.offset
        offset.y = snapResult.y - layer.styles.y
      }
    })
    LayerUtils.updateLayerStyles(this.pageIndex, layerIndex, { x: snapResult.x, y: snapResult.y })
    return offset
  }

  calcScaleSnap(layer: ITmp | IGroup | IShape | IText | IImage, layerIndex: number): { x: number, y: number, width: number, height: number } {
    const snaplinePos = this.getSnaplinePos()
    const layerSnapInfo = this.getLayerSnappingPos(layer, 'scale')
    const targetSnapLines = this.getClosestSnaplines(snaplinePos, layerSnapInfo)

    const snaplines = [...targetSnapLines.v, ...targetSnapLines.h]
    const snapResult = { width: layer.styles.width, height: layer.styles.height, scale: layer.styles.scale }
    // const aspectRatio = layer.styles.width / layer.styles.height
    /**
     * @param {x:number, y:number} offset - The difference of snapped layer pos and original layer pos
     * It's used to prevent the layer from always snapping to the snapline if the mouse move offset is too small
     * It will force the mouse move offset being higher to prevent the problem
     */
    const offset = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
    if (snaplines.length === 0) {
      return offset
    }
    snaplines.forEach((snapline: ISnapline) => {
      if (snapline.orientation === 'V') {
        snapResult.width = layer.styles.width + (snapline.pos - (layer.styles.x + layer.styles.width))
        const ratio = snapResult.width / layer.styles.width
        snapResult.height = layer.styles.height * ratio
        snapResult.scale = layer.styles.scale * ratio
        // offset.width = snapResult.width - layer.styles.width
      } else {
        snapResult.height = layer.styles.height + (snapline.pos - (layer.styles.y + layer.styles.height))
        const ratio = snapResult.height / layer.styles.height
        snapResult.width = layer.styles.width * ratio
        snapResult.scale = layer.styles.scale * ratio
        // offset.height = snapResult.height - layer.styles.height
      }
    })
    LayerUtils.updateLayerStyles(this.pageIndex, layerIndex, { width: snapResult.width, height: snapResult.height, scale: snapResult.scale })
    return offset
  }

  calAngleSnap(markerIndex: number, point: number[], forcedSnapFor15Deg = false): { newPoint: number[], lineLength: number, lineAngle: number } {
    const { lineLength, lineAngle } = this.getClosestSnapAngle(markerIndex, point, forcedSnapFor15Deg ? 15 : 90, forcedSnapFor15Deg ? 8 : undefined)
    if (this.closestSnapAngle >= 0) {
      const referenceCoordinates = point.slice((1 - markerIndex) * 2, (1 - markerIndex) * 2 + 2)
      const xDiff = lineLength * Math.cos(this.closestSnapAngle / 180 * Math.PI)
      const yDiff = lineLength * Math.sin(this.closestSnapAngle / 180 * Math.PI)
      const movedCoordinates = shapeUtils.vectorAdd(referenceCoordinates, [xDiff, yDiff])
      const newPoint = [...point]
      newPoint[markerIndex * 2] = movedCoordinates[0]
      newPoint[markerIndex * 2 + 1] = movedCoordinates[1]
      return {
        newPoint: newPoint,
        lineLength: lineLength,
        lineAngle: this.closestSnapAngle
      }
    } else {
      return {
        newPoint: point,
        lineLength: lineLength,
        lineAngle: lineAngle
      }
    }
  }

  clear(): void {
    this.closestSnaplines.v = []
    this.closestSnaplines.h = []
  }
}

export default SnapUtils
