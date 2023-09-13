// eslint-disable-next-line
import * as PIXI from 'pixi.js'
const ENABLE_RECORDING = true
const RECORD_START_DELAY = 2000
const IMG2_EXAMPLE =
  'https://images.unsplash.com/photo-1563473213013-de2a0133c100?cs=tinysrgb&q=80&w=766&origin=true&appver=v7174'
const IMG1_EXAMPLE =
  'https://images.unsplash.com/photo-1495379572396-5f27a279ee91?cs=tinysrgb&q=80&w=766&origin=true&appver=v7174'

const fragment_opacity = `
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
const fragment1 = `
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

const fragment_slide = `
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
const fragment3 = `
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

const fragment = fragment1

export default class PixiRecorder {
  pixi = new PIXI.Application()
  texture1 = null
  sprite1 = null
  texture2 = null
  sprite2 = null
  filter = null
  uniforms = {} as { [key: string]: number }
  time = 0
  canvasRecorder = null
  _animate = null

  constructor() {
    document.body.appendChild(this.pixi.view)
    this.addImage(IMG1_EXAMPLE, IMG2_EXAMPLE).then(() => {
      this.pixi.view.width = this.sprite1.width
      this.pixi.view.height = this.sprite1.height
      this.pixi.stage.addChild(this.sprite1)
      this.addFilter(fragment)

      this.time = 0
      if (RECORD_START_DELAY) {
        setTimeout(() => {
          this.pixi.ticker.add(this._animate)
        }, RECORD_START_DELAY)
      } else {
        this.pixi.ticker.add(this._animate)
      }

      if (ENABLE_RECORDING) {
        this.canvasRecorder = new CanvasRecorder(this.pixi.view)
        this.canvasRecorder.start(1000)
      }
    })
  }

  addOpacityFilter() {
    this.uniforms.opacity = 0
    this.uniforms.nextImage = this.texture2
    this.filter = new PIXI.Filter(null, fragment_opacity, this.uniforms)
    this.sprite1.filters = [this.filter]
    this._animate = (delta) => {
      if (this.uniforms.opacity >= 1) {
        // if (this.time / 300 - Math.PI * 0.5 > delta) {
        this.pixi.ticker.remove(this._animate)
        this.canvasRecorder.stop()
      }
      this.time += delta
      // this.uniforms.opacity = Math.abs(Math.sin(this.time / 300))
      this.uniforms.opacity = this.time / 100
    }
  }

  addFragment1Filter() {
    this.uniforms.dispFactor = 0
    this.uniforms.nextImage = this.texture2
    this.filter = new PIXI.Filter(null, fragment1, this.uniforms)
    this.sprite1.filters = [this.filter]
    console.log(this.filter)
    this._animate = (delta) => {
      if (this.uniforms.dispFactor >= 1) {
        this.pixi.ticker.remove(this._animate)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.time += delta
      this.uniforms.dispFactor = this.time / 100
    }
  }

  addFragment3Filter() {
    this.filter = new PIXI.Filter(null, fragment3, this.uniforms)
    this.filter.filterArea = this.pixi.screen
    this.sprite1.filters = [this.filter]
    console.log(this.filter)
    this._animate = (delta) => {
      if (this.time / 300 >= Math.PI * 0.5) {
        this.pixi.ticker.remove(this._animate)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.time += delta
    }
  }

  addSlideFilter() {
    this.uniforms.dispFactor = 0
    this.uniforms.nextImage = this.texture2
    this.filter = new PIXI.Filter(null, fragment_slide, this.uniforms)
    this.sprite1.filters = [this.filter]
    console.log('addSlideFilter')
    this._animate = (delta) => {
      if (this.time >= 200) {
        this.pixi.ticker.remove(this._animate)
        if (this.canvasRecorder) {
          this.canvasRecorder.stop()
        }
      }
      this.time += delta
      this.uniforms.dispFactor = this.time / 200
    }
  }

  addFilter(filter) {
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

  addImage(img1, img2) {
    const p1 = new Promise<void>((resolve) => {
      PIXI.Texture.fromURL(img1).then((texture) => {
        this.texture1 = texture
        this.sprite1 = new PIXI.Sprite(texture)
        this.sprite1.width = texture.width
        this.sprite1.height = texture.height
        console.log('img1 done')
        resolve()
      })
    })
    const p2 = new Promise<void>((resolve) => {
      PIXI.Texture.fromURL(img2).then((texture) => {
        this.texture2 = texture
        this.sprite2 = new PIXI.Sprite(texture)
        console.log('img2 done')
        resolve()
      })
    })
    return Promise.all([p1, p2])
  }
}

class CanvasRecorder {
  canvas = null
  chunks = []
  stream = null
  recorder = null

  constructor(canvas) {
    this.canvas = canvas
    this.recordInit()
  }

  recordInit() {
    console.log('record init')
    this.stream = this.canvas.captureStream()
    this.recorder = new MediaRecorder(this.stream, this.getMimeTypeSupportOptions())
    this.recorder.ondataavailable = (e) => this.onDataAvailable(e)
    this.recorder.onstop = () => this.onRecordStop()
  }

  start(time) {
    this.recorder.start(time)
  }

  stop() {
    this.recorder.stop()
  }

  onDataAvailable(e) {
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

  onRecordStop() {
    console.warn('recorder stopped', this.chunks.length)
    const url = URL.createObjectURL(new Blob(this.chunks, { type: 'video/mp4' }))
    const video = document.createElement('video')
    document.body.appendChild(video)
    video.setAttribute('controls', 'controls')
    video.style.position = 'absolute'
    video.style.top = '0'
    video.style.left = '0'
    video.style.width = this.canvas.width
    video.style.height = this.canvas.height
    video.src = url
  }
}
