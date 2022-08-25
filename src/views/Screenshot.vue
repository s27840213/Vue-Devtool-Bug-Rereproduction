<template lang="pug">
  div(class="screenshot")
    nu-layer(v-if="config !== undefined"
              ref="target"
              :config="config"
              :pageIndex="0"
              :layerIndex="0")
    div(v-if="backgroundImage !== ''" ref="target" class="screenshot__bg-img" :style="bgStyles()")
      img(:src="backgroundImage" @load="onload")
    div(v-if="backgroundColor !== ''" ref="target" class="screenshot__bg-color" :style="bgColorStyles()")
    page-content(v-if="usingJSON" :config="pages[0]" :pageIndex="0")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import PageContent from '@/components/editor/page/PageContent.vue'
import layerFactary from '@/utils/layerFactary'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { CustomWindow } from '@/interfaces/customWindow'
import pageUtils from '@/utils/pageUtils'

declare let window: CustomWindow

enum ScreenShotMode {
  LAYER,
  BG_IMG,
  BG_COLOR,
  PAGE
}

export default Vue.extend({
  name: 'ScreenShot',
  data() {
    return {
      config: undefined as any,
      backgroundImage: '',
      backgroundColor: '',
      usingJSON: false,
      options: ''
    }
  },
  components: {
    PageContent
  },
  async mounted() {
    this.fetchDesign(window.location.search)
  },
  created() {
    window.fetchDesign = this.fetchDesign
  },
  computed: {
    ...mapGetters({
      pages: 'getPages'
    }),
    mode(): ScreenShotMode {
      if (this.backgroundImage !== '') {
        return ScreenShotMode.BG_IMG
      } else if (this.backgroundColor !== '') {
        return ScreenShotMode.BG_COLOR
      } else if (this.config !== undefined) {
        return ScreenShotMode.LAYER
      } else {
        return ScreenShotMode.PAGE
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
        switch (type) {
          case 'svg': {
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
            break
          }
          case 'background': {
            this.backgroundImage = `https://template.vivipic.com/${type}/${id}/larg?ver=${ver}`
            break
          }
          case 'backgroundColor': {
            this.backgroundColor = id ?? '#FFFFFFFF'
            setTimeout(() => { this.onload() }, 100)
            break
          }
          case 'json': {
            const page = JSON.parse(decodeURIComponent(id ?? ''))
            vivistickerUtils.initLoadingFlags(page)
            pageUtils.setPages([page])
            this.usingJSON = true
            break
          }
        }
      })
    },
    bgStyles() {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      let width = screenWidth
      let height = width * 16 / 9
      if (height > screenHeight) {
        height = screenHeight
        width = height * 9 / 16
      }
      return {
        width: `${width}px`,
        height: `${height}px`
      }
    },
    bgColorStyles() {
      return {
        ...this.bgStyles(),
        backgroundColor: `#${this.backgroundColor}`
      }
    },
    clearBuffers() {
      this.config = undefined
      this.backgroundImage = ''
      this.backgroundColor = ''
      this.usingJSON = false
    },
    onload() {
      console.log('loaded')
      const element = this.$refs.target
      const target = (element as Vue).$el ? (element as Vue).$el : (element as HTMLElement)
      const { width, height } = target.getBoundingClientRect()
      vivistickerUtils.sendDoneLoading(width, height, this.options)
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
