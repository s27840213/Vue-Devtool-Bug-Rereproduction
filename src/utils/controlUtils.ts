import store from '@/store'
import { ICoordinate } from '@/interfaces/frame'
import { IShape } from '@/interfaces/layer'
import shapeUtils from '@/utils/shapeUtils'
import generalUtils from '@/utils/generalUtils'
import layerUtils from './layerUtils'
import editorUtils from './editorUtils'
class Controller {
  getLength(vect: ICoordinate): number {
    const sqareSum = Math.pow(vect.x, 2) + Math.pow(vect.y, 2)
    return Math.sqrt(sqareSum)
  }

  // Get position as no-rotation happens
  getNoRotationPos(vectClient: ICoordinate, center: ICoordinate, rotation: number): ICoordinate {
    return {
      x: vectClient.x * Math.cos(-rotation) - vectClient.y * Math.sin(-rotation) + center.x,
      y: vectClient.y * Math.cos(-rotation) + vectClient.x * Math.sin(-rotation) + center.y
    }
  }

  getRectCenter(rect: DOMRect): ICoordinate {
    return {
      x: rect.left + rect.width / 2 - window.pageXOffset,
      y: rect.top + rect.height / 2 - window.pageYOffset
    }
  }

  getControlPoints = (resizerShort: number, resizerLong: number) => {
    const contentScaleRatio = editorUtils.contentScaleRatio
    const scaleRatio = store.getters.getPageScaleRatio
    const isMobile = generalUtils.isTouchDevice()
    const scalerSize = isMobile ? 12 : 8

    const getScalers = (scalerSize: number, cursors?: Array<number | string>) => [
      {
        cursor: cursors?.[0] ?? 0,
        styles: {
          width: `${scalerSize}px`,
          height: `${scalerSize}px`,
          left: '0',
          top: '0',
          // transform: 'translate3d(-50%,-50%,0)',
          transform: `translate3d(-50%,-50%,0) scale(${100 / scaleRatio * contentScaleRatio})`,
          borderRadius: '50%'
          // background: cursors?.[0] ? 'red' : 'yellow'
        },
        scalerSize
      },
      {
        cursor: cursors?.[1] ?? 2,
        styles: {
          width: `${scalerSize}px`,
          height: `${scalerSize}px`,
          // transform: 'translate3d(50%,-50%,0)',
          transform: `translate3d(50%,-50%,0) scale(${100 / scaleRatio * contentScaleRatio})`,
          right: '0',
          top: '0',
          borderRadius: '50%'
          // background: cursors?.[1] ? 'red' : 'yellow'
        },
        scalerSize
      },
      {
        cursor: cursors?.[2] ?? 4,
        styles: {
          width: `${scalerSize}px`,
          height: `${scalerSize}px`,
          // transform: 'translate3d(50%,50%,0)',
          transform: `translate3d(50%,50%,0) scale(${100 / scaleRatio * contentScaleRatio})`,
          right: '0',
          bottom: '0',
          borderRadius: '50%'
          // background: cursors?.[2] ? 'red' : 'yellow'
        },
        scalerSize
      },
      {
        cursor: cursors?.[3] ?? 6,
        styles: {
          width: `${scalerSize}px`,
          height: `${scalerSize}px`,
          transform: `translate3d(-50%,50%,0) scale(${100 / scaleRatio * contentScaleRatio})`,
          // transform: 'translate3d(-50%,50%,0)',
          left: '0',
          bottom: '0',
          borderRadius: '50%'
          // background: cursors?.[3] ? 'red' : 'yellow'
        },
        scalerSize
      }
    ]
    // const topleft = 'url(/src/assets/icon/control/corner-rotate-1.png), auto'
    const topleft = 'url("data:image/png;base64, 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") 5 5, auto'
    const toprigth = 'url("data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACxSURBVHgBpZKxDcIwEEU/mIYONjATQEmZERiBEdiAERgBNojo6EJLxQiMgEs6+OcciYtIycVPerroJH+d4wNaFtTDiEsOV3RO7zDgksOePuhagwL99AVMk++gdUWP9E3PGHgtmeJJD0nP0z19aeCgEN/Rl16p02RxoSdkIBPKdXbIoNCQLCoNijjYWdItvWEkG9RPHpnBhvzIoDU6gY1SAwqtVxj5b+wX9V6MQkKa1f4BP0UcAyzyhY8AAAAASUVORK5CYII=") 10 5, auto'
    const bottomleft = 'url("data:image/png;base64, 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") 5 10, auto'
    const bottomright = 'url("data:image/png;base64, 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") 10 10, auto'
    const cornerRatateCursor = [topleft, toprigth, bottomright, bottomleft]
    return {
      scalers: getScalers(scalerSize),
      cornerRotaters: getScalers(scalerSize * 4, cornerRatateCursor),
      lineEnds: [
        {
          width: `${scalerSize}px`,
          height: `${scalerSize}px`,
          left: '0',
          top: '50%',
          transform: `translate3d(-50%,-50%,0) scale(${100 / scaleRatio * contentScaleRatio})`,
          borderRadius: '50%'
        },
        {
          width: `${scalerSize}px`,
          height: `${scalerSize}px`,
          transform: `translate3d(50%,-50%,0) scale(${100 / scaleRatio * contentScaleRatio})`,
          right: '0',
          top: '50%',
          borderRadius: '50%'
        }
      ],
      resizers: [
        {
          type: 'H',
          cursor: 7,
          styles: {
            height: `${resizerLong}px`,
            width: `${resizerShort}px`,
            left: '0',
            transform: `translate(-50%, -50%) scale(${contentScaleRatio})`
          }
        },
        {
          type: 'H',
          cursor: 3,
          styles: {
            height: `${resizerLong}px`,
            width: `${resizerShort}px`,
            right: '0',
            transform: `translate(50%, -50%) scale(${contentScaleRatio})`
          }
        },
        {
          type: 'V',
          cursor: 5,
          styles: {
            width: `${resizerLong}px`,
            height: `${resizerShort}px`,
            bottom: '0',
            transform: `translate(-50%, 50%) scale(${contentScaleRatio})`
          }
        },
        {
          type: 'V',
          cursor: 1,
          styles: {
            width: `${resizerLong}px`,
            height: `${resizerShort}px`,
            top: '0',
            transform: `translate(-50%, -50%) scale(${contentScaleRatio})`
          }
        }
      ],
      cursors: [
        'nwse-resize',
        'ns-resize',
        'nesw-resize',
        'ew-resize',
        'nwse-resize',
        'ns-resize',
        'nesw-resize',
        'ew-resize'
      ]
    }
  }

