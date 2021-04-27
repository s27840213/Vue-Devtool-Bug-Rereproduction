/**
 */
import store from '@/store'
import LayerFactary from '@/utils/layerFactary'

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
      const x = (e.clientX - targetPos.x + targetOffset.x - data.geometry.left) * (100 / store.state.pageScaleRatio)
      const y = (e.clientY - targetPos.y + targetOffset.y - data.geometry.top) * (100 / store.state.pageScaleRatio)

      const layer = LayerFactary.newImage(x, y, pageIndex)

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
