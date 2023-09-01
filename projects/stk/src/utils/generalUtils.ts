import { IGroup } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import router from '@/router'
import store from '@/store'
import { IBrowserInfo } from '@/store/module/user'
import _ from 'lodash'
import { nextTick } from 'vue'
import modalUtils from './modalUtils'
import pageUtils from './pageUtils'

class GeneralUtils {
  flags: { [key: string]: boolean }[] = []
  flagsCallback: (() => void) | undefined = undefined

  get isPic() { return process.env.VUE_APP_APP_NAME === 'vivipic' }
  get isStk() { return process.env.VUE_APP_APP_NAME === 'vivisticker' }
  get isCm() { return process.env.VUE_APP_APP_NAME === 'charmix' }
  get scaleRatio() { return store.getters.getPageScaleRatio }
  get isSuperUser() { return store.state.user.role === 0 }
  get browserInfo() {
    return store.getters['user/getBrowserInfo'] as IBrowserInfo
  }

  get safariLike() {
    return this.browserInfo.name === 'Safari' || this.browserInfo.os.family === 'iOS'
  }

  isJsonString(str: string) {
    try {
      JSON.parse(str)
    } catch (e) {
      return false
    }
    return true
  }

  deepCopy<T>(el: T): T {
    return _.cloneDeep(el) ?? {} as T
  }

  objHasOwnProperty(obj: { [index: string]: any }, property: string) {
    return Object.prototype.hasOwnProperty.call(obj, property)
  }

  exact(conditions: Array<boolean>): boolean {
    return conditions.filter((condition: boolean) => {
      return condition === true
    }).length === 1
  }

  scaleFromCenter(el: HTMLElement) {
    const scrollCenterX = (2 * el.scrollLeft + el.clientWidth)
    const scrollCenterY = (2 * el.scrollTop + el.clientHeight)
    const oldScrollWidth = el.scrollWidth
    const oldScrollHeight = el.scrollHeight

    nextTick(() => {
      el.scrollLeft = Math.round((scrollCenterX * el.scrollWidth / oldScrollWidth - el.clientWidth) / 2)
      el.scrollTop = Math.round((scrollCenterY * el.scrollHeight / oldScrollHeight - el.clientHeight) / 2)
    })
  }

  scrollToCenter(el?: HTMLElement, vertical = true, horizontal = true) {
    const target = el !== undefined ? el : document.querySelector('.editor-view')
    nextTick(() => {
      if (!target) return
      if (vertical) {
        target.scrollTop = (target.scrollHeight - target.clientHeight) / 2
      }
      if (horizontal) {
        target.scrollLeft = (target.scrollWidth - target.clientWidth) / 2
      }
    })
  }

  generateAssetId() {
    const date = new Date()
    const year = this.formatStr((date.getFullYear() - 2000).toString(), 2)
    const month = this.formatStr((date.getMonth() + 1).toString(), 2)
    const _date = this.formatStr((date.getDate()).toString(), 2)
    const hours = this.formatStr((date.getHours()).toString(), 2)
    const mins = this.formatStr((date.getMinutes()).toString(), 2)
    const sec = this.formatStr((date.getSeconds()).toString(), 2)
    const msec = this.formatStr((date.getMilliseconds()).toString(), 3)
    return year + month + _date + hours + mins + sec + msec + this.generateRandomString(8)
  }

  generateTimeStamp() {
    const date = new Date()
    const year = this.formatStr((date.getFullYear()).toString(), 4)
    const month = this.formatStr((date.getMonth() + 1).toString(), 2)
    const _date = this.formatStr((date.getDate()).toString(), 2)
    const hours = this.formatStr((date.getHours()).toString(), 2)
    const mins = this.formatStr((date.getMinutes()).toString(), 2)
    const sec = this.formatStr((date.getSeconds()).toString(), 2)
    return `${year}-${month}-${_date}-${hours}-${mins}-${sec}`
  }

