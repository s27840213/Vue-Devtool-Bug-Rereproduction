import generalUtils from './generalUtils'

class AsyncUtils {
  callbackMap: {[key: string]: any[]} = {}
  observerMap: {[key: string]: boolean[]} = {}
  finalExecutorMap: {[key: string]: number} = {}
  idMap: {[key: string]: {
    id: string,
    index: number
  }} = {}

  createObserver(numOfWaitee: number, callback: any): string {
    /**
     * create an observer that executes the given callback(s) after all target processes have completed.
     * @numOfWaitee
     *  number of processes to wait.
     * @callback
     *  the first callback to execute after all processes have completed.
     * Return: id of the observer that can be used by a target process to claim its completion.
     */
    const id = generalUtils.generateRandomString(8)
    if (numOfWaitee === 0) return id
    this.callbackMap[id] = [callback]
    this.observerMap[id] = Array(numOfWaitee).fill(false)
    return id
  }

  registerFinalExecutor(key: string, callback: any) {
    if (this.finalExecutorMap[key] !== undefined) {
      this.finalExecutorMap[key] += 1
    } else {
      this.finalExecutorMap[key] = 1
      this.callbackMap[key] = [callback]
    }
  }

  registerId(key: string, id: string, index: number) {
    /**
     * register a mapping between key/index pair and observer id.
     * @key
     *  unique key of a process that may be constructed by infomation known at both where an observer is created and where a process is executed.
     *  e.g. key constructed by a combined string of pageIndex, layerIndex, and subLayerIndex that could be known at utils.ts and component.vue.
     *  (check this.generateKeyByIndexes(...))
     * @id
     *  observer id.
     * @index
     *  index of a process among all processes an observer is waiting for.
     */
    this.idMap[key] = { id, index }
  }

  clearId(key: string) {
    /**
     * clear the mapping between key/index pair and observer id for future reuse.
     */
    delete this.idMap[key]
  }

  generateKeyByIndexes(pageIndex: number, layerIndex: number, subLayerIndex: number) {
    /**
     * generate a key by pageIndex, layerIndex, and subLayerIndex.
     */
    return `${pageIndex},${layerIndex},${subLayerIndex}`
  }

  registerByIndexes(pageIndex: number, layerIndex: number, subLayerIndex: number, id: string, index: number) {
    /**
     * combination of generating a key and registering it.
     */
    const key = this.generateKeyByIndexes(pageIndex, layerIndex, subLayerIndex)
    this.registerId(key, id, index)
  }

  finishedByIndexes(pageIndex: number, layerIndex: number, subLayerIndex: number, callback?: () => void) {
    /**
     * query the key by indexes and mark the corresponding process as completed if a mapping exists.
     * @callback
     *  (optional) add a callback to the callback list of the corresponding observer. The callbacks in the list
     *  will be executed in order of 'finishes' and the first callback is guaranteed to be the one passed in
     *  this.createObserver(...).
     */
    const key = this.generateKeyByIndexes(pageIndex, layerIndex, subLayerIndex)
    const mapValues = this.idMap[key]
    if (mapValues) {
      const { id, index } = mapValues
      this.finished(index, id, callback)
      this.clearId(key)
    }
  }

  finished(index: number, id: string, callback?: () => void) {
    /**
     * claim the completion of a process and execute the callbacks of the corresponding observer if all processes have completed.
     * @callback
     *  (optional) add a callback to the callback list of the corresponding observer. The callbacks in the list
     *  will be executed in order of 'finishes' and the first callback is guaranteed to be the one passed in
     *  this.createObserver(...).
     */
    if (callback) {
      this.callbackMap[id].push(callback)
    }
    this.observerMap[id][index] = true
    if (this.observerMap[id].reduce((acc, curr) => acc && curr, true)) {
      for (const callback of this.callbackMap[id]) {
        callback()
      }
      delete this.callbackMap[id]
      delete this.observerMap[id]
    }
  }

  completed(key: string, callback?: () => void) {
    if (callback) {
      this.callbackMap[key].push(callback)
    }
    this.finalExecutorMap[key] -= 1
    if (this.finalExecutorMap[key] === 0) {
      for (const callback of this.callbackMap[key]) {
        callback()
      }
      delete this.callbackMap[key]
      delete this.finalExecutorMap[key]
    }
  }
}

export default new AsyncUtils()
