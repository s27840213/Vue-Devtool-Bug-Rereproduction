import cmWVUtils, { ISaveAssetFromUrlResponse } from '@nu/vivi-lib/utils/cmWVUtils'
import * as PIXI from 'pixi.js'
const ENABLE_RECORDING = true
const RECORD_START_DELAY = 2000
const IMG2_EXAMPLE =
  'https://images.unsplash.com/photo-1558816280-dee9521ff364?cs=tinysrgb&q=80&h=766&origin=true&appver=v7576'
const IMG1_EXAMPLE =
  'https://images.unsplash.com/photo-1558816280-dee9521ff364?cs=tinysrgb&q=80&h=766&origin=true&appver=v7576'

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
// export const fragment_slide = `
//   varying vec2 vTextureCoord;
//   uniform sampler2D uSampler;
//   uniform highp vec4 inputSize;
//   uniform highp vec4 outputFrame;

//   vec2 mapCoord( vec2 coord ) {
//     coord *= inputSize.xy / outputFrame.zw;
//     return coord;
//   }
//   uniform sampler2D nextImage;
//   uniform float dispFactor;

//   void main() {
//     vec2 uv = vTextureCoord;
//     vec2 coord = mapCoord(vTextureCoord);

//     vec4 img1 = texture2D(uSampler, vec2(uv.x, uv.y));
//     vec4 img2 = texture2D(nextImage, vec2(coord.x, coord.y));
//     if (uv.x < dispFactor) {
//       gl_FragColor = texture2D(nextImage, vec2(coord.x, coord.y));
//     } else if (uv.x == dispFactor) {
//       gl_FragColor = mix(img1, img2, 0.5);
//     } else {
//       gl_FragColor = texture2D(uSampler, vec2(uv.x, uv.y));
//     }
//   }
// `
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
  pixi = new PIXI.Application()
  texture_src = null as null | PIXI.Texture
  sprite_src = null as null | PIXI.Sprite
  texture_res = null as null | PIXI.Texture
  sprite_res = null as null | PIXI.Sprite
  filter = null as null | PIXI.Filter
  uniforms = {} as { [key: string]: any }
  time = 0
  canvasRecorder = null as null | CanvasRecorder
  _animate = null as null | ((delta: number) => void)
  _genVideoResolver = null as null | (() => void)
  isImgReady = false

  constructor(src = IMG1_EXAMPLE, res = IMG2_EXAMPLE, fragment = fragment_slide) {
    document.body.appendChild(this.pixi.view as HTMLCanvasElement)
    this.addImage(src, res)
      .then(() => {
        this.isImgReady = true
        if (!this.sprite_src || !this.sprite_res) return console.warn('no sprite')


        this.pixi.view.width = this.sprite_src.width
        this.pixi.view.height = this.sprite_src.height
        this.pixi.stage.addChild(this.sprite_src)

        const renderer = this.pixi.renderer
        renderer.resize(this.sprite_src.width, this.sprite_src.height)

        this.addFilter(fragment)

        // const testCanvas = this.pixi.view as HTMLCanvasElement
        // console.log('testCanvas.width, testCanvas.height', testCanvas.width, testCanvas.height)
        // document.body.appendChild(testCanvas)
        // testCanvas.style.position = 'absolute'
        // testCanvas.style.top = '0'
        // testCanvas.style.width = '300px'
        // testCanvas.style.left = '0'

        if (this._genVideoResolver) {
          this._genVideoResolver()
        }
      }).catch(() => {
        throw new Error('pixi-recorder: can not load image!')
      })
  }

  async genVideo() {
    console.log('gen vedio start')
    if (!this.isImgReady) {
      await Promise.race(
        [
          new Promise<void>(resolve => { this._genVideoResolver = resolve }),
          new Promise<void>((resolve, reject) => setTimeout(reject, 60000))
        ]
      ).catch(() => { throw new Error('pixi-recorder: can not load image as genVideo!') })
    }
    console.log('gen vedio start 22')

    this.time = 0
    if (RECORD_START_DELAY) {
      setTimeout(() => {
        if (this._animate) {
          this.pixi.ticker.add(this._animate)
        }
      }, RECORD_START_DELAY)
    } else {
      if (this._animate) {
        this.pixi.ticker.add(this._animate)
      }
    }

    return new Promise<ISaveAssetFromUrlResponse | 'error'>((resolve) => {
      this.canvasRecorder = new CanvasRecorder(this.pixi.view as HTMLCanvasElement, resolve)
      this.canvasRecorder.start(1000)
    })
  }


  addOpacityFilter() {
    if (!this.sprite_src) return

    this.uniforms.opacity = 0
    this.uniforms.nextImage = this.texture_res
    this.filter = new PIXI.Filter(undefined, fragment_opacity, this.uniforms)
    this.sprite_src.filters = [this.filter]
    this._animate = (delta) => {
      if (this.uniforms.opacity >= 1) {
        this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.time += delta
      this.uniforms.opacity = this.time / 100
    }
  }

  addFragment1Filter() {
    if (!this.sprite_src) return
    this.uniforms.dispFactor = 0
    this.uniforms.nextImage = this.texture_res
    this.filter = new PIXI.Filter(undefined, fragment1, this.uniforms)
    this.sprite_src.filters = [this.filter]
    console.log(this.filter)
    this._animate = (delta) => {
      if (this.uniforms.dispFactor >= 1) {
        this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.time += delta
      this.uniforms.dispFactor = this.time / 100
    }
  }

  addFragment3Filter() {
    if (!this.sprite_src) return

    this.filter = new PIXI.Filter(undefined, fragment3, this.uniforms)
    this.sprite_src.filters = [this.filter]
    this._animate = (delta) => {
      if (this.time / 300 >= Math.PI * 0.5) {
        this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.time += delta
    }
  }

  addSlideFilter() {
    if (!this.sprite_src) return

    this.uniforms.dispFactor = 0
    this.uniforms.nextImage = this.texture_res
    this.filter = new PIXI.Filter(undefined, fragment_slide, this.uniforms)
    this.sprite_src.filters = [this.filter]
    this._animate = (delta) => {
      if (this.time >= 200) {
        this.pixi.ticker.remove(this._animate as PIXI.TickerCallback<PixiRecorder>)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.time += delta
      this.uniforms.dispFactor = this.time / 200
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

  addImage(img1: string, img2: string) {
    const p1 = new Promise<PIXI.Texture>((resolve) => {
      PIXI.Texture.fromURL(img1).then((texture) => {
        this.texture_src = texture
        this.sprite_src = new PIXI.Sprite(texture)
        this.sprite_src.width = texture.width
        this.sprite_src.height = texture.height
        console.log('img1 done')
        resolve(texture)
      })
    })
    const p2 = new Promise<PIXI.Texture>((resolve) => {
      PIXI.Texture.fromURL(img2).then((texture) => {
        this.texture_res = texture
        this.sprite_res = new PIXI.Sprite(texture)
        this.sprite_res.width = texture.width
        this.sprite_res.height = texture.height
        console.log('img2 done')
        resolve(texture)
      })
    })
    return Promise.all([p1, p2])
  }
}

class CanvasRecorder {
  canvas: HTMLCanvasElement
  stream: MediaStream
  recorder: MediaRecorder
  chunks = [] as Array<any>
  private _resolver = null as null | ((value: ISaveAssetFromUrlResponse | PromiseLike<ISaveAssetFromUrlResponse> | 'error') => void)

  constructor(canvas: HTMLCanvasElement, resolver?: ((value: ISaveAssetFromUrlResponse | PromiseLike<ISaveAssetFromUrlResponse> | 'error') => void)) {
    this.canvas = canvas
    this.stream = this.canvas.captureStream()
    this.recorder = new MediaRecorder(this.stream, this.getMimeTypeSupportOptions())
    this.recorder.ondataavailable = (e) => this.onDataAvailable(e)
    this.recorder.onstop = () => this.onRecordStop()
    if (resolver) {
      this._resolver = resolver
    }
  }

  start(time: number) {
    this.recorder.start(time)
  }

  stop() {
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

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(
        (reader.result as string)
          .replace('data:', '')
          .replace(/^.+,/, '')
      )
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  onRecordStop() {
    const url = URL.createObjectURL(new Blob(this.chunks, { type: 'video/mp4' }))
    const video = document.createElement('video')
    document.body.appendChild(video)

    // @test used
    video.addEventListener('ended', () => {
      setTimeout(() => {
        document.body.removeChild(video)
      }, 2000)
    })
    video.setAttribute('controls', 'controls')
    video.style.position = 'absolute'
    video.style.top = '0'
    video.style.left = '0'
    video.style.width = this.canvas.width.toString()
    video.style.height = this.canvas.height.toString()
    video.src = url

    this.blobToBase64(new Blob(this.chunks, { type: 'video/mp4' })).then((base64: string) => {
      cmWVUtils.saveAssetFromUrl('mp4', base64)
        .then((data: ISaveAssetFromUrlResponse) => {
          if (this._resolver) {
            this._resolver(data)
          }
          console.log('save asset from url done', data)
        }).catch((error) => {
          console.error('save asset from url failed', error)
          if (this._resolver) {
            this._resolver('error')
          }
        })
    })
    return url
  }
}
