class PointerEventUtils {
  // this utils used for tracing pinters for pointerdown event
  private _pointers: Array<PointerEvent> = []

  get pointers(): Array<PointerEvent> {
    return this._pointers
  }

  get pointerIds(): Array<number> {
    return this._pointers.map(p => p.pointerId)
  }

  addPointer(pointer: PointerEvent) {
    console.warn('add pointer')
    if (!this.pointerIds.includes(pointer.pointerId)) {
      this._pointers.push(pointer)
    }
  }

  removePointer(pointerId: number) {
    console.warn('remvoe pointer')
    this._pointers.splice(this.pointers.findIndex(p => p.pointerId === pointerId), 1)
  }
}
export default new PointerEventUtils()
