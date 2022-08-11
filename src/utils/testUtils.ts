import Vue from 'vue'

class TestUtils {
  startTime: number
  constructor() {
    this.startTime = 0
  }

  start() {
    this.startTime = (new Date()).getTime()
  }

  end(msg: string) {
    const duration = (new Date()).getTime() - this.startTime
    const result = `${msg}, ${duration}`
    console.log(result)
    Vue.notify({
      group: 'copy',
      text: result
    })
  }
}

export default new TestUtils()
