import Vue from 'vue'
import store from '@/store'
import GroupUtils from '@/utils/groupUtils'
import GeneralUtils from '@/utils/generalUtils'
import ZindexUtils from '@/utils/zindexUtils'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import { IFrame, IGroup, IImage, ILayer, IParagraph, IParagraphStyle, IShape, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import TextUtils from './textUtils'
import { ISelection } from '@/interfaces/text'
import TextPropUtils from './textPropUtils'
import ShapeUtils from './shapeUtils'
import frameUtils from './frameUtils'
import uploadUtils from './uploadUtils'
import router from '@/router'
import logUtils from './logUtils'
import tiptapUtils from './tiptapUtils'

class ShortcutUtils {
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
          } else {
            return ''
          }
        }
      }
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

    const clipboardInfo = [JSON.parse(text)].map((layer: ILayer) => {
      layer.styles.x += 10
      layer.styles.y += 10
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
            })
          break
        case 'tmp':
          (layer as IGroup).layers
            .forEach(l => {
              if (l.type === 'shape') {
                l.className = ShapeUtils.classGenerator()
              }
            })
          break
      }
      return layer
    })

    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const isTmp: boolean = clipboardInfo[0].type === 'tmp'
    if (store.getters.getCurrSelectedIndex >= 0 && lastSelectedPageIndex === store.getters.getCurrSelectedPageIndex) {
      const tmpIndex = store.getters.getCurrSelectedIndex
      const tmpLayers = store.getters.getCurrSelectedLayers
      const tmpLayersNum = isTmp ? tmpLayers.length : 1
      GroupUtils.deselect()
      if (isTmp) {
        store.commit('ADD_layersToPos', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(lastSelectedPageIndex, tmpIndex + tmpLayersNum, GeneralUtils.deepCopy(clipboardInfo[0].layers))
      } else {
        store.commit('ADD_layersToPos', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(lastSelectedPageIndex, tmpIndex + tmpLayersNum, [...GeneralUtils.deepCopy(clipboardInfo)])
      }
    } else {
      if (store.getters.getCurrSelectedIndex >= 0) {
        GroupUtils.deselect()
      }
      if (isTmp) {
        store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(lastSelectedPageIndex, store.getters.getLayersNum(store.getters.getLastSelectedPageIndex) - 1, GeneralUtils.deepCopy(clipboardInfo[0].layers))
      } else {
        store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(lastSelectedPageIndex, store.getters.getLayersNum(store.getters.getLastSelectedPageIndex) - 1, [...GeneralUtils.deepCopy(clipboardInfo)])
      }
    }
    ZindexUtils.reassignZindex(lastSelectedPageIndex)
  }

  textCopy() {
    const sel = window.getSelection()
    if (sel) {
      navigator.clipboard.writeText(sel.toString().replace(/\n\n/g, '\n'))
    }
  }

  textPaste() {
    navigator.clipboard.readText().then((text) => {
      tiptapUtils.agent(editor => {
        text = text.replace(/\r/g, '')
        const spans = text.split('\n')
        let chainedCommands = editor.chain().deleteSelection()
        spans.forEach((line, index) => {
          const spanText = `<span>${
            line === ''
              ? '<br/>'
              : line.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/ /g, '&nbsp;')
          }</span>`
          chainedCommands = chainedCommands.insertContent(spanText)
          if (index !== spans.length - 1) {
            chainedCommands = chainedCommands.enter()
          }
        })
        chainedCommands.run()
        LayerUtils.updatecCurrTypeLayerProp({ isEdited: true })
      })
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
          StepsUtils.record()
          LayerUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { clips })
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
    console.log('save')
    await uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
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

  undo() {
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
    console.log('undo')
    StepsUtils.undo()
  }

  redo() {
    console.log('redo')
    StepsUtils.redo()
  }

  zoomIn() {
    store.commit('SET_pageScaleRatio', this.scaleRatio + 10)
  }

  zoomOut() {
    store.commit('SET_pageScaleRatio', this.scaleRatio - 10)
  }

  up(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      y: this.currSelectedLayerStyles.y - (moveOffset * (100 / this.scaleRatio))
    })
  }

  down(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      y: this.currSelectedLayerStyles.y + (moveOffset * (100 / this.scaleRatio))
    })
  }

  left(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      x: this.currSelectedLayerStyles.x - (moveOffset * (100 / this.scaleRatio))
    })
  }

  right(pressShift = false) {
    const moveOffset = pressShift ? 10 : 1
    LayerUtils.updateLayerStyles(this.currSelectedPageIndex, this.currSelectedLayerIndex, {
      x: this.currSelectedLayerStyles.x + (moveOffset * (100 / this.scaleRatio))
    })
  }
}

const shotcutUtils = new ShortcutUtils()

export default shotcutUtils
