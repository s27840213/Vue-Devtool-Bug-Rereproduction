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

  const getImageUrl = (imgName: string, type = 'png') => {
    const targetUrl = `../assets/img/${imgName}.${type}`
    const res = new URL(targetUrl, import.meta.url).href
    return res
  }

  return {
    imgLoadHandler,
    getImageUrl
  }
}

export default useImageUtils
