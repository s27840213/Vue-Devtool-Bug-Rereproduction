import generalUtils from './generalUtils'

class AsyncUtils {
  callbackMap: {[key: string]: any} = {}
  observerMap: {[key: string]: boolean[]} = {}
  idMap: {[key: string]: {
    id: string,
    index: number
  }} = {}

  createObserver(numOfWaitee: number, callback: any): string {
    const id = generalUtils.generateRandomString(8)
    this.callbackMap[id] = callback
    this.observerMap[id] = Array(numOfWaitee).fill(false)
    return id
  }

  registerId(key: string, id: string, index: number) {
    this.idMap[key] = { id, index }
  }

  clearId(key: string) {
    delete this.idMap[key]
  }

  generateKeyByIndexes(pageIndex: number, layerIndex: number, subLayerIndex: number) {
    return `${pageIndex},${layerIndex},${subLayerIndex}`
  }

  registerByIndexes(pageIndex: number, layerIndex: number, subLayerIndex: number, id: string, index: number) {
    const key = this.generateKeyByIndexes(pageIndex, layerIndex, subLayerIndex)
    this.registerId(key, id, index)
  }

  finishedByIndexes(pageIndex: number, layerIndex: number, subLayerIndex: number) {
    const key = this.generateKeyByIndexes(pageIndex, layerIndex, subLayerIndex)
    const mapValues = this.idMap[key]
    if (mapValues) {
      const { id, index } = mapValues
      this.finished(index, id)
      this.clearId(key)
    }
  }

  finished(index: number, id: string) {
    this.observerMap[id][index] = true
    if (this.observerMap[id].reduce((acc, curr) => acc && curr, true)) {
      this.callbackMap[id]()
      delete this.callbackMap[id]
      delete this.observerMap[id]
    }
  }
}

export default new AsyncUtils()
