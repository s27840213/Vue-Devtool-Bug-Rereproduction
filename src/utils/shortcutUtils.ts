import Vue from 'vue'
import store from '@/store'
import GroupUtils from '@/utils/groupUtils'
import GeneralUtils from '@/utils/generalUtils'
import ZindexUtils from '@/utils/zindexUtils'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import { IFrame, IImage, ILayer, IParagraph, IParagraphStyle, IShape, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import TextUtils from './textUtils'
import { ISelection } from '@/interfaces/text'
import TextPropUtils from './textPropUtils'
import ShapeUtils from './shapeUtils'
import { Layer } from 'konva/types/Layer'
import FrameUtils from './frameUtils'

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
  // async getClipboardContents() {
  //   try {
  //     const clipboardItems = await navigator.clipboard.read()

  //     for (const clipboardItem of clipboardItems) {
  //       for (const type of clipboardItem.types) {
  //         const blob = await clipboardItem.getType(type)
  //         // we can now use blob here
  //         console.log(blob)
  //       }
  //     }
  //   } catch (err) {
  //     console.error(err.name, err.message)
  //   }
  // }

  // private getClipboardData(){
  //   const inputNode = document.createElement('input')
  //   inputNode.setAttribute('type', 'text')
  //   inputNode.focus()
  // }
  get scaleRatio(): number { return store.getters.getPageScaleRatio }

  copy() {
    if (store.getters.getCurrSelectedIndex >= 0 && !LayerUtils.getTmpLayer().locked) {
      store.commit('SET_clipboard', GeneralUtils.deepCopy(store.getters.getLayer(store.getters.getCurrSelectedPageIndex, store.getters.getCurrSelectedIndex)))
    } else {
      console.warn('You did\'t select any unlocked layer')
    }
  }

  paste(evt?: Event) {
    // this.getClipboardContents()

    const clipboardInfo = store.getters.getClipboard.map((layer: ILayer) => {
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
      const paragraphs = GeneralUtils.deepCopy((TextUtils.getCurrLayer as IText).paragraphs) as IParagraph[]

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
        TextUtils.updateTextParagraphs(TextUtils.pageIndex, TextUtils.layerIndex, paragraphs)
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
    const text = document.getElementById(`text-${layerIndex ?? TextUtils.layerIndex}`) as HTMLElement
    const sel = window.getSelection()
    const range = new Range()
    if (sel) {
      range.selectNodeContents(text)
      sel.removeAllRanges()
      sel.addRange(range)
      const config = TextUtils.getCurrLayer as IText

      const pIndex = config.paragraphs.length - 1
      const sIndex = config.paragraphs[pIndex].spans.length - 1
      const offset = config.paragraphs[pIndex].spans[sIndex].text.length

      TextUtils.updateSelection({ pIndex: 0, sIndex: 0, offset: 0 }, { pIndex, sIndex, offset })
      TextPropUtils.updateTextPropsState()
    }
  }

  del() {
    const currLayer = LayerUtils.getCurrLayer as IFrame
    if (currLayer.type === 'frame' && currLayer.clips.some(img => img.active)) {
      const idx = currLayer.clips.findIndex(img => img.active)
      if (currLayer.clips[idx].srcObj.type === 'frame') {
        LayerUtils.deleteSelectedLayer()
        GroupUtils.reset()
        return
      }
      const clips = GeneralUtils.deepCopy(currLayer.clips)
      clips[idx].srcObj = {
        type: 'frame',
        assetId: '',
        userId: ''
      }
      LayerUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { clips })
    } else {
      LayerUtils.deleteSelectedLayer()
      GroupUtils.reset()
    }
  }

  cut() {
    console.log('cut')
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
