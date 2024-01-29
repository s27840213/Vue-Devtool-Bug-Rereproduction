import { useUserStore } from '@/stores/user'
import { notify } from '@kyvg/vue3-notification'
import { ISize } from '@nu/vivi-lib/interfaces/math'
import store from '@nu/vivi-lib/store'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageShadowPanelUtils from '@nu/vivi-lib/utils/imageShadowPanelUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import * as PIXI from 'pixi.js'
const ENABLE_RECORDING = true
// the time unit is ms
const RECORD_START_DELAY = 600 as const
const RECORD_END_DELAY = 1000 as const
const TRANSITION_TIME = 2800 as const
const IMG2_EXAMPLE =
  'https://images.unsplash.com/photo-1495379572396-5f27a279ee91?cs=tinysrgb&q=80&w=766&origin=true&appver=v922'
// 'https://images.unsplash.com/photo-1552300977-cbc8b08d95e7?cs=tinysrgb&q=80&h=76&origin=true&appver=v922'
const IMG1_EXAMPLE =
  'https://images.unsplash.com/photo-1552300977-cbc8b08d95e7?cs=tinysrgb&q=80&h=766&origin=true&appver=v922'
const WATER_MARK = new URL(
  '../../../../packages/vivi-lib/src/assets/icon/cm/genpix-watermark.svg',
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
      gl_FragColor = img2;
    } else if (uv.x == dispFactor) {
      gl_FragColor = mix(img1, img2, 0.5);
    } else {
      gl_FragColor = img1;
    }
  }
  `
const errLoging = (title: string, content: string, err?: Error) => {
  const errorId = generalUtils.generateRandomString(6)
  const hint = `${store.getters['user/getUserId']}:${
    store.getters['cmWV/getUserInfo'].hostId
  },${generalUtils.generateTimeStamp()},${errorId}`
  logUtils.setLog(`${errorId}<br/>(${title})<br/>(${content})<br/>(${hint})`)
  if (err) {
    logUtils.setLogForError(err)
  }
  logUtils.uploadLog().then(() => {
    modalUtils.setModalInfo(title, `${content}<br/>(${hint})`, {
      msg: 'Okay!',
      action() {
        generalUtils.copyText(hint).then(() => {
          notify({ group: 'success', text: 'copy' })
        })
      },
    })
  })
  return `${title}/n${content}/n${hint}`
}

export default class PixiRecorder {
  private pixi = new PIXI.Application()
  private pixi_imgGen = new PIXI.Application({
    backgroundAlpha: 1,
    backgroundColor: '0xFFFFFF',
  })

  private sprite_src = null as null | PIXI.Sprite
  private texture_res = null as null | PIXI.Texture
  private sprite_res = null as null | PIXI.Sprite
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
  private testCanvasId = ''
  videoSize = { width: 0, height: 0 }

  get video() {
    return this._video
  }

  async genVideo() {
    if (!this.isImgReady) {
      await Promise.race([
        new Promise<void>((resolve) => {
          this._genVideoResolver = resolve
        }),
        new Promise<void>((resolve, reject) => setTimeout(reject, 60000)),
      ]).catch((e) => {
        throw new Error(
          errLoging('Generate video failed', 'pixi-recorder: can not load image as genVideo!'),
          e as Error,
        )
      })
    }
    if (!this.sprite_src) {
      throw new Error(
        errLoging('Generate video failed', 'the sprite_src in genVideo is undefined!'),
      )
    }

    logUtils.setLogAndConsoleLog('genVideo in pixirecorder.ts')

    // if the video is recording already, stop it first
    // this pixi instance only gening one video once a time
    if (this.isRecordingVideo) {
      await this.shutGeningVideo()
    } else if (this.pixi.ticker.count !== 0 && this._animate) {
      // check if the ticker has _animate not removed
      this.pixi.ticker.remove(this._animate)
    }

    // TEST use
    this.addTestCanvas()

    // resizing canavs
    this.pixi.view.width = this.sprite_src.width
    this.pixi.view.height = this.sprite_src.height
    const renderer = this.pixi.renderer
    renderer.resize(this.pixi.view.width, this.pixi.view.height)

    // canvas/sprite setup
    this.pixi.stage.sortableChildren = true
    this.pixi.stage.removeChildren()
    this.pixi.stage.addChild(this.sprite_src)
    this.watermarkHandler()
    this.addFilter(this.fragment)
    this.reset && this.reset()
    this.pixi.render()

    if (this._animate) {
      this.pixi.ticker.add(this._animate)
    } else {
      throw new Error(errLoging('Generate video failed', 'the _animate in genVideo is undefined!'))
    }

    return new Promise<string | 'error'>((resolve) => {
      const stopCb = (url: string) => {
        this.isRecordingVideo = false
        if (
          store.getters['cmWV/getDebugMode'] &&
          document.body.contains(this.pixi.view as HTMLCanvasElement)
        ) {
          document.body.removeChild(this.pixi.view as HTMLCanvasElement)
        }
        logUtils.setLogAndConsoleLog('stop recording')
        return resolve(url)
      }
      this.canvasRecorder = new CanvasRecorder(this.pixi.view as HTMLCanvasElement, stopCb)
      this.canvasRecorder.start(250, () => {
        this.isRecordingVideo = true
      })
    }).then((res) => {
      if (res === 'error') {
        return undefined
      }
      this._video.src = res
      return { src: res, removeWatermark: this._video.removeWatermark }
    })
  }

  shutGeningVideo() {
    logUtils.setLogAndConsoleLog('shutGeningVideo called')
    this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
    return this.canvasRecorder?.stop(true)
  }

  watermarkHandler() {
    const { removeWatermark } = storeToRefs(useUserStore())
    if (removeWatermark.value) {
      if (this.sprite_wm) {
        this.pixi.stage.removeChild(this.sprite_wm)
      }
      this._video.removeWatermark = true
    } else {
      if (!this.sprite_wm)
        throw new Error(errLoging('Add watermark failed', 'can not find sprite_wm!'))
      if (!this.sprite_src)
        throw new Error(errLoging('Add watermark failed', 'can not find sprite_src!'))

      const ratio = this.sprite_wm.width / this.sprite_wm.height
      this.sprite_wm.width = Math.min(this.sprite_src.width, this.sprite_src.height) * 0.5
      this.sprite_wm.height = this.sprite_wm.width / ratio
      this.sprite_wm.x = this.sprite_src.width - this.sprite_wm.width - 50
      this.sprite_wm.y = this.sprite_src.height - this.sprite_wm.height - 50
      this.sprite_wm.zIndex = 1000

      this.pixi.stage.addChild(this.sprite_wm)
      this._video.removeWatermark = false
    }
  }

  async saveToDevice(data?: { url?: string; path?: string; revokeUrl?: boolean }) {
    let { url = this.video.src, path, revokeUrl } = data || {}
    const { removeWatermark } = storeToRefs(useUserStore())

    if (this.video.removeWatermark !== removeWatermark.value) {
      const res = await this.genVideo()
      if (res) {
        url = res.src
      } else {
        throw new Error(errLoging('Save video to device failed', 'can not generate video'))
      }
    }

    const base64 = await blobToBase64(await getBlobFromUrl(url))

    if (revokeUrl) {
      URL.revokeObjectURL(url)
    }

    if (url) {
      return cmWVUtils.saveAssetFromUrl('mp4', base64, path).then((res) => {
        if (res.flag === '1') {
          notify({ group: 'error', text: 'video request url is empty!' })
        }
        return res
      })
    } else {
      throw new Error(errLoging('Save video to device failed', 'video not generated yet'))
    }
  }

  addOpacityFilter() {
    if (!this.sprite_src) return
    this.dynamicAnimateEndTime = -1
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

  addSlideFilter() {
    if (!this.sprite_src) return

    // @TODO: reset()
    this.reset = () => {
      this.dynamicAnimateEndTime = -1
      this.time_start = -1
      this.uniforms.dispFactor = 0
      this.uniforms.nextImage = this.texture_res
      this.filter = new PIXI.Filter(undefined, fragment_slide, this.uniforms)
      if (this.sprite_src) {
        this.sprite_src.filters = [this.filter]
      }
    }
    // @TODO: animation()
    this._animate = () => {
      try {
        const now = Date.now()
        if (this.time_start === -1) {
          this.time_start = now
        }

        if (now - this.time_start < RECORD_START_DELAY) {
          return
        }

        logUtils.setLogAndConsoleLog(
          '_animate: animating',
          'this.time_start:' + this.time_start,
          'this.uniforms.dispFactor: ' + this.uniforms.dispFactor,
          'this.dynamicAnimateEndTime: ' + this.dynamicAnimateEndTime,
        )

        if (this.uniforms.dispFactor >= 1) {
          logUtils.setLogAndConsoleLog('_animate: finish sliding')
          if (this.dynamicAnimateEndTime === -1) {
            logUtils.setLogAndConsoleLog('_animate: dynamicAnimateEndTime')
            // @TODO: remove
            this.dynamicAnimateEndTime = now
          } else {
            if (now - this.dynamicAnimateEndTime >= RECORD_END_DELAY) {
              this.dynamicAnimateEndTime = -1
              logUtils.setLogAndConsoleLog('_animate: finished all animation', this.canvasRecorder)
              this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
              this.reset && this.reset()
              if (this.canvasRecorder) {
                this.canvasRecorder.stop()
              }
            }
          }
        }
        this.uniforms.dispFactor = (now - this.time_start - RECORD_START_DELAY) / TRANSITION_TIME
      } catch (e) {
        throw new Error(
          errLoging('Generate animation fail', 'error ocurred as animating'),
          e as Error,
        )
      }
    }
  }

  addFilter(filter: string) {
    switch (filter) {
      case fragment_opacity:
        return this.addOpacityFilter()
      case fragment_slide:
        return this.addSlideFilter()
    }
  }

  loadImgs(img1: string, img2: string) {
    const p1 = new Promise<PIXI.Sprite>((resolve, reject) => {
      PIXI.Texture.fromURL(img1)
        .then((texture) => {
          this.sprite_src = new PIXI.Sprite(texture)
          this.sprite_src.width = texture.width * 0.5
          this.sprite_src.height = texture.height * 0.5
          resolve(this.sprite_src)
        })
        .catch((e) => reject(e))
    }).catch((e) => {
      throw e
    })
    const p2 = new Promise<PIXI.Sprite>((resolve, reject) => {
      PIXI.Texture.fromURL(img2)
        .then((texture) => {
          this.texture_res = texture
          this.sprite_res = new PIXI.Sprite(texture)
          this.sprite_res.width = texture.width * 0.5
          this.sprite_res.height = texture.height * 0.5
          resolve(this.sprite_res)
        })
        .catch((e) => reject(e))
    }).catch((e) => {
      throw e
    })

    const p3 = new Promise<PIXI.Sprite>((resolve) => {
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
                resolve(this.sprite_wm)
              })
            })
          }
        })
      })
    }).catch((e) => {
      throw e
    })

    return Promise.all([p1, p2, p3])
  }

  async preprocessor(sprites: [PIXI.Sprite, PIXI.Sprite, PIXI.Sprite]) {
    const [src_origin, res_origin, wm] = sprites
    const newSize = {
      width: Math.max(src_origin.width, res_origin.width),
      height: Math.max(src_origin.height, res_origin.height),
    }
    let src = src_origin
    if (newSize.width !== src_origin.width || newSize.height !== src_origin.height) {
      src = await PIXI.Texture.fromURL(await this.genImg(newSize, src_origin)).then((texture) => {
        this.sprite_src = new PIXI.Sprite(texture)
        this.sprite_src.width = texture.width
        this.sprite_src.height = texture.height
        return this.sprite_src
      })
    }
    let res = res_origin
    if (newSize.width !== res_origin.width || newSize.height !== res_origin.height) {
      res = await PIXI.Texture.fromURL(await this.genImg(newSize, res_origin)).then((texture) => {
        this.texture_res = texture
        this.sprite_res = new PIXI.Sprite(texture)
        this.sprite_res.width = texture.width
        this.sprite_res.height = texture.height
        return this.sprite_res
      })
    }
    logUtils.setLogAndConsoleLog(
      'video: addimg preprocessor, ',
      `src_origin size: ${src_origin.width}, ${src_origin.height}`,
      `res_origin size: ${res_origin.width}, ${res_origin.height}`,
      `src size: ${src.width}, ${src.height}`,
      `res size: ${res.width}, ${res.height}`,
    )
    return [src, res, wm]
  }

  genImg(containerSize: ISize, sprite: PIXI.Sprite) {
    this.pixi_imgGen.view.width = containerSize.width
    this.pixi_imgGen.view.height = containerSize.height
    this.pixi_imgGen.stage.addChild(sprite)
    const scale = Math.min(containerSize.width / sprite.width, containerSize.height / sprite.height)
    sprite.width *= scale
    sprite.height *= scale
    sprite.x = (containerSize.width - sprite.width) * 0.5
    sprite.y = (containerSize.height - sprite.height) * 0.5
    const renderer = this.pixi_imgGen.renderer
    renderer.resize(this.pixi_imgGen.view.width, this.pixi_imgGen.view.height)
    renderer.render(this.pixi_imgGen.stage)
    return this.pixi_imgGen.renderer.extract.base64().finally(() => {
      this.pixi_imgGen.stage.removeChildren()
    })
  }

  addImage(src: string, res: string) {
    return this.loadImgs(src, res)
      .then((sprites) => this.preprocessor(sprites))
      .then(() => {
        this.videoSize = {
          width: this.sprite_src?.width ?? 0,
          height: this.sprite_src?.height ?? 0,
        }
        this.isImgReady = true
        // if the genVideo func is called, but the imgs is not loaded yet,
        // the genVideo func will await for the imgs to be loaded
        if (this._genVideoResolver) {
          this._genVideoResolver()
        }
      })
      .catch((e) => {
        logUtils.setLogAndConsoleLog('video load images error:', src, res)
        modalUtils.setModalInfo(
          'video load images error',
          'can not load images at addimage before genVideo',
          {
            msg: 'okay',
            action() {
              notify({ group: 'success', text: 'ok' })
            },
          },
        )
        throw new Error(errLoging('Add image to video failed', 'can not load image!'), e as Error)
      })
  }

  private addTestCanvas() {
    // @TEST use
    if (store.getters['cmWV/getDebugMode']) {
      const testCanvas = this.pixi.view as HTMLCanvasElement
      document.body.appendChild(testCanvas)
      const id = generalUtils.generateRandomString(6)
      this.testCanvasId = id
      testCanvas.style.position = 'absolute'
      testCanvas.style.top = '0'
      testCanvas.style.width = '300px'
      testCanvas.style.left = '0'
      testCanvas.style.zIndex = '10000'
      setTimeout(() => {
        if (
          store.getters['cmWV/getDebugMode'] &&
          this.testCanvasId === id &&
          document.body.contains(this.pixi.view as HTMLCanvasElement)
        ) {
          errLoging('Generate video error', 'test canvas not remove properly')
          document.body.removeChild(this.pixi.view as HTMLCanvasElement)
          this.canvasRecorder?.stop()
        }
      }, 15000)
    }
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

  start(time: number, startCb?: () => void) {
    this.recorder.start(time)
    this.recorder.onstart = () => {
      startCb && startCb()
    }
  }

  stop(notStoreVideo = false) {
    return new Promise<void>((resolve) => {
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
        resolve()
      }
      this.recorder.stop()
    })
  }

  onDataAvailable(e: any) {
    logUtils.setLogAndConsoleLog('recording: ondataavailable 0')
    if (e.data && e.data.size) {
      logUtils.setLogAndConsoleLog('recording: ondataavailable 1')
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
    fetch(url)
      .then((r) => resolve(r.blob()))
      .catch((e) => {
        throw e
      })
  })
}
