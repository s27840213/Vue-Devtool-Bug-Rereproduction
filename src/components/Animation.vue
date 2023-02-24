<template lang="pug">
div(class="animation")
  div(v-if="isJSON"
    class="lottie"
    :style="lottieStyle" ref="lavContainer")
  video(v-if="isMp4"
    class="video"
    :src="require(`@/assets/img/svg/homepage/${mp4FileName}`)"
    :width="width"
    :height="height"
    type="video/mp4"
    autoplay muted loop playsinline)
</template>

<script lang="ts">
import axios from 'axios'
import lottie, { AnimationItem } from 'lottie-web'
import { defineComponent } from 'vue'
// :src="require('@/assets/img/svg/homepage/tw/remover.mp4')"

export default defineComponent({
  props: {
    path: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      default: -1
    },
    height: {
      type: Number,
      default: -1
    },
    // The following is for lottie
    lottieName: { // required if type is lottie and source image in /image folder
      type: String
    },
    speed: {
      type: Number,
      default: 1
    },
    loop: {
      type: Boolean,
      default: true
    },
    autoPlay: {
      type: Boolean,
      default: true
    },
    loopDelayMin: {
      type: Number,
      default: 0
    },
    loopDelayMax: {
      type: Number,
      default: 0
    }
  },
  emits: ['AnimControl'],
  data() {
    return {
      rendererSettings: {
        scaleMode: 'centerCrop',
        clearCanvas: true,
        progressiveLoad: false,
        hideOnTransparent: true
      },
      anim: null as unknown as AnimationItem,
      test: 'remover.mp4'
    }
  },
  computed: {
    isJSON():boolean {
      return this.path.endsWith('.json')
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
    },
    mp4FileName(): string {
      const splitResult = this.path.split('/')
      const len = splitResult.length
      return `${splitResult[len - 2]}/${splitResult[len - 1]}`
    }
  },
  mounted() {
    this.init()
  },
  unmounted() {
    this.anim && this.anim.destroy()
  },
  methods: {
    async loadJsonData(path: string) {
      if (path.startsWith('@/')) {
        return await require(`@/assets/img/svg/homepage/${this.mp4FileName}`)
      } else {
        return await axios.get(path).then(response => {
          return response.data
        })
      }
    },
    async init() {
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
        rendererSettings: this.rendererSettings,
        assetsPath: `/lottie/${this.$i18n.locale}/${this.lottieName}/images/`
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
</style>
