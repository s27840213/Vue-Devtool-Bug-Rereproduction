interface IRect {
  top: number,
  left: number,
  width: number,
  height: number
}

// function manhattan (imageData: ImageData, rect?: IRect) {
//   const DIST_MAX = 128
//   const { data: pixels, width: _w, height: _h } = imageData
//   const { left = 0, top = 0, width = _w, height = _h } = rect || {}
//   const mapX = new Array(pixels.length).fill(DIST_MAX) as Array<number>
//   const mapY = new Array(pixels.length).fill(DIST_MAX) as Array<number>
//   for (let y = top; y < top + height; y++) {
//     const yy = y * _w
//     for (let x = left; x < left + width; x++) {
//       const pos0 = yy + x
//       const pos = pos0 * 4
//       if (pixels[pos + 3] > 32) {
//         mapX[pos0] = 1 - pixels[pos + 3] / 255
//         mapY[pos0] = mapX[pos0]
//       } else {
//         mapX[pos0] = width > DIST_MAX ? DIST_MAX : width
//         mapY[pos0] = height > DIST_MAX ? DIST_MAX : height
//         let curX = width > DIST_MAX ? DIST_MAX : width
//         let curY = height > DIST_MAX ? DIST_MAX : height
//         if (x > left) {
//           const tmpX = mapX[pos0 - 1] + 1
//           const tmpY = mapY[pos0 - 1]
//           if (tmpX < curX || tmpY < curY) {
//             if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//               curX = tmpX
//               curY = tmpY
//             }
//           }
//         }
//         if (y > top) {
//           const tmpX = mapX[pos0 - _w]
//           const tmpY = mapY[pos0 - _w] + 1
//           if (tmpX < curX || tmpY < curY) {
//             if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//               curX = tmpX
//               curY = tmpY
//             }
//           }
//         }
//         mapX[pos0] = curX
//         mapY[pos0] = curY
//       }
//     }
//   }
//   for (let y = top + height - 1; y >= top; y--) {
//     const yy = y * _w
//     for (let x = left + width - 1; x >= left; x--) {
//       const pos = yy + x
//       let curX = mapX[pos]
//       let curY = mapY[pos]
//       if (x + 1 < left + width) {
//         const tmpX = mapX[pos + 1] + 1
//         const tmpY = mapY[pos + 1]
//         if (tmpX < curX || tmpY < curY) {
//           if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//             curX = tmpX
//             curY = tmpY
//           }
//         }
//       }
//       if (y + 1 < top + height) {
//         const tmpX = mapX[pos + _w]
//         const tmpY = mapY[pos + _w] + 1
//         if (tmpX < curX || tmpY < curY) {
//           if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//             curX = tmpX
//             curY = tmpY
//           }
//         }
//       }
//       mapX[pos] = curX
//       mapY[pos] = curY
//     }
//   }
//   for (let y = top; y < top + height; y++) {
//     const yy = y * _w
//     for (let x = left + width - 1; x >= left; x--) {
//       const pos = yy + x
//       let curX = mapX[pos]
//       let curY = mapY[pos]
//       if (x + 1 < left + width) {
//         const tmpX = mapX[pos + 1] + 1
//         const tmpY = mapY[pos + 1]
//         if (tmpX < curX || tmpY < curY) {
//           if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//             curX = tmpX
//             curY = tmpY
//           }
//         }
//       }
//       if (y > top) {
//         const tmpX = mapX[pos - _w]
//         const tmpY = mapY[pos - _w] + 1
//         if (tmpX < curX || tmpY < curY) {
//           if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//             curX = tmpX
//             curY = tmpY
//           }
//         }
//       }
//       mapX[pos] = curX
//       mapY[pos] = curY
//     }
//   }
//   for (let y = top + height - 1; y >= top; y--) {
//     const yy = y * _w
//     for (let x = left; x < left + width; x++) {
//       const pos = yy + x
//       let curX = mapX[pos]
//       let curY = mapY[pos]
//       if (x > left) {
//         const tmpX = mapX[pos - 1] + 1
//         const tmpY = mapY[pos - 1]
//         if (tmpX < curX || tmpY < curY) {
//           if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//             curX = tmpX
//             curY = tmpY
//           }
//         }
//       }
//       if (y + 1 < top + height) {
//         const tmpX = mapX[pos + _w]
//         const tmpY = mapY[pos + _w] + 1
//         if (tmpX < curX || tmpY < curY) {
//           if (tmpX * tmpX + tmpY * tmpY < curX * curX + curY * curY) {
//             curX = tmpX
//             curY = tmpY
//           }
//         }
//       }
//       mapX[pos] = curX
//       mapY[pos] = curY
//     }
//   }
//   return { mapX, mapY }
// }

export function getDilate(imageData: ImageData, rect?: IRect, scale = 1) {
  const start = Date.now()
  const { mapX, mapY } = manhattan(imageData, rect)
  console.warn('handle manhanttan calculation: ', Date.now() - start)
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

function manhattan(imageData: ImageData, rect?: { top: number, left: number, width: number, height: number }) {
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
