import { IShape, IText } from '@/interfaces/layer'
import { EventEmitter } from 'events'
import store from '@/store'
import layerUtils from './layerUtils'

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

export default new ColorUtils()
