/* eslint-disable */
/**
* StackBlur - a fast almost Gaussian Blur For Canvas
*
* In case you find this class useful - especially in commercial projects -
* I am not totally unhappy for a small donation to my PayPal account
* mario@quasimondo.de
*
* Or support me on flattr:
* {@link https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript}.
*
* @module StackBlur
* @author Mario Klingemann
* Contact: mario@quasimondo.com
* Website: {@link http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html}
* Twitter: @quasimondo
*
* @copyright (c) 2010 Mario Klingemann
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

import imageShadowUtils from './imageShadowUtils'

const mulTable = [
  512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292,
  512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292,
  273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259,
  496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292,
  282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373,
  364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259,
  507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381,
  374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292,
  287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461,
  454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373,
  368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309,
  305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259,
  257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442,
  437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381,
  377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332,
  329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
  289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259
]

const shgTable = [
  9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
  17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
  19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
  20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
  21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
  21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
  22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
  22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
  23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
  24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24
]

export class BlurStack {
  /**
   * Set properties.
   */
  r = 0
  g = 0
  b = 0
  a = 0
  next = null as null | BlurStack
  constructor () {
    this.r = 0
    this.g = 0
    this.b = 0
    this.a = 0
    this.next = null
  }
}

/**
 * @param {ImageData} imageData
 * @param {Integer} topX
 * @param {Integer} topY
 * @param {Integer} width
 * @param {Integer} height
 * @param {Float} radius
 * @returns {ImageData}
 */
