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
    if (!this.pointerIds.includes(pointer.pointerId)) {
      this._pointers.push(pointer)
      console.warn('record Pointer', this.pointers)
    }
  }

  removePointer(pointerId: number) {
    console.warn('remvoe Pointer', pointerId)
    const i = this._pointers.findIndex(p => p.pointerId === pointerId)
    if (i !== -1) {
      this._pointers.splice(i, 1)
    }
  }
}
export default new PointerEventUtils()
