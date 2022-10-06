interface IRect {
  top: number,
  left: number,
  width: number,
  height: number
}

const getManhanttan = function (imageData: ImageData, region?: IRect, scale = 1) {
  const { mapX, mapY } = manhattan(imageData, region)
  const { data: pixels, width, height } = imageData
  const trasition_r = 1
  const _trasition_r = 1 / trasition_r

  return (r: number): Uint8ClampedArray => {
    r *= scale
    for (let y = 0; y < height; y++) {
      const yy = y * width
      for (let x = 0; x < width; x++) {
        const pos0 = yy + x
        const pos = pos0 * 4
        const dist = Math.sqrt(mapX[pos0] * mapX[pos0] + mapY[pos0] * mapY[pos0])
        pixels[pos] = 0
        pixels[pos + 1] = 0
        pixels[pos + 2] = 0
        if (dist > r + trasition_r) {
          pixels[pos + 3] = 0
        } else if (dist >= r) {
          pixels[pos + 3] = 255 * (1 - (dist - r) * _trasition_r)
        } else {
          pixels[pos + 3] = 255
        }
      }
    }
    return pixels
  }
}

const getRect = function (imageData: ImageData, region?: IRect, scale = 1) {
  const map = rect(imageData, region)
  const { data: pixels, width, height } = imageData

  return (r: number): Uint8ClampedArray => {
    r *= scale
    for (let y = 0; y < height; y++) {
      const yy = y * width
      for (let x = 0; x < width; x++) {
        const pos0 = yy + x
        const pos = pos0 * 4
        pixels[pos] = 0
        pixels[pos + 1] = 0
        pixels[pos + 2] = 0
        if (map[pos0] >= r) {
          pixels[pos + 3] = 0
        } else {
          pixels[pos + 3] = 255
        }
      }
    }
    return pixels
  }
}

const rect = function (imageData: ImageData, region?: { top: number, left: number, width: number, height: number }) {
  const DIST_MAX = 128
  const map = [] as Array<number>
  const { data: pixels, width, height } = imageData
  for (let y = 0; y < height; y++) {
    const yy = y * width
    for (let x = 0; x < width; x++) {
      const pos0 = yy + x
      const pos = pos0 * 4
      if (pixels[pos + 3] > 0) {
        map[pos0] = 0
      } else {
        map[pos0] = DIST_MAX
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          if (map[pos0 - width] === map[pos0 - 1] && map[pos0 - width] === map[pos0 - width - 1] + 1) {
            map[pos0] = map[pos0 - width]
            continue
          }
        }
        if (x > 0) {
          map[pos0] = Math.min(map[pos0], map[pos0 - 1] + 1)
        }
        if (y > 0) {
          map[pos0] = Math.min(map[pos0], map[pos0 - width] + 1)
        }
      }
    }
  }
  for (let y = Math.floor(height / 2); y >= 0; y--) {
    const yy = y * width
    for (let x = Math.floor(width / 2); x >= 0; x--) {
      const pos = yy + x
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        if (map[pos + width] === map[pos + 1] && map[pos + width] === map[pos + width + 1] + 1) {
          map[pos] = map[pos + width]
          continue
        }
      }
      if (x + 1 < width) {
        map[pos] = Math.min(map[pos], map[pos + 1] + 1)
      }
      if (y + 1 < height) {
        map[pos] = Math.min(map[pos], map[pos + width] + 1)
      }
    }
  }
  for (let y = Math.floor(height / 2); y < height; y++) {
    const yy = y * width
    for (let x = Math.floor(width / 2); x >= 0; x--) {
      const pos = yy + x
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        if (map[pos - width] === map[pos + 1] && map[pos + 1] === map[pos - width + 1] + 1) {
          map[pos] = map[pos + 1]
          continue
        }
      }
      if (x + 1 < width) {
        map[pos] = Math.min(map[pos], map[pos + 1] + 1)
      }
      if (y > 0) {
        map[pos] = Math.min(map[pos], map[pos - width] + 1)
      }
    }
  }
  for (let y = Math.floor(height / 2); y >= 0; y--) {
    const yy = y * width
    for (let x = Math.floor(width / 2); x < width; x++) {
      const pos = yy + x
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        if (map[pos + width] === map[pos - 1] && map[pos - 1] === map[pos + width - 1] + 1) {
          map[pos] = map[pos - 1]
          continue
        }
      }
      if (x > 0) {
        map[pos] = Math.min(map[pos], map[pos - 1] + 1)
      }
      if (y + 1 < height) {
        map[pos] = Math.min(map[pos], map[pos + width] + 1)
      }
    }
  }
  return map
}

