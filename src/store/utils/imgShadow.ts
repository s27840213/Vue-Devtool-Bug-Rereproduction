import { IShadowEffects, IShadowProps } from '@/interfaces/imgShadow'
import { IGroup, IImage } from '@/interfaces/layer'
import { IEditorState, ILayerInfo } from '../types'

const imgShadowMutations = {
  UPDATE_shadowEffect(state: IEditorState, data: { layerInfo: ILayerInfo, payload: IShadowEffects }) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      Object.assign(((state.pages[pageIndex].layers[layerIndex] as IGroup)
        .layers[subLayerIdx] as IImage)
        .styles.shadow.effects, payload)
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage)
        .styles.shadow.effects, payload)
    }
  },
  UPDATE_shadowEffectState(state: IEditorState, data: { layerInfo: ILayerInfo, payload: { currentEffect?: string }}) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      Object.assign(((state.pages[pageIndex].layers[layerIndex] as IGroup)
        .layers[subLayerIdx] as IImage)
        .styles.shadow, payload)
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow, payload)
    }
  },
  UPDATE_shadowProps(state: IEditorState, data: { layerInfo: ILayerInfo, payload: Partial<IShadowProps> }) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      const shadow = ((state.pages[pageIndex].layers[layerIndex] as IGroup)
        .layers[subLayerIdx] as IImage)
        .styles.shadow
      Object.assign(shadow, payload)
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow)
    }
  }
}

export default imgShadowMutations
