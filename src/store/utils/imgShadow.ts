/* eslint-disable camelcase */
import { SrcObj } from '@/interfaces/gallery'
import { IShadowEffects, IShadowProps, IShadowStyles, ShadowEffectType } from '@/interfaces/imgShadow'
import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import { IEditorState, ILayerInfo } from '../types'

const UPDATE_shadowEffect = 'UPDATE_shadowEffect' as const
const UPDATE_shadowProps = 'UPDATE_shadowProps' as const
const UPDATE_shadowStyles = 'UPDATE_shadowStyles' as const
const SET_shadowEffectState = 'SET_shadowEffectState' as const
const SET_srcObj = 'SET_srcObj' as const
const SET_srcState = 'SET_srcState' as const
const SET_old = 'SET_old' as const

const imgShadowMutations = {
  [UPDATE_shadowEffect](state: IEditorState, data: { layerInfo: ILayerInfo, payload: IShadowEffects }) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (pageIndex === -1 || layerIndex === -1) return
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      Object.assign(((state.pages[pageIndex].layers[layerIndex] as IGroup)
        .layers[subLayerIdx] as IImage)
        .styles.shadow.effects, payload)
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage)
        .styles.shadow.effects, payload)
    }
  },
  [SET_shadowEffectState](state: IEditorState, data: { layerInfo: ILayerInfo, payload: { currentEffect?: string }}) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (pageIndex === -1 || layerIndex === -1) return
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      const shadow = ((state.pages[pageIndex].layers[layerIndex] as IGroup).layers[subLayerIdx] as IImage).styles.shadow
      if (shadow) {
        Object.assign(shadow, payload)
      } else {
        ((state.pages[pageIndex].layers[layerIndex] as IGroup).layers[subLayerIdx] as IImage).styles.shadow = payload as any
      }
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow, payload)
    }
  },
  [UPDATE_shadowProps](state: IEditorState, data: { layerInfo: ILayerInfo, payload: Partial<IShadowProps> }) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (pageIndex === -1 || layerIndex === -1) return
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      const shadow = ((state.pages[pageIndex].layers[layerIndex] as IGroup)
        .layers[subLayerIdx] as IImage)
        .styles.shadow
      Object.assign(shadow, payload)
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow, payload)
    }
  },
  [UPDATE_shadowStyles](state: IEditorState, data: { layerInfo: ILayerInfo, payload: IShadowStyles }) {
    const { layerInfo, payload } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (pageIndex === -1 || layerIndex === -1) return
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      const styles = ((state.pages[pageIndex].layers[layerIndex] as IGroup)
        .layers[subLayerIdx] as IImage)
        .styles.shadow.styles
      Object.assign(styles, payload)
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow.styles, payload)
    }
  },
  [SET_srcObj](state: IEditorState, data: { layerInfo: ILayerInfo, srcObj: SrcObj }) {
    const { layerInfo, srcObj } = data
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (pageIndex === -1 || layerIndex === -1) return
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      const _srcObj = ((state.pages[pageIndex].layers[layerIndex] as IGroup)
        .layers[subLayerIdx] as IImage)
        .styles.shadow.srcObj
      Object.assign(_srcObj, srcObj)
    } else {
      Object.assign((state.pages[pageIndex].layers[layerIndex] as IImage).styles.shadow.srcObj, srcObj)
    }
  },
  [SET_srcState](state: IEditorState, data: { layerInfo: ILayerInfo, effect: ShadowEffectType, effects: IShadowEffects, layerSrcObj: SrcObj, shadowSrcObj: SrcObj, layerState: Partial<IImageStyle> }) {
    const { layerInfo: { pageIndex, layerIndex, subLayerIdx }, effect, effects, layerSrcObj, shadowSrcObj, layerState } = data
    if (pageIndex === -1 || layerIndex === -1) return

    let target
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      target = (state.pages[pageIndex].layers[layerIndex] as IGroup).layers[subLayerIdx] as IImage
    } else {
      target = state.pages[pageIndex].layers[layerIndex] as IImage
    }

    if (target.styles.shadow.srcState) {
      Object.assign(target.styles.shadow.srcState, { effect, effects, layerSrcObj, shadowSrcObj, layerState })
    } else {
      target.styles.shadow.srcState = { effect, effects, layerSrcObj, shadowSrcObj, layerState }
    }
  },
  [SET_old](state: IEditorState, layerInfo: ILayerInfo) {
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    if (pageIndex === -1 || layerIndex === -1) return

    let target
    if (typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1) {
      target = (state.pages[pageIndex].layers[layerIndex] as IGroup).layers[subLayerIdx] as IImage
    } else {
      target = state.pages[pageIndex].layers[layerIndex] as IImage
    }
    target.styles.shadow.old = {
      currentEffect: target.styles.shadow.currentEffect,
      effects: generalUtils.deepCopy(target.styles.shadow.effects)
    }
  }
}

export default imgShadowMutations
