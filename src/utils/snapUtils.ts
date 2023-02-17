
import { IGroup, IImage, IShape, IStyle, IText, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { IConsideredEdges, ISnapline, ISnaplineInfo, ISnaplinePos } from '@/interfaces/snap'
import store from '@/store'
import LayerUtils from '@/utils/layerUtils'
import MathUtils from '@/utils/mathUtils'
import shapeUtils from '@/utils/shapeUtils'
import { EventEmitter } from 'events'
import generalUtils from './generalUtils'
import pageUtils from './pageUtils'
class SnapUtils {
  id: string
  event: any
  pageIndex: number
  private _GUIDELINE_OFFSET: number
  GUIDEANGLE_OFFSET: number
  closestSnaplines: {
    v: Array<ISnapline>,
    h: Array<ISnapline>
  }

  closestSnapAngle: number

  constructor(pageIndex: number) {
    this.event = new EventEmitter()
    this.id = generalUtils.generateRandomString(4)
    this.pageIndex = pageIndex
    this._GUIDELINE_OFFSET = 5
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

  get GUIDELINE_OFFSET(): number {
    return generalUtils.isTouchDevice() ? this._GUIDELINE_OFFSET / (pageUtils.getPage(pageUtils.currActivePageIndex)?.contentScaleRatio || 1) : 5
  }

  on(type: string, callback: () => void): void {
    // replace origin event
    this.event.on(type, callback)
  }

  off(type: string, callback: () => void): void {
    // replace origin event
    this.event.off(type, callback)
  }

  getSnaplinePos(): ISnaplinePos {
    const page = store.getters.getPages[this.pageIndex] as IPage
    /**
     * Push page edge and center snapline first
     */
    const v = [-1, page.width / 2, page.width + 1, ...this.guidelinePos.v]
    const h = [-1, page.height / 2, page.height + 1, ...this.guidelinePos.h]

    /**
     * Then push all bounding edges and center line of layers
     */
    const layers = store.getters.getLayers(this.pageIndex)
    layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
      if (!layer.active) {
        if (layer.type === 'shape' && layer.category === 'D') {
          // svg line snaps to the line edges not the whole layer.
          const { point, size } = layer as IShape
          const { x, y, width, initWidth } = layer.styles
          const scale = (size ?? [1])[0]
          const { width: rawWidth, height: rawHeight, baseDegree } = shapeUtils.lineDimension(point ?? [])
          const ratio = width / initWidth
          const dx = 2 * scale * Math.sin(baseDegree) * ratio
          const dy = 2 * scale * Math.cos(baseDegree) * ratio

          v.push(...[x + dx, x + dx + rawWidth * ratio / 2, x + dx + rawWidth * ratio])
          h.push(...[y + dy, y + dy + rawHeight * ratio / 2, y + dy + rawHeight * ratio])
        } else {
          const rect = MathUtils.getBounding(layer.styles)

          v.push(...[rect.x, rect.x + rect.width / 2, rect.x + rect.width])
          h.push(...[rect.y, rect.y + rect.height / 2, rect.y + rect.height])
        }
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
  getLayerSnappingPos(styles: IStyle, type: string): ISnaplineInfo {
    const layerBounding = MathUtils.getBounding(styles)
    const { x, y } = styles

    return type === 'move' ? {
      v: [
        {
          pos: layerBounding.x,
          offset: x - layerBounding.x
        },
        {
          pos: layerBounding.x + layerBounding.width / 2,
          offset: x - layerBounding.x - layerBounding.width / 2
        },
        {
          pos: layerBounding.x + layerBounding.width,
          offset: x - layerBounding.x - layerBounding.width
        }
      ],
      h: [
        {
          pos: layerBounding.y,
          offset: y - layerBounding.y
        },
        {
          pos: layerBounding.y + layerBounding.height / 2,
          offset: y - layerBounding.y - layerBounding.height / 2
        },
        {
          pos: layerBounding.y + layerBounding.height,
          offset: y - layerBounding.y - layerBounding.height
        }
      ]
    } : {
      v: [
        {
          pos: layerBounding.x,
          offset: x - layerBounding.x
        },
        {
          pos: layerBounding.x + layerBounding.width,
          offset: x - layerBounding.x - layerBounding.width
        }
      ],
      h: [
        {
          pos: layerBounding.y,
          offset: y - layerBounding.y
        },
        {
          pos: layerBounding.y + layerBounding.height,
          offset: y - layerBounding.y - layerBounding.height
        }
      ]
    }
  }

  getLayerSnappingPos4Line(styles: IStyle, layer: IShape, type: string) {
    const { x, y } = styles

    if (type === 'move' && layer.type === 'shape' && layer.category === 'D') {
      // svg line snaps to the line edges not the whole layer.
      const { point, size } = layer as IShape
      const { width, initWidth } = styles
      const scale = (size ?? [1])[0]
      const { width: rawWidth, height: rawHeight, baseDegree } = shapeUtils.lineDimension(point ?? [])
      const ratio = width / initWidth
      const dx = 2 * scale * Math.sin(baseDegree) * ratio
      const dy = 2 * scale * Math.cos(baseDegree) * ratio

      return {
        v: [
          {
            pos: x + dx,
            offset: -dx
          },
          {
            pos: x + dx + rawWidth * ratio / 2,
            offset: -dx - rawWidth * ratio / 2
          },
          {
            pos: x + dx + rawWidth * ratio,
            offset: -dx - rawWidth * ratio
          }
        ],
        h: [
          {
            pos: y + dy,
            offset: -dy
          },
          {
            pos: y + dy + rawHeight * ratio / 2,
            offset: -dy - rawHeight * ratio / 2
          },
          {
            pos: y + dy + rawHeight * ratio,
            offset: -dy - rawHeight * ratio
          }
        ]
      }
    }
    return { v: [], h: [] }
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

  getClosestSnapAngle(angle: number, multipleOf: number, allowedOffset: number = this.GUIDEANGLE_OFFSET): void {
    const quotient = Math.floor(angle / multipleOf)
    let candidateAngle = quotient * multipleOf
    if ((angle - candidateAngle) > multipleOf / 2) {
      candidateAngle += multipleOf
    }
    if (Math.abs(angle - candidateAngle) < allowedOffset) {
      this.closestSnapAngle = candidateAngle % 360
    } else {
      this.closestSnapAngle = -1
    }
  }

  getClosestSnapLineAngle(markerIndex: number, point: number[], multipleOf: number, allowedOffset: number = this.GUIDEANGLE_OFFSET): { lineLength: number, lineAngle: number } {
    const { angle, xDiff, yDiff } = shapeUtils.lineDimension(point)
    let lineAngle = (angle / Math.PI * 180 + 360) % 360
    const hypotenuse = Math.sqrt(Math.pow(yDiff, 2) + Math.pow(xDiff, 2))
    if (markerIndex === 0) {
      lineAngle = (lineAngle + 180) % 360
    }
    this.getClosestSnapAngle(lineAngle, multipleOf, allowedOffset)
    return {
      lineLength: hypotenuse,
      lineAngle: lineAngle
    }
  }

  calcMoveSnap(styles: IStyle, line?: IShape): { x: number, y: number } {
    const snaplinePos = this.getSnaplinePos()
    let layerSnapInfo = null as unknown as ISnaplineInfo
    if (line) {
      layerSnapInfo = this.getLayerSnappingPos4Line(styles, line, 'move')
    } else {
      layerSnapInfo = this.getLayerSnappingPos(styles, 'move')
    }
    const targetSnapLines = this.getClosestSnaplines(snaplinePos, layerSnapInfo)

    const snaplines = [...targetSnapLines.v, ...targetSnapLines.h]
    const snapResult = { x: styles.x, y: styles.y }
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
        offset.x = snapResult.x - styles.x
      } else {
        snapResult.y = snapline.pos + snapline.offset
        offset.y = snapResult.y - styles.y
      }
    })
    // LayerUtils.updateLayerStyles(this.pageIndex, layerIndex, { x: snapResult.x, y: snapResult.y })
    return offset
  }

  calcScaleSnap(styles: IStyle, layerIndex: number, line?: IShape): { x: number, y: number, width: number, height: number } {
    const snaplinePos = this.getSnaplinePos()
    // const layerSnapInfo = this.getLayerSnappingPos(layer, 'scale')
    let layerSnapInfo = null as unknown as ISnaplineInfo
    if (line) {
      layerSnapInfo = this.getLayerSnappingPos4Line(styles, line, 'move')
    } else {
      layerSnapInfo = this.getLayerSnappingPos(styles, 'move')
    }

    const targetSnapLines = this.getClosestSnaplines(snaplinePos, layerSnapInfo)

    const snaplines = [...targetSnapLines.v, ...targetSnapLines.h]
    const snapResult = { width: styles.width, height: styles.height, scale: styles.scale }
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
        snapResult.width = styles.width + (snapline.pos - (styles.x + styles.width))
        const ratio = snapResult.width / styles.width
        snapResult.height = styles.height * ratio
        snapResult.scale = styles.scale * ratio
        // offset.width = snapResult.width - layer.styles.width
      } else {
        snapResult.height = styles.height + (snapline.pos - (styles.y + styles.height))
        const ratio = snapResult.height / styles.height
        snapResult.width = styles.width * ratio
        snapResult.scale = styles.scale * ratio
        // offset.height = snapResult.height - layer.styles.height
      }
    })
    LayerUtils.updateLayerStyles(this.pageIndex, layerIndex, { width: snapResult.width, height: snapResult.height, scale: snapResult.scale })
    return offset
  }

  calAngleSnap(angle: number, forcedSnapFor15Deg = false): number {
    this.getClosestSnapAngle(angle, forcedSnapFor15Deg ? 15 : 90, forcedSnapFor15Deg ? 8 : 2)
    if (this.closestSnapAngle >= 0) {
      return this.closestSnapAngle
    }
    return angle
  }

  calLineAngleSnap(markerIndex: number, point: number[], forcedSnapFor15Deg = false): { newPoint: number[], lineLength: number, lineAngle: number } {
    const { lineLength, lineAngle } = this.getClosestSnapLineAngle(markerIndex, point, forcedSnapFor15Deg ? 15 : 90, forcedSnapFor15Deg ? 8 : undefined)
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
