import store from '@/store'
import { v4 as uuidv4 } from 'uuid'
import { ICoordinate } from '@/interfaces/frame'
import { ILayer, IParagraph, IParagraphStyle, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { stringToArray } from 'konva/types/shapes/Text'
import { SidebarPanelType } from '@/store/types'

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
    const scaleRatio = store.getters.getPageScaleRatio
    return {
      scalers: [
        {
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          left: '0',
          top: '0',
          transform: 'translate3d(-50%,-50%,0)',
          borderRadius: '50%'
        },
        {
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          transform: 'translate3d(50%,-50%,0)',
          right: '0',
          top: '0',
          borderRadius: '50%'
        },
        {
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          transform: 'translate3d(50%,50%,0)',
          right: '0',
          bottom: '0',
          borderRadius: '50%'
        },
        {
          width: `${10 * (100 / scaleRatio)}px`,
          height: `${10 * (100 / scaleRatio)}px`,
          transform: 'translate3d(-50%,50%,0)',
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

  textStopPropagation(e: KeyboardEvent) {
    if (e.key === 'Backspace' || e.key === ' ') {
      e.stopPropagation()
    }
  }

  onTyping(mutations: MutationRecord[], observer: MutationObserver) {
    observer.disconnect()
    const pageIndex = store.state.lastSelectedPageIndex
    const layerIndex = store.getters.getCurrSelectedIndex
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.target.nodeName === 'DIV') {
        const paragraphs: IParagraph[] = []
        const text = mutation.target as HTMLElement
        const ps = text.childNodes
        const scale = store.getters.getLayer(pageIndex, layerIndex).styles.scale
        ps.forEach((p) => {
          const spans: ISpan[] = []
          p.childNodes.forEach((span) => {
            const spanEl = span as HTMLElement
            // console.log(spanEl.style.color.substring(0, spanEl.style.color.length - 3))
            const spanStyle = {
              font: spanEl.style.fontFamily,
              weight: spanEl.style.fontWeight,
              size: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
              initSize: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
              decoration: spanEl.style.textDecorationLine,
              style: spanEl.style.fontStyle,
              color: spanEl.style.color,
              opacity: parseInt(spanEl.style.opacity)
            } as ISpanStyle
            const text = spanEl.innerText as string
            if (text !== '') {
              spans.push({ text: text, styles: spanStyle, id: uuidv4() })
            }
          })
          const pEl = p as HTMLElement
          const pStyle: IParagraphStyle = { lineHeight: 0, fontSpacing: 0, align: 'left' }
          pStyle.lineHeight = parseInt(pEl.style.lineHeight.replace(/px/, ''))
          pStyle.fontSpacing = parseInt(pEl.style.letterSpacing)
          pStyle.align = pEl.style.textAlign
          if (spans.length !== 0) {
            paragraphs.push({ styles: pStyle, spans: spans, id: uuidv4() })
          }
        })
        console.log(paragraphs)
        text.style.width = 'initial'
        text.style.height = 'initial'
        const textHW = {
          width: Math.ceil(text.getBoundingClientRect().width),
          height: Math.ceil(text.getBoundingClientRect().height)
        }
        let pIndex = -1
        const removedP = []
        for (const p of text.childNodes) {
          const pEl = p as HTMLElement
          if (parseInt(pEl.dataset.pindex as string) === pIndex) {
            // text.removeChild(p)
            removedP.push(p)
            // break
          } else {
            pIndex = parseInt(pEl.dataset.pindex as string)
          }
        }
        removedP.forEach(p => {
          text.removeChild(p)
        })
        store.commit('UPDATE_layerStyles', {
          pageIndex,
          layerIndex,
          styles: {
            width: textHW.width,
            height: textHW.height,
            scale
          }
        })
        store.commit('UPDATE_layerStyles', {
          pageIndex,
          layerIndex,
          styles: {
            initWidth: Math.ceil(textHW.width / scale),
            initHeight: Math.ceil(textHW.height / scale),
            initSize: store.getters.getLayer(pageIndex, layerIndex).styles.initSize
          }
        })
        if (paragraphs.length !== 0) {
          store.commit('UPDATE_textProps', {
            pageIndex,
            layerIndex,
            paragraphs
          })
        }
      } else if (mutation.type === 'characterData' || mutation.type === 'childList') {
        const paragraphs: IParagraph[] = []
        let text = mutation.target as HTMLElement
        while (text.nodeName !== 'DIV' && text.parentElement) {
          text = text.parentElement
        }
        const ps = text.childNodes
        const scale = store.getters.getLayer(pageIndex, layerIndex).styles.scale
        ps.forEach((p) => {
          const spans: ISpan[] = []
          for (const span of p.childNodes) {
            if (span instanceof HTMLElement) {
              // console.log(spanEl.style.color.substring(0, spanEl.style.color.length - 3))
              const spanEl = span as HTMLElement
              const text = spanEl.innerText as string
              if (text === '') {
                continue
              }
              const spanStyle = {
                font: spanEl.style.fontFamily,
                weight: spanEl.style.fontWeight,
                size: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
                initSize: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
                decoration: spanEl.style.textDecorationLine,
                style: spanEl.style.fontStyle,
                color: spanEl.style.color,
                opacity: parseInt(spanEl.style.opacity)
              } as ISpanStyle
              spans.push({ text: text, styles: spanStyle, id: uuidv4() })
            }
          }
          const pEl = p as HTMLElement
          const pStyle: IParagraphStyle = { lineHeight: 0, fontSpacing: 0, align: 'left' }
          pStyle.lineHeight = parseInt(pEl.style.lineHeight.replace(/px/, ''))
          pStyle.fontSpacing = parseInt(pEl.style.letterSpacing)
          pStyle.align = pEl.style.textAlign
          paragraphs.push({ styles: pStyle, spans: spans, id: uuidv4() })
        })
        text.style.width = 'initial'
        text.style.height = 'initial'
        const textHW = {
          width: Math.ceil(text.getBoundingClientRect().width),
          height: Math.ceil(text.getBoundingClientRect().height)
        }
        store.commit('UPDATE_layerStyles', {
          pageIndex,
          layerIndex,
          styles: {
            width: textHW.width,
            height: textHW.height,
            scale
          }
        })
        store.commit('UPDATE_layerStyles', {
          pageIndex,
          layerIndex,
          styles: {
            initWidth: Math.ceil(textHW.width / scale),
            initHeight: Math.ceil(textHW.height / scale),
            initSize: store.getters.getLayer(pageIndex, layerIndex).styles.initSize
          }
        })
        store.commit('UPDATE_textProps', {
          pageIndex,
          layerIndex,
          paragraphs
        })
      }
    }
  }

  getSpanLength(text: IText, pIndex: number): number {
    return text.paragraphs[pIndex].spans.length <= 0 ? 1 : text.paragraphs[pIndex].spans.length
  }

  getLayer(pageIndex: number, layerIndex: number): ILayer | IText {
    return store.getters.getLayer(pageIndex, layerIndex)
  }

  shapeCategorySorter(resizer: any, category: number) {
    switch (category) {
      // category: 0 => 線條，可以修改顏色，線條粗細，線條樣式，端點樣式
      case 0:
        return []
      // category: 1 => 形狀，可以修改顏色，以及等比例/非等比例縮放
      case 1:
        return resizer
      // category: 2 => 複雜內容，可以修改顏色，以及等比例縮放
      case 2:
        return []
    }
  }

  updateTextProp(pageIndex: number, layerIndex: number, paragraphs: IParagraph[]) {
    store.commit('UPDATE_textProps', {
      pageIndex,
      layerIndex,
      paragraphs
    })
  }

  updateTextProps(pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean | null }) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props
    })
  }

  updateTextContent(pageIndex: number, layerIndex: number, pIndex: number, sIndex: number, text: string) {
    store.commit('UPDATE_textContent', {
      pageIndex, layerIndex, pIndex, sIndex, text
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

  updateImgClipPath(pageIndex: number, layerIndex: number, clipPath: string) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props: {
        clipPath
      }
    })
  }
}

export default new Controller()
