import Vue from 'vue'
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import { IEditorState, PanelType } from './types'
import { IPage } from '@/interfaces/page'
import GroupUtils from '@/utils/groupUtils'
import apis from '@/apis/unsplash'

Vue.use(Vuex)

const getDefaultState = (): IEditorState => ({
  pages: [
    {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      backgroundImage: {
        src: 'none',
        posX: -1,
        posY: -1
      },
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
      backgroundImage: {
        src: 'none',
        posX: -1,
        posY: -1
      },
      name: 'Default Page',
      layers: []
    }
  ],
  currPanelType: PanelType.template,
  pageScaleRatio: 100,
  lastSelectedPageIndex: 0,
  clipboard: [],
  photos: []
})
const state = getDefaultState()
const getters: GetterTree<IEditorState, unknown> = {
  getPages(state): Array<IPage> {
    return state.pages
  },
  getCurrPanelType(state): number {
    return state.currPanelType
  },
  getPageScaleRatio(state): number {
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
  getLastSelectedPageIndex(state: IEditorState): number {
    return state.lastSelectedPageIndex
  },
  getClipboard(state: IEditorState): Array<ITmp> {
    return state.clipboard
  },
  getPhotos(state: IEditorState) {
    return state.photos
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
  SET_backgroundImageSrc(state: IEditorState, updateInfo: { pageIndex: number, imageSrc: string }) {
    state.pages[updateInfo.pageIndex].backgroundImage.src = updateInfo.imageSrc
  },
  SET_backgroundImagePos(state: IEditorState, updateInfo: { pageIndex: number, imagePos: { x: number, y: number } }) {
    state.pages[updateInfo.pageIndex].backgroundImage.posX = updateInfo.imagePos.x
    state.pages[updateInfo.pageIndex].backgroundImage.posY = updateInfo.imagePos.y
  },
  REMOVE_backgroundImage(state: IEditorState) {
    Object.assign(state.pages[state.lastSelectedPageIndex].backgroundImage, {
      src: 'none',
      posX: -1,
      posY: -1
    })
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
  UPDATE_layerProps(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean } }) {
    /**
     * This Mutation is used to update the layer's properties excluding styles
     */
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex][k] = v
    })
  },
  UPDATE_layerStyles(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, styles: { [key: string]: string | number } }) {
    /**
     * TODO: type check -> To check the properties is in the certain interface or not
     * ex: weight properties is not allowed in Img Layer
     * keywords: user-type-guard in TypeScript or using type predicates
     */
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex].styles[k] = v
    })
  },
  UPDATE_layerOrders(state: IEditorState, updateInfo: { pageIndex: number }) {
    state.pages[updateInfo.pageIndex].layers.sort((a, b) => a.styles.zindex - b.styles.zindex)
  },
  UPDATE_tmpLayerStyles(state: IEditorState, updateInfo: { pageIndex: number, styles: { [key: string]: string | number } }) {
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
    state.pages[state.lastSelectedPageIndex].layers.splice(index, 1)

    GroupUtils.reset()
  },
  SET_clipboard(state: IEditorState, tmpLayer: IShape | IText | IImage | IGroup) {
    state.clipboard = [JSON.parse(JSON.stringify(tmpLayer))]
  },
  CLEAR_clipboard(state: IEditorState) {
    state.clipboard = []
  },
  SET_photos(state: IEditorState, data) {
    state.photos = [...data]
  }
}

const actions: ActionTree<IEditorState, unknown> = {
  async getRandomPhoto({ state, commit }, { count }) {
    try {
      const { data } = await apis.getRandomPhoto(count)
      commit('SET_photos', data)
    } catch (error) {
      console.log(error)
    }
  }
}
export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions
})
