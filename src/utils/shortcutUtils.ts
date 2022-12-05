import store from '@/store'
import Vue, { nextTick } from 'vue'
import GroupUtils from '@/utils/groupUtils'
import GeneralUtils from '@/utils/generalUtils'
import ZindexUtils from '@/utils/zindexUtils'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp } from '@/interfaces/layer'
import TextUtils from './textUtils'
import TextPropUtils from './textPropUtils'
import ShapeUtils from './shapeUtils'
import frameUtils from './frameUtils'
import uploadUtils from './uploadUtils'
import logUtils from './logUtils'
import tiptapUtils from './tiptapUtils'
import pageUtils from './pageUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'

class ShortcutUtils {
  copySourcePageIndex: number

  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }

  get currSelectedPageIndex() {
    return store.getters.getCurrSelectedPageIndex
  }

  get currSelectedLayerIndex() {
    return store.getters.getCurrSelectedIndex
  }

  get currSelectedLayerStyles() {
    return LayerUtils.getTmpLayer().styles
  }
  // target: HTMLElement
  // constructor(target: HTMLElement) {
  //   this.target = target
  // }

  constructor() {
    this.copySourcePageIndex = -1
  }

  private regenerateLayerInfo(layer: IText | IShape | IImage | IGroup | ITmp | IFrame, props: { toCenter?: boolean, offset?: number, targetPageIndex?: number }) {
    const { toCenter = false, offset = 10, targetPageIndex } = props

    if (toCenter && targetPageIndex !== undefined) {
      const targetPage = pageUtils.getPage(targetPageIndex)
      const { x, y, width, height } = layer.styles
      const posX = (targetPage.width / 2) - (width / 2)
      const posY = (targetPage.height / 2) - (height / 2)
      layer.styles.x = posX
      layer.styles.y = posY
    } else {
      layer.styles.x += offset
      layer.styles.y += offset
    }

    layer.id = GeneralUtils.generateRandomString(8)
    layer.shown = false

    switch (layer.type) {
      case 'image':
        (layer as IImage).imgControl = false
        break
      case 'shape':
        (layer as IShape).className = ShapeUtils.classGenerator()
        break
      case 'group':
        (layer as IGroup).layers
          .forEach(l => {
            if (l.type === 'shape') {
              l.className = ShapeUtils.classGenerator()
            }
            l.id = GeneralUtils.generateRandomString(8)
          })
        break
      case 'tmp':
        (layer as IGroup).layers
          .forEach(l => {
            if (l.type === 'shape') {
              l.className = ShapeUtils.classGenerator()
            }
            l.id = GeneralUtils.generateRandomString(8)
          })
        break
    }
    return layer
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

  copy() {
    if (store.getters.getCurrSelectedIndex >= 0 && !LayerUtils.getTmpLayer().locked) {
      navigator.clipboard.writeText(JSON.stringify(GeneralUtils.deepCopy(store.getters.getLayer(store.getters.getCurrSelectedPageIndex, store.getters.getCurrSelectedIndex))))
      this.copySourcePageIndex = store.getters.getCurrSelectedPageIndex
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

    const clipboardInfo = [JSON.parse(text)].map((layer: IText | IShape | IImage | IGroup | ITmp) => {
      return this.regenerateLayerInfo(layer, { toCenter: targetPageIndex !== this.copySourcePageIndex, targetPageIndex })
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
        GroupUtils.set(targetPageIndex, tmpIndex + tmpLayersNum, [...GeneralUtils.deepCopy(clipboardInfo)])
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
        GroupUtils.set(targetPageIndex, store.getters.getLayersNum(targetPageIndex) - 1, [...GeneralUtils.deepCopy(clipboardInfo)])
      }
      ZindexUtils.reassignZindex(targetPageIndex)
    }
    if (targetPageIndex === this.copySourcePageIndex) {
      navigator.clipboard.writeText(JSON.stringify(GeneralUtils.deepCopy(store.getters.getLayer(this.copySourcePageIndex, store.getters.getCurrSelectedIndex))))
    }
    nextTick(() => {
      StepsUtils.record()
    })
  }

  duplicate() {
    const { getCurrLayer: currLayer } = LayerUtils
    const newLayer = this.regenerateLayerInfo(GeneralUtils.deepCopy(currLayer) as IShape | IText | IImage | IGroup | IFrame | ITmp, {})

    const currActivePageIndex = pageUtils.currActivePageIndex
    const isTmp: boolean = currLayer.type === 'tmp'
    if (store.getters.getCurrSelectedIndex >= 0 && currActivePageIndex === store.getters.getCurrSelectedPageIndex) {
      const tmpIndex = store.getters.getCurrSelectedIndex
      const tmpLayers = store.getters.getCurrSelectedLayers
      const tmpLayersNum = isTmp ? tmpLayers.length : 1
      GroupUtils.deselect()
      if (isTmp) {
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
      if (isTmp) {
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
    const newLayer = this.regenerateLayerInfo(GeneralUtils.deepCopy(config as IShape | IText | IImage | IGroup | IFrame), { offset: 0 })
    newLayer.active = false

    const isTmp: boolean = config.type === 'tmp'
    const { index, layers } = LayerUtils.currSelectedInfo
    const currFocusPageIndex = pageUtils.currFocusPageIndex

    const tmpIndex = index
    const tmpLayersNum = isTmp ? layers.length : 1

    if (isTmp) {
      // const layers2Page = GroupUtils.mapLayersToPage(layers, config as ITmp)
      // store.commit('ADD_layersToPos', { pageIndex: currFocusPageIndex, layers: [...layers2Page], pos: tmpIndex })
      // GroupUtils.set(currFocusPageIndex, tmpIndex + tmpLayersNum, [newLayer])
      return
    } else {
      store.commit('ADD_layersToPos', { pageIndex: currFocusPageIndex, layers: [newLayer], pos: tmpIndex })
      GroupUtils.set(currFocusPageIndex, tmpIndex + 1, [newLayer])
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
        LayerUtils.updatecCurrTypeLayerProp({ isEdited: true })
      })
    }
  }

  textPasteWith(text: string) {
    tiptapUtils.agent(editor => {
      text = text.replace(/\r/g, '')
      const spans = text.split('\n')
      let chainedCommands = editor.chain().deleteSelection()
      spans.forEach((line, index) => {
        const spanText = `<span>${line === ''
          ? '<br/>'
          : line.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
          }</span>`
        chainedCommands = chainedCommands.insertContent(spanText)
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
      LayerUtils.updatecCurrTypeLayerProp({ isEdited: true })
    })
  }

  textPaste() {
    navigator.clipboard.readText().then((text) => {
      this.textPasteWith(text)
    })
  }

  textSelectAll(layerIndex?: number) {
    const text = document.getElementById(`text-${layerIndex ?? LayerUtils.layerIndex}`) as HTMLElement
    const sel = window.getSelection()
    const range = new Range()
    if (sel) {
      range.selectNodeContents(text)
      sel.removeAllRanges()
      sel.addRange(range)
      const config = LayerUtils.getCurrLayer as IText

      const pIndex = config.paragraphs.length - 1
      const sIndex = config.paragraphs[pIndex].spans.length - 1
      const offset = config.paragraphs[pIndex].spans[sIndex].text.length

      TextUtils.updateSelection({ pIndex: 0, sIndex: 0, offset: 0 }, { pIndex, sIndex, offset })
      TextPropUtils.updateTextPropsState()
    }
  }

  del() {
    let currLayer = LayerUtils.getCurrLayer
    switch (currLayer.type) {
      case 'frame':
        currLayer = currLayer as IFrame
        if (currLayer.clips.some(img => img.active)) {
          const idx = currLayer.clips.findIndex(img => img.active)
          if (currLayer.clips[idx].srcObj.type === 'frame') {
            LayerUtils.deleteSelectedLayer()
            GroupUtils.reset()
            return
          }
          const clips = GeneralUtils.deepCopy(currLayer.clips) as Array<IImage>
          if (clips[idx].imgControl) {
            frameUtils.updateFrameLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, idx, { imgControl: false })
            return
          }
          clips[idx].srcObj = {
            type: 'frame',
            assetId: '',
            userId: ''
          }
          LayerUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { clips })
          StepsUtils.record()
          return
        }
        break
    }

    LayerUtils.deleteSelectedLayer()
    GroupUtils.reset()
  }

  cut() {
    this.copy()
    this.del()
  }

  async save() {
    if (TextUtils.isFontLoading) return
    await uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
    logUtils.uploadLog()
  }

  selectAll() {
    console.log('select all')
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
      const currLayer = LayerUtils.getCurrLayer
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
          const currLayer = LayerUtils.getCurrLayer
          let textLayer = currLayer
          if (!currLayer.active) return
          if (currLayer.type === 'group') {
            const subLayerIndex = LayerUtils.subLayerIdx
            if (subLayerIndex === -1) return
            const subLayer = (currLayer as IGroup).layers[subLayerIndex]
            if (!subLayer.active || subLayer.type !== 'text') return
            textLayer = subLayer
          } else if (currLayer.type !== 'text') return
          editor.commands.sync()
          textLayer.contentEditable && editor.commands.focus(null, { scrollIntoView: false })
          tiptapUtils.prevText = tiptapUtils.getText(editor)
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
          const currLayer = LayerUtils.getCurrLayer
          let textLayer = currLayer
          if (!currLayer.active) return
          if (currLayer.type === 'group') {
            const subLayerIndex = LayerUtils.subLayerIdx
            if (subLayerIndex === -1) return
            const subLayer = (currLayer as IGroup).layers[subLayerIndex]
            if (!subLayer.active || subLayer.type !== 'text') return
            textLayer = subLayer
          } else if (currLayer.type !== 'text') return
          editor.commands.sync()
          textLayer.contentEditable && editor.commands.focus(null, { scrollIntoView: false })
          tiptapUtils.prevText = tiptapUtils.getText(editor)
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
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      y: this.currSelectedLayerStyles.y - (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }

  down(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      y: this.currSelectedLayerStyles.y + (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }

  left(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      x: this.currSelectedLayerStyles.x - (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }

  right(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      x: this.currSelectedLayerStyles.x + (moveOffset * (100 / this.scaleRatio))
    })
    StepsUtils.record()
  }
}

const shotcutUtils = new ShortcutUtils()

export default shotcutUtils
