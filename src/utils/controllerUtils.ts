import store from '@/store'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import { ICoordinate } from '@/interfaces/frame'

class Controller {
  getLength(vect: ICoordinate): number {
    const sqareSum = Math.pow(vect.x, 2) + Math.pow(vect.y, 2)
    return Math.sqrt(sqareSum)
  }

  // Get relative position to the center as no-rotation happens
  getRelPosToCenter(vectClient: ICoordinate, center: ICoordinate, rotation: number): ICoordinate {
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
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          left: '0',
          top: '0',
          transform: 'translate3d(-50%,-50%,0)',
          borderRadius: '50%',
          cursor: 'nwse-resize'
        },
        {
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          transform: 'translate3d(50%,-50%,0)',
          right: '0',
          top: '0',
          borderRadius: '50%',
          cursor: 'nesw-resize'
        },
        {
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          transform: 'translate3d(50%,50%,0)',
          right: '0',
          bottom: '0',
          borderRadius: '50%',
          cursor: 'ns-resize'
        },
        {
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          transform: 'translate3d(-50%,50%,0)',
          left: '0',
          bottom: '0',
          borderRadius: '50%',
          cursor: 'nesw-resize'
        }
      ],
      resizers: [
        {
          width: `${resizerLong}px`,
          height: `${resizerShort}px`,
          top: `${-resizerShort - 1.5}px`,
          transform: 'translate(-50%, 0)',
          cursor: 'ew-resize'
        },
        {
          height: `${resizerLong}px`,
          width: `${resizerShort}px`,
          right: `${-resizerShort - 1.5}px`,
          transform: 'translate(0, -50%)',
          cursor: 'ew-resize'
        },
        {
          width: `${resizerLong}px`,
          height: `${resizerShort}px`,
          bottom: `${-resizerShort - 1.5}px`,
          transform: 'translate(-50%, 0)',
          cursor: 'nwse-resize'
        },
        {
          height: `${resizerLong}px`,
          width: `${resizerShort}px`,
          left: `${-resizerShort - 1.5}px`,
          transform: 'translate(0, -50%)',
          cursor: 'nwse-resize'
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

  textBackspace(e: KeyboardEvent) {
    if (e.key !== 'Backspace') return
    e.stopPropagation()
  }

  textEnter(e: KeyboardEvent, content: HTMLElement, isCompositioning: boolean) {
    if (e.key !== 'Enter' || isCompositioning) return
    e.preventDefault()

    const docFragment = document.createDocumentFragment()
    const br = document.createElement('br')
    docFragment.appendChild(br)

    let range = window.getSelection()?.getRangeAt(0)
    if (range) {
      range.deleteContents()
      range.insertNode(docFragment)
    }

    range = document.createRange()
    range.setStartAfter(br)
    range.collapse(true)

    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }

    if (content.lastChild?.nodeName !== 'BR') {
      const br = document.createElement('br') as HTMLBRElement
      content.appendChild(br)
    }
  }

  updateTextProps(pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean | null }) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props
    })
  }

  toggleTextEditable(pageIndex: number, layerIndex: number, isEditable: boolean) {
    const props = {
      textEditable: isEditable
    }
    this.updateTextProps(pageIndex, layerIndex, props)
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

  updateImgPos(pageIndex: number, layerIndex: number, imgX: number, imgY: number, imgController: ICoordinate) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        imgX,
        imgY,
        imgController
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

  updateImgControl(pageIndex: number, layerIndex: number, imgControl: boolean) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        imgControl
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

  updateFontSize(pageIndex: number, layerIndex: number, size: number) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        size
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

  // TODO: change the viewBox so as the path to accomplish the shape's size changing
  updateShapeProps(pageIndex: number, layerIndex: number, viewBox: number[], path: string) {
    console.log(viewBox)
    console.log(path)
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        viewBox,
        path
      }
    })
  }
}

export default new Controller()
