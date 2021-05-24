import generalUtils from '@/utils/generalUtils'
import zindexUtils from '@/utils/zindexUtils'
import { IEditorState } from '../types'

export default {
  UPDATE_layerOrder(state: IEditorState, updateInfo: { type: string }): void {
    const lastSelectedPageIndex = state.lastSelectedPageIndex
    const layerIndex = state.currSelectedInfo.index
    const layerNum = state.pages[lastSelectedPageIndex].layers.length
    switch (updateInfo.type) {
      case 'front': {
        const layer = state.pages[lastSelectedPageIndex].layers.splice(layerIndex, 1)
        state.pages[lastSelectedPageIndex].layers.push(layer[0])
        state.currSelectedInfo.index = layerNum - 1
        zindexUtils.reassignZindex(lastSelectedPageIndex)
        break
      }
      case 'back': {
        const layer = state.pages[lastSelectedPageIndex].layers.splice(layerIndex, 1)
        state.pages[lastSelectedPageIndex].layers.unshift(layer[0])
        state.currSelectedInfo.index = 0
        zindexUtils.reassignZindex(lastSelectedPageIndex)
        break
      }
      case 'forward': {
        if (layerIndex === layerNum - 1) {
          break
        }
        const layer = state.pages[lastSelectedPageIndex].layers.splice(layerIndex, 1)
        state.pages[lastSelectedPageIndex].layers.splice(layerIndex + 1, 0, ...layer)
        state.currSelectedInfo.index = layerIndex + 1
        zindexUtils.reassignZindex(lastSelectedPageIndex)
        break
      }
      case 'backward': {
        if (layerIndex === 0) {
          break
        }
        const layer = state.pages[lastSelectedPageIndex].layers.splice(layerIndex, 1)
        state.pages[lastSelectedPageIndex].layers.splice(layerIndex - 1, 0, ...layer)
        state.currSelectedInfo.index = layerIndex - 1
        zindexUtils.reassignZindex(lastSelectedPageIndex)
        break
      }
    }
  }
}
