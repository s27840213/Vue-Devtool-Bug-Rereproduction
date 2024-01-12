import { useUserStore } from '@/stores/user'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import imageShadowPanelUtils from '@nu/vivi-lib/utils/imageShadowPanelUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import * as PIXI from 'pixi.js'
const ENABLE_RECORDING = true
// the time unit is ms
const RECORD_START_DELAY = 600
const RECORD_END_DELAY = 1000
const TRANSITION_TIME = 2800
const IMG2_EXAMPLE =
  'https://images.unsplash.com/photo-1558816280-dee9521ff364?cs=tinysrgb&q=80&h=766&origin=true&appver=v7576'
const IMG1_EXAMPLE =
  'https://images.unsplash.com/photo-1558816280-dee9521ff364?cs=tinysrgb&q=80&h=766&origin=true&appver=v7576'
const WATER_MARK = new URL(
  '../../../../packages/vivi-lib/src/assets/icon/cm/charmix-logo.svg',
  import.meta.url,
).href

export const fragment_opacity = `
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform sampler2D nextImage;
  uniform float opacity;
  void main() {
    vec2 uv = vTextureCoord;
    vec4 image1 = texture2D(uSampler,uv);
    vec4 image2 = texture2D(nextImage,uv);
    gl_FragColor = mix(image1, image2, opacity);
  }
`
// gl_FragColor = mix(image1, image2, opacity);
export const fragment1 = `
  precision mediump float;

  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform highp vec4 inputSize;
  uniform highp vec4 outputFrame;

  vec2 mapCoord( vec2 coord ) {
    coord *= inputSize.xy / outputFrame.zw;
    return coord;
  }

  vec2 unmapCoord( vec2 coord ) {
    coord -= outputFrame.xy;
    coord /= inputSize.xy;
    return coord;
  }

  uniform sampler2D nextImage;
  uniform float dispFactor;

  void main() {
    vec2 uv = vTextureCoord;
    vec2 coord = mapCoord(vTextureCoord);

    vec4 _currentImage;
    vec4 _nextImage;
    float intensity = .3;
    vec4 orig1 = texture2D(uSampler, uv);
    vec4 orig2 = texture2D(nextImage, coord);
    _currentImage = texture2D(uSampler, vec2(uv.x, uv.y + dispFactor * intensity * orig2));
    _nextImage = texture2D(nextImage, vec2(coord.x, coord.y + (1.0 - dispFactor) * intensity * orig1));
    gl_FragColor = mix(_currentImage, _nextImage, dispFactor);
  }
  `
// _currentImage = texture2D(uSampler, vec2(uv.x - dispFactor * intensity * orig2.r * orig2.g * orig2.b, uv.y));
// _nextImage = texture2D(nextImage, vec2(coord.x - (1.0 - dispFactor) * intensity * orig1.r * orig1.g * orig1.b, coord.y));

export const fragment_slide = `
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform highp vec4 inputSize;
  uniform highp vec4 outputFrame;

  vec2 mapCoord( vec2 coord ) {
    coord *= inputSize.xy / outputFrame.zw;
    return coord;
  }
  uniform sampler2D nextImage;
  uniform float dispFactor;

  void main() {
    vec2 uv = vTextureCoord;
    vec2 coord = mapCoord(vTextureCoord);

    vec4 img1 = texture2D(uSampler, vec2(uv.x, uv.y));
    vec4 img2 = texture2D(nextImage, vec2(coord.x, coord.y));
    if (uv.x < dispFactor) {
      gl_FragColor = texture2D(nextImage, vec2(coord.x, coord.y));
    } else if (uv.x == dispFactor) {
      gl_FragColor = mix(img1, img2, 0.5);
    } else {
      gl_FragColor = texture2D(uSampler, vec2(uv.x, uv.y));
    }
  }
  `
export const fragment3 = `
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  void main() {
    vec2 uv = vTextureCoord;
    if ( vTextureCoord.x < 0.5 ) {
      gl_FragColor = texture2D(uSampler,uv);
    } else {
      gl_FragColor = vec4(0, 0.5, 0, 1.0);
    }
  }
`

