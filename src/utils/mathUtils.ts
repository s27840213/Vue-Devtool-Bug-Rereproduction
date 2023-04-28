import { IStyle, ITextStyle } from '@/interfaces/layer'
import { IBounding } from '@/interfaces/math'
import store from '@/store'
import Flatten from '@flatten-js/core'

interface IPolygonConfig {
  x: number,
  y: number,
  width: number,
  height: number,
  rotate?: number
}

class MathUtils {
  cos(angleDeg: number) {
    const angleInRad = angleDeg * Math.PI / 180
    return Math.cos(angleInRad)
  }

  sin(angleDeg: number) {
    const angleInRad = angleDeg * Math.PI / 180
    return Math.sin(angleInRad)
  }

  getCenter(styles: IStyle | ITextStyle | { x: number, y: number, width: number, height: number }) {
    return {
      x: styles.x + ((styles.width as number) / 2),
      y: styles.y + ((styles.height as number) / 2)
    }
  }

  getRotatedPoint(angle: number, origin: { x: number, y: number }, initPos: { x: number, y: number }) {
    const tempX = initPos.x - origin.x
    const tempY = initPos.y - origin.y
    return {
      x: origin.x + tempX * this.cos(angle) - tempY * this.sin(angle),
      y: origin.y + tempX * this.sin(angle) + tempY * this.cos(angle)
    }
  }

  getBounding(styles: IStyle): IBounding {
    const angle = styles.rotate
    const origin = this.getCenter(styles)
    const initStyles = { x: styles.x, y: styles.y, width: styles.width, height: styles.height }
    const points = [
      [initStyles.x, initStyles.y],
      [initStyles.x + initStyles.width, initStyles.y],
      [initStyles.x, initStyles.y + initStyles.height],
      [initStyles.x + initStyles.width, initStyles.y + initStyles.height]
    ]
    let minX = Number.MAX_SAFE_INTEGER
    let minY = Number.MAX_SAFE_INTEGER
    let maxX = Number.MIN_SAFE_INTEGER
    let maxY = Number.MIN_SAFE_INTEGER

    points.forEach((point: number[]) => {
      const tmp = this.getRotatedPoint(angle, origin, { x: point[0], y: point[1] })
      minX = Math.min(minX, tmp.x)
      minY = Math.min(minY, tmp.y)
      maxX = Math.max(maxX, tmp.x)
      maxY = Math.max(maxY, tmp.y)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  getActualMoveOffset(x: number, y: number, scale = 100 / store.getters.getPageScaleRatio) {
    return {
      offsetX: x * scale,
      offsetY: y * scale
    }
  }

  // getCornerPoints(angle: number, posInfo: Partial<IStyle>) {
  //   const { x, y, width, height } = posInfo
  //   const center = this.getCenter(posInfo)
  //   const posArr = [{
  //     x,
  //     y
  //   },
  //   {
  //     x: x + width,
  //     y
  //   },
  //   {
  //     x: x + width,
  //     y: y + height
  //   },
  //   {
  //     x,
  //     y: y + height
  //   }]

  //   return posArr.map((pos) => {
  //     return this.getRotatedPoint(angle, center, pos)
  //   })
  // }

  /**
 * Helper function to determine whether there is an intersection between the two polygons described
 * by the lists of vertices. Uses the Separating Axis Theorem
 *
 * @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @return true if there is any intersection between the 2 polygons, false otherwise
 */
  doPolygonsIntersect(a: Array<{ x: number, y: number }>, b: Array<{ x: number, y: number }>) {
    const polygons = [a, b]
    let minA = Number.MAX_SAFE_INTEGER
    let minB = Number.MAX_SAFE_INTEGER
    let maxA = Number.MIN_SAFE_INTEGER
    let maxB = Number.MIN_SAFE_INTEGER
    let projected = 0

    // const minA, maxA, projected, i, i1, j, minB, maxB

    for (let i = 0; i < polygons.length; i++) {
      // for each polygon, look at each edge of the polygon, and determine if it separates
      // the two shapes
      const polygon = polygons[i]
      for (let i1 = 0; i1 < polygon.length; i1++) {
        // grab 2 vertices to create an edge
        const i2 = (i1 + 1) % polygon.length
        const p1 = polygon[i1]
        const p2 = polygon[i2]

        // find the line perpendicular to this edge
        const normal = { x: p2.y - p1.y, y: p1.x - p2.x }

        // for each vertex in the first shape, project it onto the line perpendicular to the edge
        // and keep track of the min and max of these values
        for (let j = 0; j < a.length; j++) {
          projected = normal.x * a[j].x + normal.y * a[j].y
          if (!minA || projected < minA) {
            minA = projected
          }
          if (!maxA || projected > maxA) {
            maxA = projected
          }
        }

        // for each vertex in the second shape, project it onto the line perpendicular to the edge
        // and keep track of the min and max of these values
        for (let j = 0; j < b.length; j++) {
          projected = normal.x * b[j].x + normal.y * b[j].y
          if (!minB || projected < minB) {
            minB = projected
          }
          if (!minB || projected > maxB) {
            maxB = projected
          }
        }

        // if there is no overlap between the projects, the edge we are looking at separates the two
        // polygons, and we know there is no overlap
        if (maxA < minB || maxB < minA) {
          console.log("polygons don't intersect!")
          return false
        }
      }
    }
    return true
  }

  multipy(multiplier: number, _params: { [key: string]: number | string } | Array<number>, excludes: Array<string> = []): { [key: string]: number | string } | Array<number> {
    const params = Object.entries(_params)
    if (!params.length) return {}

    const result = (params as any).map((el: [string, number | string]) => {
      if (typeof el === 'number') {
        return el * multiplier
      } else {
        if (typeof el[1] === 'number' && !excludes.includes(el[0])) {
          const k = el[0]
          const v = el[1]
          return [k, v * multiplier]
        } else {
          return [el[0], el[1]]
        }
      }
    })
    return Array.isArray(result[0]) ? Object.fromEntries(result as [string, number][]) : result
  }

  generatePolygon(styles: IPolygonConfig): Flatten.Polygon {
    const { x, y, width, height, rotate = 0 } = styles
    const angle = rotate / 180 * Math.PI
    const object = new Flatten.Polygon([
      Flatten.point(x, y),
      Flatten.point(x, y + height),
      Flatten.point(x + width, y + height),
      Flatten.point(x + width, y)
    ])
    const center = Flatten.point(x + width / 2, y + height / 2)
    return object.rotate(angle, center)
  }

  getIntersectArea(polygon1: Flatten.Polygon, polygon2: Flatten.Polygon): number {
    const { intersect } = Flatten.BooleanOperations
    return intersect(polygon1, polygon2).area()
  }

  calculateIfIntersect(polygon1: Flatten.Polygon | IPolygonConfig, polygon2: Flatten.Polygon | IPolygonConfig): boolean {
    polygon1 = (polygon1 instanceof Flatten.Polygon) ? polygon1 : this.generatePolygon(polygon1)
    polygon2 = (polygon2 instanceof Flatten.Polygon) ? polygon2 : this.generatePolygon(polygon2)
    return this.getIntersectArea(polygon1, polygon2) > 0
  }

  // Normal Distribution Between 0 and 1
  randnBm(): number {
    let u = 0
    let v = 0
    // Converting [0,1) to (0,1)
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    // Translate to 0 -> 1
    num = num / 10.0 + 0.5
    // resample between 0 and 1
    if (num > 1 || num < 0) return this.randnBm()
    return num
  }
}

const mathUtils = new MathUtils()
export default mathUtils