  generateRandomString(length: number) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength))
    }
    return result
  }

  generateRandomTime(start: Date, end: Date) {
    return start.getTime() + Math.random() * (end.getTime() - start.getTime())
  }

  async asyncForEach(array: Array<any>, callback: (el: any, index?: number, array?: Array<any>) => void) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  formatStr(str: string, len: number) {
    if (str.length === len) {
      return str
    } else {
      const diff = len - str.length
      const complement = new Array(diff).fill(0).join('')
      return complement + str
    }
  }

  isValidInt(value: string) {
    return value.match(/^-?\d+$/)
  }

  isValidFloat(value: string) {
    return value.match(/[+-]?\d+(\.\d+)?/)
  }

  boundValue(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min)
  }

  copyText(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
    }
    const el = document.createElement('textarea')
    el.value = text
    el.style.display = 'none'
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand('copy')
    el.remove()
    return Promise.resolve()
  }

  arrayCompare<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  createGroups(arr: any[], numPerGroupGroups: number) {
    const numOfArr = arr.length
    if (numOfArr < numPerGroupGroups) {
      return [arr.slice(0)]
    }

    const groupNum = Math.ceil(arr.length / numPerGroupGroups)
    return new Array(groupNum)
      .fill('')
      .map((_, i) => arr.slice(i * numPerGroupGroups, (i + 1) * numPerGroupGroups))
  }

  fixSize(size: number) {
    return size * (100 / this.scaleRatio)
  }

  scaledSize(size: number) {
    return size * (this.scaleRatio / 100)
  }

  test() {
    const modifiedPageIndex = [] as Array<number>
    const pages = pageUtils.getPages
    pages.forEach((page: IPage, index: number) => {
      if (page.modified) {
        modifiedPageIndex.push(index)
      }
    })
    console.log(pages)
    modalUtils.setModalInfo('測試', [`修改過的 templates: ${modifiedPageIndex.join(' ')}`, `數量: ${modifiedPageIndex.length}`])
  }

  downloadImage(src: string, name = 'image.png') {
    const a = document.createElement('a')
    a.href = src
    a.download = name
    a.click()
  }

  isTouchDevice(): boolean {
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()) || this.isIPadOS()
  }

  isIPadOS(): boolean {
    return /macintosh/i.test(navigator.userAgent.toLowerCase()) && navigator.maxTouchPoints > 0
  }

  isTablet(): boolean {
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(navigator.userAgent.toLowerCase())
  }

  getListRowItemSize(): number {
    return !this.isTouchDevice() ? 145
      : window.outerWidth >= 600
        ? (window.outerWidth - 50) / 3
        : (window.outerWidth - 40) / 2
  }

  getEventType(e: MouseEvent | TouchEvent) {
    switch (e.type) {
      case 'touchstart':
      case 'touchmove':
      case 'touchend': {
        return 'touch'
        break
      }
      case 'mousedown':
      case 'mousemove':
      case 'mouseup': {
        return 'mouse'
        break
      }
    }
  }

  assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here")
  }

  getScrollbarSize(el: HTMLElement): { width: number, height: number } {
    return {
      width: el.scrollWidth - el.clientWidth,
      height: el.scrollHeight - el.clientHeight
    }
  }

  dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(',')
    const mime = (arr[0] as any).match(/:(.*?);/)[1]

    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  toDataURL(src: string, callback?: (dataUrl: string) => void) {
    const image = new Image()
    image.crossOrigin = 'Anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = image.naturalHeight
      canvas.width = image.naturalWidth
      context?.drawImage(image, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      callback && callback(dataURL)
    }
    image.src = src
  }

  fbq(type: string, action: string, params?: { [index: string]: any }) {
    params ? (window as any).fbq(type, action, params) : (window as any).fbq(type, action)
  }

  async getFileImageTypeByByte(file: File): Promise<string> {
    return new Promise<string>((resolve) => {
      const fileReader = new FileReader()
      fileReader.onloadend = function fileReaderLoaded(e): void {
        let type = ''
        const arr = (new Uint8Array(e.target!.result as ArrayBuffer)).subarray(0, 4)
        let header = ''
        for (let i = 0; i < arr.length; i += 1) {
          header += arr[i].toString(16)
        }
        switch (header) {
          case '89504e47':
            type = 'png'
            break
          case '47494638':
            type = 'gif'
            break
          case '3c3f786d':
          case '3c737667':
            type = 'svg'
            break
          case 'ffd8ffdb':
          case 'ffd8ffe0':
          case 'ffd8ffe1':
          case 'ffd8ffe2':
          case 'ffd8ffe3':
          case 'ffd8ffe8':
            type = 'jpeg'
            break
          default:
            type = 'unknown'
            break
        }
        resolve(type)
      }
      fileReader.readAsArrayBuffer(file)
    })
  }

  // log(params: string, data: any = '') {
  //   if (data) {
  //     console.log(data)
  //   } else {
  //     store.commit('SET_LOG' {
  //       params += 'time'e
  //     })
  //     logData.push(params)
  //   }
  // }

  async panelInit(panelName: string,
    searchF: (keyword: string) => Promise<void>,
    categoryF: (keyword: string, locale: string) => Promise<void>,
    normalInit: ({ reset }: { reset: boolean }) => void) { // May move to a new file panelUtils.ts
    const urlParams = new URLSearchParams(window.location.search)
    const panel = urlParams.get('panel')
    const category = urlParams.get('category')
    const category_locale = urlParams.get('category_locale')
    const search = urlParams.get('search')
    if (panel !== panelName) {
      normalInit({ reset: true })
    } else if (category && category_locale) {
      await categoryF(category, category_locale)
      normalInit({ reset: false })
    } else if (search) {
      await searchF(search)
      normalInit({ reset: false })
    } else {
      normalInit({ reset: true })
    }

    const query = _.omit(router.currentRoute.value.query,
      ['panel', 'category', 'category_locale', 'search'])
    router.replace({ query })
  }

  downloadTextFile(filename: string, content: string) {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }

  capitalize(str: string): string {
    if (str.length === 0) return str
    return str[0].toUpperCase() + str.substring(1).toLowerCase()
  }

  capitalizeFirstWord(str: string) {
    const words = str.split(' ').map(w => w.toLowerCase())
    const first = words[0]
    words[0] = first[0].toUpperCase() + first.substring(1)
    return words.join(' ')
  }

  // Get browser W/H, from jQuery lib, https://stackoverflow.com/a/1038781
  getWidth() {
    return Math.max(
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    )
  }

  getHeight() {
    return Math.max(
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    )
  }

  isWatcherTriggerByUndoRedo(v1: any, v2: any): boolean {
    // if the object props val is the same and the reference address is different,
    // means the watcher is triggered by undo/redo
    return v1 !== v2 && _.isEqual(v1, v2)
  }

  unproxify<T>(val: T): T {
    if (Array.isArray(val)) {
      return val.map((i) => this.unproxify(i)) as unknown as T
    }
    if (typeof val === 'object') {
      return Object.fromEntries(Object.entries({ ...val as object }).map(([k, v]) => {
        return [k, this.unproxify(v)]
      })) as unknown as T
    }
    return val
  }

  // greaterThan actually means "greater than or equal to", the same as lessThan.
  // So { greaterThan: '16.0', lessThan: '16.3' } means 16.0 <= v <= 16.3.
  versionCheck(data: { greaterThan?: string, lessThan?: string, version?: string }): boolean {
    const { lessThan, greaterThan } = data
    let { version } = data
    if (!version) {
      version = (store.getters['user/getBrowserInfo'] as IBrowserInfo).version
    }
    const vArr = version.split('.')
    if (lessThan) {
      const lessArr = lessThan.split('.')
      for (let i = 0; i < Math.max(vArr.length, lessArr.length); i++) {
        const less = lessArr[i] ?? '0'
        const v = vArr[i] ?? '0'
        if (+less > +v) break
        else if (+less < +v) return false
      }
    }
    if (greaterThan) {
      const greaterArr = greaterThan.split('.')
      for (let i = 0; i < Math.max(vArr.length, greaterArr.length); i++) {
        const greater = greaterArr[i] ?? '0'
        const v = vArr[i] ?? '0'
        if (+greater < +v) break
        else if (+greater > +v) return false
      }
    }
    return true
  }

  resetFlags() {
    this.flags = []
  }

  initializeFlags(layerType: string, pages?: IPage[], callback?: () => void) {
    pages = pages ?? store.getters.getPages as IPage[]
    const pageNum = pages.length
    const layerIndexes = this.getlayerIndexes(pages, layerType)
    this.resetFlags()
    for (let i = 0; i < pageNum; i++) {
      const pageArray = {} as { [key: string]: boolean }
      for (let j = 0; j < layerIndexes[i].length; j++) {
        pageArray[layerIndexes[i][j]] = false
      }
      this.flags.push(pageArray)
    }
    this.flagsCallback = callback
    if (this.flags.every(pageFlags => Object.keys(pageFlags).length === 0)) {
      this.flagsCallback && this.flagsCallback()
      this.resetFlags()
    }
  }

  setDoneFlag(pageIndex: number, layerIndex: number, subLayerIndex?: number) {
    const key = `${layerIndex},${subLayerIndex ?? -1}`
    if (!this.flags[pageIndex] || this.flags[pageIndex][key] === undefined) return
    this.flags[pageIndex][key] = true
    if (this.flags.every(pageFlags => Object.values(pageFlags).every(flag => flag))) {
      this.flagsCallback && this.flagsCallback()
      this.resetFlags()
    }
  }

  getlayerIndexes(pages: IPage[], layerType: string): string[][] {
    const textLayerIndexes = []
    for (const page of pages) {
      const indexes = []
      for (const [index, layer] of page.layers.entries()) {
        if (layer.type === layerType) {
          indexes.push(`${index},-1`)
        }
        if (layer.type === 'group') {
          for (const [subIndex, subLayer] of (layer as IGroup).layers.entries()) {
            if (subLayer.type === layerType) {
              indexes.push(`${index},${subIndex}`)
            }
          }
        }
      }
      textLayerIndexes.push(indexes)
    }
    return textLayerIndexes
  }

  getSliderWidth(): number | undefined {
    let width: number | undefined
    const functionPanelContent = document.querySelector('.function-panel__content')
    if (functionPanelContent) {
      const style = window.getComputedStyle(functionPanelContent, null)
      width = parseInt(style.getPropertyValue('width').replace('px', ''))
    }
    return width
  }

  async sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}

const generalUtils = new GeneralUtils()

export default generalUtils
