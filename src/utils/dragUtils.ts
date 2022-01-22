import { IImage, IShape } from '@/interfaces/layer'
import store from '@/store'
import assetUtils from './assetUtils'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import mouseUtils from './mouseUtils'

class DragUtils {
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

  itemOnDrop(e: DragEvent) {
    const dropData = e.dataTransfer ? e.dataTransfer.getData('data') : null
    if (dropData === null || typeof dropData !== 'string') return
    const data = JSON.parse(dropData)

    if (data.type === 'image') {
      mouseUtils.onDrop(e, layerUtils.pageIndex)
    } else {
      const target = e.target as HTMLElement
      const targetPos = {
        x: target.getBoundingClientRect().x,
        y: target.getBoundingClientRect().y
      }
      const x = (e.clientX - targetPos.x) * (100 / store.state.pageScaleRatio)
      const y = (e.clientY - targetPos.y) * (100 / store.state.pageScaleRatio)
      assetUtils.addAsset(data, { styles: { x, y } })
    }
  }
}

export default new DragUtils()