export default class PixiRecorder {
  private pixi = new PIXI.Application()
  private sprite_src = null as null | PIXI.Sprite
  private texture_res = null as null | PIXI.Texture
  private sprite_wm = null as null | PIXI.Sprite
  private filter = null as null | PIXI.Filter
  private uniforms = {} as { [key: string]: any }
  private time_start = -1
  private dynamicAnimateEndTime = -1
  private canvasRecorder = null as null | CanvasRecorder
  private _animate = null as null | ((delta: number) => void)
  private _genVideoResolver = null as null | (() => void)
  private reset = null as null | (() => void)
  private isImgReady = false
  private _video = { src: '', removeWatermark: false }
  private isRecordingVideo = false
  private fragment = fragment_slide

  get video() {
    return this._video
  }

  constructor(src: string = IMG1_EXAMPLE, res: string = IMG2_EXAMPLE) {
    this.addImage(src, res)
  }

  async genVideo() {
    if (!this.isImgReady) {
      await Promise.race([
        new Promise<void>((resolve) => {
          this._genVideoResolver = resolve
        }),
        new Promise<void>((resolve, reject) => setTimeout(reject, 60000)),
      ]).catch(() => {
        throw new Error('pixi-recorder: can not load image as genVideo!')
      })
    }
    this.watermarkHandler()

    // if the video is recording already, stop it first
    if (this.isRecordingVideo && this.sprite_src) {
      this.canvasRecorder?.stop(true)
      this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
    }

    this.reset && this.reset()
    if (this._animate) {
      this.pixi.ticker.add(this._animate)
    }

    return new Promise<string | 'error'>((resolve) => {
      const stopCb = (url: string) => {
        this.isRecordingVideo = false
        return resolve(url)
      }
      this.canvasRecorder = new CanvasRecorder(this.pixi.view as HTMLCanvasElement, stopCb)
      this.canvasRecorder.start(1000)
      this.isRecordingVideo = true
    }).then((res) => {
      if (res === 'error') {
        return undefined
      }
      this._video.src = res
      return { src: res, removeWatermark: this._video.removeWatermark }
    })
  }

  watermarkHandler() {
    const { removeWatermark } = useUserStore()
    if (removeWatermark && this.sprite_wm) {
      this.pixi.stage.removeChild(this.sprite_wm)
      this._video.removeWatermark = true
    } else if (this.sprite_wm) {
      this.pixi.stage.addChild(this.sprite_wm)
      this._video.removeWatermark = false
    }
  }

  async saveToDevice(url = this.video.src, path?: string) {
    const { removeWatermark } = useUserStore()
    if (this.video.removeWatermark !== removeWatermark) {
      const data = await this.genVideo()
      if (data) {
        url = data.src
      } else {
        throw new Error('can not generate video')
      }
    }
    const blob = await getBlobFromUrl(url)
    const base64 = await blobToBase64(blob)
    if (url) {
      return cmWVUtils.saveAssetFromUrl('mp4', base64, path)
    } else {
      throw new Error('video not generated yet')
    }
  }

  addOpacityFilter() {
    if (!this.sprite_src) return

    this.uniforms.opacity = 0
    this.uniforms.nextImage = this.texture_res
    this.filter = new PIXI.Filter(undefined, fragment_opacity, this.uniforms)
    this.sprite_src.filters = [this.filter]
    this._animate = () => {
      const now = Date.now()
      // init time
      if (this.time_start === -1) {
        this.time_start = now
      }
      if (this.uniforms.opacity >= 1) {
        if (this.dynamicAnimateEndTime === -1) {
          this.dynamicAnimateEndTime = now
        } else {
          if (now - this.dynamicAnimateEndTime >= RECORD_END_DELAY) {
            this.dynamicAnimateEndTime = -1
            this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
            if (this.canvasRecorder) {
              this.canvasRecorder.stop()
            }
          }
        }
      }
      this.uniforms.opacity = (now - this.time_start) / TRANSITION_TIME
    }
  }

