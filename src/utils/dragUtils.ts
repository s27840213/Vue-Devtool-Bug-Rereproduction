/* eslint-disable indent */
import { IImage, IImageStyle, IShape } from '@/interfaces/layer'
import store from '@/store'
import assetUtils from './assetUtils'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import mouseUtils from './mouseUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'

class DragUtils {
  /**
   *
   * @param payload The core data of dragItem, e.g. srcObj for image, designId for svg.
   * @param attrs offsetX/offsetY for dragImg's offset, width/height for dropped layer size
   */
  itemDragStart(e: DragEvent, type: string, payload: Partial<IImage | IShape>, attrs: { [key: string]: string | number } = {}) {
    let { offsetX = 10, offsetY = 15, width, height } = attrs
    const scaleRatio = store.getters.getPageScaleRatio
    const { width: rowWidth, height: rowHeight, x, y } = (e.target as Element).getBoundingClientRect()

    const iconImg = new Image()
    iconImg.src = (e.target as HTMLImageElement).src
    let { width: iconWidth, height: iconHeight } = iconImg
    iconWidth > iconHeight ? ((iconHeight *= rowWidth / iconWidth) && (iconWidth = rowWidth))
      : ((iconWidth *= rowHeight / iconHeight) && (iconHeight = rowHeight))

    if (typeof width === 'undefined' || typeof height === 'undefined') {
      const currentPage = store.getters.getPage(layerUtils.pageIndex)
      const pageAspectRatio = currentPage.width / currentPage.height
      const aspectRatio = iconWidth / iconHeight
      const resizeRatio = attrs.resizeRatio && typeof attrs.resizeRatio === 'number' ? attrs.resizeRatio : 0.5
      width = aspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * aspectRatio
      height = aspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / aspectRatio : currentPage.height * resizeRatio
    }

    const data = {
      type,
      styles: {
        x: (e.clientX - x) * (scaleRatio / 100),
        y: (e.clientY - y) * (scaleRatio / 100),
        width,
        height
      },
      ...payload
    }
    const dataTransfer = e.dataTransfer as DataTransfer
    dataTransfer.dropEffect = 'move'
    dataTransfer.effectAllowed = 'move'
    dataTransfer.setData('data', JSON.stringify(data))

    const dragImage = new Image()
    dragImage.src = iconImg.src
    dragImage.setAttribute('style',
      'width: 100%;' +
      'height: 100%;' +
      'position: absolute;' +
      `transform: translate(${offsetX}px, ${offsetY}px);`
    )

    const wrapper = document.createElement('div')
    /**
     * The standard text preivew is not an image element
     * use the span beneth it as a preview
     * update at 2022/1/24: the only non-image dragged-item is the standard text.
     */
    const previewIsImg = (e.target as HTMLElement).tagName === 'IMG'
    wrapper.appendChild(previewIsImg ? dragImage : (() => {
      let div = e.target as Node
      while (div.nodeName !== 'BUTTON' && div) {
        div = div.firstChild ?? div
      }
      !div && (div = e.target as Node)
      const span = div.lastChild?.cloneNode(true) as HTMLElement
      span.classList.add(`btn-text-${payload.type?.toLocaleLowerCase()}`)
      span.setAttribute('style',
        'color: black;' +
        'position: absolute;' +
        `transform: translate(${offsetX}px, ${offsetY}px);`
      )
      return span
    })())
    wrapper.setAttribute('style',
      (previewIsImg ? `width: ${Math.floor(iconWidth)}px;` : '') +
      (previewIsImg ? `height: ${Math.floor(iconHeight)}px;` : '') +
      'position: absolute;' +
      // If the padding is not set, there would be a problem to the dragImg
      (!previewIsImg ? `padding: ${1}px;` : '')
    )
    document.body.appendChild(wrapper)
    /**
     * Notice the xOffset/yOffset of this function can only work as the value is inside the size range.
     * e.g. the value of (-50,-50) won't work and (50,50) will only work for the image which size is bigger than (50, 50)
     */
    dataTransfer.setDragImage(wrapper, 0, 0)
    setTimeout(() => {
      document.body.removeChild(wrapper)
    }, 0)
  }

