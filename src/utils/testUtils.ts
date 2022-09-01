import Vue from 'vue'

class TestUtils {
  timer: Record<string, number>
  constructor() {
    this.timer = {}
  }

  start(key: string) {
    this.timer[key] = (new Date()).getTime()
    console.log(key + 'start')
  }

  end(key: string) {
    const duration = (new Date()).getTime() - this.timer[key]
    const result = `${key}, ${duration}`
    console.log(result)
    Vue.notify({
      group: 'copy',
      text: result
    })
  }
}

export default new TestUtils()
