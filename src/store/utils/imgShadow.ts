import { IShadowEffects } from '@/interfaces/imgShadow'
import { IImage } from '@/interfaces/layer'
import store from '@/store'
import { IEditorState, ILayerInfo } from '../types'

const imgShadowMutations = {
  UPDATE_shadowEffect(state: IEditorState, data: { layerInfo: ILayerInfo, payload: IShadowEffects }) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      // @TODO
      // state.pages[pageIndex].layers[layerIndex]
    } else {
      Object
        .assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow.effects, payload)
    }
  },
  UPDATE_shadowEffectState(state: IEditorState, data: { layerInfo: ILayerInfo, payload: { filterId?: string, currentEffect?: string }}) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      // @TODO
      // Object
      //   .assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow, payload)
    } else {
      Object
        .assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow, payload)
    }
  }
}

export default imgShadowMutations