export async function imageDataRGBA_Async (imageData: ImageData, topX: number, topY: number, width: number, height: number, radius: number, handlerId?: string) {
  const pixels = imageData.data
  const { getHandlerId } = imageShadowUtils
  const currHandlerId = getHandlerId.bind(imageShadowUtils)
  const div = 2 * radius + 1
  // const w4 = width << 2
  const widthMinus1 = width - 1
  const heightMinus1 = height - 1
  const radiusPlus1 = radius + 1
  const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2

  const stackStart = new BlurStack()
  let stack = stackStart
  let stackEnd = undefined as unknown as BlurStack
  for (let i = 1; i < div; i++) {
    stack = stack.next = new BlurStack()
    if (i === radiusPlus1) {
      stackEnd = stack
    }
  }
  stack.next = stackStart

  let stackIn = null
  let stackOut = null
  let yw = 0
  let yi = 0

  const mulSum = mulTable[radius]
  const shgSum = shgTable[radius]
  for (let i = 0; i < width * height * 4; i += 4) {
    pixels[i] = pixels[i] * pixels[i + 3] / 255
    pixels[i + 1] = pixels[i + 1] * pixels[i + 3] / 255
    pixels[i + 2] = pixels[i + 2] * pixels[i + 3] / 255
  }

  const DIVIDE_SIZE = 16
  const _height = Math.ceil(height / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    await imageShadowUtils.asyncProcessing(() => {
      for (let y = _height * i; y < _height * (i + 1) && y < height; y++) {
        stack = stackStart

        const pr = pixels[yi]
        const pg = pixels[yi + 1]
        const pb = pixels[yi + 2]
        const pa = pixels[yi + 3]

        for (let i = 0; i < radiusPlus1; i++) {
          stack.r = pr
          stack.g = pg
          stack.b = pb
          stack.a = pa
          stack = stack.next as BlurStack
        }

        let rInSum = 0
        let gInSum = 0
        let bInSum = 0
        let aInSum = 0
        let rOutSum = radiusPlus1 * pr
        let gOutSum = radiusPlus1 * pg
        let bOutSum = radiusPlus1 * pb
        let aOutSum = radiusPlus1 * pa
        let rSum = sumFactor * pr
        let gSum = sumFactor * pg
        let bSum = sumFactor * pb
        let aSum = sumFactor * pa

        for (let i = 1; i < radiusPlus1; i++) {
          const p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2)

          const r = pixels[p]
          const g = pixels[p + 1]
          const b = pixels[p + 2]
          const a = pixels[p + 3]

          const rbs = radiusPlus1 - i
          rSum += (stack.r = r) * rbs
          gSum += (stack.g = g) * rbs
          bSum += (stack.b = b) * rbs
          aSum += (stack.a = a) * rbs

          rInSum += r
          gInSum += g
          bInSum += b
          aInSum += a

          stack = stack.next as BlurStack
        }

        stackIn = stackStart
        stackOut = stackEnd
        for (let x = 0; x < width && stackIn && stackOut; x++) {
          const paInitial = (aSum * mulSum) >> shgSum
          pixels[yi + 3] = paInitial
          if (paInitial !== 0) {
            const a = 255 / paInitial
            pixels[yi] = ((rSum * mulSum) >> shgSum)
            pixels[yi + 1] = ((gSum * mulSum) >> shgSum)
            pixels[yi + 2] = ((bSum * mulSum) >> shgSum)
          } else {
            pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0
          }

          rSum -= rOutSum
          gSum -= gOutSum
          bSum -= bOutSum
          aSum -= aOutSum

          rOutSum -= stackIn.r
          gOutSum -= stackIn.g
          bOutSum -= stackIn.b
          aOutSum -= stackIn.a

          let p = x + radius + 1
          p = (yw + (p < widthMinus1
            ? p
            : widthMinus1)) << 2

          rInSum += (stackIn.r = pixels[p])
          gInSum += (stackIn.g = pixels[p + 1])
          bInSum += (stackIn.b = pixels[p + 2])
          aInSum += (stackIn.a = pixels[p + 3])

          rSum += rInSum
          gSum += gInSum
          bSum += bInSum
          aSum += aInSum

          stackIn = stackIn.next

          const { r, g, b, a } = stackOut

          rOutSum += r
          gOutSum += g
          bOutSum += b
          aOutSum += a

          rInSum -= r
          gInSum -= g
          bInSum -= b
          aInSum -= a

          stackOut = stackOut.next

          yi += 4
        }
        yw += width
      }
    })
    if (handlerId !== currHandlerId()) {
      return imageData
    }
  }

  const _width = Math.ceil(width / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    await imageShadowUtils.asyncProcessing(() => {
      for (let x = _width * i; x < _width * (i + 1) && x < width; x++) {
        yi = x << 2

        let pr = pixels[yi]
        let pg = pixels[yi + 1]
        let pb = pixels[yi + 2]
        let pa = pixels[yi + 3]
        let rOutSum = radiusPlus1 * pr
        let gOutSum = radiusPlus1 * pg
        let bOutSum = radiusPlus1 * pb
        let aOutSum = radiusPlus1 * pa
        let rSum = sumFactor * pr
        let gSum = sumFactor * pg
        let bSum = sumFactor * pb
        let aSum = sumFactor * pa

        stack = stackStart
        for (let i = 0; i < radiusPlus1; i++) {
          stack.r = pr
          stack.g = pg
          stack.b = pb
          stack.a = pa
          stack = stack.next as BlurStack
        }

        let yp = width

        let gInSum = 0
        let bInSum = 0
        let aInSum = 0
        let rInSum = 0
        for (let i = 1; i <= radius; i++) {
          yi = (yp + x) << 2

          const rbs = radiusPlus1 - i
          rSum += (stack.r = (pr = pixels[yi])) * rbs
          gSum += (stack.g = (pg = pixels[yi + 1])) * rbs
          bSum += (stack.b = (pb = pixels[yi + 2])) * rbs
          aSum += (stack.a = (pa = pixels[yi + 3])) * rbs

          rInSum += pr
          gInSum += pg
          bInSum += pb
          aInSum += pa

          stack = stack.next as BlurStack

          if (i < heightMinus1) {
            yp += width
          }
        }

        yi = x
        stackIn = stackStart
        stackOut = stackEnd
        for (let y = 0; y < height && stackIn && stackOut; y++) {
          let p = yi << 2
          pixels[p + 3] = pa = (aSum * mulSum) >> shgSum
          if (pa > 0) {
            pa = 255 / pa
            pixels[p] = ((rSum * mulSum) >> shgSum)
            pixels[p + 1] = ((gSum * mulSum) >> shgSum)
            pixels[p + 2] = ((bSum * mulSum) >> shgSum)
          } else {
            pixels[p] = pixels[p + 1] = pixels[p + 2] = 0
          }

          rSum -= rOutSum
          gSum -= gOutSum
          bSum -= bOutSum
          aSum -= aOutSum

          rOutSum -= stackIn.r
          gOutSum -= stackIn.g
          bOutSum -= stackIn.b
          aOutSum -= stackIn.a

          p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2

          rSum += (rInSum += (stackIn.r = pixels[p]))
          gSum += (gInSum += (stackIn.g = pixels[p + 1]))
          bSum += (bInSum += (stackIn.b = pixels[p + 2]))
          aSum += (aInSum += (stackIn.a = pixels[p + 3]))

          stackIn = stackIn.next

          rOutSum += (pr = stackOut.r)
          gOutSum += (pg = stackOut.g)
          bOutSum += (pb = stackOut.b)
          aOutSum += (pa = stackOut.a)

          rInSum -= pr
          gInSum -= pg
          bInSum -= pb
          aInSum -= pa

          stackOut = stackOut.next

          yi += width
        }
      }
    })
    if (handlerId !== currHandlerId()) {
      return imageData
    }
  }

  for (let i = 0; i < width * height * 4; i += 4) {
    pixels[i] = pixels[i] * 255 / pixels[i + 3]
    pixels[i + 1] = pixels[i + 1] * 255 / pixels[i + 3]
    pixels[i + 2] = pixels[i + 2] * 255 / pixels[i + 3]
  }

  return imageData
}
export function imageDataRGBA (imageData: ImageData, topX: number, topY: number, width: number, height: number, radius: number, handlerId?: string) {
  const pixels = imageData.data
  const div = 2 * radius + 1
  // const w4 = width << 2
  const widthMinus1 = width - 1
  const heightMinus1 = height - 1
  const radiusPlus1 = radius + 1
  const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2

  const stackStart = new BlurStack()
  let stack = stackStart
  let stackEnd = undefined as unknown as BlurStack
  for (let i = 1; i < div; i++) {
    stack = stack.next = new BlurStack()
    if (i === radiusPlus1) {
      stackEnd = stack
    }
  }
  stack.next = stackStart

  let stackIn = null
  let stackOut = null
  let yw = 0
  let yi = 0

  const mulSum = mulTable[radius]
  const shgSum = shgTable[radius]
  for (let i = 0; i < width * height * 4; i += 4) {
    pixels[i] = pixels[i] * pixels[i + 3] / 255
    pixels[i + 1] = pixels[i + 1] * pixels[i + 3] / 255
    pixels[i + 2] = pixels[i + 2] * pixels[i + 3] / 255
  }

  const DIVIDE_SIZE = 16
  const _height = Math.ceil(height / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    for (let y = _height * i; y < _height * (i + 1) && y < height; y++) {
      stack = stackStart

      const pr = pixels[yi]
      const pg = pixels[yi + 1]
      const pb = pixels[yi + 2]
      const pa = pixels[yi + 3]

      for (let i = 0; i < radiusPlus1; i++) {
        stack.r = pr
        stack.g = pg
        stack.b = pb
        stack.a = pa
        stack = stack.next as BlurStack
      }

      let rInSum = 0
      let gInSum = 0
      let bInSum = 0
      let aInSum = 0
      let rOutSum = radiusPlus1 * pr
      let gOutSum = radiusPlus1 * pg
      let bOutSum = radiusPlus1 * pb
      let aOutSum = radiusPlus1 * pa
      let rSum = sumFactor * pr
      let gSum = sumFactor * pg
      let bSum = sumFactor * pb
      let aSum = sumFactor * pa

      for (let i = 1; i < radiusPlus1; i++) {
        const p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2)

        const r = pixels[p]
        const g = pixels[p + 1]
        const b = pixels[p + 2]
        const a = pixels[p + 3]

        const rbs = radiusPlus1 - i
        rSum += (stack.r = r) * rbs
        gSum += (stack.g = g) * rbs
        bSum += (stack.b = b) * rbs
        aSum += (stack.a = a) * rbs

        rInSum += r
        gInSum += g
        bInSum += b
        aInSum += a

        stack = stack.next as BlurStack
      }

      stackIn = stackStart
      stackOut = stackEnd
      for (let x = 0; x < width && stackIn && stackOut; x++) {
        const paInitial = (aSum * mulSum) >> shgSum
        pixels[yi + 3] = paInitial
        if (paInitial !== 0) {
          const a = 255 / paInitial
          pixels[yi] = ((rSum * mulSum) >> shgSum)
          pixels[yi + 1] = ((gSum * mulSum) >> shgSum)
          pixels[yi + 2] = ((bSum * mulSum) >> shgSum)
        } else {
          pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0
        }

        rSum -= rOutSum
        gSum -= gOutSum
        bSum -= bOutSum
        aSum -= aOutSum

        rOutSum -= stackIn.r
        gOutSum -= stackIn.g
        bOutSum -= stackIn.b
        aOutSum -= stackIn.a

        let p = x + radius + 1
        p = (yw + (p < widthMinus1
          ? p
          : widthMinus1)) << 2

        rInSum += (stackIn.r = pixels[p])
        gInSum += (stackIn.g = pixels[p + 1])
        bInSum += (stackIn.b = pixels[p + 2])
        aInSum += (stackIn.a = pixels[p + 3])

        rSum += rInSum
        gSum += gInSum
        bSum += bInSum
        aSum += aInSum

        stackIn = stackIn.next

        const { r, g, b, a } = stackOut

        rOutSum += r
        gOutSum += g
        bOutSum += b
        aOutSum += a

        rInSum -= r
        gInSum -= g
        bInSum -= b
        aInSum -= a

        stackOut = stackOut.next

        yi += 4
      }
      yw += width
    }
  }

  const _width = Math.ceil(width / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    for (let x = _width * i; x < _width * (i + 1) && x < width; x++) {
      yi = x << 2

      let pr = pixels[yi]
      let pg = pixels[yi + 1]
      let pb = pixels[yi + 2]
      let pa = pixels[yi + 3]
      let rOutSum = radiusPlus1 * pr
      let gOutSum = radiusPlus1 * pg
      let bOutSum = radiusPlus1 * pb
      let aOutSum = radiusPlus1 * pa
      let rSum = sumFactor * pr
      let gSum = sumFactor * pg
      let bSum = sumFactor * pb
      let aSum = sumFactor * pa

      stack = stackStart
      for (let i = 0; i < radiusPlus1; i++) {
        stack.r = pr
        stack.g = pg
        stack.b = pb
        stack.a = pa
        stack = stack.next as BlurStack
      }

      let yp = width

      let gInSum = 0
      let bInSum = 0
      let aInSum = 0
      let rInSum = 0
      for (let i = 1; i <= radius; i++) {
        yi = (yp + x) << 2

        const rbs = radiusPlus1 - i
        rSum += (stack.r = (pr = pixels[yi])) * rbs
        gSum += (stack.g = (pg = pixels[yi + 1])) * rbs
        bSum += (stack.b = (pb = pixels[yi + 2])) * rbs
        aSum += (stack.a = (pa = pixels[yi + 3])) * rbs

        rInSum += pr
        gInSum += pg
        bInSum += pb
        aInSum += pa

        stack = stack.next as BlurStack

        if (i < heightMinus1) {
          yp += width
        }
      }

      yi = x
      stackIn = stackStart
      stackOut = stackEnd
      for (let y = 0; y < height && stackIn && stackOut; y++) {
        let p = yi << 2
        pixels[p + 3] = pa = (aSum * mulSum) >> shgSum
        if (pa > 0) {
          pa = 255 / pa
          pixels[p] = ((rSum * mulSum) >> shgSum)
          pixels[p + 1] = ((gSum * mulSum) >> shgSum)
          pixels[p + 2] = ((bSum * mulSum) >> shgSum)
        } else {
          pixels[p] = pixels[p + 1] = pixels[p + 2] = 0
        }

        rSum -= rOutSum
        gSum -= gOutSum
        bSum -= bOutSum
        aSum -= aOutSum

        rOutSum -= stackIn.r
        gOutSum -= stackIn.g
        bOutSum -= stackIn.b
        aOutSum -= stackIn.a

        p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2

        rSum += (rInSum += (stackIn.r = pixels[p]))
        gSum += (gInSum += (stackIn.g = pixels[p + 1]))
        bSum += (bInSum += (stackIn.b = pixels[p + 2]))
        aSum += (aInSum += (stackIn.a = pixels[p + 3]))

        stackIn = stackIn.next

        rOutSum += (pr = stackOut.r)
        gOutSum += (pg = stackOut.g)
        bOutSum += (pb = stackOut.b)
        aOutSum += (pa = stackOut.a)

        rInSum -= pr
        gInSum -= pg
        bInSum -= pb
        aInSum -= pa

        stackOut = stackOut.next

        yi += width
      }
    }
  }
  for (let i = 0; i < width * height * 4; i += 4) {
    pixels[i] = pixels[i] * 255 / pixels[i + 3]
    pixels[i + 1] = pixels[i + 1] * 255 / pixels[i + 3]
    pixels[i + 2] = pixels[i + 2] * 255 / pixels[i + 3]
  }

  return imageData
}

