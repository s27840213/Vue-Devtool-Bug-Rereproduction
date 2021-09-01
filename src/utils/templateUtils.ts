import store from '@/store'
import GeneralUtils from '@/utils/generalUtils'
import { IParagraph, IText } from '@/interfaces/layer'
import LayerUtils from './layerUtils'

class TemplateUtils {
  public readonly fields = ['heading', 'subheading', 'body']
  public readonly fieldsMap = {
    heading: 'isHeading',
    subheading: 'isSubheading',
    body: 'isBody'
  } as { [key: string]: string }

  get getTextInfo() { return store.getters.getTextInfo }
  get pageIndex() { return store.getters.getLastSelectedPageIndex }
  get getCurrPageLayers() { return store.getters.getLayers(this.pageIndex) }

  updateTemplate(json: any): any {
    const fields = [...this.fields]
    for (const layer of json.layers) {
      if (layer.type === 'text') {
        for (const [i, field] of fields.entries()) {
          if (layer[this.fieldsMap[field]] && this.getTextInfo[field].length) {
            const paraStyles = GeneralUtils.deepCopy(layer.paragraphs[0].styles)
            const spanStyles = GeneralUtils.deepCopy(layer.paragraphs[0].spans[0].styles)
            const paragraphs = [] as Array<IParagraph>
            for (const text of this.getTextInfo[field]) {
              paragraphs.push({
                styles: paraStyles,
                spans: [{
                  styles: spanStyles,
                  text: text
                }]
              })
            }
            layer.paragraphs = paragraphs
            fields.splice(i, 1)
            break
          }
        }
      }
    }
    return json
  }

  updateTextInfoTarget() {
    this.fields.forEach(field => {
      this.textInfoUpdater(field, [])
      for (const [layerIndex, layer] of this.getCurrPageLayers.entries()) {
        if (layer.type === 'text' && Object.prototype.hasOwnProperty.call(layer, this.fieldsMap[field])) {
          LayerUtils.updateLayerProps(this.pageIndex, layerIndex, { [field]: true })
          this.textInfoUpdater(field, (layer as IText).paragraphs)
          break
        }
      }
    })
  }

  setTextInfo(textInfo: { [key: string]: Array<string> }) {
    store.commit('SET_textInfo', textInfo)
  }

  textInfoUpdater(field: string, paragraphs: IParagraph[]) {
    const textArr = []
    for (const p of paragraphs) {
      let text = ''
      for (const span of p.spans) {
        text += span.text
      }
      textArr.push(text)
    }
    this.setTextInfo({ [field]: textArr })
  }
}

export default new TemplateUtils()