  itemOnDrop(e: DragEvent, pageIndex: number) {
    const dropData = e.dataTransfer ? e.dataTransfer.getData('data') : null
    if (dropData === null || typeof dropData !== 'string') return
    const data = JSON.parse(dropData)
    if (data.type === 'image') {
      mouseUtils.onDrop(e, pageIndex)
    } else {
      const target = document.querySelector(`.nu-page-${pageIndex}`) as HTMLElement
      const targetPos = {
        x: target.getBoundingClientRect().x,
        y: target.getBoundingClientRect().y
      }
      const styles = {
        x: (e.clientX - targetPos.x) * (100 / store.state.pageScaleRatio),
        y: (e.clientY - targetPos.y) * (100 / store.state.pageScaleRatio)
      }

      if (data.type === 'standardText') {
        const { textType, text, locale } = data
        assetUtils.addStanardText(textType, text, locale, pageIndex, { styles })
      } else {
        if (data.type === 6) {
          const currPage = pageUtils.currFocusPage
          const aspectRatio = data.match_cover.height / data.match_cover.width
          const resize = {
            width: currPage.width,
            height: currPage.width * aspectRatio
          }
          assetUtils.addAsset(data, {
            styles,
            pageIndex,
            // for template
            ...(data.type === 6 && resize)
          })
        } else {
          assetUtils.addAsset(data, {
            styles,
            pageIndex
          })
        }
      }
    }
  }

  constructor(layerIndex = -1, subLayerIdx = -1) {
    this.imgBuff.layerIndex = layerIndex
    this.imgBuff.subLayerIdx = subLayerIdx
  }

  imgBuff: {
    layerIndex: number,
    subLayerIdx: number,
    styles: Partial<IImageStyle>,
    srcObj: { type: string, assetId: string | number, userId: string }
  } = {
      layerIndex: -1,
      subLayerIdx: -1,
      styles: {},
      srcObj: { type: '', assetId: '', userId: '' }
    }

  onImageDragEnter(e: DragEvent, config: IImage) {
    const DragSrcObj = store.state.currDraggedPhoto.srcObj
    const { layerIndex, subLayerIdx } = this.imgBuff
    if (store.state.currDraggedPhoto.srcObj.type) {
      const { imgWidth, imgHeight } = config.styles
      const path = `path('M0,0h${imgWidth}v${imgHeight}h${-imgWidth}z`
      const styles = mouseUtils.clipperHandler(store.state.currDraggedPhoto as any, path, config.styles).styles
      Object.assign(this.imgBuff, {
        srcObj: {
          ...config.srcObj
        },
        styles: {
          imgX: config.styles.imgX,
          imgY: config.styles.imgY,
          imgWidth: config.styles.imgWidth,
          imgHeight: config.styles.imgHeight
        }
      })
      layerUtils.updateLayerProps(layerUtils.pageIndex, layerIndex, { srcObj: DragSrcObj }, subLayerIdx)
      layerUtils.updateLayerStyles(layerUtils.pageIndex, layerIndex, styles, subLayerIdx)
    }
  }

  onImageDragLeave(e: DragEvent) {
    const { layerIndex, subLayerIdx, styles, srcObj } = this.imgBuff
    if (store.state.currDraggedPhoto.srcObj.type) {
      layerUtils.updateLayerProps(layerUtils.pageIndex, layerIndex, { srcObj }, subLayerIdx)
      layerUtils.updateLayerStyles(layerUtils.pageIndex, layerIndex, styles, subLayerIdx)
    }
  }

  onImgDrop(e: DragEvent) {
    if (store.state.currDraggedPhoto.srcObj.type) {
      e.stopPropagation()
      stepsUtils.record()
    }
  }
}

export default DragUtils
