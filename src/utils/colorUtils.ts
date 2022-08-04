import { IGroup, ILayer, IShape, IText } from '@/interfaces/layer'
import { EventEmitter } from 'events'
import store from '@/store'
import { IPage } from '@/interfaces/page'
import pageUtils from './pageUtils'

const STOP_POSTFIX = '_st'

class ColorUtils {
  event: any
  eventHash: { [index: string]: (color: string) => void }
  currEvent: string
  currColor: string
  isColorPickerOpen: boolean

  get currPageBackgroundColor() {
    return pageUtils.currFocusPage.backgroundColor
  }

  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
    this.currEvent = ''
    this.currColor = '#ffffff'
    this.isColorPickerOpen = false
  }

  get currStopEvent(): string { return this.currEvent + STOP_POSTFIX }

  on(type: string, callback: (color: string) => void) {
    // replace origin event
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  onStop(type: string, callback: (color: string) => void) {
    this.on(type + STOP_POSTFIX, callback)
  }

  offStop(type: string, callback: (color: string) => void) {
    this.event.off(type + STOP_POSTFIX, callback)
  }

  setCurrEvent(event: string) {
    this.currEvent = event
  }

  setCurrColor(color: string) {
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      this.currColor = color
    }
  }

  setIsColorPickerOpen(bool: boolean) {
    this.isColorPickerOpen = bool
  }

  setCurrPageBackgroundColor(color: string) {
    store.commit('SET_backgroundColor', {
      pageIndex: pageUtils.currFocusPageIndex,
      color
    })
  }
}

export function getDocumentColor(pageIndex: number, color: string): Array<string> {
  const page = store.getters.getPage(pageIndex) as IPage
  const docColors = new Set<string>()

  const handler = (layers: Array<ILayer>) => {
    layers
      .forEach(l => {
        switch (l.type) {
          case 'text':
            (l as IText).paragraphs.forEach(p => {
              p.spans.forEach(s => {
                if (!docColors.has(s.styles.color)) {
                  docColors.add(s.styles.color)
                }
              })
            })
            break
          case 'shape': {
            const shape = l as IShape
            for (let i = 0; shape.color && i < shape.color.length && i < 20; i++) {
              if (!docColors.has(shape.color[i])) {
                docColors.add(shape.color[i])
              }
            }
          }
            break
          case 'group':
            handler((l as IGroup).layers)
        }
      })
  }

  handler(page.layers)
  docColors.delete(color)
  return color ? [color, ...docColors].splice(0, 50) : [...docColors].splice(0, 50)
}

export default new ColorUtils()