  dirHandler(clientP: ICoordinate, rect: DOMRect): boolean {
    const center: ICoordinate = this.getRectCenter(rect)
    const H = {
      left: center.x - rect.width / 2,
      right: center.x + rect.width / 2
    }
    const V = {
      top: center.y - rect.height / 2,
      bottom: center.y + rect.height / 2
    }
    const xmin = Math.min(Math.abs(clientP.x - H.left), Math.abs(clientP.x - H.right))
    const ymin = Math.min(Math.abs(clientP.y - V.top), Math.abs(clientP.y - V.bottom))
    /**  If it's in horizontal direction, return true
     *  */
    return xmin < ymin
  }

  getTranslateCompensation(initData: { xSign: number, ySign: number, x: number, y: number, angle: number },
    sizeOffset: { width: number, height: number }): ICoordinate {
    return {
      x: -sizeOffset.width / 2 + initData.xSign * (sizeOffset.width / 2) * Math.cos(initData.angle) -
        initData.ySign * (sizeOffset.height / 2) * Math.sin(initData.angle) + initData.x,
      y: -sizeOffset.height / 2 + initData.xSign * (sizeOffset.width / 2) * Math.sin(initData.angle) +
        initData.ySign * (sizeOffset.height / 2) * Math.cos(initData.angle) + initData.y
    }
  }

  getAbsPointByQuadrant(point: number[], styles: { x: number, y: number, width: number, initWidth: number }, scale: number, quadrant: number): ICoordinate {
    const { width, height, baseDegree } = shapeUtils.lineDimension(point)
    const dx = 2 * scale * Math.sin(baseDegree)
    const dy = 2 * scale * Math.cos(baseDegree)
    const ratio = styles.width / styles.initWidth
    switch (quadrant) {
      case 1:
        return { x: styles.x + dx * ratio, y: styles.y + (dy + height) * ratio }
      case 2:
        return { x: styles.x + (dx + width) * ratio, y: styles.y + (dy + height) * ratio }
      case 3:
        return { x: styles.x + (dx + width) * ratio, y: styles.y + dy * ratio }
      case 4:
        return { x: styles.x + dx * ratio, y: styles.y + dy * ratio }
      default:
        return { x: styles.x + dx * ratio, y: styles.y + dy * ratio }
    }
  }

  getAbsPointWithRespectToReferencePoint(referencePoint: ICoordinate, point: number[], styles: { width: number, initWidth: number }, scale: number, quadrant: number): ICoordinate {
    const { width, height, baseDegree } = shapeUtils.lineDimension(point)
    const dx = 2 * scale * Math.sin(baseDegree)
    const dy = 2 * scale * Math.cos(baseDegree)
    const ratio = styles.width / styles.initWidth
    switch (quadrant) {
      case 1:
        return { x: referencePoint.x - dx * ratio, y: referencePoint.y - (dy + height) * ratio }
      case 2:
        return { x: referencePoint.x - (dx + width) * ratio, y: referencePoint.y - (dy + height) * ratio }
      case 3:
        return { x: referencePoint.x - (dx + width) * ratio, y: referencePoint.y - dy * ratio }
      case 4:
        return { x: referencePoint.x - dx * ratio, y: referencePoint.y - dy * ratio }
      default:
        return { x: referencePoint.x - dx * ratio, y: referencePoint.y - dy * ratio }
    }
  }

