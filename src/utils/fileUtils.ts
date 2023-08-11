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

  importFont(callback: (this: HTMLInputElement, ev: Event) => any) {
    const inputNode = document.createElement('input')
    inputNode.setAttribute('type', 'file')
    inputNode.setAttribute('accept', '.ttf,.ttc,.otf')
    inputNode.click()
    inputNode.addEventListener('change', callback, false)
  }
}

function handleFileSelect(evt: any) {
  const file = evt.target.files[0]
  evt.target.removeEventListener('change', handleFileSelect, false)
  const reader = new FileReader()
  reader.onload = (evt: Event) => {
    const target = evt.target as FileReader
    const json = JSON.parse(target.result as string)
    const pages = json.pages ? json.pages : json
    store.commit('SET_pages', pageUtils.newPages(pages))
  }
  reader.readAsText(file)
}
export default new FileUtils()
