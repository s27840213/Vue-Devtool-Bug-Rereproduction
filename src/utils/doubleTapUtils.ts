class DoubleTapUtils {
  prev: {
    el: EventTarget | null
    time: number
    timer: number
  }

  constructor() {
    this.prev = {
      el: null,
      time: 0,
      timer: 0
    }
  }

  click(event: Event, {
    doubleClickCallback = () => { /**/ },
    clickCallback = () => { /**/ },
    delay = 500,
    clickWaitForDelay = true
  }) {
    if (event.type === 'click') {
      console.error('!! Don\'t use click event in doubleTapUtils. Use pointerdown instead. !!')
    }
    event.preventDefault() // fix tap event issue of apple pencil for unknown reason
    const now = Date.now()

    if (this.prev.el === event.target && now - this.prev.time < delay) {
      clearTimeout(this.prev.timer)
      doubleClickCallback()
      this.prev = {
        el: null,
        time: 0,
        timer: 0
      }
    } else {
      if (!clickWaitForDelay)clickCallback()
      this.prev = {
        el: event.target,
        time: now,
        timer: clickWaitForDelay ? window.setTimeout(clickCallback, delay) : 0
      }
    }
  }
}

export default new DoubleTapUtils()
