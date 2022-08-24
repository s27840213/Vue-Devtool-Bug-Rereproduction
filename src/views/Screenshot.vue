<template lang="pug">
  div(class="screenshot")
    nu-layer(v-if="config !== undefined"
              ref="target"
              :config="config"
              :pageIndex="0"
              :layerIndex="0")
    div(v-if="backgroundImage !== ''" class="screenshot__bg-img")
      img(ref="target" :src="backgroundImage" :style="imageStyles()" @load="onload")
    div(v-if="backgroundColor !== ''" class="screenshot__bg-color" :style="bgColorStyles()")
</template>

<script lang="ts">
import Vue from 'vue'
import layerFactary from '@/utils/layerFactary'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { CustomWindow } from '@/interfaces/customWindow'
import imageUtils from '@/utils/imageUtils'

declare let window: CustomWindow

enum ScreenShotMode {
  LAYER,
  BG_IMG,
  BG_COLOR
}

export default Vue.extend({
  name: 'ScreenShot',
  data() {
    return {
      config: undefined as any,
      backgroundImage: '',
      backgroundSize: {
        width: 0,
        height: 0
      },
      backgroundColor: '',
      options: ''
    }
  },
  async mounted() {
    this.fetchDesign(window.location.search)
  },
  created() {
    window.fetchDesign = this.fetchDesign
  },
  computed: {
    mode(): ScreenShotMode {
      if (this.backgroundImage !== '') {
        return ScreenShotMode.BG_IMG
      } else if (this.backgroundColor !== '') {
        return ScreenShotMode.BG_COLOR
      } else {
        return ScreenShotMode.LAYER
      }
    }
  },
  methods: {
    fetchDesign(query: string, options = '') {
      this.clearBuffers()
      this.options = options
      this.$nextTick(async () => {
        const urlParams = new URLSearchParams(query)
        const type = urlParams.get('type')
        const id = urlParams.get('id')
        const ver = urlParams.get('ver')
        if (type === 'svg') {
          const json = await (await fetch(`https://template.vivipic.com/${type}/${id}/config.json?ver=${ver}`)).json()
          const vSize = json.vSize as number[]
          const pageAspectRatio = window.innerWidth / window.innerHeight
          const svgAspectRatio = vSize[0] / vSize[1]
          const svgWidth = svgAspectRatio > pageAspectRatio ? window.innerWidth : window.innerHeight * svgAspectRatio
          const svgHeight = svgAspectRatio > pageAspectRatio ? window.innerWidth / svgAspectRatio : window.innerHeight
          json.ratio = 1
          this.config = layerFactary.newShape({
            ...json,
            styles: {
              width: svgWidth,
              height: svgHeight,
              initWidth: vSize[0],
              initHeight: vSize[1],
              scale: svgWidth / vSize[0],
              color: json.color,
              vSize: json.vSize
            }
          })
          setTimeout(() => { this.onload() }, 100)
        }
        if (type === 'background') {
          const url = `https://template.vivipic.com/${type}/${id}/full?ver=${ver}`
          imageUtils.getImageSize(url, 0, 0).then(({ width, height }) => {
            this.backgroundSize = { width, height }
            this.backgroundImage = url
          })
        }
        if (type === 'backgroundColor') {
          this.backgroundColor = id ?? '#FFFFFFFF'
          setTimeout(() => { this.onload() }, 100)
        }
      })
    },
    bgColorStyles() {
      return {
        backgroundColor: `#${this.backgroundColor}`
      }
    },
    imageStyles() {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const { width, height } = this.backgroundSize
      if (screenWidth / screenHeight > width / height) {
        return {
          width: `${screenHeight * width / height}px`,
          height: `${screenHeight}px`
        }
      } else {
        return {
          width: `${screenWidth}px`,
          height: `${screenWidth * height / width}px`
        }
      }
    },
    clearBuffers() {
      this.config = undefined
      this.backgroundImage = ''
      this.backgroundColor = ''
    },
    onload() {
      console.log('loaded')
      if (this.mode === ScreenShotMode.LAYER || this.mode === ScreenShotMode.BG_IMG) {
        const element = (this.$refs.target as Vue)
        const target = element.$el ?? element
        const { width, height } = target.getBoundingClientRect()
        vivistickerUtils.sendDoneLoading(width, height, this.options)
      } else {
        vivistickerUtils.sendDoneLoading(window.innerWidth, window.innerHeight, this.options)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.screenshot {
  @include size(100%, 100%);
  &__bg-img, &__bg-color {
    @include size(100%, 100%);
  }
}
</style>
