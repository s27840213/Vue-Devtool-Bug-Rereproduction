import Vue from 'vue'
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IShape, IText, IImage, IGroup, ITmp, IParagraph } from '@/interfaces/layer'
import { IEditorState, SidebarPanelType, FunctionPanelType, ISpecLayerData } from './types'
import { IPage } from '@/interfaces/page'
import userApis from '@/apis/user'
import zindexUtils from '@/utils/zindexUtils'
import uploadUtils from '@/utils/uploadUtils'

import photos from '@/store/photos'
import color from '@/store/module/color'
import text from '@/store/text'
import objects from '@/store/objects'

Vue.use(Vuex)

const getDefaultState = (): IEditorState => ({
  pages: [
    {
      width: 1080,
      height: 1080,
      backgroundColor: '#ffffff',
      backgroundImage: {
        src: 'none',
        config: {
          type: 'image',
          src: 'none',
          clipPath: '',
          active: false,
          shown: false,
          locked: false,
          moved: false,
          imgControl: false,
          isClipper: false,
          dragging: false,
          designId: '',
          styles: {
            x: 0,
            y: 0,
            scale: 1,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            width: 0,
            height: 0,
            initWidth: 0,
            initHeight: 0,
            imgX: 0,
            imgY: 0,
            imgWidth: 0,
            imgHeight: 0,
            zindex: -1,
            opacity: 100
          }
        },
        posX: -1,
        posY: -1
      },
      name: 'Default Page',
      layers: [
      ],
      designId: ''
    },
    {
      width: 1080,
      height: 1080,
      backgroundColor: '#ffffff',
      backgroundImage: {
        src: 'none',
        config: {
          type: 'image',
          src: 'none',
          clipPath: '',
          active: false,
          shown: false,
          locked: false,
          moved: false,
          imgControl: false,
          isClipper: false,
          dragging: false,
          designId: '',
          styles: {
            x: 0,
            y: 0,
            scale: 1,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            width: 0,
            height: 0,
            initWidth: 0,
            initHeight: 0,
            imgX: 0,
            imgY: 0,
            imgWidth: 0,
            imgHeight: 0,
            zindex: -1,
            opacity: 100
          }
        },
        posX: -1,
        posY: -1
      },
      name: 'Default Page',
      layers: [
      ],
      designId: ''
    }
  ],
  designId: '',
  currSidebarPanelType: SidebarPanelType.template,
  currFunctionPanelType: FunctionPanelType.none,
  pageScaleRatio: 100,
  lastSelectedPageIndex: 0,
  currActivePageIndex: -1,
  lastSelectedLayerIndex: -1,
  clipboard: [],
  currSelectedInfo: {
    pageIndex: -1,
    index: -1,
    layers: [],
    types: new Set<string>()
  },
  currSubSelectedInfo: {
    indexs: [],
    layers: [],
    types: new Set<string>()
  },
  isOrderDropdownsOpened: false,
  isLayerDropdownsOpened: false,
  isPageDropdownsOpened: false,
  isColorPickerOpened: false,
  currSelectedPhotoInfo: {},
  jsonMap: {}
})
const state = getDefaultState()
const getters: GetterTree<IEditorState, unknown> = {
  getPage(state: IEditorState) {
    return (pageIndex: number): IPage => {
      return state.pages[pageIndex]
    }
  },
  getPages(state): Array<IPage> {
    return state.pages
  },
  getDesignId(state): string {
    return state.designId
  },
  getPageSize(state: IEditorState) {
    return {
      width: state.pages[0].width,
      height: state.pages[0].height
    }
  },
  getCurrSidebarPanelType(state): number {
    return state.currSidebarPanelType
  },
  getCurrFunctionPanelType(state): number {
    return state.currFunctionPanelType
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
  getBackgroundImage(state: IEditorState) {
    return (pageIndex: number) => {
      return state.pages[pageIndex].backgroundImage
    }
  },
  getLastSelectedPageIndex(state: IEditorState): number {
    return state.lastSelectedPageIndex
  },
  getCurrActivePageIndex(state: IEditorState): number {
    return state.currActivePageIndex
  },
  getLastSelectedLayerIndex(state: IEditorState): number {
    return state.lastSelectedLayerIndex
  },
  getClipboard(state: IEditorState): Array<ITmp> {
    return state.clipboard
  },
  getCurrSelectedInfo(state: IEditorState): {
    pageIndex: number,
    index: number,
    layers: Array<IShape | IText | IImage | IGroup | ITmp>,
    types: Set<string>
  } {
    return state.currSelectedInfo
  },
  getCurrSubSelectedInfo(state: IEditorState): {
    indexs: Array<number>,
    layers: Array<IShape | IText | IImage | IGroup | ITmp>,
    types: Set<string>
  } {
    return state.currSubSelectedInfo
  },
  getCurrSelectedPageIndex(state: IEditorState) {
    return state.currSelectedInfo.pageIndex
  },
  getCurrSelectedIndex(state: IEditorState) {
    return state.currSelectedInfo.index
  },
  getCurrSelectedLayers(state: IEditorState) {
    return state.currSelectedInfo.layers
  },
  getCurrSelectedTypes(state: IEditorState) {
    return state.currSelectedInfo.types
  },
  getIsOrderDropdownsOpened(state: IEditorState) {
    return state.isOrderDropdownsOpened
  },
  getIsLayerDropdownsOpened(state: IEditorState) {
    return state.isLayerDropdownsOpened
  },
  getIsPageDropdownsOpened(state: IEditorState) {
    return state.isPageDropdownsOpened
  },
  getIsColorPickerOpened(state: IEditorState) {
    return state.isColorPickerOpened
  },
  getCurrSelectedPhotoInfo(state: IEditorState) {
    return state.currSelectedPhotoInfo
  },
  getJson(state: IEditorState) {
    return (id: string) => state.jsonMap[id]
  }
}

const mutations: MutationTree<IEditorState> = {
  SET_pages(state: IEditorState, newPages: Array<IPage>) {
    state.pages = newPages
  },
  ADD_page(state: IEditorState, newPages: IPage) {
    state.pages.push(newPages)
  },
  SET_designId(state: IEditorState, designId: string) {
    state.designId = designId
  },
  SET_pageDesignId(state: IEditorState, updateInfo: { pageIndex: number, designId: string }) {
    state.pages[updateInfo.pageIndex].designId = updateInfo.designId
  },
  UPDATE_pageProps(state: IEditorState, updateInfo: { pageIndex: number, props: { [key: string]: string | number } }) {
    /**
     * This Mutation is used to update the layer's properties excluding styles
     */
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex][k] = v
    })
  },
  SET_layers(state: IEditorState, updateInfo: { pageIndex: number, newLayers: Array<IShape | IText | IImage | IGroup> }) {
    state.pages[updateInfo.pageIndex].layers = [...updateInfo.newLayers]
  },
  SET_currSidebarPanelType(state: IEditorState, type: SidebarPanelType) {
    state.currSidebarPanelType = type
  },
  SET_currFunctionPanelType(state: IEditorState, type: SidebarPanelType) {
    state.currFunctionPanelType = type
  },
  SET_pageScaleRatio(state: IEditorState, ratio: number) {
    state.pageScaleRatio = ratio
  },
  SET_lastSelectedPageIndex(state: IEditorState, index: number) {
    state.lastSelectedPageIndex = index
  },
  SET_currActivePageIndex(state: IEditorState, index: number) {
    state.currActivePageIndex = index
  },
  SET_lastSelectedLayerIndex(state: IEditorState, index: number) {
    state.lastSelectedLayerIndex = index
  },
  SET_backgroundColor(state: IEditorState, updateInfo: { pageIndex: number, color: string }) {
    state.pages[updateInfo.pageIndex].backgroundColor = updateInfo.color
  },
  SET_backgroundImage(state: IEditorState, updateInfo: { pageIndex: number, config: IImage }) {
    state.pages[updateInfo.pageIndex].backgroundImage.src = updateInfo.config.src
    state.pages[updateInfo.pageIndex].backgroundImage.config = updateInfo.config
  },
  SET_backgroundImageSrc(state: IEditorState, updateInfo: { pageIndex: number, imageSrc: string }) {
    state.pages[updateInfo.pageIndex].backgroundImage.src = updateInfo.imageSrc
  },
  SET_backgroundImageConfig(state: IEditorState, updateInfo: { pageIndex: number, config: IImage }) {
    state.pages[updateInfo.pageIndex].backgroundImage.config = updateInfo.config
  },
  SET_backgroundImagePos(state: IEditorState, updateInfo: { pageIndex: number, imagePos: { x: number, y: number } }) {
    state.pages[updateInfo.pageIndex].backgroundImage.posX = updateInfo.imagePos.x
    state.pages[updateInfo.pageIndex].backgroundImage.posY = updateInfo.imagePos.y
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
  UPDATE_layerProps(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean | IParagraph } }) {
    /**
     * This Mutation is used to update the layer's properties excluding styles
     */
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex][k] = v
    })
  },
  UPDATE_subLayerProps(state: IEditorState, updateInfo: { pageIndex: number, indexs: Array<number>, props: { [key: string]: string | number | boolean | IParagraph } }) {
    const indexs = updateInfo.indexs
    const outestIndex = indexs.shift() as number
    const outestLayer = state.pages[updateInfo.pageIndex].layers[outestIndex] as IGroup
    const getTargetSubLayer = (indexs: Array<number>, currLayer: IGroup): IShape | IText | IImage | IGroup => {
      if (indexs.length === 0) {
        return currLayer
      } else {
        const tmp = currLayer.layers[indexs.shift() as number] as IGroup
        return getTargetSubLayer(indexs, tmp)
      }
    }

    const target = getTargetSubLayer(indexs, outestLayer)

    Object.entries(updateInfo.props).forEach(([k, v]) => {
      target[k] = v
    })
  },
  UPDATE_textProps(state: IEditorState, updateInfo: {
    pageIndex: number, layerIndex: number,
    paragraphs: [IParagraph]
  }) {
    (state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex] as IText).paragraphs = updateInfo.paragraphs
  },
  UPDATE_paragraphStyles(state: IEditorState, updateInfo: {
    pageIndex: number, layerIndex: number, pIndex: number,
    styles: { [key: string]: string | number }
  }) {
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      (state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex] as IText).paragraphs[updateInfo.pIndex].styles[k] = v
    })
  },
  UPDATE_layerStyles(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, styles: { [key: string]: string | number } }) {
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex].styles[k] = v
    })
  },
  UPDATE_layerOrders(state: IEditorState, updateInfo: { pageIndex: number }) {
    state.pages[updateInfo.pageIndex].layers.sort((a, b) => a.styles.zindex - b.styles.zindex)
  },
  UPDATE_layerOrder(state: IEditorState, updateInfo: { type: string }): void {
    const layerIndex = state.currSelectedInfo.index
    const layerNum = state.pages[state.currSelectedInfo.pageIndex].layers.length
    switch (updateInfo.type) {
      case 'front': {
        const layer = state.pages[state.currSelectedInfo.pageIndex].layers.splice(layerIndex, 1)
        state.pages[state.currSelectedInfo.pageIndex].layers.push(layer[0])
        state.currSelectedInfo.index = layerNum - 1
        zindexUtils.reassignZindex(state.currSelectedInfo.pageIndex)
        break
      }
      case 'back': {
        const layer = state.pages[state.currSelectedInfo.pageIndex].layers.splice(layerIndex, 1)
        state.pages[state.currSelectedInfo.pageIndex].layers.unshift(layer[0])
        state.currSelectedInfo.index = 0
        zindexUtils.reassignZindex(state.currSelectedInfo.pageIndex)
        break
      }
      case 'forward': {
        if (layerIndex === layerNum - 1) {
          zindexUtils.reassignZindex(state.currSelectedInfo.pageIndex)
          break
        }
        const layer = state.pages[state.currSelectedInfo.pageIndex].layers.splice(layerIndex, 1)
        state.pages[state.currSelectedInfo.pageIndex].layers.splice(layerIndex + 1, 0, ...layer)
        state.currSelectedInfo.index = layerIndex + 1
        zindexUtils.reassignZindex(state.currSelectedInfo.pageIndex)
        break
      }
      case 'backward': {
        if (layerIndex === 0) {
          break
        }
        const layer = state.pages[state.currSelectedInfo.pageIndex].layers.splice(layerIndex, 1)
        state.pages[state.currSelectedInfo.pageIndex].layers.splice(layerIndex - 1, 0, ...layer)
        state.currSelectedInfo.index = layerIndex - 1
        zindexUtils.reassignZindex(state.currSelectedInfo.pageIndex)
        break
      }
    }
  },
  UPDATE_tmpLayerStyles(state: IEditorState, updateInfo: { pageIndex: number, styles: { [key: string]: string | number } }) {
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      if (typeof v === 'number') {
        (state.pages[updateInfo.pageIndex].layers[state.currSelectedInfo.index].styles[k] as number) += v
      } else {
        state.pages[updateInfo.pageIndex].layers[state.currSelectedInfo.index].styles[k] = v
      }
    })
  },
  UPDATE_groupLayerStyles(state: IEditorState, updateInfo: { styles: { [key: string]: string | number } }) {
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      (state.pages[state.lastSelectedPageIndex].layers[state.currSelectedInfo.index] as IGroup).layers.forEach((layer: IShape | IText | IImage | IGroup) => {
        layer.styles[k] = v
      })
    })
    state.currSelectedInfo.layers[0].layers = (state.pages[state.lastSelectedPageIndex].layers[state.currSelectedInfo.index] as IGroup).layers
  },
  UPDATE_selectedLayersStyles(state: IEditorState, updateInfo: { styles: { [key: string]: string | number }, layerIndex?: number }) {
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      if (typeof updateInfo.layerIndex !== 'undefined') {
        (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers[updateInfo.layerIndex].styles[k] = v
      } else {
        (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers.forEach((layer: IShape | IText | IImage | IGroup) => {
          layer.styles[k] = v
        })
      }
    })
    state.currSelectedInfo.layers = (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers
  },
  UPDATE_selectedTextParagraphs(state: IEditorState, updateInfo: { tmpLayerIndex: number, paragraphs: [IParagraph] }) {
    ((state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers[updateInfo.tmpLayerIndex] as IText).paragraphs = updateInfo.paragraphs
    state.currSelectedInfo.layers = (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers
  },
  UPDATE_selectedTextParagraphsProp(state: IEditorState, updateInfo: { tmpLayerIndex: number, props: { [key: string]: string | number } }) {
    const pLeng = ((state.pages[state.lastSelectedPageIndex].layers[state.currSelectedInfo.index] as ITmp).layers[updateInfo.tmpLayerIndex] as IText).paragraphs.length
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      for (let pIndex = 0; pIndex < pLeng; pIndex++) {
        const p = ((state.pages[state.lastSelectedPageIndex].layers[state.currSelectedInfo.index] as ITmp).layers[updateInfo.tmpLayerIndex] as IText).paragraphs[pIndex]
        p.styles[k] = v
      }
    })
    state.currSelectedInfo.layers = (state.pages[state.lastSelectedPageIndex].layers[state.currSelectedInfo.index] as ITmp).layers
  },
  UPDATE_tmpLayersZindex(state: IEditorState) {
    (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      layer.styles.zindex = state.currSelectedInfo.index + 1
    })
    Object.assign(state.currSelectedInfo, {
      layers: (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers
    })
  },
  // DELETE_textParagraphsSpans(state: IEditorState, deleteInfo: { pageIndex: number, layerIndex: number, pIndex: number | number[], sIndex: number | number[] }) {
  //   if ((Array.isArray(deleteInfo.pIndex) && deleteInfo.pIndex.length !== 2) || (Array.isArray(deleteInfo.sIndex) && deleteInfo.sIndex.length !== 2 )) {
  //     console.log('The delete range of array is wrong!')
  //     return
  //   }
  //   /**
  //    *  If the selected delete range is multi-paragraphs, pIndex and sIndex are both of type of array
  //    */
  //   if (Array.isArray(deleteInfo.pIndex) && Array.isArray(deleteInfo.sIndex)) {
  //     const text = (state.pages[deleteInfo.pageIndex].layers[deleteInfo.layerIndex] as IText)
  //     let spanLength = text.paragraphs[deleteInfo.pIndex[0]].spans.length

  //     text.paragraphs[deleteInfo.pIndex[0]].spans.splice(deleteInfo.sIndex[0], spanLength - deleteInfo.sIndex[0])
  //     text.paragraphs[deleteInfo.pIndex[1]].spans.splice(0, deleteInfo.sIndex[1] + 1)
  //     text.paragraphs.splice(deleteInfo.pIndex[0] + 1, deleteInfo.pIndex[1] - (deleteInfo.pIndex[0] + 1))
  //     console.log(text.paragraphs)
  //   /**
  //    *  If the delete range is about only a certain span inside a certain paragraph, pIndex and sIndex are both of type of number
  //    */
  //   } else if (Array.isArray(deleteInfo.sIndex)) {

  //   }
  // },
  DELETE_selectedLayer(state: IEditorState) {
    const index = state.currSelectedInfo.index
    if (index < 0) {
      console.log('You didn\'t select any layer')
      return
    }
    state.pages[state.currSelectedInfo.pageIndex].layers.splice(index, 1)
  },
  SET_clipboard(state: IEditorState, tmpLayer: IShape | IText | IImage | IGroup) {
    state.clipboard = [JSON.parse(JSON.stringify(tmpLayer))]
  },
  CLEAR_clipboard(state: IEditorState) {
    state.clipboard = []
  },
  SET_currSelectedInfo(state: IEditorState, data: { index: number, layers: Array<IShape | IText | IImage | IGroup | ITmp>, types: Set<string> }) {
    Object.assign(state.currSelectedInfo, data)
  },
  SET_currSubSelectedInfo(state: IEditorState, data: { index: number, layers: Array<IShape | IText | IImage | IGroup | ITmp>, types: Set<string> }) {
    Object.assign(state.currSelectedInfo, data)
  },
  SET_isOrderDropdownsOpened(state: IEditorState, isOpened: boolean) {
    state.isOrderDropdownsOpened = isOpened
  },
  SET_isLayerDropdownsOpened(state: IEditorState, isOpened: boolean) {
    state.isLayerDropdownsOpened = isOpened
  },
  SET_isPageDropdownsOpened(state: IEditorState, isOpened: boolean) {
    state.isPageDropdownsOpened = isOpened
  },
  SET_isColorPickerOpened(state: IEditorState, isOpened: boolean) {
    state.isColorPickerOpened = isOpened
    console.log(state.isColorPickerOpened)
  },
  SET_currSelectedPhotoInfo(state: IEditorState, data: { userName: string, userLink: string, vendor: string, tags: string[] }) {
    state.currSelectedPhotoInfo = data
  },
  SET_subLayerStyles(state: IEditorState, data: { pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: any }) {
    const { pageIndex, primaryLayerIndex, subLayerIndex, styles } = data
    const layers = state.pages[pageIndex].layers[primaryLayerIndex].layers as (IShape | IText)[]
    Object.assign(layers[subLayerIndex].styles, styles)
  },
  SET_contentJson(state: IEditorState, json: { [key: string]: any }) {
    Object.assign(state.jsonMap, json)
  },
  UPDATE_specLayerData(state: IEditorState, data: ISpecLayerData) {
    const { pageIndex, layerIndex, subLayerIndex, props, styles, type } = data
    const targetLayer = state.pages[pageIndex].layers[layerIndex] as IGroup | ITmp
    if (!targetLayer) { return }
    if (targetLayer.layers) {
      targetLayer.layers.forEach((layer, idx) => {
        const matchType = type ? type.includes(layer.type) : true
        const matchSubLayerIndex = typeof subLayerIndex === 'undefined' || idx === subLayerIndex
        if (matchType && matchSubLayerIndex) {
          props && Object.assign(targetLayer.layers[idx], props)
          styles && Object.assign(targetLayer.layers[idx].styles, styles)
        }
      })
    } else {
      props && Object.assign(targetLayer, props)
      styles && Object.assign(targetLayer.styles, styles)
    }
  }
}

const actions: ActionTree<IEditorState, unknown> = {
  // async getRandomPhoto({ commit }, { count }) {
  //   try {
  //     const { data } = await unsplashApis.getRandomPhoto(count)
  //     commit('SET_photos', data)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // },
  async getAssets({ commit }, { token }) {
    try {
      const { data } = await userApis.getAssets(token)
      console.log(data)
    } catch (error) {
      console.log(error)
    }
  },
  async login({ commit }, { token, account, password }) {
    try {
      const { data } = await userApis.login(token, account, password)
      console.log(data)
      uploadUtils.setLoginOutput(data.data)
    } catch (error) {
      console.log(error)
    }
  }
}

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  modules: {
    photos,
    text,
    color,
    objects
  }
})