export async function imageDataAChannelAsync (imageData: ImageData, width: number, height: number, radius: number, handlerId?: string) {
  const pixels = imageData.data
  const { getHandlerId } = imageShadowUtils
  const currHandlerId = getHandlerId.bind(imageShadowUtils)
  const div = 2 * radius + 1
  // const w4 = width << 2
  const widthMinus1 = width - 1
  const heightMinus1 = height - 1
  const radiusPlus1 = radius + 1
  const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2

  const stackStart = new BlurStack()
  let stack = stackStart
  let stackEnd = undefined as unknown as BlurStack
  for (let i = 1; i < div; i++) {
    stack = stack.next = new BlurStack()
    if (i === radiusPlus1) {
      stackEnd = stack
    }
  }
  stack.next = stackStart

  let stackIn = null
  let stackOut = null
  let yw = 0
  let yi = 0

  const mulSum = mulTable[radius]
  const shgSum = shgTable[radius]
  // for (let i = 0; i < width * height * 4; i += 4) {
  //   pixels[i] = pixels[i] * pixels[i + 3] / 255
  //   pixels[i + 1] = pixels[i + 1] * pixels[i + 3] / 255
  //   pixels[i + 2] = pixels[i + 2] * pixels[i + 3] / 255
  // }

  const DIVIDE_SIZE = 16
  const _height = Math.ceil(height / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    await imageShadowUtils.asyncProcessing(() => {
      for (let y = _height * i; y < _height * (i + 1) && y < height; y++) {
        stack = stackStart

        // const pr = pixels[yi]
        // const pg = pixels[yi + 1]
        // const pb = pixels[yi + 2]
        const pa = pixels[yi + 3]

        for (let i = 0; i < radiusPlus1; i++) {
          // stack.r = pr
          // stack.g = pg
          // stack.b = pb
          stack.a = pa
          stack = stack.next as BlurStack
        }

        // let rInSum = 0
        // let gInSum = 0
        // let bInSum = 0
        let aInSum = 0
        // let rOutSum = radiusPlus1 * pr
        // let gOutSum = radiusPlus1 * pg
        // let bOutSum = radiusPlus1 * pb
        let aOutSum = radiusPlus1 * pa
        // let rSum = sumFactor * pr
        // let gSum = sumFactor * pg
        // let bSum = sumFactor * pb
        let aSum = sumFactor * pa

        for (let i = 1; i < radiusPlus1; i++) {
          const p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2)

          const r = pixels[p]
          const g = pixels[p + 1]
          const b = pixels[p + 2]
          const a = pixels[p + 3]

          const rbs = radiusPlus1 - i
          // rSum += (stack.r = r) * rbs
          // gSum += (stack.g = g) * rbs
          // bSum += (stack.b = b) * rbs
          aSum += (stack.a = a) * rbs

          // rInSum += r
          // gInSum += g
          // bInSum += b
          aInSum += a

          stack = stack.next as BlurStack
        }

        stackIn = stackStart
        stackOut = stackEnd
        for (let x = 0; x < width && stackIn && stackOut; x++) {
          const paInitial = (aSum * mulSum) >> shgSum
          pixels[yi + 3] = paInitial
          // if (paInitial !== 0) {
          //   const a = 255 / paInitial
          //   pixels[yi] = ((rSum * mulSum) >> shgSum)
          //   pixels[yi + 1] = ((gSum * mulSum) >> shgSum)
          //   pixels[yi + 2] = ((bSum * mulSum) >> shgSum)
          // } else {
          //   pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0
          // }

          // rSum -= rOutSum
          // gSum -= gOutSum
          // bSum -= bOutSum
          aSum -= aOutSum

          // rOutSum -= stackIn.r
          // gOutSum -= stackIn.g
          // bOutSum -= stackIn.b
          aOutSum -= stackIn.a

          let p = x + radius + 1
          p = (yw + (p < widthMinus1
            ? p
            : widthMinus1)) << 2

          // rInSum += (stackIn.r = pixels[p])
          // gInSum += (stackIn.g = pixels[p + 1])
          // bInSum += (stackIn.b = pixels[p + 2])
          aInSum += (stackIn.a = pixels[p + 3])

          // rSum += rInSum
          // gSum += gInSum
          // bSum += bInSum
          aSum += aInSum

          stackIn = stackIn.next

          const { r, g, b, a } = stackOut

          // rOutSum += r
          // gOutSum += g
          // bOutSum += b
          aOutSum += a

          // rInSum -= r
          // gInSum -= g
          // bInSum -= b
          aInSum -= a

          stackOut = stackOut.next

          yi += 4
        }
        yw += width
      }
    })
    if (handlerId !== currHandlerId()) {
      return imageData
    }
  }
  // for (let x = 0; x < width; x++) {
  const _width = Math.ceil(width / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    await imageShadowUtils.asyncProcessing(() => {
      for (let x = _width * i; x < _width * (i + 1) && x < width; x++) {
        yi = x << 2

        // let pr = pixels[yi]
        // let pg = pixels[yi + 1]
        // let pb = pixels[yi + 2]
        let pa = pixels[yi + 3]
        // let rOutSum = radiusPlus1 * pr
        // let gOutSum = radiusPlus1 * pg
        // let bOutSum = radiusPlus1 * pb
        let aOutSum = radiusPlus1 * pa
        // let rSum = sumFactor * pr
        // let gSum = sumFactor * pg
        // let bSum = sumFactor * pb
        let aSum = sumFactor * pa

        stack = stackStart
        for (let i = 0; i < radiusPlus1; i++) {
          // stack.r = pr
          // stack.g = pg
          // stack.b = pb
          stack.a = pa
          stack = stack.next as BlurStack
        }

        let yp = width

        // let gInSum = 0
        // let bInSum = 0
        // let rInSum = 0
        let aInSum = 0
        for (let i = 1; i <= radius; i++) {
          yi = (yp + x) << 2

          const rbs = radiusPlus1 - i
          // rSum += (stack.r = (pr = pixels[yi])) * rbs
          // gSum += (stack.g = (pg = pixels[yi + 1])) * rbs
          // bSum += (stack.b = (pb = pixels[yi + 2])) * rbs
          aSum += (stack.a = (pa = pixels[yi + 3])) * rbs

          // rInSum += pr
          // gInSum += pg
          // bInSum += pb
          aInSum += pa

          stack = stack.next as BlurStack

          if (i < heightMinus1) {
            yp += width
          }
        }

        yi = x
        stackIn = stackStart
        stackOut = stackEnd
        for (let y = 0; y < height && stackIn && stackOut; y++) {
          let p = yi << 2
          pixels[p + 3] = pa = (aSum * mulSum) >> shgSum
          // if (pa > 0) {
          //   pa = 255 / pa
          //   pixels[p] = ((rSum * mulSum) >> shgSum)
          //   pixels[p + 1] = ((gSum * mulSum) >> shgSum)
          //   pixels[p + 2] = ((bSum * mulSum) >> shgSum)
          // } else {
          //   pixels[p] = pixels[p + 1] = pixels[p + 2] = 0
          // }

          // rSum -= rOutSum
          // gSum -= gOutSum
          // bSum -= bOutSum
          aSum -= aOutSum

          // rOutSum -= stackIn.r
          // gOutSum -= stackIn.g
          // bOutSum -= stackIn.b
          aOutSum -= stackIn.a

          p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2

          // rSum += (rInSum += (stackIn.r = pixels[p]))
          // gSum += (gInSum += (stackIn.g = pixels[p + 1]))
          // bSum += (bInSum += (stackIn.b = pixels[p + 2]))
          aSum += (aInSum += (stackIn.a = pixels[p + 3]))

          stackIn = stackIn.next

          // rOutSum += (pr = stackOut.r)
          // gOutSum += (pg = stackOut.g)
          // bOutSum += (pb = stackOut.b)
          aOutSum += (pa = stackOut.a)

          // rInSum -= pr
          // gInSum -= pg
          // bInSum -= pb
          aInSum -= pa

          stackOut = stackOut.next

          yi += width
        }
      }
    })
    if (handlerId !== currHandlerId()) {
      return imageData
    }
  }

  // for (let i = 0; i < width * height * 4; i += 4) {
  //   pixels[i] = pixels[i] * 255 / pixels[i + 3]
  //   pixels[i + 1] = pixels[i + 1] * 255 / pixels[i + 3]
  //   pixels[i + 2] = pixels[i + 2] * 255 / pixels[i + 3]
  // }

  return imageData
}
/**
 * This is the sync version
 */
