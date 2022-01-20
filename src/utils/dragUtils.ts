import { IImage, IShape } from '@/interfaces/layer'
import store from '@/store'

class DragUtils {
  dragStart(e: DragEvent, type: string, payload: Partial<IImage | IShape>, attrs: { [key: string]: string | number } = {}) {
    const rect = (e.target as Element).getBoundingClientRect()
    const scaleRatio = store.getters.getPageScaleRatio
    const { offsetX, offsetY, width, height } = attrs
    const data = {
      type,
      styles: {
        x: (e.clientX - rect.x) * (scaleRatio / 100),
        y: (e.clientY - rect.y) * (scaleRatio / 100),
        width: width,
        height: height
      },
      ...payload
    }
    const dataTransfer = e.dataTransfer as DataTransfer
    dataTransfer.dropEffect = 'move'
    dataTransfer.effectAllowed = 'move'
    dataTransfer.setData('data', JSON.stringify(data))

    const dragImage = new Image()
    dragImage.src = (e.target as HTMLImageElement).src
    dragImage.setAttribute('style',
      'width: 100%;' +
      'height: 100%;' +
      'position: absolute;' +
      `transform: translate(${offsetX}px, ${offsetY}px);`
    )

    const { width: rectWidth, height: rectHeight } = (e.target as HTMLElement).getBoundingClientRect()
    const wrapper = document.createElement('div')
    wrapper.appendChild(dragImage)
    wrapper.setAttribute('style',
      `width: ${Math.floor(rectWidth)}px;` +
      `height: ${Math.floor(rectHeight)}px;` +
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
}

export default new DragUtils()
