import _ from 'lodash'
const worker = self

worker.addEventListener('message', function(e) {
  console.log('this.is worker.ts', e.data)
  worker.postMessage(_.cloneDeep(e.data))
})