  addFragment1Filter() {
    if (!this.sprite_src) return
    this.uniforms.dispFactor = 0
    this.uniforms.nextImage = this.texture_res
    this.filter = new PIXI.Filter(undefined, fragment1, this.uniforms)
    this.sprite_src.filters = [this.filter]
    this._animate = () => {
      const now = Date.now()
      if (this.uniforms.dispFactor >= 1) {
        this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.uniforms.dispFactor = (now - this.time_start) / TRANSITION_TIME
    }
  }

  addFragment3Filter() {
    if (!this.sprite_src) return

    this.filter = new PIXI.Filter(undefined, fragment3, this.uniforms)
    this.sprite_src.filters = [this.filter]
    this._animate = () => {
      const now = Date.now()
      if (now / TRANSITION_TIME >= Math.PI * 0.5) {
        this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
    }
  }

  addSlideFilter() {
    if (!this.sprite_src) return

    this.reset = () => {
      this.time_start = -1
      this.uniforms.dispFactor = 0
      this.uniforms.nextImage = this.texture_res
      this.filter = new PIXI.Filter(undefined, fragment_slide, this.uniforms)
      if (this.sprite_src) {
        this.sprite_src.filters = [this.filter]
      }
    }
    this._animate = (delta) => {
      const now = Date.now()
      if (this.time_start === -1) {
        this.time_start = now
      }

      if (now - this.time_start < RECORD_START_DELAY) {
        return
      }
      console.log(now - this.time_start, RECORD_START_DELAY)

      if (this.uniforms.dispFactor >= 1) {
        if (this.dynamicAnimateEndTime === -1) {
          this.dynamicAnimateEndTime = now
        } else {
          if (now - this.dynamicAnimateEndTime >= RECORD_END_DELAY) {
            this.dynamicAnimateEndTime = -1
            this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
            this.reset && this.reset()
            if (this.canvasRecorder) {
              this.canvasRecorder.stop()
            }
          }
        }
      }
      this.uniforms.dispFactor = (now - this.time_start - RECORD_START_DELAY) / TRANSITION_TIME
    }
  }

  addFilter(filter: string) {
    switch (filter) {
      case fragment_opacity:
        return this.addOpacityFilter()
      case fragment_slide:
        return this.addSlideFilter()
      case fragment1:
        return this.addFragment1Filter()
      case fragment3:
        return this.addFragment3Filter()
    }
  }

  loadImgs(img1: string, img2: string) {
    const p1 = new Promise<PIXI.Texture>((resolve) => {
      PIXI.Texture.fromURL(img1).then((texture) => {
        this.sprite_src = new PIXI.Sprite(texture)
        this.sprite_src.width = texture.width
        this.sprite_src.height = texture.height
        resolve(texture)
      })
    })
    const p2 = new Promise<PIXI.Texture>((resolve) => {
      PIXI.Texture.fromURL(img2).then((texture) => {
        this.texture_res = texture
        resolve(texture)
      })
    })

    const p3 = new Promise<PIXI.Texture>((resolve) => {
      // to fix svg blurry error, we need to resize the svg first
      imageUtils.imgLoadHandler(WATER_MARK, async (img: HTMLImageElement) => {
        const { width, height } = await imageUtils.imgLoadHandler(img1, (img) => {
          return img
        })
        imageShadowPanelUtils.svgImageSizeFormatter(img, Math.min(width, height) * 0.5, () => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 500
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight)
            PIXI.Texture.fromURL(img.src, {
              resourceOptions: { resolution: devicePixelRatio },
            }).then((texture) => {
              // safari bug: svg partially rendered, need to destroy it and reload it again
              // see. https://github.com/pixijs/pixijs/issues/7204
              texture.baseTexture.destroy()
              PIXI.Texture.fromURL(img.src, {
                resourceOptions: { resolution: devicePixelRatio },
              }).then((texture) => {
                this.sprite_wm = new PIXI.Sprite(texture)
                this.sprite_wm.width = texture.width
                this.sprite_wm.height = texture.height
                resolve(texture)
              })
            })
          }
        })
      })
    })

