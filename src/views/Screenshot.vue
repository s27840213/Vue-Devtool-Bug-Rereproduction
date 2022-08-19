<template lang="pug">
  div(class="screenshot")
    nu-layer(v-if="config !== undefined"
              ref="target"
              :config="config"
              :pageIndex="0"
              :layerIndex="0")
    div(v-if="backgroundImage !== ''" class="screenshot__bg-img")
      img(:src="backgroundImage" @load="onload")
    div(v-if="backgroundColor !== ''" class="screenshot__bg-color" :style="bgColorStyles()")
</template>

<script lang="ts">
import Vue from 'vue'
import layerFactary from '@/utils/layerFactary'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { CustomWindow } from '@/interfaces/customWindow'

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
      backgroundColor: ''
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
    fetchDesign(query: string) {
      this.clearBuffers()
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
          this.backgroundImage = `https://template.vivipic.com/${type}/${id}/larg?ver=${ver}`
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
    clearBuffers() {
      this.config = undefined
      this.backgroundImage = ''
      this.backgroundColor = ''
    },
    onload() {
      console.log('loaded')
      if (this.mode === ScreenShotMode.LAYER) {
        const target = (this.$refs.target as Vue).$el
        const { width, height } = target.getBoundingClientRect()
        vivistickerUtils.sendDoneLoading(width, height)
      } else {
        vivistickerUtils.sendDoneLoading(window.innerWidth, window.innerHeight)
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
  &__bg-img > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    vertical-align: middle;
  }
}
</style>
