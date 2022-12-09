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
    page-content(v-if="usingJSON" :config="pages[0]" :pageIndex="0" :noBg="true" :style="pageTransforms()")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import PageContent from '@/components/editor/page/PageContent.vue'
import layerFactary from '@/utils/layerFactary'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { CustomWindow } from '@/interfaces/customWindow'
import pageUtils from '@/utils/pageUtils'
import { calcTmpProps } from '@/utils/groupUtils'
import { IPage } from '@/interfaces/page'
import shapeUtils from '@/utils/shapeUtils'
import mathUtils from '@/utils/mathUtils'
import { IImageStyle } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'

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
      pageTranslate: {
        x: 0,
        y: 0
      },
      pageScale: 1,
      JSONcontentSize: {
        width: 0,
        height: 0
      },
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
    window.resizePage = this.resizePage
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
        const width = urlParams.get('width')
        const height = urlParams.get('height')
        switch (type) {
          case 'svg': {
            const json = await (await fetch(`https://template.vivipic.com/${type}/${id}/config.json?ver=${ver}`)).json()
            let vSize = json.vSize as number[] | undefined
            if (!vSize) {
              vSize = [json.styles.width, json.styles.height]
            }
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
          case 'svgImage': {
            const pageAspectRatio = window.innerWidth / window.innerHeight
            const photoAspectRatio = parseInt(width ?? '1') / parseInt(height ?? '1')
            const photoWidth = photoAspectRatio > pageAspectRatio ? window.innerWidth : window.innerHeight * photoAspectRatio
            const photoHeight = photoAspectRatio > pageAspectRatio ? window.innerWidth / photoAspectRatio : window.innerHeight

            const srcObj = {
              type: 'svg',
              userId: '',
              assetId: id
            }

            vivistickerUtils.initLoadingFlagsForOneLayer(() => {
              this.onload()
            })

            this.config = layerFactary.newImage({
              srcObj,
              styles: {
                x: 0,
                y: 0,
                width: photoWidth,
                height: photoHeight,
                initWidth: photoWidth,
                initHeight: photoHeight,
                imgWidth: photoWidth,
                imgHeight: photoHeight
              }
            })
            break
          }
          case 'svgImage2': {
            const json = await (await fetch(`https://template.vivipic.com/svg/${id}/config.json?ver=${ver}`)).json()
            const { srcObj, styles } = json

            const { width: boundingWidth, height: boundingHeight } = mathUtils.getBounding(json)
            const xDiff = (boundingWidth - styles.width) / 2
            const yDiff = (boundingHeight - styles.height) / 2

            const pageAspectRatio = window.innerWidth / window.innerHeight
            const photoAspectRatio = boundingWidth / boundingHeight
            const photoWidth = photoAspectRatio > pageAspectRatio ? window.innerWidth : window.innerHeight * photoAspectRatio
            const photoHeight = photoAspectRatio > pageAspectRatio ? window.innerWidth / photoAspectRatio : window.innerHeight

            const { imgWidth = photoWidth, imgHeight = photoHeight, imgX = 0, imgY = 0 } = styles as IImageStyle

            const scaleRatio = photoWidth / boundingWidth

            vivistickerUtils.initLoadingFlagsForOneLayer(() => {
              this.onload()
            })

            this.config = layerFactary.newImage({
              srcObj,
              styles: {
                ...styles,
                x: xDiff * scaleRatio,
                y: yDiff * scaleRatio,
                width: styles.width * scaleRatio,
                height: styles.height * scaleRatio,
                initWidth: styles.width * scaleRatio,
                initHeight: styles.height * scaleRatio,
                imgWidth: imgWidth * scaleRatio,
                imgHeight: imgHeight * scaleRatio,
                imgX: imgX * scaleRatio,
                imgY: imgY * scaleRatio
              }
            })
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
            const page = layerFactary.newTemplate(JSON.parse(decodeURIComponent(id ?? ''))) as IPage
            vivistickerUtils.initLoadingFlags(page, () => {
              this.onload()
            })
            page.isAutoResizeNeeded = true
            pageUtils.setPages([page])
            this.JSONcontentSize = {
              width: page.width,
              height: page.height
            }
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
    pageTransforms() {
      return {
        transform: `translate(${this.pageScale * this.pageTranslate.x}px, ${this.pageScale * this.pageTranslate.y}px)`
      }
    },
    clearBuffers() {
      this.config = undefined
      this.backgroundImage = ''
      this.backgroundColor = ''
      this.usingJSON = false
      this.pageTranslate = { x: 0, y: 0 }
      this.pageScale = 1
      this.JSONcontentSize = { width: 0, height: 0 }
    },
    onload() {
      console.log('loaded')
      if (this.mode === ScreenShotMode.PAGE) {
        vivistickerUtils.sendDoneLoading(this.JSONcontentSize.width, this.JSONcontentSize.height, this.options, true)
      } else if ([ScreenShotMode.BG_IMG, ScreenShotMode.BG_COLOR].includes(this.mode)) {
        const element = this.$refs.target
        const target = (element as Vue).$el ? (element as Vue).$el : (element as HTMLElement)
        const { width, height } = target.getBoundingClientRect()
        vivistickerUtils.sendDoneLoading(width, height, this.options)
      } else {
        vivistickerUtils.sendDoneLoading(window.innerWidth, window.innerHeight, this.options)
      }
    },
    fitPageToScreen(width: number, height: number): number {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const screenRatio = screenWidth / screenHeight
      const objectRatio = width / height
      if (screenRatio > objectRatio) {
        this.JSONcontentSize = {
          width: screenHeight * objectRatio,
          height: screenHeight
        }
        return screenHeight / height
      } else {
        this.JSONcontentSize = {
          width: screenWidth,
          height: screenWidth / objectRatio
        }
        return screenWidth / width
      }
    },
    resizePage(data: { x: number, y: number, width: number, height: number, options: string }) {
      const { x, y, width, height, options } = data
      this.options = options
      this.pageTranslate = { x: -x, y: -y }
      const page = pageUtils.getPage(0)
      this.pageScale = this.fitPageToScreen(width, height)
      pageUtils.resizePage({ width: page.width * this.pageScale, height: page.height * this.pageScale })
      setTimeout(() => {
        console.log('resized')
        vivistickerUtils.sendDoneLoading(this.JSONcontentSize.width, this.JSONcontentSize.height, this.options, false)
      }, 100)
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
