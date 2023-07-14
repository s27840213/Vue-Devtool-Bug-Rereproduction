/**
 * This typescript file is used to import/export JSON.
 * May implement futhter file export feature in the future
 */
import store from '@/store'
import GroupUtils from '@/utils/groupUtils'
import pageUtils from './pageUtils'
class FileUtils {
  import() {
    // Because inputNode won't be appended to DOM, so we don't need to release it
    // It will be remove by JS garbage collection system sooner or later
    const inputNode = document.createElement('input')
    inputNode.setAttribute('type', 'file')
    inputNode.setAttribute('accept', 'application/json')
    inputNode.click()
    inputNode.addEventListener('change', handleFileSelect, false)
  }

  export() {
    GroupUtils.deselect()
    const dataStr = 'data:text/jsoncharset=utf-8,' + encodeURIComponent(JSON.stringify(store.getters.getPages))
    const downloadAnchorNode = document.createElement('a')
    const exportName = 'file'
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', exportName + '.json')
    downloadAnchorNode.click()
  }

  exportFile(obj: any) {
    const dataStr = 'data:text/jsoncharset=utf-8,' + encodeURIComponent(JSON.stringify(obj))
    const downloadAnchorNode = document.createElement('a')
    const exportName = 'file'
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', exportName + '.json')
    downloadAnchorNode.click()
  }

  downloadImageFromFile(file: File, fileName: string) {
    // Create a temporary anchor element
    const link = document.createElement('a')
    link.href = URL.createObjectURL(file)
    link.download = fileName

    // Programmatically trigger the download
    link.click()

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(link.href)
      link.remove()
    }, 0)
  }

  importFont(callback: (this: HTMLInputElement, ev: Event) => any) {
    const inputNode = document.createElement('input')
    inputNode.setAttribute('type', 'file')
    inputNode.setAttribute('accept', '.ttf,.ttc,.otf')
    inputNode.click()
    inputNode.addEventListener('change', callback, false)
  }

  getFileImageByByte (file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const fileReader = new FileReader()
      fileReader.onloadend = function fileReaderLoaded (e): void {
        let type = ''
        const bytes = (new Uint8Array(e.target?.result as ArrayBuffer))
        const header = bytes
          .subarray(0, 4)
          .reduce((prev, curr) => `${prev}${curr.toString(16)}`, '')

        switch (header) {
          case '89504e47':
            type = 'png'
            break
          case '47494638':
            type = 'gif'
            break
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
        resolve(new Blob([bytes], { type: `image/${type}` }))
      }
      fileReader.readAsArrayBuffer(file)
    })
  }
}

function handleFileSelect(evt: any) {
  const file = evt.target.files[0]
  evt.target.removeEventListener('change', handleFileSelect, false)
  const reader = new FileReader()
  reader.onload = (evt: Event) => {
    const target = evt.target as FileReader
    store.commit('SET_pages', pageUtils.newPages(JSON.parse(target.result as string)))
  }
  reader.readAsText(file)
}
export default new FileUtils()
