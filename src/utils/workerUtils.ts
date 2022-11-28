import CloneDeepWorker from '@/components/editor/worker/clneDeep.worker.ts'

class WorkerUtils {
  private cloneDeepWorker = new CloneDeepWorker() as CloneDeepWorker | undefined
  async asyncCloneDeep<T>(data?: T) {
    this.cloneDeepWorker && this.cloneDeepWorker.terminate()
    if (data) {
      return new Promise<T>((resolve, reject) => {
        this.cloneDeepWorker = new CloneDeepWorker()
        try {
          this.cloneDeepWorker.postMessage(data)
          this.cloneDeepWorker.addEventListener('message', function(e) {
            resolve(e.data)
          }, false)
        } catch (e) {
          reject(e)
        }
      }).finally(() => this.cloneDeepWorker && this.cloneDeepWorker.terminate())
    }
  }
}

export default new WorkerUtils()
