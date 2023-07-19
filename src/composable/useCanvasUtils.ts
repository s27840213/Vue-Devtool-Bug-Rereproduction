import { IStyle } from '@/interfaces/layer'

const useCanvasUtils = (targetLayerStyle?: IStyle) => {
// This function takes an HTMLCanvasElement as input and returns a trimmed version of it.
  const trimCanvas = (canvas: HTMLCanvasElement) => {
  // Get the 2D rendering context of the input canvas.
    const ctx = canvas.getContext('2d')!

    // Create a new canvas and get its 2D rendering context to hold the trimmed content.
    const copy = document.createElement('canvas').getContext('2d')!

    // Get the pixel data from the original canvas.
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // The total number of pixels (RGBA values).
    const l = pixels.data.length

    // Variables to store the boundaries of the non-transparent content.
    const bound = {
      top: -1,
      left: -1,
      right: -1,
      bottom: -1
    }
    let x, y

    // Iterate over every pixel to find the boundaries of the non-transparent content.
    for (let i = 0; i < l; i += 4) {
    // Check the alpha (transparency) value of each pixel.
      if (pixels.data[i + 3] !== 0) {
      // Calculate the x and y coordinates of the current pixel.
        x = (i / 4) % canvas.width
        y = ~~((i / 4) / canvas.width)

        // Update the top boundary if not set yet.
        if (bound.top === -1) {
          bound.top = y
        }

        // Update the left boundary if not set yet.
        if (bound.left === -1) {
          bound.left = x
        } else if (x < bound.left) {
        // Update the left boundary if the current x coordinate is smaller.
          bound.left = x
        }

        // Update the right boundary if not set yet.
        if (bound.right === -1) {
          bound.right = x
        } else if (x > bound.right) {
        // Update the right boundary if the current x coordinate is greater.
          bound.right = x
        }

        // Update the bottom boundary if not set yet.
        if (bound.bottom === -1) {
          bound.bottom = y
        } else if (y > bound.bottom) {
        // Update the bottom boundary if the current y coordinate is greater.
          bound.bottom = y
        }
      }
    }

    // Calculate the height and width of the non-transparent content.
    const trimHeight = bound.bottom - bound.top
    const trimWidth = bound.right - bound.left

    // Get the trimmed image data based on the boundaries found above.
    const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight)

    // Set the dimensions of the new canvas to match the trimmed content.
    copy.canvas.width = trimWidth
    copy.canvas.height = trimHeight

    // Put the trimmed image data on the new canvas.
    copy.putImageData(trimmed, 0, 0)

    const remainingWidthPercentage = (trimWidth / canvas.width)
    const remainingHeightPercentage = (trimHeight / canvas.height)

    const imgScaleRatio = targetLayerStyle ? targetLayerStyle.width / canvas.width : 1
    // Return an object containing information about the trimmed canvas.
    return {
      canvas: copy.canvas, // The trimmed canvas.
      width: trimWidth, // The width of the trimmed content.
      height: trimHeight, // The height of the trimmed content.
      remainingWidthPercentage,
      remainingHeightPercentage,
      xShift: bound.left * imgScaleRatio, // The x-coordinate shift applied during trimming.
      yShift: bound.top * imgScaleRatio // The y-coordinate shift applied during trimming.
    }
  }

  return {
    trimCanvas
  }
}

export default useCanvasUtils
