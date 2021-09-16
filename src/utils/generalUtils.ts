class GeneralUtils {
  deepCopy(el: unknown) {
    return typeof el === 'undefined' ? {} : JSON.parse(JSON.stringify(el))
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
    return value.match(/^#[0-9A-F]{6}$/)
  }
}

const generalUtils = new GeneralUtils()

export default generalUtils
