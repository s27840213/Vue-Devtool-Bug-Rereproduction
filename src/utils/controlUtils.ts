import store from '@/store'
import { ICoordinate } from '@/interfaces/frame'
import { ILayer, IParagraph, IParagraphStyle, IShape, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { stringToArray } from 'konva/types/shapes/Text'
import { SidebarPanelType } from '@/store/types'

class Controller {
  get pageIndex(): number { return store.getters.getLastSelectedPageIndex }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IText { return store.getters.getLayer(this.pageIndex, this.layerIndex) }

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
    const scaleRatio = store.getters.getPageScaleRatio
    return {
      scalers: [
        {
          width: '8px',
          height: '8px',
          left: '0',
          top: '0',
          transform: `translate3d(-50%,-50%,0) scale(${100 / scaleRatio})`,
          borderRadius: '50%'
        },
        {
          width: '8px',
          height: '8px',
          transform: `translate3d(50%,-50%,0) scale(${100 / scaleRatio})`,
          right: '0',
          top: '0',
          borderRadius: '50%'
        },
        {
          width: '8px',
          height: '8px',
          transform: `translate3d(50%,50%,0) scale(${100 / scaleRatio})`,
          right: '0',
          bottom: '0',
          borderRadius: '50%'
        },
        {
          width: '8px',
          height: '8px',
          transform: `translate3d(-50%,50%,0) scale(${100 / scaleRatio})`,
          left: '0',
          bottom: '0',
          borderRadius: '50%'
        }
      ],
      resizers: [
        {
          height: `${resizerLong}px`,
          width: `${resizerShort}px`,
          left: `${-resizerShort - 1.5}px`,
          transform: 'translate(0, -50%)'
        },
        {
          height: `${resizerLong}px`,
          width: `${resizerShort}px`,
          right: `${-resizerShort - 1.5}px`,
          transform: 'translate(0, -50%)'
        },
        {
          width: `${resizerLong}px`,
          height: `${resizerShort}px`,
          bottom: `${-resizerShort - 1.5}px`,
          transform: 'translate(-50%, 0)'
        },
        {
          width: `${resizerLong}px`,
          height: `${resizerShort}px`,
          top: `${-resizerShort - 1.5}px`,
          transform: 'translate(-50%, 0)'
        }
      ],
      cursors: [
        'nwse-resize',
        'ew-resize',
        'nesw-resize',
        'ew-resize',
        'nwse-resize',
        'ns-resize',
        'nesw-resize',
        'ns-resize'
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
    //  If it's in horizontal direction, return true
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

  shapeCategorySorter(resizers: any, category: string, scaleType: number) {
    switch (category) {
      // category: A => 只能被等比例縮放
      case 'A':
        return []
      // category: B => 等比例/非等比例縮放
      // category: C => 可被等比例縮放，也可沿着水平/垂直方向伸縮，伸縮時四個角落的形狀固定不變
      case 'B':
      case 'C':
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
        console.log('shape of category A should not have resizer!')
        break
      }
      case 'B': {
        let scaleX = scale.scaleX
        let scaleY = scale.scaleY
        scaleX = width / initHW.width === 1 ? scaleX : width / initHW.width * scaleX
        scaleY = height / initHW.height === 1 ? scaleY : height / initHW.height * scaleY
        this.updateLayerScale(this.pageIndex, this.layerIndex, scaleX, scaleY)
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
        this.updateShapePatchDiff(this.pageIndex, this.layerIndex, [patchDiffX, patchDiffY])
        this.updateLayerInitSize(this.pageIndex, this.layerIndex, width / scale, height / scale, scale)
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
}

export default new Controller()
