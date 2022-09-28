import Vue from 'vue'
import Vuex, { GetterTree, MutationTree } from 'vuex'
import { IShape, IText, IImage, IGroup, ITmp, IParagraph, IFrame, IImageStyle } from '@/interfaces/layer'
import { IEditorState, SidebarPanelType, FunctionPanelType, ISpecLayerData, ILayerInfo, LayerType } from './types'
import { IPage } from '@/interfaces/page'
import zindexUtils from '@/utils/zindexUtils'

import photos from '@/store/photos'
import user from '@/store/module/user'
import color from '@/store/module/color'
import bgRemove from '@/store/module/bgRemove'
import text from '@/store/text'
import objects from '@/store/module/objects'
import textStock from '@/store/module/text'
import shadow from '@/store/module/shadow'
import font from '@/store/module/font'
import background from '@/store/module/background'
import modal from '@/store/module/modal'
import popup from '@/store/module/popup'
import page from '@/store/module/page'
import markers from '@/store/module/markers'
import mobileEditor from '@/store/module/mobileEditor'
import vivisticker from '@/store/module/vivisticker'
import groupUtils from '@/utils/groupUtils'
import { ICurrSubSelectedInfo } from '@/interfaces/editor'
import { SrcObj } from '@/interfaces/gallery'
import pageUtils from '@/utils/pageUtils'
import { getDocumentColor } from '@/utils/colorUtils'
import generalUtils from '@/utils/generalUtils'
import { Itheme } from '@/interfaces/theme'
import uploadUtils from '@/utils/uploadUtils'
import imgShadowMutations from '@/store/utils/imgShadow'
import fontTag from '@/store/module/fontTag'
import imgControl from '@/store/module/imgControl'
import { ADD_subLayer } from '@/utils/layerUtils'

Vue.use(Vuex)

const getDefaultState = (): IEditorState => ({
  pages: [pageUtils.newPage({})],
  designId: '',
  groupId: '',
  groupType: -1,
  assetId: '',
  assetIndex: -1,
  exportIds: '',
  folderInfo: {
    isRoot: true,
    parentFolder: '',
    path: 'root'
  },
  name: '',
  currSidebarPanelType: SidebarPanelType.template,
  mobileSidebarPanelOpen: false,
  currFunctionPanelType: FunctionPanelType.none,
  pageScaleRatio: 100,
  isSettingScaleRatio: false,
  middlemostPageIndex: 0,
  currActivePageIndex: -1,
  currHoveredPageIndex: -1,
  lastSelectedLayerIndex: -1,
  clipboard: [],
  currSelectedInfo: {
    pageIndex: -1,
    index: -1,
    layers: [],
    types: new Set<string>(),
    id: ''
  },
  currDraggedPhoto: {
    srcObj: {
      type: '',
      assetId: '',
      userId: ''
    },
    styles: {
      width: 0,
      height: 0
    },
    isTransparent: false,
    isPreview: false
  },
  currSubSelectedInfo: {
    index: -1,
    type: ''
  },
  isColorPanelOpened: false,
  currSelectedResInfo: {},
  asset: {},
  textInfo: {
    heading: [],
    subheading: [],
    body: []
  },
  isMoving: false,
  showRuler: localStorage.getItem('showRuler') === 'true' ?? false,
  showGuideline: true,
  lockGuideline: false,
  themes: [],
  hasCopiedFormat: false,
  inGestureToolMode: false,
  isMobile: false,
  isLargeDesktop: false,
  isGlobalLoading: false,
  useMobileEditor: false,
  defaultContentScaleRatio: 0.4
})

