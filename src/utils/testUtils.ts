import Vue from 'vue'

class TestUtils {
  timer: Record<string, {
    start: number
    notify: boolean
  }>

  constructor() {
    this.timer = {}
  }

  start(key: string, notify = true) {
    this.timer[key] = {
      start: (new Date()).getTime(),
      notify
    }
    console.log(`${key}: start`)
  }

  log(key: string, msg: string) {
    const timer = this.timer[key]
    const duration = (new Date()).getTime() - timer.start
    const result = `${key}: ${msg}, ${duration}`
    console.log(result)
    if (timer.notify) {
      // Vue.notify({
      //   group: 'copy',
      //   text: result
      // })P
    }
  }
}

export default new TestUtils()
