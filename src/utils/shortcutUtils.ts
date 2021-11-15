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
import { DocColorHandler } from './colorUtils'

class ShortcutHandler {
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
      navigator.clipboard.writeText(sel.toString())
    }
  }

  textPaste() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount !== 0) {
      const selPos = TextUtils.getSelection()?.start as ISelection
      const selEnd = TextUtils.getSelection()?.end as ISelection
      const paragraphs = GeneralUtils.deepCopy((LayerUtils.getCurrLayer as IText).paragraphs) as IParagraph[]

      if (TextUtils.isSel(selEnd)) {
        /**
         *  Used to delete the selected-text-range
         *  */
        const textTrimming = () => {
          paragraphs[selPos.pIndex].spans[selPos.sIndex].text = paragraphs[selPos.pIndex].spans[selPos.sIndex].text.substring(0, selPos.offset)
          paragraphs[selEnd.pIndex].spans[selEnd.sIndex].text = paragraphs[selEnd.pIndex].spans[selEnd.sIndex].text.substr(selEnd.offset)
        }
        if (selPos.pIndex === selEnd.pIndex) {
          /**
           *  The startSel and endSel is at the same paragraph and span
           *  */
          if (selPos.sIndex === selEnd.sIndex) {
            const text = paragraphs[selPos.pIndex].spans[selPos.sIndex].text
            const removedText = text.substring(selPos.offset, selEnd.offset)
            paragraphs[selPos.pIndex].spans[selPos.sIndex].text = text.replace(removedText, '')
          } else {
            textTrimming()
            paragraphs[selEnd.pIndex].spans.splice(selPos.sIndex + 1, selEnd.sIndex - selPos.sIndex - 1)
          }
        } else {
          textTrimming()
          paragraphs[selPos.pIndex].spans.splice(selPos.sIndex + 1)
          paragraphs[selEnd.pIndex].spans.splice(0, selEnd.sIndex)
          if (selEnd.pIndex - selPos.pIndex > 1) {
            paragraphs.splice(selPos.pIndex + 1, selEnd.pIndex - selPos.pIndex - 1)
          }
        }
      }

      const spanBuff: ISpan[] = []
      const paraStyles: IParagraphStyle = GeneralUtils.deepCopy(paragraphs[selPos.pIndex].styles)
      const spanStyles: ISpanStyle = GeneralUtils.deepCopy(paragraphs[selPos.pIndex].spans[selPos.sIndex].styles)
      const selFinalPos: ISelection = Object.assign({}, selPos)
      navigator.clipboard.readText().then((text) => {
        const textArr = text.split('\n\n')
        for (let i = 0; i < textArr.length; i++, selPos.pIndex++) {
          let pastedText = textArr[i]
          const p = paragraphs[selPos.pIndex]
          if (i === 0) {
            /**
             * Store the rest spans of to the textBuffer
             */
            for (let sidx = selPos.sIndex; sidx < p.spans.length; sidx++) {
              if (sidx === selPos.sIndex) {
                if (textArr.length === 1) {
                  pastedText += p.spans[selPos.sIndex].text.substr(selPos.offset)
                  selFinalPos.offset += textArr[i].length
                  p.spans[selPos.sIndex].text = p.spans[selPos.sIndex].text.substr(0, selPos.offset)
                  p.spans[selPos.sIndex].text += pastedText
                  break
                }
                const span = GeneralUtils.deepCopy(p.spans[sidx])
                if ((span.text = span.text.substr(selPos.offset))) {
                  spanBuff.push(span)
                }
                p.spans[selPos.sIndex].text = p.spans[selPos.sIndex].text.substr(0, selPos.offset)
                p.spans[selPos.sIndex].text += pastedText
                continue
              }
              const span = GeneralUtils.deepCopy(p.spans[sidx])
              spanBuff.push(span)
            }
            if (textArr.length !== 1) {
              p.spans.splice(selPos.sIndex + 1, p.spans.length)
            }
            continue
          }
          const newPara: IParagraph = {
            styles: GeneralUtils.deepCopy(paraStyles) as IParagraphStyle,
            spans: [
              {
                text: pastedText,
                styles: GeneralUtils.deepCopy(spanStyles) as ISpanStyle
              }
            ]
          }
          paragraphs.splice(selPos.pIndex, 0, newPara)
          selFinalPos.pIndex++
        }
        if (spanBuff.length) {
          paragraphs.splice(selPos.pIndex, 0, {
            styles: paraStyles,
            spans: spanBuff
          })
        }
        TextUtils.updateTextParagraphs(LayerUtils.pageIndex, LayerUtils.layerIndex, paragraphs)
        Vue.nextTick(() => {
          if (textArr.length !== 1) {
            selFinalPos.sIndex = paragraphs[selFinalPos.pIndex].spans.length - 1
            selFinalPos.offset = paragraphs[selFinalPos.pIndex].spans[selFinalPos.sIndex].text.length
          }
          TextUtils.updateSelection(selFinalPos, selFinalPos)
          TextUtils.focus()
        })
      })
    }
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
      case 'group':
        currLayer = currLayer as IGroup
        currLayer.layers
          .forEach(l => {
            if (l.type === 'text' || l.type === 'shape') {
              DocColorHandler(l as IText | IShape)
            }
          })
        break
      default:
        if (currLayer.type === 'text' || currLayer.type === 'shape') {
          DocColorHandler(currLayer as IShape | IText)
        }
    }

    LayerUtils.deleteSelectedLayer()
    GroupUtils.reset()
  }

  cut() {
    console.log('cut')
  }

  save() {
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    const designId = urlParams.get('design_id')

    uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH).then(() => {
      Vue.notify({ group: 'copy', text: '檔案資料已儲存' })
    })
    if (!type || !designId) {
      router.replace({ query: Object.assign({}, router.currentRoute.query, { type: 'design', design_id: uploadUtils.assetId }) })
    }
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

const shortcutHandler = new ShortcutHandler()

export default shortcutHandler
