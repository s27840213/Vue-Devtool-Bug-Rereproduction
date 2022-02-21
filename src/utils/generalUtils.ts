/* eslint-disable @typescript-eslint/no-explicit-any */
import { IPage } from '@/interfaces/page'
import store from '@/store'
import modalUtils from './modalUtils'
import pageUtils from './pageUtils'
class GeneralUtils {
  get scaleRatio() { return store.getters.getPageScaleRatio }

  isJsonString(str: string) {
    try {
      JSON.parse(str)
    } catch (e) {
      return false
    }
    return true
  }

  deepCopy(el: unknown) {
    return typeof el === 'undefined' ? {} : JSON.parse(JSON.stringify(el))
  }

  objHasOwnProperty(obj: { [index: string]: any }, property: string) {
    return Object.prototype.hasOwnProperty.call(obj, property)
  }

  exact(conditions: Array<boolean>): boolean {
    return conditions.filter((condition: boolean) => {
      return condition === true
    }).length === 1
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

  isValidHexColor(value: string) {
    value = value.toUpperCase()
    return value.match(/^#[0-9A-F]{6}$/)
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

  fixSize(size: number) {
    return size * (100 / this.scaleRatio)
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
    modalUtils.setIsModalOpen(true)
    modalUtils.setModalInfo('測試', [`修改過的 templates: ${modifiedPageIndex.join(' ')}`, `數量: ${modifiedPageIndex.length}`], '')
  }

  downloadImage(src: string, name = 'image.png') {
    const a = document.createElement('a')
    a.href = src
    a.download = name
    a.click()
  }

  assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here")
  }

  fbq(type: string, action: string, params?: { [index: string]: any }) {
    params ? (window as any).fbq(type, action, params) : (window as any).fbq(type, action)
  }

  // log(params: string, data: any = '') {
  //   if (data) {
  //     console.log(data)
  //   } else {
  //     store.commit('SET_LOG' {
  //       params += 'time'
  //     })
  //     logData.push(params)
  //   }
  // }
}

const generalUtils = new GeneralUtils()

export default generalUtils