  getTranslateCompensationForLine(markerIndex: number, referencePoint: ICoordinate, styles: { width: number, initWidth: number }, scale: number, newPoint: number[]): ICoordinate {
    const newNormalQuadrant = shapeUtils.getLineQuadrant(newPoint)
    const newQuadrantByMarkerIndex = (markerIndex === 0) ? (newNormalQuadrant - 1 + 2) % 4 + 1 : newNormalQuadrant
    // If the startMarker is dragged, take the symmetric version (w.r.t. the origin) of the quadrant
    return this.getAbsPointWithRespectToReferencePoint(referencePoint, newPoint, styles, scale, newQuadrantByMarkerIndex)
  }

  getControllerStyleParameters(point: number[], styles: { x: number, y: number, width: number, height: number, initWidth: number, rotate: number }, isLine: boolean, scale: number): { x: number, y: number, width: number, height: number, rotate: number } {
    if (isLine) {
      scale = scale ?? 1
      const { x, y, width, height } = styles
      const ratio = styles.width / styles.initWidth
      const moverHeight = Math.max(scale, generalUtils.fixSize(16)) * ratio
      const { xDiff, yDiff } = shapeUtils.lineDimension(point)
      const moverWidth = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) * ratio
      const degree = Math.atan2(yDiff, xDiff) / Math.PI * 180
      return {
        x: x + (width - moverWidth) / 2,
        y: y + (height - moverHeight) / 2,
        width: moverWidth,
        height: moverHeight,
        rotate: degree
      }
    } else {
      return styles
    }
  }

  getMarkerIndex(control: { xSign: number, ySign: number }, quadrant: number) {
    if ([2, 3].includes(quadrant)) {
      return (1 - control.xSign) / 2 // -1 => 1, 1 => 0
    } else {
      return (control.xSign + 1) / 2 // -1 => 0, 1 => 1
    }
  }

  getCorRadPercentage(vSize: number[], size: number[], shapeType: string): number {
    const maxCorRad = shapeUtils.getMaxCorRad(shapeType, vSize)
    return size[1] * 100 / maxCorRad
  }

  getCorRadValue(vSize: number[], percentage: number, shapeType: string): number {
    const maxCorRad = shapeUtils.getMaxCorRad(shapeType, vSize)
    return percentage * maxCorRad / 100
  }

  shapeCategorySorter(resizers: any, category: string, scaleType: number) {
    switch (category) {
      // category: A => 只能被等比例縮放
      case 'A':
        return []
      // category: B => 等比例/非等比例縮放
      // category: C => 可被等比例縮放，也可沿着水平/垂直方向伸縮，伸縮時四個角落的形狀固定不變
      case 'B':
      case 'C':
      case 'E':
      case 'G':
        switch (scaleType) {
          case 1:
            return resizers
          case 2:
            return resizers.slice(0, 2)
          case 3:
            return resizers.slice(2, 4)
        }
        return []
    }
  }

  resizeShapeHandler(config: IShape, scale: { scaleX: number, scaleY: number }, initHW: { width: number, height: number }, width: number, height: number): [number, number] {
    const SIZE_LIMIT = 30
    switch (config.category) {
      case 'A': {
        console.warn('shape of category A should not have resizer!')
        break
      }
      case 'B': {
        let scaleX = scale.scaleX
        let scaleY = scale.scaleY
        scaleX = width / initHW.width === 1 ? scaleX : width / initHW.width * scaleX
        scaleY = height / initHW.height === 1 ? scaleY : height / initHW.height * scaleY
        this.updateLayerScale(layerUtils.pageIndex, layerUtils.layerIndex, scaleX, scaleY)
        break
      }
      case 'C': {
        const scale = config.styles.scale
        let patchDiffX = width * config.ratio / scale - config.vSize[0]
        let patchDiffY = height * config.ratio / scale - config.vSize[1]
        const pSize = config.pSize
        switch (config.scaleType) {
          case 1:
            if (pSize && (pSize[0] + patchDiffX < SIZE_LIMIT || pSize[1] + patchDiffY < SIZE_LIMIT)) {
              patchDiffX = pSize[0] + patchDiffX < SIZE_LIMIT ? SIZE_LIMIT - pSize[0] : patchDiffX
              patchDiffY = pSize[1] + patchDiffY < SIZE_LIMIT ? SIZE_LIMIT - pSize[1] : patchDiffY
              width = patchDiffX === SIZE_LIMIT - pSize[0] ? (patchDiffX + config.vSize[0]) * scale / config.ratio : width
              height = patchDiffY === SIZE_LIMIT - pSize[1] ? (patchDiffY + config.vSize[1]) * scale / config.ratio : height
            }
            break
          case 2:
            if (pSize && pSize[0] + patchDiffX < SIZE_LIMIT) {
              patchDiffX = pSize[0] + patchDiffX < SIZE_LIMIT ? SIZE_LIMIT - pSize[0] : patchDiffX
              width = patchDiffX === SIZE_LIMIT - pSize[0] ? (patchDiffX + config.vSize[0]) * scale / config.ratio : width
            }
            break
          case 3:
            if (pSize && pSize[1] + patchDiffY < SIZE_LIMIT) {
              patchDiffY = pSize[1] + patchDiffY < SIZE_LIMIT ? SIZE_LIMIT - pSize[1] : patchDiffY
              height = patchDiffY === SIZE_LIMIT - pSize[1] ? (patchDiffY + config.vSize[1]) * scale / config.ratio : height
            }
        }
        this.updateShapePatchDiff(layerUtils.pageIndex, layerUtils.layerIndex, [patchDiffX, patchDiffY])
        this.updateLayerInitSize(layerUtils.pageIndex, layerUtils.layerIndex, width / scale, height / scale, scale)
        break
      }
      case 'G': {
        const scale = config.styles.scale
        let patchDiffX = width * config.ratio / scale - config.vSize[0]
        let patchDiffY = height * config.ratio / scale - config.vSize[1]
        const pDiff = config.pDiff
        switch (config.scaleType) {
          case 1:
            if (pDiff) {
              patchDiffX = Math.max(patchDiffX, config.pDiffLimits?.[0] ?? 0)
              patchDiffY = Math.max(patchDiffY, config.pDiffLimits?.[1] ?? 0)
              width = (patchDiffX + config.vSize[0]) * scale / config.ratio
              height = (patchDiffY + config.vSize[1]) * scale / config.ratio
            }
            break
          case 2:
            if (pDiff) {
              patchDiffX = Math.max(patchDiffX, config.pDiffLimits?.[0] ?? 0)
              width = (patchDiffX + config.vSize[0]) * scale / config.ratio
            }
            break
          case 3:
            if (pDiff) {
              patchDiffY = Math.max(patchDiffY, config.pDiffLimits?.[1] ?? 0)
              height = (patchDiffY + config.vSize[1]) * scale / config.ratio
            }
        }
        this.updateShapePatchDiff(layerUtils.pageIndex, layerUtils.layerIndex, [patchDiffX, patchDiffY])
        this.updateLayerInitSize(layerUtils.pageIndex, layerUtils.layerIndex, width / scale, height / scale, scale)
        break
      }
    }
    return [width, height]
  }

  updateImgPos(pageIndex: number, layerIndex: number, imgX: number, imgY: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        imgX,
        imgY
      }
    })
  }

  updateImgSize(pageIndex: number, layerIndex: number, imgWidth: number, imgHeight: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        imgWidth,
        imgHeight
      }
    })
  }

  updateLayerProps(pageIndex: number, layerIndex: number, props: { [key: string]: number | string | boolean }) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props
    })
  }

  updateLayerPos(pageIndex: number, layerIndex: number, x: number, y: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        x,
        y
      }
    })
  }

  updateLayerSize(pageIndex: number, layerIndex: number, width: number, height: number, scale: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        width,
        height,
        scale
      }
    })
  }

  updateLayerScale(pageIndex: number, layerIndex: number, scaleX: number, scaleY: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        scaleX,
        scaleY
      }
    })
  }

  updateLayerRotate(pageIndex: number, layerIndex: number, rotate: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        rotate
      }
    })
  }

  updateLayerInitSize(pageIndex: number, layerIndex: number, initWidth: number, initHeight: number, initSize: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        initWidth,
        initHeight,
        initSize
      }
    })
  }

  updateImgClipPath(pageIndex: number, layerIndex: number, clipPath: string) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        clipPath
      }
    })
  }

  updateShapePatchDiff(pageIndex: number, layerIndex: number, pDiff: number[]) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        pDiff
      }
    })
  }

  updateShapeLinePoint(pageIndex: number, layerIndex: number, point: number[]) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        point
      }
    })
  }

  updateShapeVSize(pageIndex: number, layerIndex: number, vSize: number[]) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        vSize
      }
    })
  }

  updateShapeCorRad(pageIndex: number, layerIndex: number, size: number[], corRad: number) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        size: [size[0], corRad]
      }
    })
  }
}

export default new Controller()
