
import store from '@/store'
import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import MathUtils from '@/utils/mathUtils'

const GUIDELINE_OFFSET = 5

class SnapUtils {
  pageIndex: number
  constructor(pageIndex: number) {
    this.pageIndex = pageIndex
  }

  getSnaplinePos(): { v: Array<number>, h: Array<number> } {
    const page = store.getters.getPages[this.pageIndex] as IPage
    const v: number[] = [0, page.width / 2, page.width]
    const h: number[] = [0, page.height / 2, page.height]
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

  // what points of the object will trigger to snapping?
  // it can be just center of the object
  // but we will enable all edges and center
  getObjectSnappingEdges(layer: IShape | IText | IImage | IGroup | ITmp): any {
    const box = MathUtils.getBounding(layer.styles.rotate, MathUtils.getCenter(layer.styles), {
      x: layer.styles.x,
      y: layer.styles.y,
      width: layer.styles.width,
      height: layer.styles.height
    })
    const absPos = {
      x: layer.styles.x,
      y: layer.styles.y,
      width: layer.styles.width,
      height: layer.styles.height
    }

    return {
      v: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snapTo: 'start'
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snapTo: 'center'
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snapTo: 'end'
        }
      ],
      h: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snapTo: 'start'
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snapTo: 'center'
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snapTo: 'end'
        }
      ]
    }
  }

  // find all snapping possibilities
  getPossibleSnaplines(snaplines: any, layerSnappingInfos: any): any {
    const resultV: any = []
    const resultH: any = []
    snaplines.v.forEach((lineGuide: any) => {
      layerSnappingInfos.v.forEach((layerSnappingInfo: any) => {
        const diff = Math.abs(lineGuide - layerSnappingInfo.guide)
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snapTo: layerSnappingInfo.snapTo,
            offset: layerSnappingInfo.offset
          })
        }
      })
    })

    snaplines.h.forEach((lineGuide: any) => {
      layerSnappingInfos.h.forEach((layerSnappingInfo: any) => {
        const diff = Math.abs(lineGuide - layerSnappingInfo.guide)
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snapTo: layerSnappingInfo.snapTo,
            offset: layerSnappingInfo.offset
          })
        }
      })
    })

    const possibleSnaplinesV = []
    const possibleSnaplinesH = []

    // find closest snap
    const minV = resultV.sort((a: any, b: any) => a.diff - b.diff)[0]
    const minH = resultH.sort((a: any, b: any) => a.diff - b.diff)[0]
    if (minV) {
      possibleSnaplinesV.push({
        pos: minV.lineGuide,
        offset: minV.offset,
        orientation: 'V',
        snapTo: minV.snapTo
      })
    }
    if (minH) {
      possibleSnaplinesH.push({
        pos: minH.lineGuide,
        offset: minH.offset,
        orientation: 'H',
        snapTo: minH.snapTo
      })
    }
    return {
      v: possibleSnaplinesV,
      h: possibleSnaplinesH
    }
  }
}

export default SnapUtils