const state = getDefaultState()
const getters: GetterTree<IEditorState, unknown> = {
  getPage(state: IEditorState) {
    return (pageIndex: number): IPage => {
      return state.pages[pageIndex]
    }
  },
  getPages(state: IEditorState): Array<IPage> {
    return state.pages
  },
  getPagesName(state: IEditorState): string {
    return state.name
  },
  getPagesLength(state: IEditorState): number {
    return state.pages.length
  },
  getDesignId(state: IEditorState): string {
    return state.designId
  },
  getAssetId(state: IEditorState): string {
    return state.assetId
  },
  getAssetIndex(state: IEditorState): number {
    return state.assetIndex
  },
  getGroupId(state: IEditorState): string {
    return state.groupId
  },
  getGroupType(state: IEditorState): number {
    return state.groupType
  },
  getFolderInfo(state: IEditorState): { isRoot: boolean, parentFolder: string } {
    return state.folderInfo
  },
  getPageSize(state: IEditorState) {
    return (pageIndex: number): { width: number, height: number } => {
      return {
        width: state.pages[pageIndex].width,
        height: state.pages[pageIndex].height
      }
    }
  },
  getCurrSidebarPanelType(state: IEditorState): number {
    return state.currSidebarPanelType
  },
  getMobileSidebarPanelOpen(state: IEditorState): boolean {
    return state.mobileSidebarPanelOpen
  },
  getCurrFunctionPanelType(state: IEditorState): number {
    return state.currFunctionPanelType
  },
  getPageScaleRatio(state: IEditorState): number {
    return state.pageScaleRatio
  },
  getIsSettingScaleRatio(state: IEditorState): boolean {
    return state.isSettingScaleRatio
  },
  getLayer(state: IEditorState) {
    return (pageIndex: number, layerIndex: number): IShape | IText | IImage | IGroup | IFrame | undefined => {
      const page = state.pages[pageIndex]
      return page?.layers[layerIndex] ?? {}
    }
  },
  getLayers(state: IEditorState) {
    return (pageIndex: number): Array<IShape | IText | IImage | IGroup | IFrame> => {
      return state.pages[pageIndex] ? state.pages[pageIndex].layers : []
    }
  },
  getLayersNum(state: IEditorState) {
    return (pageIndex = state.middlemostPageIndex): number => {
      return state.pages[pageIndex].layers.length
    }
  },
  getBackgroundImage(state: IEditorState) {
    return (pageIndex: number) => {
      return state.pages[pageIndex].backgroundImage
    }
  },
  getBackgroundColor(state: IEditorState) {
    return (pageIndex: number) => {
      return state.pages[pageIndex].backgroundColor
    }
  },
  getMiddlemostPageIndex(state: IEditorState): number {
    return state.middlemostPageIndex
  },
  getCurrActivePageIndex(state: IEditorState): number {
    return state.currActivePageIndex
  },
  getCurrFocusPageIndex(state: IEditorState): number {
    const { pageIndex } = state.currSelectedInfo
    return pageIndex >= 0 ? pageIndex
      : state.currActivePageIndex >= 0
        ? state.currActivePageIndex : state.middlemostPageIndex
  },
  getCurrHoveredPageIndex(state: IEditorState): number {
    return state.currHoveredPageIndex
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
    types: Set<string>,
    id: string
  } {
    return state.currSelectedInfo
  },
  getCurrSubSelectedInfo(state: IEditorState): ICurrSubSelectedInfo {
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
  getCurrSelectedResInfo(state: IEditorState) {
    return state.currSelectedResInfo
  },
  getAsset(state: IEditorState) {
    return (id: string) => state.asset[id]
  },
  getTextInfo(state: IEditorState) {
    return state.textInfo
  },
  getShowRuler(state: IEditorState) {
    return state.showRuler
  },
  getShowGuideline(state: IEditorState) {
    return state.showGuideline
  },
  getLockGuideline(state: IEditorState) {
    return state.lockGuideline
  },
  getThemes(state: IEditorState) {
    return state.themes
  },
  getEditThemes(state: IEditorState) {
    return state.themes.filter(theme => {
      return theme.editHidden === 0
    })
  },
  getHasCopiedFormat(state: IEditorState) {
    return state.hasCopiedFormat
  },
  getInGestureToolMode(state: IEditorState) {
    return state.inGestureToolMode
  },
  getIsGlobalLoading(state: IEditorState) {
    return state.isGlobalLoading
  },
  getUseMobileEditor(state: IEditorState) {
    return state.useMobileEditor
  },
  getContentScaleRatio(state: IEditorState) {
    return state.defaultContentScaleRatio
  }
}

const mutations: MutationTree<IEditorState> = {
  SET_pages(state: IEditorState, newPages: Array<IPage> | { name: string, pages: Array<IPage>, loadDesign: boolean, groupId: string, groupType: number, exportIds: string }) {
    groupUtils.reset()
    if (Array.isArray(newPages)) {
      state.pages = newPages
    } else {
      state.pages = newPages.loadDesign ? pageUtils.newPages(newPages.pages) : newPages.pages
      state.groupId = newPages.groupId || state.groupId
      state.groupType = newPages.groupType || state.groupType
      state.exportIds = newPages.exportIds || state.exportIds
    }
    // reset page index
    state.middlemostPageIndex = 0
    state.currActivePageIndex = -1
  },
  SET_pageToPos(state: IEditorState, updateInfo: { newPage: IPage, pos: number }) {
    state.pages.splice(updateInfo.pos, 1, updateInfo.newPage)
  },
  ADD_page(state: IEditorState, newPage: IPage) {
    state.pages.push(newPage)
  },
  ADD_pageToPos(state: IEditorState, updateInfo: { newPage: IPage, pos: number }) {
    state.pages = state.pages.slice(0, updateInfo.pos).concat(updateInfo.newPage, state.pages.slice(updateInfo.pos))
  },
  DELETE_page(state: IEditorState, pageIndex: number) {
    state.pages = state.pages.slice(0, pageIndex).concat(state.pages.slice(pageIndex + 1))
    /**
     * @Note the reason why I replace the splice method is bcz its low performance
     */
    //  state.pages.splice(pageIndex, 1)
  },
  SET_pagesName(state: IEditorState, name: string) {
    state.name = name
  },
  SET_designId(state: IEditorState, designId: string) {
    state.designId = designId
  },
  SET_assetId(state: IEditorState, assetId: string) {
    state.assetId = assetId
  },
  SET_assetIndex(state: IEditorState, assetIndex: number) {
    state.assetIndex = assetIndex
  },
  SET_groupId(state: IEditorState, groupId: string) {
    state.groupId = groupId
  },
  ADD_exportIds(state: IEditorState, exportId: string) {
    const exportIds = state.exportIds.split(',').filter((id) => id.length !== 0)
    exportIds.push(exportId)
    if (exportIds.length > 10) {
      exportIds.shift()
    }
    state.exportIds = exportIds.join(',')
  },
  SET_groupType(state: IEditorState, groupType: number) {
    console.log('SET_groupType')
    state.groupType = groupType
  },
  SET_folderInfo(state: IEditorState, folderInfo: { isRoot: boolean, parentFolder: string, path: string }) {
    Object.assign(state.folderInfo, folderInfo)
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
  SET_mobileSidebarPanelOpen(state: IEditorState, value: boolean) {
    state.mobileSidebarPanelOpen = value
  },
  SET_currFunctionPanelType(state: IEditorState, type: FunctionPanelType) {
    state.currFunctionPanelType = type
  },
  SET_pageScaleRatio(state: IEditorState, ratio: number) {
    state.pageScaleRatio = ratio
  },
  SET_isSettingScaleRatio(state: IEditorState, isSettingScaleRatio: boolean) {
    state.isSettingScaleRatio = isSettingScaleRatio
  },
  SET_middlemostPageIndex(state: IEditorState, index: number) {
    state.middlemostPageIndex = index
  },
  SET_currActivePageIndex(state: IEditorState, index: number) {
    state.currActivePageIndex = index
  },
  SET_lastSelectedLayerIndex(state: IEditorState, index: number) {
    state.lastSelectedLayerIndex = index
  },
  SET_currHoveredPageIndex(state: IEditorState, index: number) {
    state.currHoveredPageIndex = index
  },
  SET_backgroundColor(state: IEditorState, updateInfo: { pageIndex: number, color: string }) {
    state.pages[updateInfo.pageIndex].backgroundColor = updateInfo.color
    state.pages[updateInfo.pageIndex].backgroundImage.config.srcObj = { type: '', userId: '', assetId: '' }
  },
  SET_backgroundImage(state: IEditorState, updateInfo: { pageIndex: number, config: IImage }) {
    // state.pages[updateInfo.pageIndex].backgroundImage.config = updateInfo.config
    const { pageIndex, config } = updateInfo
    Object.assign(state.pages[pageIndex].backgroundImage.config, config)
    // state.pages[pageIndex].backgroundColor = '#ffffff'
  },
  SET_backgroundImageSrc(state: IEditorState, updateInfo: { pageIndex: number, srcObj: any, previewSrc: '' }) {
    Object.assign(state.pages[updateInfo.pageIndex].backgroundImage.config.srcObj, updateInfo.srcObj)
    updateInfo.previewSrc && (state.pages[updateInfo.pageIndex].backgroundImage.config.previewSrc = updateInfo.previewSrc)
    // state.pages[updateInfo.pageIndex].backgroundColor = '#ffffff'
  },
  SET_backgroundImagePos(state: IEditorState, updateInfo: { pageIndex: number, imagePos: { x: number, y: number } }) {
    state.pages[updateInfo.pageIndex].backgroundImage.posX = updateInfo.imagePos.x
    state.pages[updateInfo.pageIndex].backgroundImage.posY = updateInfo.imagePos.y
  },
  SET_backgroundImageStyles(state: IEditorState, updateInfo: { pageIndex: number, styles: Partial<IImageStyle> }) {
    const { pageIndex, styles } = updateInfo
    Object.assign(state.pages[pageIndex].backgroundImage.config.styles, styles)
  },
  SET_backgroundImageMode(state: IEditorState, updateInfo: { pageIndex: number, newDisplayMode: boolean }) {
    state.pages[updateInfo.pageIndex].backgroundImage.newDisplayMode = updateInfo.newDisplayMode
  },
  SET_backgroundImageControl(state: IEditorState, updateInfo: { pageIndex: number, imgControl: boolean }) {
    state.pages[updateInfo.pageIndex].backgroundImage.config.imgControl = updateInfo.imgControl
  },
  SET_allBackgroundImageControl(state: IEditorState, imgControl: boolean) {
    state.pages.forEach((page) => {
      page.backgroundImage.config.imgControl = imgControl
    })
  },
  SET_backgroundOpacity(state: IEditorState, updateInfo: { pageIndex: number, opacity: number }) {
    state.pages[updateInfo.pageIndex].backgroundImage.config.styles.opacity = updateInfo.opacity
  },
  REMOVE_background(state: IEditorState, updateInfo: { pageIndex: number }) {
    state.pages[updateInfo.pageIndex].backgroundColor = '#ffffff'
    state.pages[updateInfo.pageIndex].backgroundImage.config.srcObj = { type: '', userId: '', assetId: '' }
    state.pages[updateInfo.pageIndex].backgroundImage.config.styles.opacity = 100
  },
  SET_pageIsModified(state: IEditorState, { pageIndex, modified }) {
    state.pages[pageIndex].modified = modified
  },
  SET_textInfo(state: IEditorState, textInfo: { [key: string]: Array<string> }) {
    Object.entries(textInfo).forEach(([k, v]) => {
      if (Object.keys(state.textInfo).includes(k)) {
        Object.assign(state.textInfo, { [k]: v })
      }
    })
  },
  SET_currDraggedPhoto(state: IEditorState, photo: { srcObj: SrcObj, styles: { width: number, height: number }, isPreview: boolean, previewSrc: string, isTransparent: boolean }) {
    if (photo.srcObj) {
      state.currDraggedPhoto.srcObj = {
        ...state.currDraggedPhoto.srcObj,
        ...photo.srcObj
      }
    }
    if (photo.styles) {
      state.currDraggedPhoto.styles = {
        ...state.currDraggedPhoto.styles,
        ...photo.styles
      }
    }
    if (typeof photo.isPreview !== 'undefined') {
      state.currDraggedPhoto.isPreview = photo.isPreview
    }
    if (photo.previewSrc) {
      state.currDraggedPhoto.previewSrc = photo.previewSrc
    }
    if (typeof photo.isTransparent !== 'undefined') {
      state.currDraggedPhoto.isTransparent = photo.isTransparent
    }
  },
  SET_hasCopiedFormat(state: IEditorState, value: boolean) {
    state.hasCopiedFormat = value
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
  DELETE_subLayer(state: IEditorState, updateInfo: { pageIndex: number, primaryIndex: number, subIndex: number }) {
    const { pageIndex, primaryIndex, subIndex } = updateInfo
    const { currSelectedInfo, pages } = state
    const targetLayer = pages[pageIndex].layers[primaryIndex] as IGroup | ITmp
    targetLayer.layers.splice(subIndex, 1)
    // currSelectedInfo.layers.splice(subIndex, 1)
    // currSelectedInfo.types = groupUtils.calcType(currSelectedInfo.layers)
  },
  REPLACE_layer(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, layer: IShape | IGroup | IImage | IText }) {
    const { pageIndex, layerIndex, layer } = updateInfo
    state.pages[pageIndex].layers.splice(layerIndex, 1, layer)
  },
  UPDATE_layerProps(state: IEditorState, updateInfo: {
    pageIndex: number, layerIndex: number, props: {
      [key: string]: string | number | boolean | IParagraph
      | Array<string> | Array<IShape | IText | IImage | IGroup> | number[] | SrcObj
    }
  }) {
    /**
     * This Mutation is used to update the layer's properties excluding styles
     */
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      if (state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex]) {
        state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex][k] = v
      }
    })
  },
  UPDATE_subLayerProps(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, targetIndex: number, props: { [key: string]: string | number | boolean | IParagraph | SrcObj } }) {
    const groupLayer = state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex] as IGroup
    if (!groupLayer || !groupLayer.layers) return
    const targetLayer = groupLayer.layers[updateInfo.targetIndex]
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      targetLayer[k] = v
    })
  },
  UPDATE_frameLayerProps(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, targetIndex: number, props: { [key: string]: string | number | boolean | SrcObj } }) {
    const frame = state.pages[updateInfo.pageIndex].layers[updateInfo.layerIndex] as IFrame
    const targetLayer = frame.clips[updateInfo.targetIndex]
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      targetLayer[k] = v
    })
  },
  UPDATE_groupLayerProps(state: IEditorState, updateInfo: { props: { [key: string]: string | number | boolean | number[] } }) {
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      (state.pages[state.middlemostPageIndex].layers[state.currSelectedInfo.index] as IGroup).layers.forEach((layer: IShape | IText | IImage | IGroup) => {
        layer[k] = v
      })
    })
  },
  UPDATE_selectedLayerProps(state: IEditorState, updateInfo: { pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean | Array<string> } }) {
    Object.entries(updateInfo.props).forEach(([k, v]) => {
      (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers[updateInfo.layerIndex][k] = v
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
    const layer = state.pages[updateInfo.pageIndex].layers[state.currSelectedInfo.index]
    if (layer) {
      Object.entries(updateInfo.styles).forEach(([k, v]) => {
        if (typeof v === 'number') {
          (layer.styles[k] as number) += v
        } else {
          layer.styles[k] = v
        }
      })
    }
  },
  UPDATE_groupLayerStyles(state: IEditorState, updateInfo: { styles: { [key: string]: string | number } }) {
    Object.entries(updateInfo.styles).forEach(([k, v]) => {
      (state.pages[state.middlemostPageIndex].layers[state.currSelectedInfo.index] as IGroup).layers.forEach((layer: IShape | IText | IImage | IGroup) => {
        layer.styles[k] = v
      })
    })
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
    if ((state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).type === 'group') {
      state.currSelectedInfo.layers = [state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp]
    } else {
      state.currSelectedInfo.layers = (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers
    }
  },
  UPDATE_selectedTextParagraphs(state: IEditorState, updateInfo: { tmpLayerIndex: number, paragraphs: [IParagraph] }) {
    ((state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers[updateInfo.tmpLayerIndex] as IText).paragraphs = updateInfo.paragraphs
    if ((state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).type === 'group') {
      state.currSelectedInfo.layers = [state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp]
    } else {
      state.currSelectedInfo.layers = (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers
    }
  },
  UPDATE_tmpLayersZindex(state: IEditorState) {
    const tmpLayer = state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp
    tmpLayer.layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      layer.styles.zindex = state.currSelectedInfo.index + 1
    })
    Object.assign(state.currSelectedInfo, {
      layers: (state.pages[state.currSelectedInfo.pageIndex].layers[state.currSelectedInfo.index] as ITmp).layers
    })
  },
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
  SET_currSelectedInfo(state: IEditorState, data: { index: number, layers: Array<IShape | IText | IImage | IGroup | ITmp | IFrame>, types: Set<string> }) {
    Object.assign(state.currSelectedInfo, data)
  },
  SET_currSubSelectedInfo(state: IEditorState, data: { index: number, type: string }) {
    Object.assign(state.currSubSelectedInfo, data)
  },
  SET_isColorPanelOpened(state: IEditorState, isOpened: boolean) {
    state.isColorPanelOpened = isOpened
  },
  SET_currSelectedResInfo(state: IEditorState, data: { userName: string, userLink: string, vendor: string, tags: string[] }) {
    state.currSelectedResInfo = data
  },
  SET_subLayerStyles(state: IEditorState, data: { pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: any }) {
    const { pageIndex, primaryLayerIndex, subLayerIndex, styles } = data
    const layers = state.pages[pageIndex].layers[primaryLayerIndex].layers as (IShape | IText | IImage)[]
    Object.assign(layers[subLayerIndex].styles, styles)
  },
  SET_frameLayerStyles(state: IEditorState, data: { pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: any }) {
    const { pageIndex, primaryLayerIndex, subLayerIndex, styles } = data
    const layers = state.pages[pageIndex].layers[primaryLayerIndex].clips as IImage[]
    Object.assign(layers[subLayerIndex].styles, styles)
  },
  SET_frameLayerAllClipsStyles(state: IEditorState, data: { pageIndex: number, primaryLayerIndex: number, styles: any }) {
    const { pageIndex, primaryLayerIndex, styles } = data
    const layers = state.pages[pageIndex].layers[primaryLayerIndex].clips as IImage[]
    for (const clip of layers) {
      Object.assign(clip.styles, generalUtils.deepCopy(styles))
    }
  },
  SET_subFrameLayerStyles(state: IEditorState, data: { pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, targetIndex: number, styles: any }) {
    const { pageIndex, primaryLayerIndex, subLayerIndex, targetIndex, styles } = data
    const groupLayer = state.pages[pageIndex].layers[primaryLayerIndex] as IGroup
    if (groupLayer.type === 'group') {
      const clipsLayer = groupLayer.layers[subLayerIndex].clips as IImage[]
      Object.assign(clipsLayer[targetIndex].styles, styles)
    }
  },
  SET_frameDecorColors(state: IEditorState, data: { pageIndex: number, layerIndex: number, subLayerIdx: number, payload: any }) {
    const { pageIndex, layerIndex, subLayerIdx, payload } = data
    const { decorationColors, decorationTopColors } = payload
    const targetLayer = subLayerIdx === -1 ? state.pages[pageIndex].layers[layerIndex] : (state.pages[pageIndex].layers[layerIndex] as IGroup).layers[subLayerIdx]
    decorationColors && ((targetLayer.decoration as IShape).color = decorationColors)
    decorationTopColors && ((targetLayer.decorationTop as IShape).color = decorationTopColors)
  },
  SET_subFrameLayerAllClipsStyles(state: IEditorState, data: { pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: any }) {
    const { pageIndex, primaryLayerIndex, subLayerIndex, styles } = data
    const groupLayer = state.pages[pageIndex].layers[primaryLayerIndex] as IGroup
    if (groupLayer.type === 'group') {
      const clipsLayer = groupLayer.layers[subLayerIndex].clips as IImage[]
      for (const clip of clipsLayer) {
        Object.assign(clip.styles, generalUtils.deepCopy(styles))
      }
    }
  },
  SET_assetJson(state: IEditorState, json: { [key: string]: any }) {
    Object.keys(json)
      .forEach(id => {
        Object.assign(state.asset, { [id]: json[id] })
      })
  },
  SET_moving(state: IEditorState, isMoving: boolean) {
    state.isMoving = isMoving
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
          props && Object.assign(targetLayer.layers[idx], generalUtils.deepCopy(props))
          styles && Object.assign(targetLayer.layers[idx].styles, generalUtils.deepCopy(styles))
        }
      })
    } else {
      props && Object.assign(targetLayer, props)
      styles && Object.assign(targetLayer.styles, styles)
    }
  },
  DELETE_previewSrc(state: IEditorState, { type, userId, assetId, assetIndex }) {
    state.pages.forEach((page: IPage, index: number) => {
      page.layers.filter((layer: IShape | IText | IImage | IGroup | IFrame, index: number) => {
        return layer.type === 'image' && (layer as IImage).srcObj.assetId === assetId && layer.previewSrc
      }).forEach((layer) => {
        Vue.delete(layer, 'previewSrc')
        Object.assign((layer as IImage).srcObj, {
          type,
          userId,
          assetId: uploadUtils.isAdmin ? assetId : assetIndex
        })

        uploadUtils.uploadDesign()
      })
    })
  },
  ADD_guideline(state: IEditorState, updateInfo: { pos: number, type: string, pageIndex?: number }) {
    const { pos, type, pageIndex } = updateInfo
    const { pages } = state
    const currFocusPageIndex = pageIndex !== undefined ? pageIndex : pageUtils.currFocusPageIndex
    switch (type) {
      case 'v': {
        pages[currFocusPageIndex].guidelines.v.push(pos)
        break
      }
      case 'h': {
        pages[currFocusPageIndex].guidelines.h.push(pos)
        break
      }
    }
  },
  SET_guideline(state: IEditorState, { guidelines, pageIndex }) {
    const { pages } = state
    const currFocusPageIndex = pageIndex ?? pageUtils.currFocusPageIndex
    pages[currFocusPageIndex].guidelines = guidelines
  },
  DELETE_guideline(state: IEditorState, updateInfo: { pageIndex: number, index: number, type: string }) {
    const { pageIndex, index, type } = updateInfo
    const { pages } = state
    pages[pageIndex].guidelines[type].splice(index, 1)
  },
  CLEAR_guideline(state: IEditorState) {
    const { pages } = state
    const currFocusPageIndex = pageUtils.currFocusPageIndex
    pages[currFocusPageIndex].guidelines.v = []
    pages[currFocusPageIndex].guidelines.h = []
  },
  SET_showRuler(state: IEditorState, bool: boolean) {
    state.showRuler = bool
  },
  SET_showGuideline(state: IEditorState, bool: boolean) {
    state.showGuideline = bool
  },
  SET_lockGuideline(state: IEditorState, bool: boolean) {
    state.lockGuideline = bool
  },
  CLEAR_pagesInfo(state: IEditorState) {
    state.designId = ''
    state.assetId = ''
    state.groupId = ''
    state.groupType = -1
    state.name = ''
    state.exportIds = ''
    Object.assign(state.folderInfo, {
      isRoot: true,
      parentFolder: '',
      path: 'root'
    })
  },
  SET_documentColors(state: IEditorState, data: { pageIndex: number, colors: Array<{ color: string, count: number }> }) {
    state.pages[data.pageIndex].documentColors = [...generalUtils.deepCopy(data.colors)]
  },
  UPDATE_documentColors(state: IEditorState, payload: { pageIndex: number, color: string }) {
    state.pages[payload.pageIndex].documentColors = getDocumentColor(payload.pageIndex, payload.color)
  },
  SET_themes(state: IEditorState, themes: Itheme[]) {
    state.themes = themes
  },
  UPDATE_frameClipSrc(state: IEditorState, data: { pageIndex: number, layerIndex: number, subLayerIndex: number, srcObj: { [key: string]: string | number } }) {
    const { pageIndex, subLayerIndex, layerIndex, srcObj } = data
    Object.assign((state as any).pages[pageIndex].layers[layerIndex].clips[subLayerIndex].srcObj, srcObj)
  },
  CLEAR_state(state: IEditorState) {
    Object.assign(state, getDefaultState())
  },
  SET_inGestureMode(state: IEditorState, bool: boolean) {
    state.inGestureToolMode = bool
  },
  SET_isGlobalLoading(state: IEditorState, bool: boolean) {
    state.isGlobalLoading = bool
  },
  SET_useMobileEditor(state: IEditorState, bool: boolean) {
    state.useMobileEditor = bool
  },
  ...imgShadowMutations,
  ADD_subLayer
}

function handleResize() {
  state.isMobile = window.matchMedia('screen and (max-width: 768px)').matches
  state.isLargeDesktop = window.matchMedia('screen and (min-width: 1440px)').matches
}

window.addEventListener('resize', handleResize)
handleResize()

export default new Vuex.Store({
  state,
  getters,
  mutations,
  modules: {
    user,
    photos,
    text,
    font,
    color,
    objects,
    textStock,
    background,
    mobileEditor,
    modal,
    popup,
    page,
    markers,
    bgRemove,
    shadow,
    vivisticker,
    fontTag,
    imgControl
  }
})
