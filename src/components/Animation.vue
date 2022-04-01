<template lang="pug">
  div(class="animation")
    div(v-if="isJSON"
      class="lottie"
      :style="lottieStyle" ref="lavContainer")
    div(style="width: 100px; position: absolute; left: 50%") gsap
    br
    img(v-if="isImg"
      v-for="index in 2"
      class="img1 img"
      :src="require('@/' + path.slice(2))"
      :width="width"
      :height="height")
    br
    div(style="width: 100px; position: absolute; left: 50%") css
    br
    img(v-if="isImg"
      v-for="index in 2"
      class="img2 img"
      :src="require('@/' + path.slice(2))"
      :width="width"
      :height="height")
    br
    div(style="width: 100px; position: absolute; left: 50%") js
    br
    img(v-if="isImg"
      v-for="index in 2"
      class="img"
      :src="require('@/' + path.slice(2))"
      :width="width"
      :height="height"
      :style="carousel")
    video(v-if="isMp4"
      class="video"
      :src="require('@/' + path.slice(2))"
      :width="width"
      :height="height"
      type="video/mp4"
      autoplay muted loop playsinline)
</template>

<script lang="ts">
import Vue from 'vue'
import lottie from 'lottie-web'
import axios from 'axios'
import gsap from 'gsap'

export default Vue.extend({
  props: {
    path: {
      type: String,
      required: true
    },
    test: { // to delete
      type: Object
    },
    speed: {
      type: Number,
      required: false,
      default: 1
    },
    width: {
      type: Number,
      required: false,
      default: -1
    },
    height: {
      type: Number,
      required: false,
      default: -1
    },
    loop: {
      type: Boolean,
      required: false,
      default: true
    },
    autoPlay: {
      type: Boolean,
      required: false,
      default: true
    },
    loopDelayMin: {
      type: Number,
      required: false,
      default: 0
    },
    loopDelayMax: {
      type: Number,
      required: false,
      default: 0
    },
    delay: {
      type: Number,
      default: 10
    },
    imgSpeed: {
      type: Number,
      default: 0.01
    }
  },
  data() {
    return {
      name: 'lottie-animation',
      rendererSettings: {
        scaleMode: 'centerCrop',
        clearCanvas: true,
        progressiveLoad: false,
        hideOnTransparent: true
      },
      anim: null as any,
      time: 0 as number
    }
  },
  computed: {
    carousel(): Record<string, string> {
      return {
        transform: `translateX(-${this.time}%)`
      }
    },
    isJSON():boolean {
      return this.path.endsWith('.json')
    },
    isImg():boolean {
      return this.path.endsWith('.svg') || this.path.endsWith('.png') || this.path.endsWith('.jpg')
    },
    isMp4():boolean {
      return this.path.endsWith('.mp4')
    },
    lottieStyle():Record<string, string> {
      return {
        width: (this.width !== -1) ? `${this.width}px` : '100%',
        height: (this.height !== -1) ? `${this.height}px` : '100%',
        overflow: 'hidden',
        margin: '0 auto'
      }
    }
  },
  created() {
    if (this.isImg) {
      setInterval(() => {
        this.time = (this.time + this.imgSpeed) % 100
      }, this.delay)
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    async loadJsonData(path: string) {
      if (path.startsWith('@/')) {
        return await require('@/' + path.slice(2)) // 之後改成讀特定資料夾下的
      } else {
        return await axios.get(path).then(response => {
          return response.data
        })
      }
    },
    async init() {
      if (this.isImg) {
        gsap.to('.img1', {
          ease: 'linear',
          duration: 110,
          repeat: -1,
          transform: 'translateX(-100%)'
        })
      }
      if (!this.isJSON) {
        return
      }

      const jsonData = await this.loadJsonData(this.path)

      if (this.anim) {
        this.anim.destroy() // Releases resources. The DOM element will be emptied.
      }
      this.anim = lottie.loadAnimation({
        container: this.$refs.lavContainer as HTMLElement,
        renderer: 'svg',
        loop: this.loop,
        autoplay: this.autoPlay,
        animationData: jsonData,
        rendererSettings: this.rendererSettings
      })
      this.$emit('AnimControl', this.anim)
      this.anim.setSpeed(this.speed)
      if (this.loopDelayMin > 0) {
        this.anim.loop = false
        this.anim.autoplay = false
        this.executeLoop()
      }
    },
    getRandomInt(min: number, max: number):number {
      min = Math.ceil(min)
      max = Math.floor(max)
      return Math.floor(Math.random() * (max - min)) + min // The maximum is exclusive and the minimum is inclusive
    },
    executeLoop() {
      this.anim.play()
      setTimeout(() => {
        this.anim.stop()
        this.executeLoop()
      }, this.getRandomInt(this.loopDelayMin, this.loopDelayMax === 0 ? this.loopDelayMin : this.loopDelayMax))
    }
  },
  watch: {
    src: function() {
      this.init()
    }
  }
})
</script>

<style lang="scss" scoped>
.animation {
  white-space: pre;
  .img {
    position: relative;
    left: calc(50% - 50vw);
    // animation: 20s ease-in 1s infinite both slidein;
    // animation-iteration-count: infinite;
    // animation-name: slidein;
    // animation-duration: 20s;
    // animation-timing-function: linear;
    // @keyframes slidein {
    //   from {
    //     transform: translateX(0%)
    //   }
    //   to {
    //     transform: translateX(-100%)
    //   }
    // }

    // transition-property: transform;
    // transition-duration: 20s;
    // transition-timing-function: linear;
    // transform: translateX(-100%);
  }
  .img2 {
    animation-iteration-count: infinite;
    animation-name: slidein;
    animation-duration: 110s;
    animation-timing-function: linear;
    @keyframes slidein {
      from {
        transform: translateX(0%)
      }
      to {
        transform: translateX(-100%)
      }
    }
  }
}
</style>
