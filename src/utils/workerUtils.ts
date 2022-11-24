import Worker from '@/components/editor/worker/clneDeep.worker.ts'

export const asyncCloneDeep = async function<T>(data?: T) {
  if (data) {
    return new Promise<T>((resolve, reject) => {
      try {
        const worker = new Worker()
        worker.postMessage(data)
        worker.addEventListener('message', function(e) {
          console.log('Worker return: ', e.data)
          resolve(e.data)
        }, false)
      } catch (e) {
        reject(e)
      }
    })
  }
}
