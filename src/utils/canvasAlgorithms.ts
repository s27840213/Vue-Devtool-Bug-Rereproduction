function manhattan (imageData: ImageData) {
	const DIST_MAX = 128
	const mapX = [] as Array<number>
	const mapY = [] as Array<number>
	const { data: pixels, width, height } = imageData
	for (let y = 0; y < height; y++) {
		const yy = y * width
		for (let x = 0; x < width; x++) {
			const pos0 = yy + x
			const pos = pos0 * 4
			if (pixels[pos + 3] > 0) {
				mapX[pos0] = 0
				mapY[pos0] = 0
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

export function getDilate(imageData: ImageData, unifiedScale: number) {
	const start = Date.now()
	const { mapX, mapY } = manhattan(imageData)
	console.warn('handle manhanttan calculation: ', Date.now() - start)
	const { data: pixels, width, height } = imageData

	const SPREAD_RADIUS = 5
	const unifiedSpreadRadius = SPREAD_RADIUS * unifiedScale
	const _uni_spread_rad = 1 / unifiedSpreadRadius

	return (r: number): Uint8ClampedArray => {
		r *= unifiedScale
		for (let y = 0; y < height; y++) {
			const yy = y * width
			for (let x = 0; x < width; x++) {
				const pos0 = yy + x
				const pos = pos0 * 4
				const dist = Math.sqrt(mapX[pos0] * mapX[pos0] + mapY[pos0] * mapY[pos0])
				pixels[pos] = 0
				pixels[pos + 1] = 0
				pixels[pos + 2] = 0
				if (dist > r) {
					pixels[pos + 3] = 0
				}	else {
					pixels[pos + 3] = 255
				}
			}
		}
		return pixels
	}
}
// if (dist > r + unifiedSpreadRadius) {
// 	pixels[pos + 3] = 0
// } else if (dist >= r) {
// 	pixels[pos + 3] = 255 * (1 - (dist - r) * _uni_spread_rad)
// }	else {
// 	pixels[pos + 3] = 255
// }
