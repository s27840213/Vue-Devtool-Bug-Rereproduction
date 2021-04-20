/**
 * This typescript file is used to import/export JSON.
 * May implement futhter file export feature in the future
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
