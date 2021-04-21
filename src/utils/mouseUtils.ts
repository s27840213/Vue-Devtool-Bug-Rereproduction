/**
 */
class MouseUtils {
  getMouseAbsPoint(e: MouseEvent) {
    return { x: e.clientX, y: e.clientY }
  }

  getMouseRelPoint(e: MouseEvent, target: HTMLElement) {
    const rect = target.getBoundingClientRect()
    const x = e.clientX + target.scrollLeft - rect.left
    const y = e.clientY + target.scrollTop - rect.top
    return { x, y }
  }
}
export default new MouseUtils()