function manhattan (imageData: ImageData, region?: { top: number, left: number, width: number, height: number }) {
  const DIST_MAX = 128
  const mapX = [] as Array<number>
  const mapY = [] as Array<number>
  const { data: pixels, width, height } = imageData
  for (let y = 0; y < height; y++) {
    const yy = y * width
    for (let x = 0; x < width; x++) {
      const pos0 = yy + x
      const pos = pos0 * 4
      if (pixels[pos + 3] > 32) {
        mapX[pos0] = 1 - pixels[pos + 3] / 255
        mapY[pos0] = mapX[pos0]
      } else {
        mapX[pos0] = width > DIST_MAX ? DIST_MAX : width
        mapY[pos0] = height > DIST_MAX ? DIST_MAX : height
        let curX = width > DIST_MAX ? DIST_MAX : width
        let curY = height > DIST_MAX ? DIST_MAX : height
        if (x > 0) {
          const tmpX = mapX[pos0 - 1] + 1
          const tmpY = mapY[pos0 - 1]
          if (tmpX < curX || tmpY < curY) {
            if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
              curX = tmpX
              curY = tmpY
            }
          }
        }
        if (y > 0) {
          const tmpX = mapX[pos0 - width]
          const tmpY = mapY[pos0 - width] + 1
          if (tmpX < curX || tmpY < curY) {
            if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
              curX = tmpX
              curY = tmpY
            }
          }
        }
        mapX[pos0] = curX
        mapY[pos0] = curY
      }
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    const yy = y * width
    for (let x = width - 1; x >= 0; x--) {
      const pos = yy + x
      let curX = mapX[pos]
      let curY = mapY[pos]
      if (x + 1 < width) {
        const tmpX = mapX[pos + 1] + 1
        const tmpY = mapY[pos + 1]
        if (tmpX < curX || tmpY < curY) {
          if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
            curX = tmpX
            curY = tmpY
          }
        }
      }
      if (y + 1 < height) {
        const tmpX = mapX[pos + width]
        const tmpY = mapY[pos + width] + 1
        if (tmpX < curX || tmpY < curY) {
          if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
            curX = tmpX
            curY = tmpY
          }
        }
      }
      mapX[pos] = curX
      mapY[pos] = curY
    }
  }
  for (let y = 0; y < height; y++) {
    const yy = y * width
    for (let x = width - 1; x >= 0; x--) {
      const pos = yy + x
      let curX = mapX[pos]
      let curY = mapY[pos]
      if (x + 1 < width) {
        const tmpX = mapX[pos + 1] + 1
        const tmpY = mapY[pos + 1]
        if (tmpX < curX || tmpY < curY) {
          if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
            curX = tmpX
            curY = tmpY
          }
        }
      }
      if (y > 0) {
        const tmpX = mapX[pos - width]
        const tmpY = mapY[pos - width] + 1
        if (tmpX < curX || tmpY < curY) {
          if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
            curX = tmpX
            curY = tmpY
          }
        }
      }
      mapX[pos] = curX
      mapY[pos] = curY
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    const yy = y * width
    for (let x = 0; x < width; x++) {
      const pos = yy + x
      let curX = mapX[pos]
      let curY = mapY[pos]
      if (x > 0) {
        const tmpX = mapX[pos - 1] + 1
        const tmpY = mapY[pos - 1]
        if (tmpX < curX || tmpY < curY) {
          if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
            curX = tmpX
            curY = tmpY
          }
        }
      }
      if (y + 1 < height) {
        const tmpX = mapX[pos + width]
        const tmpY = mapY[pos + width] + 1
        if (tmpX < curX || tmpY < curY) {
          if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
            curX = tmpX
            curY = tmpY
          }
        }
      }
      mapX[pos] = curX
      mapY[pos] = curY
    }
  }
  return { mapX, mapY }
}

export function getDilate(imageData: ImageData, isRect?: boolean, region?: IRect, scale = 1) {
  return isRect ? getRect(imageData, region, scale) : getManhanttan(imageData, region, scale)
}
