import { ICurrSelectedInfo } from '@/interfaces/editor'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp } from '@/interfaces/layer'
import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import ZindexUtils from '@/utils/zindexUtils'
import { Editor } from '@tiptap/vue-3'
import { nextTick } from 'vue'
import frameUtils from './frameUtils'
import layerFactary from './layerFactary'
import logUtils from './logUtils'
import pageUtils from './pageUtils'
import picWVUtils from './picWVUtils'
import ShapeUtils from './shapeUtils'
import TextPropUtils from './textPropUtils'
import TextUtils from './textUtils'
import tiptapUtils from './tiptapUtils'
import uploadUtils from './uploadUtils'

class ShortcutUtils {
  copySourcePageIndex: number
  prevPasteTargetPageIndex: number
  prevLayerId: string
  offsetCount: number

  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }

  get currSelectedPageIndex() {
    return store.getters.getCurrSelectedPageIndex
  }

  get currSelectedLayerIndex() {
    return store.getters.getCurrSelectedIndex
  }

  get currSelectedLayerStyles() {
    return layerUtils.getSelectedLayer().styles
  }
  // target: HTMLElement
  // constructor(target: HTMLElement) {
  //   this.target = target
  // }

  constructor() {
    this.copySourcePageIndex = -1
    this.prevPasteTargetPageIndex = -1
    this.prevLayerId = ''
    this.offsetCount = 0
  }

  private regenerateLayerInfo(_layer: IText | IShape | IImage | IGroup | ITmp | IFrame, props: { toCenter?: boolean, offset?: number, targetPageIndex?: number }) {
    const { toCenter = false, offset = 10, targetPageIndex } = props
    let layer = GeneralUtils.deepCopy(_layer)
    if (toCenter && targetPageIndex !== undefined) {
      layer = layerUtils.resizeLayerConfig(targetPageIndex, GeneralUtils.deepCopy(layer), true)
      layer.styles.x += offset * this.offsetCount
      layer.styles.y += offset * this.offsetCount
    } else {
      layer.styles.x += offset * this.offsetCount
      layer.styles.y += offset * this.offsetCount
    }

    if (layerUtils.isOutOfBoundary(targetPageIndex, layer)) {
      layer.styles.x -= offset * this.offsetCount
      layer.styles.y -= offset * this.offsetCount
      this.offsetCount = 0
    }

    layer.id = GeneralUtils.generateRandomString(8)
    layer.shown = false

    switch (layer.type) {
      case 'image':
        layer.imgControl = false
        return layerFactary.newImage(layer)
      case 'shape':
        layer.className = ShapeUtils.classGenerator()
        return layerFactary.newShape(layer)
      case 'group':
        layer.layers
          .forEach(l => {
            if (l.type === 'shape') {
              l.className = ShapeUtils.classGenerator()
            }
            l.id = GeneralUtils.generateRandomString(8)
          })
        return layerFactary.newGroup(layer as IGroup, (layer as IGroup).layers)
      case 'tmp':
        layer.layers
          .forEach(l => {
            if (l.type === 'shape') {
              l.className = ShapeUtils.classGenerator()
            }
            l.id = GeneralUtils.generateRandomString(8)
          })
        return layerFactary.newTmp((layer as ITmp).styles as ICalculatedGroupStyle, (layer as ITmp).layers)
      case 'text':
        return layerFactary.newText(layer as IText)
      case 'frame':
        return layerFactary.newFrame(layer as IFrame)
    }
  }

  async getClipboardContents(): Promise<string | undefined> {
    try {
      const clipboardItems = await (navigator.clipboard as any).read()

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          const blob = await clipboardItem.getType(type)

          // we can now use blob here
          if (blob.type.includes('image')) {
            uploadUtils.uploadScreenShotImage(blob)
            return 'image'
          } else if (blob.type.includes('text')) {
            return 'text'
          }
        }
      }

      return ''
    } catch (err) {
      console.error(err)
    }
  }

  // private getClipboardData(){
  //   const inputNode = document.createElement('input')
  //   inputNode.setAttribute('type', 'text')
  //   inputNode.focus()
  // }
  get scaleRatio(): number { return store.getters.getPageScaleRatio }

  async copy() {
    const { index, layers, pageIndex } = layerUtils.currSelectedInfo
    this.prevPasteTargetPageIndex = -1
    if (index >= 0 && !layerUtils.getSelectedLayer().locked) {
      const layer = store.getters.getLayer(pageIndex, index) as ILayer
      if (this.prevLayerId !== layer.id) {
        this.offsetCount = 0
        this.prevLayerId = layer.id
      }
      await navigator.clipboard.writeText(JSON.stringify(GeneralUtils.deepCopy(layer)))
      this.copySourcePageIndex = pageIndex
      // store.commit('SET_clipboard', GeneralUtils.deepCopy(store.getters.getLayer(store.getters.getCurrSelectedPageIndex, store.getters.getCurrSelectedIndex)))
    } else {
      console.warn('You did\'t select any unlocked layer')
    }
  }

  async paste(evt?: Event) {
    const type = await this.getClipboardContents()
    if (type === 'image') {
      return
    }

    const text = await navigator.clipboard.readText()

    if (!GeneralUtils.isJsonString(text)) {
      return
    }

    const { currFocusPageIndex, currHoveredPageIndex } = pageUtils
    const targetPageIndex = currHoveredPageIndex >= 0 ? currHoveredPageIndex : currFocusPageIndex

    if (targetPageIndex === this.copySourcePageIndex) {
      if (this.prevPasteTargetPageIndex !== -1 && this.prevPasteTargetPageIndex !== targetPageIndex) {
        this.offsetCount = 0
      }
      this.offsetCount++
    } else {
      if (this.prevPasteTargetPageIndex !== targetPageIndex) {
        this.offsetCount = 0
      } else {
        this.offsetCount++
      }
    }

    const clipboardInfo = [JSON.parse(text)].map((layer: IText | IShape | IImage | IGroup | ITmp) => {
      let toCenterResizeFlag = false

      if (this.copySourcePageIndex !== targetPageIndex) {
        const intersectRatio = layerUtils.getLayerPageIntersectRatio(targetPageIndex, layer)
        const prevIntersectRatio = this.copySourcePageIndex !== -1 ? layerUtils.getLayerPageIntersectRatio(this.copySourcePageIndex, layer) : 1

        if (intersectRatio === 1 || intersectRatio === prevIntersectRatio) {
          toCenterResizeFlag = false
        } else {
          toCenterResizeFlag = true
        }
      }

      return this.regenerateLayerInfo(layer, { toCenter: toCenterResizeFlag, targetPageIndex })
    })

    const isTmp: boolean = clipboardInfo[0].type === 'tmp'

    if (store.getters.getCurrSelectedIndex >= 0 && targetPageIndex === store.getters.getCurrSelectedPageIndex) {
      const tmpIndex = store.getters.getCurrSelectedIndex
      const tmpLayers = store.getters.getCurrSelectedLayers
      const tmpLayersNum = isTmp ? tmpLayers.length : 1
      GroupUtils.deselect()
      if (isTmp) {
        store.commit('ADD_layersToPos', { pageIndex: targetPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(targetPageIndex, tmpIndex + tmpLayersNum, GeneralUtils.deepCopy(clipboardInfo[0].layers) as Array<IShape | IText | IImage | IGroup | IFrame>)
      } else {
        store.commit('ADD_layersToPos', { pageIndex: targetPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(targetPageIndex, tmpIndex + tmpLayersNum, [...GeneralUtils.deepCopy(clipboardInfo)] as (IShape | IText | IImage | IGroup | IFrame)[])
      }
      ZindexUtils.reassignZindex(targetPageIndex)
    } else {
      if (store.getters.getCurrSelectedIndex >= 0) {
        GroupUtils.deselect()
      }
      if (isTmp) {
        store.commit('ADD_newLayers', { pageIndex: targetPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(targetPageIndex, store.getters.getLayersNum(targetPageIndex) - 1, GeneralUtils.deepCopy(clipboardInfo[0].layers) as Array<IShape | IText | IImage | IGroup | IFrame>)
      } else {
        store.commit('ADD_newLayers', { pageIndex: targetPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(targetPageIndex, store.getters.getLayersNum(targetPageIndex) - 1, [...GeneralUtils.deepCopy(clipboardInfo)] as (IShape | IText | IImage | IGroup | IFrame)[])
      }
      ZindexUtils.reassignZindex(targetPageIndex)
    }

    this.prevPasteTargetPageIndex = targetPageIndex

    nextTick(() => {
      StepsUtils.record()
    })
  }

  duplicate() {
    const { getCurrLayer: currLayer } = layerUtils
    this.offsetCount = 1
    const newLayer = this.regenerateLayerInfo(GeneralUtils.deepCopy(currLayer) as IShape | IText | IImage | IGroup | IFrame | ITmp, {})
    this.offsetCount = 0

    const currActivePageIndex = pageUtils.currActivePageIndex
    const isTmp: boolean = currLayer.type === 'tmp'
    if (store.getters.getCurrSelectedIndex >= 0 && currActivePageIndex === store.getters.getCurrSelectedPageIndex) {
      const tmpIndex = store.getters.getCurrSelectedIndex
      const tmpLayers = store.getters.getCurrSelectedLayers
      const tmpLayersNum = isTmp ? tmpLayers.length : 1
      GroupUtils.deselect()
      if (newLayer.type === 'tmp') {
        store.commit('ADD_layersToPos', { pageIndex: currActivePageIndex, layers: [newLayer], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(currActivePageIndex, tmpIndex + tmpLayersNum, GeneralUtils.deepCopy(newLayer.layers as Array<IShape | IText | IImage | IGroup | IFrame>))
      } else {
        store.commit('ADD_layersToPos', { pageIndex: currActivePageIndex, layers: [newLayer], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(currActivePageIndex, tmpIndex + tmpLayersNum, [newLayer])
      }
      ZindexUtils.reassignZindex(currActivePageIndex)
    } else {
      const currFocusPageIndex = store.getters.currFocusPageIndex
      if (store.getters.getCurrSelectedIndex >= 0) {
        GroupUtils.deselect()
      }
      if (newLayer.type === 'tmp') {
        store.commit('ADD_newLayers', { pageIndex: currFocusPageIndex, layers: [newLayer] })
        GroupUtils.set(currFocusPageIndex, store.getters.getLayersNum(currFocusPageIndex) - 1, GeneralUtils.deepCopy(newLayer.layers as Array<IShape | IText | IImage | IGroup | IFrame>))
      } else {
        store.commit('ADD_newLayers', { pageIndex: currFocusPageIndex, layers: [newLayer] })
        GroupUtils.set(currFocusPageIndex, store.getters.getLayersNum(currFocusPageIndex) - 1, [newLayer])
      }
      ZindexUtils.reassignZindex(currFocusPageIndex)
    }
    StepsUtils.record()
  }

  altDuplicate(targetPageIndex: number, targetLayerIndex: number, config: ILayer) {
    const ori_config = config as any
    const newLayer = this.regenerateLayerInfo(GeneralUtils.deepCopy(config as IShape | IText | IImage | IGroup | IFrame), { offset: 0 })
    newLayer.active = false

    const isTmp: boolean = newLayer.type === 'tmp'
    const { index, layers } = layerUtils.currSelectedInfo
    const currFocusPageIndex = pageUtils.currFocusPageIndex

    const tmpIndex = index
    const tmpLayersNum = isTmp ? layers.length : 1

    if (newLayer.type === 'tmp') {
      // const layers2Page = GroupUtils.mapLayersToPage(layers, config as ITmp)
      // store.commit('ADD_layersToPos', { pageIndex: currFocusPageIndex, layers: [...layers2Page], pos: tmpIndex })
      // GroupUtils.set(currFocusPageIndex, tmpIndex + tmpLayersNum, [newLayer])
      return
    } else {
      store.commit('ADD_layersToPos', { pageIndex: currFocusPageIndex, layers: [newLayer], pos: tmpIndex })
      GroupUtils.set(currFocusPageIndex, tmpIndex + 1, [ori_config])
    }
    ZindexUtils.reassignZindex(currFocusPageIndex)
  }

  textCopy() {
    const sel = window.getSelection()
    if (sel) {
      navigator.clipboard.writeText(sel.toString().replace(/\n\n/g, '\n'))
    }
  }

  textCut() {
    const sel = window.getSelection()
    if (sel) {
      navigator.clipboard.writeText(sel.toString().replace(/\n\n/g, '\n'))
      tiptapUtils.agent(editor => {
        editor.commands.deleteSelection()
        layerUtils.updatecCurrTypeLayerProp({ isEdited: true })
      })
    }
  }

  textPasteWith(text: string) {
    tiptapUtils.agent(editor => {
      text = text.replace(/\r/g, '')
      const spans = text.split('\n')
      let chainedCommands = editor.chain().deleteSelection()
      spans.forEach((line, index) => {
        chainedCommands = chainedCommands.insertPlainText(line)
        if (index !== spans.length - 1) {
          chainedCommands = chainedCommands.enter()
        }
      })
      editor.storage.nuTextStyle.pasting = true
      chainedCommands.run()
      editor.storage.nuTextStyle.pasting = false
      nextTick(() => {
        editor.commands.scrollIntoView()
      })
      layerUtils.updatecCurrTypeLayerProp({ isEdited: true })
    })
  }

  textPaste() {
    navigator.clipboard.readText().then((text) => {
      this.textPasteWith(text)
    })
  }

  textSelectAll(layerIndex?: number) {
    const text = document.getElementById(`text-${layerIndex ?? layerUtils.layerIndex}`) as HTMLElement
    const sel = window.getSelection()
    const range = new Range()
    if (sel) {
      range.selectNodeContents(text)
      sel.removeAllRanges()
      sel.addRange(range)
      const config = layerUtils.getCurrLayer as IText

      const pIndex = config.paragraphs.length - 1
      const sIndex = config.paragraphs[pIndex].spans.length - 1
      const offset = config.paragraphs[pIndex].spans[sIndex].text.length

      TextUtils.updateSelection({ pIndex: 0, sIndex: 0, offset: 0 }, { pIndex, sIndex, offset })
      TextPropUtils.updateTextPropsState()
    }
  }

  del() {
    let currLayer = layerUtils.getCurrLayer
    switch (currLayer.type) {
      case 'frame':
        currLayer = currLayer as IFrame
        if (currLayer.clips.some(img => img.active)) {
          const idx = currLayer.clips.findIndex(img => img.active)
          if (currLayer.clips[idx].srcObj.type === 'frame') {
            layerUtils.deleteSelectedLayer()
            return
          }
          const clips = GeneralUtils.deepCopy(currLayer.clips) as Array<IImage>
          if (clips[idx].imgControl) {
            frameUtils.updateFrameLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, idx, { imgControl: false })
            return
          }
          clips[idx].srcObj = {
            type: 'frame',
            assetId: '',
            userId: ''
          }
          layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { clips })
          StepsUtils.record()
          return
        }
        break
    }

    layerUtils.deleteSelectedLayer()
  }

  cut() {
    this.copy()
    this.del()
  }

  async save() {
    if (TextUtils.isFontLoading) return
    await uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
    picWVUtils.ratingRequest('save_file')
    logUtils.uploadLog()
  }

  selectAll() {
    GroupUtils.selectAll()
  }

  deselect() {
    GroupUtils.deselect()
  }

  group() {
    GroupUtils.group()
  }

  ungroup() {
    GroupUtils.ungroup()
  }

  async undo() {
    if (!StepsUtils.isInFirstStep) {
      const currLayer = layerUtils.getCurrLayer
      if (currLayer) {
        switch (currLayer.type) {
          case 'frame':
            if ((currLayer as IFrame).clips.some(img => img.imgControl)) {
              return
            }
            break
          case 'group':
            if ((currLayer as IGroup).layers.some(l => l.type === 'image' && l.imgControl)) {
              return
            }
            break
          case 'image':
            if (currLayer.imgControl) {
              return
            }
        }
      }
      await StepsUtils.undo()
      nextTick(() => {
        tiptapUtils.agent(editor => {
          const currLayer = layerUtils.getCurrLayer
          let textLayer = currLayer
          if (!currLayer.active) return
          if (currLayer.type === 'group') {
            const subLayerIndex = layerUtils.subLayerIdx
            if (subLayerIndex === -1) return
            const subLayer = (currLayer as IGroup).layers[subLayerIndex]
            if (!subLayer.active || subLayer.type !== 'text') return
            textLayer = subLayer
          } else if (currLayer.type !== 'text') return
          editor.commands.sync()
          textLayer.contentEditable && editor.commands.focus(null, { scrollIntoView: false })
          tiptapUtils.updatePrevData(editor as Editor)
          TextPropUtils.updateTextPropsState()
        })
      })
    }
  }

  async redo() {
    if (!StepsUtils.isInLastStep) {
      await StepsUtils.redo()
      nextTick(() => {
        tiptapUtils.agent(editor => {
          const currLayer = layerUtils.getCurrLayer
          let textLayer = currLayer
          if (!currLayer.active) return
          if (currLayer.type === 'group') {
            const subLayerIndex = layerUtils.subLayerIdx
            if (subLayerIndex === -1) return
            const subLayer = (currLayer as IGroup).layers[subLayerIndex]
            if (!subLayer.active || subLayer.type !== 'text') return
            textLayer = subLayer
          } else if (currLayer.type !== 'text') return
          editor.commands.sync()
          textLayer.contentEditable && editor.commands.focus(null, { scrollIntoView: false })
          tiptapUtils.updatePrevData(editor as Editor)
          TextPropUtils.updateTextPropsState()
        })
      })
    }
  }

  zoomIn() {
    store.commit('SET_pageScaleRatio', Math.min(this.scaleRatio + 10, 500))
  }

  zoomOut() {
    store.commit('SET_pageScaleRatio', Math.max(this.scaleRatio - 10, 10))
  }

  up(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    layerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      y: this.currSelectedLayerStyles.y - (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }

  down(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    layerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      y: this.currSelectedLayerStyles.y + (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }

  left(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    layerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      x: this.currSelectedLayerStyles.x - (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }

  right(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    layerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      x: this.currSelectedLayerStyles.x + (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }
}

const shotcutUtils = new ShortcutUtils()

export default shotcutUtils
