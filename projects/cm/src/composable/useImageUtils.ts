const useImageUtils = () => {
  const imgLoadHandler = async <T>(
    src: string,
    cb: (img: HTMLImageElement) => T,
    options?: { error?: (img?: HTMLImageElement) => void; crossOrigin?: boolean }
  ) => {
    const { error, crossOrigin = false } = options || {}
    return new Promise<T>((resolve) => {
      const image = new Image()
      if (crossOrigin) {
        image.crossOrigin = 'anonymous'
      }
      image.onload = () => resolve(cb(image))
      error && (image.onerror = () => error(image))
      image.src = src
    })
  }

  // If window.require not is not defined, use this instead.
  const require = (src: string) => {
    if (src.startsWith('@img/')) {
      src = src.replace('@img/', '')
      return new URL(`../../../../packages/vivi-lib/src/assets/img/${src}`, import.meta.url).href
    }
    return new URL(`../assets/img/${src}`, import.meta.url).href
  }

  return {
    imgLoadHandler,
    require,
  }
}

export default useImageUtils
