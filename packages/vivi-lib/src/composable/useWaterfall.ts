import { minBy } from 'lodash'

function generate<T extends { width: number, height: number }>
  (items: T[], columns: number): T[][] {
  const arr = Array.from({ length: columns }, () => ({ content: [] as T[], height: 0 }))

  items.forEach((item) => {
    const next = minBy(arr, 'height')
    if (!next) return
    next.content.push(item)
    next.height += item.height / (item.width / 100)
  })
  return arr.map((a) => a.content)
}

export default generate
