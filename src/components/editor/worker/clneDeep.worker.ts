import _ from 'lodash'
const worker = self

worker.addEventListener('message', function(e) {
  worker.postMessage(_.cloneDeep(e.data))
})
