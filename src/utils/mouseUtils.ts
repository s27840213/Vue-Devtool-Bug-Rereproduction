/**
 */
import store from '@/store'
import { IShape, IText, IImage, IGroup, ILayer } from '@/interfaces/layer'

class MouseUtils {
  getMouseAbsPoint(e: MouseEvent) {
    return { x: e.clientX, y: e.clientY }
  }

  getMouseRelPoint(e: MouseEvent, target: HTMLElement | { x: number, y: number }) {
    let x: number
    let y: number
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect()
      x = e.clientX + target.scrollLeft - rect.left
      y = e.clientY + target.scrollTop - rect.top
    } else {
      x = e.clientX - target.x
      y = e.clientY - target.y
    }
    return { x, y }
  }

  onDrop(e: DragEvent, pageIndex: number, targetOffset: { x: number, y: number } = { x: 0, y: 0 }) {
    if (e.dataTransfer != null) {
      const data = JSON.parse(e.dataTransfer.getData('data'))
      const target = e.target as HTMLElement
      const targetPos = {
        x: target.getBoundingClientRect().x,
        y: target.getBoundingClientRect().y
      }
      const x = (e.clientX - targetPos.x + targetOffset.x - data.styles.x) * (100 / store.state.pageScaleRatio)
      const y = (e.clientY - targetPos.y + targetOffset.y - data.styles.y) * (100 / store.state.pageScaleRatio)

      const layer: ILayer = {
        type: data.type,
        pageIndex: pageIndex,
        active: false,
        shown: false,
        styles: {
          x: x,
          y: y,
          scale: 1,
          scaleX: 0,
          scaleY: 0,
          rotate: 0,
          width: data.styles.width,
          height: data.styles.height,
          initWidth: data.styles.width,
          initHeight: data.styles.height
        }
      }
      if (data.type === 'image') {
        layer.src = require(`@/assets/${data.src}`)
        // should be deleted
        layer.text = data.text
      } else if (data.type === 'text') {
        layer.text = data.text
        layer.textEditable = false
        layer.styles = Object.assign(data.styles, layer.styles)
      }

      store.commit('ADD_newLayers', {
        pageIndex: pageIndex,
        layers: [layer]
      })
      store.commit('CLEAR_currSelectedInfo')
      store.commit('ADD_selectedLayer', {
        pageIndex: pageIndex,
        layerIndexs: [store.state.pages[pageIndex].layers.length - 1]
      })
    }
  }
}

const mouseUtils = new MouseUtils()
export default mouseUtils
