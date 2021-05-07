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

  getTranslateCompensation(initData: { xSign: number, ySign: number, x: number, y: number, angle: number},
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

  textEnter(e: KeyboardEvent, content: HTMLElement) {
    if (e.key !== 'Enter') return
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
    store.commit('Update_layerProps', {
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
    store.commit('Update_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        x,
        y
      }
    })
  }

  updateLayerSize(pageIndex: number, layerIndex: number, width: number, height: number, scale: number) {
    store.commit('Update_layerStyles', {
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
    store.commit('Update_layerStyles', {
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
    store.commit('Update_layerStyles', {
      pageIndex,
      layerIndex,
      styles: {
        size
      }
    })
  }

  updateLayerRotate(pageIndex: number, layerIndex: number, rotate: number) {
    store.commit('Update_layerStyles', {
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
    store.commit('Update_layerProps', {
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
