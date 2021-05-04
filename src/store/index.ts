import Vue from 'vue'
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'
import { IEditorState, PanelType } from './types'
import { IPage } from '@/interfaces/page'
import GroupUtils from '@/utils/groupUtils'
Vue.use(Vuex)

const getDefaultState = (): IEditorState => ({
  pages: [
    {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      name: 'Default Page',
      layers: [
        // {
        //   type: 'text',
        //   pageIndex: 0,
        //   active: false,
        //   shown: false,
        //   text: 'Tesing Font',
        //   styles: {
        //     width: 'auto',
        //     height: 'auto',
        //     x: 40,
        //     y: 100,
        //     scale: 0,
        //     scaleX: 0,
        //     scaleY: 0,
        //     rotate: 0,
        //     font: 'Lobster',
        //     weight: 'bold',
        //     align: 'left',
        //     lineHeight: 20,
        //     color: '#000000',
        //     size: 72
        //   }
        // },
        // {
        //   type: 'text',
        //   pageIndex: 1,
        //   active: false,
        //   shown: false,
        //   text: 'Tesing Font ts',
        //   styles: {
        //     width: 120,
        //     height: 120,
        //     x: 300,
        //     y: 200,
        //     scale: 1,
        //     scaleX: 0,
        //     scaleY: 0,
        //     rotate: 0,
        //     font: 'Lobster',
        //     weight: 'bold',
        //     align: 'left',
        //     color: '#000000',
        //     size: 72,
        //     initSize: 72
        //   }
        // }
      ]
    },
    {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      name: 'Default Page',
      layers: []
    }
  ],
  currPanelType: PanelType.template,
  pageScaleRatio: 100,
  lastSelectedPageIndex: 0,
  clipboard: []
})
const state = getDefaultState()
const getters: GetterTree<IEditorState, unknown> = {
  getPages(state) {
    return state.pages
  },
  getCurrPanelType(state) {
    return state.currPanelType
  },
  getPageScaleRatio(state) {
    return state.pageScaleRatio
  },
  getLayer(state: IEditorState) {
    return (pageIndex: number, layerIndex: number): IShape | IText | IImage | IGroup => {
      return state.pages[pageIndex].layers[layerIndex]
    }
  },
  getLayers(state: IEditorState) {
    return (pageIndex: number): Array<IShape | IText | IImage | IGroup> => {
      return state.pages[pageIndex].layers
    }
  },
  getLayersNum(state: IEditorState) {
    return (pageIndex: number): number => {
      return state.pages[pageIndex].layers.length
    }
  },
  getLastSelectedPageIndex(state: IEditorState) {
    return state.lastSelectedPageIndex
  },
  getClipboard(state: IEditorState) {
    return state.clipboard
  }
}

const mutations: MutationTree<IEditorState> = {
  SET_pages(state: IEditorState, newPages: Array<IPage>) {
    state.pages = newPages
  },
  SET_layers(state: IEditorState, updateInfo: { pageIndex: number, newLayers: Array<IShape | IText | IImage | IGroup> }) {
    state.pages[updateInfo.pageIndex].layers = [...updateInfo.newLayers]
  },
  SET_currPanelType(state: IEditorState, type: PanelType) {
    state.currPanelType = type
  },
  SET_pageScaleRatio(state: IEditorState, ratio: number) {
    state.pageScaleRatio = ratio
  },
  SET_lastSelectedPageIndex(state: IEditorState, index: number) {
    state.lastSelectedPageIndex = index
  },
  ADD_newLayers(state: IEditorState, updateInfo: { pageIndex: number, layers: Array<IShape | IText | IImage | IGroup> }) {
    updateInfo.layers.forEach(layer => {
      state.pages[updateInfo.pageIndex].layers.push(layer)
    })
  },
  ADD_layersToPos(state: IEditorState, updateInfo: { pageIndex: number, layers: Array<IShape | IText | IImage | IGroup>, pos: number }) {
    state.pages[updateInfo.pageIndex].layers.splice(updateInfo.pos, 0, ...updateInfo.layers)
  },
  DELETE_layer(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number }) {
    state.pages[updateInfo.pageIndex].layers.splice(updateInfo.layerIndex, 1)
  },
  Update_layerProps(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean } }) {
    /**
     * This Mutation is used to update the layer's properties excluding styles
     */
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex][k] = v
    })
  },
  Update_layerStyles(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, styles: { [key: string]: string | number } }) {
    /**
     * TODO: type check -> To check the properties is in the certain interface or not
     * ex: weight properties is not allowed in Img Layer
     * keywords: user-type-guard in TypeScript or using type predicates
     */
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex].styles[k] = v
    })
  },
  Update_tmpLayerStyles(state: IEditorState, updateInfo: { pageIndex: number, styles: { [key: string]: string | number } }) {
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      if (typeof v === 'number') {
        (state.pages[updateInfo.pageIndex].layers[GroupUtils.tmpIndex].styles[k] as number) += v
      } else {
        state.pages[updateInfo.pageIndex].layers[GroupUtils.tmpIndex].styles[k] = v
      }
    })
  },
  DELETE_selectedLayer(state: IEditorState) {
    const index = GroupUtils.tmpIndex
    if (index < 0) {
      console.log('You didn\'t select any layer')
      return
    }
    console.log(index)
    state.pages[state.lastSelectedPageIndex].layers.splice(index, 1)

    GroupUtils.reset()
  },
  SET_clipboard(state: IEditorState, tmpLayer: IShape | IText | IImage | IGroup) {
    state.clipboard = [JSON.parse(JSON.stringify(tmpLayer))]
  },
  CLEAR_clipboard(state: IEditorState) {
    state.clipboard = []
  }
}

const actions: ActionTree<IEditorState, unknown> = {

}
export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions
})
