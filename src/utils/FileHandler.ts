import store from '@/store'
class FileHandler {
  import() {
    // Because inputNode won't be appended to DOM, so we don't need to release it
    // It will be remove by JS garbage collection system
    const inputNode = document.createElement('input')
    inputNode.setAttribute('type', 'file')
    inputNode.setAttribute('accept', 'application/json')
    inputNode.click()
    inputNode.addEventListener('change', handleFileSelect, false)
  }

  export() {
    const dataStr = 'data:text/jsoncharset=utf-8,' + encodeURIComponent(JSON.stringify(store.getters.getPages))
    const downloadAnchorNode = document.createElement('a')
    const exportName = 'file'
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', exportName + '.json')
    downloadAnchorNode.click()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleFileSelect(evt: any) {
  const file = evt.target.files[0]
  evt.target.removeEventListener('change', handleFileSelect, false)
  const reader = new FileReader()
  reader.onload = (evt: Event) => {
    const target = evt.target as FileReader
    store.commit('SET_pages', JSON.parse(target.result as string))
  }
  reader.readAsText(file)
}
export default new FileHandler()