export function imageDataAChannel (imageData: ImageData, width: number, height: number, radius: number, handlerId?: string) {
  const pixels = imageData.data
  const { getHandlerId } = imageShadowUtils
  const currHandlerId = getHandlerId.bind(imageShadowUtils)
  const div = 2 * radius + 1
  // const w4 = width << 2
  const widthMinus1 = width - 1
  const heightMinus1 = height - 1
  const radiusPlus1 = radius + 1
  const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2

  const stackStart = new BlurStack()
  let stack = stackStart
  let stackEnd = undefined as unknown as BlurStack
  for (let i = 1; i < div; i++) {
    stack = stack.next = new BlurStack()
    if (i === radiusPlus1) {
      stackEnd = stack
    }
  }
  stack.next = stackStart

  let stackIn = null
  let stackOut = null
  let yw = 0
  let yi = 0

  const mulSum = mulTable[radius]
  const shgSum = shgTable[radius]

  const DIVIDE_SIZE = 16
  const _height = Math.ceil(height / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    for (let y = _height * i; y < _height * (i + 1) && y < height; y++) {
      stack = stackStart
      const pa = pixels[yi + 3]

      for (let i = 0; i < radiusPlus1; i++) {
        stack.a = pa
        stack = stack.next as BlurStack
      }

      let aInSum = 0
      let aOutSum = radiusPlus1 * pa
      let aSum = sumFactor * pa

      for (let i = 1; i < radiusPlus1; i++) {
        const p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2)

        const r = pixels[p]
        const g = pixels[p + 1]
        const b = pixels[p + 2]
        const a = pixels[p + 3]

        const rbs = radiusPlus1 - i
        aSum += (stack.a = a) * rbs
        aInSum += a
        stack = stack.next as BlurStack
      }

      stackIn = stackStart
      stackOut = stackEnd
      for (let x = 0; x < width && stackIn && stackOut; x++) {
        const paInitial = (aSum * mulSum) >> shgSum
        pixels[yi + 3] = paInitial
        aSum -= aOutSum
        aOutSum -= stackIn.a

        let p = x + radius + 1
        p = (yw + (p < widthMinus1
          ? p
          : widthMinus1)) << 2
        aInSum += (stackIn.a = pixels[p + 3])
        aSum += aInSum
        stackIn = stackIn.next

        const { r, g, b, a } = stackOut
        aOutSum += a
        aInSum -= a
        stackOut = stackOut.next
        yi += 4
      }
      yw += width
    }
    if (handlerId !== currHandlerId()) {
      return imageData
    }
  }
  const _width = Math.ceil(width / DIVIDE_SIZE)
  for (let i = 0; i < DIVIDE_SIZE; i++) {
    for (let x = _width * i; x < _width * (i + 1) && x < width; x++) {
      yi = x << 2
      let pa = pixels[yi + 3]
      let aOutSum = radiusPlus1 * pa
      let aSum = sumFactor * pa

      stack = stackStart
      for (let i = 0; i < radiusPlus1; i++) {
        stack.a = pa
        stack = stack.next as BlurStack
      }

      let yp = width
      let aInSum = 0
      for (let i = 1; i <= radius; i++) {
        yi = (yp + x) << 2
        const rbs = radiusPlus1 - i
        aSum += (stack.a = (pa = pixels[yi + 3])) * rbs
        aInSum += pa
        stack = stack.next as BlurStack
        if (i < heightMinus1) {
          yp += width
        }
      }

      yi = x
      stackIn = stackStart
      stackOut = stackEnd
      for (let y = 0; y < height && stackIn && stackOut; y++) {
        let p = yi << 2
        pixels[p + 3] = pa = (aSum * mulSum) >> shgSum
        aSum -= aOutSum
        aOutSum -= stackIn.a
        p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2
        aSum += (aInSum += (stackIn.a = pixels[p + 3]))
        stackIn = stackIn.next
        aOutSum += (pa = stackOut.a)
        aInSum -= pa
        stackOut = stackOut.next
        yi += width
      }
    }
    if (handlerId !== currHandlerId()) {
      return imageData
    }
  }
  return imageData
}
