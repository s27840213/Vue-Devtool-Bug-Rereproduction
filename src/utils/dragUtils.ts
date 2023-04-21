/* eslint-disable indent */
import i18n from '@/i18n'
import { SrcObj } from '@/interfaces/gallery'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IImage, IImageStyle, IShape } from '@/interfaces/layer'
import store from '@/store'
import { round } from 'lodash'
import assetUtils from './assetUtils'
import imageShadowUtils from './imageShadowUtils'
import layerUtils from './layerUtils'
import modalUtils from './modalUtils'
import mouseUtils from './mouseUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import { PRECISION } from './unitUtils'

class DragUtils {
  /**
   *
   * @param payload The core data of dragItem, e.g. srcObj for image, designId for svg.
   * @param attrs offsetX/offsetY for dragImg's offset, width/height for dropped layer size
   */
  itemDragStart(evt: DragEvent, type: string, config: Partial<IImage | IShape>, imgSrc: string, attrs?: { offsetX?: number, offsetY?: number, width?: number, height?: number, resizeRatio?: number, panelPreviewSrc?: string, aspectRatio?: number }) {
    const { width: rectW, height: rectH, x, y } = (evt.target as Element).getBoundingClientRect()
    const { offsetX = 10, offsetY = 15, panelPreviewSrc = '', resizeRatio = 0.5, aspectRatio = rectW / rectH } = attrs || {}
    const iconWidth = aspectRatio > 1 ? rectW : (rectH * aspectRatio)
    const iconHeight = iconWidth / aspectRatio
    let { width, height } = attrs || {}

    if (typeof width === 'undefined' || typeof height === 'undefined') {
      const currentPage = store.getters.getPage(layerUtils.pageIndex)
      const pageAspectRatio = currentPage.width / currentPage.height
      width = aspectRatio > pageAspectRatio ? currentPage.width * resizeRatio : (currentPage.height * resizeRatio) * aspectRatio
      height = aspectRatio > pageAspectRatio ? (currentPage.width * resizeRatio) / aspectRatio : currentPage.height * resizeRatio
    }
    const data = {
      type,
      styles: {
        x: (evt.clientX - x) * (store.getters.getPageScaleRatio / 100),
        y: (evt.clientY - y) * (store.getters.getPageScaleRatio / 100),
        width,
        height
      },
      panelPreviewSrc,
      ...config
    }
    const dataTransfer = evt.dataTransfer as DataTransfer
    dataTransfer.dropEffect = 'move'
    dataTransfer.effectAllowed = 'move'
    dataTransfer.setData('data', JSON.stringify(data))

    const dragImage = new Image()
    dragImage.src = imgSrc
    dragImage.setAttribute('style',
      'width: 100%;' +
      'height: 100%;' +
      'position: absolute;' +
      `transform: translate(${offsetX}px, ${offsetY}px);`
    )
    const wrapper = document.createElement('div')
    wrapper.appendChild(dragImage)
    wrapper.setAttribute('style',
      `width: ${Math.floor(iconWidth)}px;` +
      `height: ${Math.floor(iconHeight)}px;` +
      'position: absolute;'
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

  textItemDragStart(evt: DragEvent, type: string, payload: Partial<IImage | IShape>, attrs?: { offsetX: number, offsetY: number }) {
    const { offsetX = 10, offsetY = 15 } = attrs || {}
    const scaleRatio = store.getters.getPageScaleRatio
    const { x, y } = (evt.target as Element).getBoundingClientRect()
    const data = {
      type,
      styles: {
        x: (evt.clientX - x) * (scaleRatio / 100),
        y: (evt.clientY - y) * (scaleRatio / 100),
      },
      ...payload
    }
    const dataTransfer = evt.dataTransfer as DataTransfer
    dataTransfer.dropEffect = 'move'
    dataTransfer.effectAllowed = 'move'
    dataTransfer.setData('data', JSON.stringify(data))

    const wrapper = document.createElement('div')
    /**
     * The standard text preivew is not an image element
     * use the span beneth it as a preview
     * update at 2022/1/24: the only non-image dragged-item is the standard text.
     */
    wrapper.appendChild((() => {
      let div: Node | null = evt.target as Node
      while (div && div.nodeName !== 'BUTTON') {
        div = div.firstChild
      }
      !div && (div = evt.target as Node)
      const span = div.lastChild?.cloneNode(true) as HTMLElement
      span.classList.add(`btn-text-${payload.type?.toLocaleLowerCase()}`)
      span.setAttribute('style',
        'color: black;' +
        'position: absolute;' +
        `transform: translate(${offsetX}px, ${offsetY}px);` +
        'white-space: nowrap'
      )
      return span
    })())
    wrapper.setAttribute('style',
      'position: absolute;' + 'padding: 1px;'
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
      const target = document.querySelector(`.nu-page-content-${pageIndex}`) as HTMLElement
      const targetPos = {
        x: target.getBoundingClientRect().x,
        y: target.getBoundingClientRect().y
      }
      const styles = {
        x: (e.clientX - targetPos.x) * (100 / store.state.pageScaleRatio),
        y: (e.clientY - targetPos.y) * (100 / store.state.pageScaleRatio)
      }
      if (data.type === 'standardText') {
        const { textType, text, locale, spanStyles } = data
        assetUtils.addStandardText(textType, text, locale, pageIndex, { styles }, spanStyles)
      } else {
        if (data.type === 6) {
          const addTemplate = data.groupChildId ? (resize?: any) => assetUtils.addGroupTemplate(data, data.groupChildId, resize)
            : (resize?: any) => assetUtils.addAsset(data, { styles, pageIndex, ...resize })
          const pageSize = data.groupChildId ? pageUtils.currFocusPageSize : pageUtils.getPageSize(pageIndex)
          const newPageIndex = data.groupChildId ? data.content_ids.findIndex((content: any) => content.id === data.groupChildId) : 0
          const { height, width, unit } = data.content_ids[newPageIndex]
          let resize = pageSize

          if (pageUtils.isDetailPage) {
            const aspectRatio = height / width
            const precision = pageSize.unit === 'px' ? 0 : PRECISION
            resize = {
              width: pageSize.width,
              height: round(pageSize.width * aspectRatio, precision),
              physicalWidth: pageSize.physicalWidth,
              physicalHeight: round(pageSize.physicalWidth * aspectRatio, precision),
              unit: pageSize.unit
            }
            addTemplate(resize)
            return
          }

          const isSameSize = pageSize.physicalWidth === width && pageSize.physicalHeight === height && pageSize.unit === unit
          if (!isSameSize) {
            modalUtils.setModalInfo(
              i18n.global.t('NN0695') as string,
              [`${i18n.global.t('NN0209', { tsize: `${width}x${height} ${unit}`, psize: `${round(pageSize.physicalWidth, PRECISION)}x${round(pageSize.physicalHeight, PRECISION)} ${pageSize.unit}` })}`],
              {
                msg: `${i18n.global.t('NN0021')}`,
                class: 'btn-light-mid',
                style: { border: '1px solid #4EABE6' },
                action: () => addTemplate(resize)
              },
              {
                msg: `${i18n.global.t('NN0208')}`,
                action: () => addTemplate()
              }
            )
          } else {
            addTemplate()
          }
        } else {
          assetUtils.addAsset(data, {
            styles,
            pageIndex
          })
        }
      }
    }
  }

  constructor(layerId = '', subLayerId = '') {
    this.imgBuff.layerId = layerId
    this.imgBuff.subLayerId = subLayerId
  }

  imgBuff: {
    layerId: string
    subLayerId: string,
    styles: Partial<IImageStyle>,
    srcObj: SrcObj
    shadow: {
      srcObj: SrcObj
    },
    panelPreviewSrc?: string
  } = {
      layerId: '',
      subLayerId: '',
      styles: {},
      srcObj: { type: '', assetId: '', userId: '' },
      shadow: {
        srcObj: { type: '', assetId: '', userId: '' }
      }
    }

  onImageDragEnter(e: DragEvent, pageIndex: number, config: IImage) {
    const DragSrcObj = store.state.currDraggedPhoto.srcObj
    const panelPreviewSrc = store.state.currDraggedPhoto.panelPreviewSrc
    const { layerId, subLayerId } = this.imgBuff
    if (store.state.currDraggedPhoto.srcObj.type) {
      const { imgWidth, imgHeight } = config.styles
      const path = `path('M0,0h${imgWidth}v${imgHeight}h${-imgWidth}z`
      const styles = {
        ...config.styles,
        ...mouseUtils.clipperHandler(store.state.currDraggedPhoto as any, path, config.styles).styles
      }
      Object.assign(this.imgBuff, {
        srcObj: {
          ...config.srcObj
        },
        styles: {
          imgX: config.styles.imgX,
          imgY: config.styles.imgY,
          imgWidth: config.styles.imgWidth,
          imgHeight: config.styles.imgHeight,
          initWidth: config.styles.initWidth,
          initHeight: config.styles.initHeight
        },
        shadow: {
          srcObj: {
            ...config.styles.shadow.srcObj
          }
        },
        panelPreviewSrc: config.panelPreviewSrc
      })
      const { layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageUtils.getPage(pageIndex).id, layerId, subLayerId)
      layerUtils.updateLayerProps(pageIndex, layerIndex, { srcObj: DragSrcObj, panelPreviewSrc }, subLayerIdx)
      layerUtils.updateLayerStyles(pageIndex, layerIndex, styles, subLayerIdx)
      const isFloatingEffect = config.styles.shadow.currentEffect === ShadowEffectType.floating
      if (!isFloatingEffect && (config.styles.shadow.isTransparent || config.styles.shadow.currentEffect === ShadowEffectType.imageMatched)) {
        imageShadowUtils.updateShadowSrc({
          pageIndex,
          layerIndex,
          subLayerIdx
        }, { type: '', assetId: '', userId: '' })
      }
    }
  }

  onImageDragLeave(e: DragEvent, pageIndex: number) {
    const { layerId, subLayerId, styles, srcObj, shadow, panelPreviewSrc } = this.imgBuff
    const { layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageUtils.getPage(pageIndex).id, layerId, subLayerId)
    if (store.state.currDraggedPhoto.srcObj.type && srcObj.type) {
      layerUtils.updateLayerProps(pageIndex, layerIndex, { srcObj, panelPreviewSrc }, subLayerIdx)
      layerUtils.updateLayerStyles(pageIndex, layerIndex, styles, subLayerIdx)
      imageShadowUtils.updateShadowSrc({
        pageIndex,
        layerIndex,
        subLayerIdx
      }, shadow.srcObj)
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