    return Promise.all([p1, p2, p3])
  }

  addImage(src: string, res: string) {
    return this.loadImgs(src, res)
      .then(() => {
        this.isImgReady = true
        if (!this.sprite_src) return console.warn('no sprite')

        this.pixi.view.width = this.sprite_src.width
        this.pixi.view.height = this.sprite_src.height
        this.pixi.stage.addChild(this.sprite_src)
        if (this.sprite_wm) {
          const ratio = this.sprite_wm.width / this.sprite_wm.height
          this.sprite_wm.width = Math.min(this.sprite_src.width, this.sprite_src.height) * 0.5
          this.sprite_wm.height = this.sprite_wm.width / ratio
          this.sprite_wm.x = this.sprite_src.width - this.sprite_wm.width - 50
          this.sprite_wm.y = this.sprite_src.height - this.sprite_wm.height - 50
        }
        const renderer = this.pixi.renderer
        renderer.resize(this.sprite_src.width, this.sprite_src.height)
        this.addFilter(this.fragment)

        // @TEST use
        // const testCanvas = this.pixi.view as HTMLCanvasElement
        // document.body.appendChild(testCanvas)
        // testCanvas.style.position = 'absolute'
        // testCanvas.style.top = '0'
        // testCanvas.style.width = '300px'
        // testCanvas.style.left = '0'

        // if the genVideo func is called, but the imgs is not loaded yet,
        // the genVideo func will await for the imgs to be loaded
        if (this._genVideoResolver) {
          this._genVideoResolver()
        }
      })
      .catch(() => {
        throw new Error('pixi-recorder: can not load image!')
      })
  }
}

class CanvasRecorder {
  private canvas: HTMLCanvasElement
  private stream: MediaStream
  private recorder: MediaRecorder
  private chunks = [] as Array<any>
  // private _resolver = null as null | ((value: string | PromiseLike<string> | 'error') => void)
  private _stopCb = undefined as undefined | ((url: string) => void)

  constructor(canvas: HTMLCanvasElement, stopCb?: (url: string) => void) {
    this.canvas = canvas
    this.stream = this.canvas.captureStream()
    this.recorder = new MediaRecorder(this.stream, this.getMimeTypeSupportOptions())
    this.recorder.ondataavailable = (e) => this.onDataAvailable(e)
    if (stopCb) {
      this._stopCb = stopCb
    }
  }

  start(time: number) {
    this.recorder.start(time)
  }

  stop(notStoreVideo = false) {
    this.recorder.onstop = () => {
      if (notStoreVideo) {
        if (this._stopCb) {
          this._stopCb('')
        }
      } else {
        const url = URL.createObjectURL(new Blob(this.chunks, { type: 'video/mp4' }))
        if (this._stopCb) {
          this._stopCb(url)
        }
      }
    }
    this.recorder.stop()
  }

  onDataAvailable(e: any) {
    if (e.data && e.data.size) {
      this.chunks.push(e.data)
    }
  }

  // ios 16 supported for video/mp4 not supported for video/webm
  // howerver, chrome supported for video/webm not supported for video/mp4 (2023.9.9)
  getMimeTypeSupportOptions() {
    if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
      return { mimeType: 'video/webm; codecs=vp9' }
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      return { mimeType: 'video/webm' }
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      // return { mimeType: 'video/mp4', videoBitsPerSecond : 300000 }
      return { mimeType: 'video/mp4' }
    } else {
      console.error('no suitable mimetype found for this device')
    }
  }
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () =>
      resolve((reader.result as string).replace('data:', '').replace(/^.+,/, ''))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const getBlobFromUrl = async (url: string) => {
  return new Promise<Blob>((resolve) => {
    fetch(url).then((r) => resolve(r.blob()))
  })
}

export const saveToDevice = async (url: string) => {
  const blob = await getBlobFromUrl(url)
  const base64 = await blobToBase64(blob)
  return cmWVUtils.saveAssetFromUrl('mp4', base64)
}
