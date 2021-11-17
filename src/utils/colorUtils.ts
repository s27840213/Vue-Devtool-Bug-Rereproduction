import { IShape, IText } from '@/interfaces/layer'
import { EventEmitter } from 'events'
import store from '@/store'
import layerUtils from './layerUtils'
import { IPage } from '@/interfaces/page'

class ColorUtils {
  event: any
  eventHash: { [index: string]: (color: string) => void }
  currEvent: string
  currColor: string

  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
    this.currEvent = ''
    this.currColor = '#ffffff'
  }

  on(type: string, callback: (color: string) => void) {
    // replace origin event
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  setCurrEvent(event: string) {
    this.currEvent = event
  }

  setCurrColor(color: string) {
    this.currColor = color
  }
}

export function DocColorHandler(config: IShape | IText) {
  switch (config.type) {
    case 'shape':
      store.commit('UPDATE_documentColors', {
        pageIndex: layerUtils.pageIndex,
        colors: (config as IShape).color
          .map(color => {
            return { color, count: -1 }
          })
      })
      break
    case 'text': {
      config = config as IText
      config.paragraphs
        .forEach(p => {
          p.spans.forEach(s => {
            store.commit('UPDATE_documentColors', {
              pageIndex: layerUtils.pageIndex,
              colors: [{
                color: s.styles.color,
                count: -1
              }]
            })
          })
        })
    }
  }
}

export function getDocumentColor(color: string): Array<string> {
  const page = store.getters.getPage(layerUtils.pageIndex) as IPage
  const docColors = new Set<string>()

  page.layers
    .forEach(l => {
      if (l.type === 'text') {
        (l as IText).paragraphs.forEach(p => {
          p.spans.forEach(s => {
            if (!docColors.has(s.styles.color)) {
              docColors.add(s.styles.color)
            }
          })
        })
      }
      if (l.type === 'shape') {
        (l as IShape).color.forEach(c => {
          if (!docColors.has(c)) {
            docColors.add(c)
          }
        })
      }
    })
  docColors.delete(color)
  return [...docColors, color]
}

export default new ColorUtils()
