
import store from '@/store'
import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import MathUtils from '@/utils/mathUtils'
import ControlUtils from '@/utils/controllerUtils'
import { IConsideredEdges, ISnaplineInfo, ISnaplinePos, ISnapline } from '@/interfaces/snap'
class SnapUtils {
  pageIndex: number
  GUIDELINE_OFFSET: number
  closestSnaplines: {
    v: Array<ISnapline>,
    h: Array<ISnapline>
  }

  constructor(pageIndex: number) {
    this.pageIndex = pageIndex
    this.GUIDELINE_OFFSET = 10
    this.closestSnaplines = {
      v: [],
      h: []
    }
  }

  getSnaplinePos(): ISnaplinePos {
    const page = store.getters.getPages[this.pageIndex] as IPage
    /**
     * Push page edge and center snapline first
     */
    const v = [0, page.width / 2, page.width]
    const h = [0, page.height / 2, page.height]

    /**
     * Then push all bounding edges and center line of layers
     */
    const layers = store.getters.getLayers(this.pageIndex)
    layers.forEach((layer: IShape | IText | IImage | IGroup | ITmp) => {
      if (!layer.active) {
        const rect = MathUtils.getBounding(layer.styles.rotate, MathUtils.getCenter(layer.styles), {
          x: layer.styles.x,
          y: layer.styles.y,
          width: layer.styles.width,
          height: layer.styles.height
        })

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
  getLayerSnappingEdges(layer: IShape | IText | IImage | IGroup | ITmp): ISnaplineInfo {
    const layerBounding = MathUtils.getBounding(layer.styles.rotate, MathUtils.getCenter(layer.styles), {
      x: layer.styles.x,
      y: layer.styles.y,
      width: layer.styles.width,
      height: layer.styles.height
    })
    const layerStyles = {
      x: layer.styles.x,
      y: layer.styles.y,
      width: layer.styles.width,
      height: layer.styles.height
    }

    return {
      v: [
        {
          pos: layerBounding.x,
          offset: layerStyles.x - layerBounding.x,
          snapTo: 'start'
        },
        {
          pos: layerBounding.x + layerBounding.width / 2,
          offset: layerStyles.x - layerBounding.x - layerBounding.width / 2,
          snapTo: 'center'
        },
        {
          pos: layerBounding.x + layerBounding.width,
          offset: layerStyles.x - layerBounding.x - layerBounding.width,
          snapTo: 'end'
        }
      ],
      h: [
        {
          pos: layerBounding.y,
          offset: layerStyles.y - layerBounding.y,
          snapTo: 'start'
        },
        {
          pos: layerBounding.y + layerBounding.height / 2,
          offset: layerStyles.y - layerBounding.y - layerBounding.height / 2,
          snapTo: 'center'
        },
        {
          pos: layerBounding.y + layerBounding.height,
          offset: layerStyles.y - layerBounding.y - layerBounding.height,
          snapTo: 'end'
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
        if (diff < this.GUIDELINE_OFFSET) {
          resultV.push({
            pos: pos,
            diff: diff,
            snapTo: layerSnappingInfo.snapTo,
            offset: layerSnappingInfo.offset
          })
        }
      })
    })

    snaplinesPos.h.forEach((pos: number) => {
      layerSnappingInfos.h.forEach((layerSnappingInfo: ISnapline) => {
        const diff = Math.abs(pos - layerSnappingInfo.pos)
        if (diff < this.GUIDELINE_OFFSET) {
          resultH.push({
            pos: pos,
            diff: diff,
            snapTo: layerSnappingInfo.snapTo,
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
        offset: minV.offset,
        snapTo: minV.snapTo
      })
    }
    if (minH) {
      closestSnaplineH.push({
        pos: minH.pos,
        orientation: 'H',
        offset: minH.offset,
        snapTo: minH.snapTo
      })
    }
    this.closestSnaplines.v = [...closestSnaplineV]
    this.closestSnaplines.h = [...closestSnaplineH]
    return {
      v: this.closestSnaplines.v,
      h: this.closestSnaplines.h
    }
  }

  calcMoveSnap(layer: ITmp | IGroup | IShape | IText | IImage, layerIndex: number): { x: number, y: number } {
    const snaplinePos = this.getSnaplinePos()
    const layerSnapInfo = this.getLayerSnappingEdges(layer)
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
    ControlUtils.updateLayerPos(this.pageIndex, layerIndex, snapResult.x, snapResult.y)
    return offset
  }

  calcScaleSnap(layer: ITmp | IGroup | IShape | IText | IImage, layerIndex: number): { x: number, y: number, width: number, height: number } {
    const snaplinePos = this.getSnaplinePos()
    const layerSnapInfo = this.getLayerSnappingEdges(layer)
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
      y: 0,
      width: 0,
      height: 0
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
    ControlUtils.updateLayerPos(this.pageIndex, layerIndex, snapResult.x, snapResult.y)
    return offset
  }

  clear(): void {
    this.closestSnaplines.v = []
    this.closestSnaplines.h = []
  }
}

export default SnapUtils
