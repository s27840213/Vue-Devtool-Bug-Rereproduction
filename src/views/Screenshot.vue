<template lang="pug">
div(class="screenshot")
  nu-layer(v-if="config !== undefined"
            ref="target"
            :config="config"
            :page="pages[0]"
            :pageIndex="0"
            :layerIndex="0")
  div(v-if="backgroundImage !== ''" ref="target" class="screenshot__bg-img" :style="bgStyles()")
    img(:src="backgroundImage" @load="onload")
  div(v-if="backgroundColor !== ''" ref="target" class="screenshot__bg-color" :style="bgColorStyles()")
  page-content(v-if="usingJSON" :config="pages[0]" :pageIndex="0" :noBg="true" :style="pageTransforms()")
</template>

<script lang="ts">
import PageContent from '@/components/editor/page/PageContent.vue'
import { CustomWindow } from '@/interfaces/customWindow'
import { IImageStyle, ILayer } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'
import mathUtils from '@/utils/mathUtils'
import pageUtils from '@/utils/pageUtils'
import resizeUtils from '@/utils/resizeUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

declare let window: CustomWindow

enum ScreenShotMode {
  LAYER,
  BG_IMG,
  BG_COLOR,
  PAGE
}

export default defineComponent({
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
      extraData: undefined as any,
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
    vivistickerUtils.registerCallbacks('screenshot')
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
        const thumbType = urlParams.get('thumbType')
        const designId = urlParams.get('designId')
        const key = urlParams.get('key')
        const source = urlParams.get('source')
        this.extraData = { thumbType, designId, key }
        switch (type) {
          case 'svg': {
            const json = await (await fetch(`https://template.vivipic.com/${type}/${id}/config.json?ver=${ver}`)).json() as ILayer
            let vSize = json.vSize as number[] | undefined
            if (!vSize) {
              vSize = [json.styles.width, json.styles.height]
            }
            const pageAspectRatio = window.outerWidth / window.outerHeight
            const svgAspectRatio = vSize[0] / vSize[1]
            const svgWidth = svgAspectRatio > pageAspectRatio ? window.outerWidth : window.outerHeight * svgAspectRatio
            const svgHeight = svgAspectRatio > pageAspectRatio ? window.outerWidth / svgAspectRatio : window.outerHeight
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
            const pageAspectRatio = window.outerWidth / window.outerHeight
            const photoAspectRatio = parseInt(width ?? '1') / parseInt(height ?? '1')
            const photoWidth = photoAspectRatio > pageAspectRatio ? window.outerWidth : window.outerHeight * photoAspectRatio
            const photoHeight = photoAspectRatio > pageAspectRatio ? window.outerWidth / photoAspectRatio : window.outerHeight

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
            const json = await (await fetch(`https://template.vivipic.com/svg/${id}/config.json?ver=${ver}`)).json() as ILayer
            const { srcObj, styles } = json

            const { width: boundingWidth, height: boundingHeight } = mathUtils.getBounding(json.styles)
            const xDiff = (boundingWidth - styles.width) / 2
            const yDiff = (boundingHeight - styles.height) / 2

            const pageAspectRatio = window.outerWidth / window.outerHeight
            const photoAspectRatio = boundingWidth / boundingHeight
            const photoWidth = photoAspectRatio > pageAspectRatio ? window.outerWidth : window.outerHeight * photoAspectRatio
            const photoHeight = photoAspectRatio > pageAspectRatio ? window.outerWidth / photoAspectRatio : window.outerHeight

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
          // case 'text': { deprecated
          //   const json = await (await fetch(`https://template.vivipic.com/svg/${id}/config.json?ver=${ver}`)).json() as IText | IGroup
          //   const page = pageUtils.newPage({ width: window.outerWidth, height: window.outerHeight })
          //   layerUtils.setAutoResizeNeededForLayersInPage(page, true)
          //   pageUtils.setPages([page])
          //   vivistickerUtils.initLoadingFlags({ layers: [json] }, () => {
          //     this.onload()
          //   })

          //   const { width, height, scale } = json.styles
          //   const pageAspectRatio = window.outerWidth / window.outerHeight
          //   const textAspectRatio = width / height
          //   const textWidth = textAspectRatio > pageAspectRatio ? window.outerWidth : window.outerHeight * textAspectRatio
          //   const textHeight = textAspectRatio > pageAspectRatio ? window.outerWidth / textAspectRatio : window.outerHeight
          //   const rescaleFactor = textWidth / width

          //   const config = {
          //     ...json,
          //     styles: {
          //       ...json.styles,
          //       width: textWidth,
          //       height: textHeight,
          //       scale: scale * rescaleFactor,
          //       x: 0,
          //       y: 0
          //     }
          //   }

          //   if (config.type === 'text') {
          //     Object.assign(config, {
          //       widthLimit: config.widthLimit === -1 ? -1 : config.widthLimit * rescaleFactor
          //     })
          //   }

          //   const newLayer = config.type === 'group'
          //     ? layerFactary.newGroup(config, (config as IGroup).layers)
          //     : layerFactary.newText(config as IText)
          //   layerUtils.addLayers(0, [newLayer])

          //   this.JSONcontentSize = {
          //     width: page.width,
          //     height: page.height
          //   }
          //   this.usingJSON = true
          //   break
          // }
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
            const page = layerFactary.newTemplate(JSON.parse(id ?? '')) as IPage
            if (page.layers.length === 0) {
              this.JSONcontentSize = {
                width: page.width,
                height: page.height
              }
              this.usingJSON = true
              this.onload()
              return
            }
            layerUtils.setAutoResizeNeededForLayersInPage(page, true)
            vivistickerUtils.initLoadingFlags(page, () => {
              this.onload()
            })
            pageUtils.setPages([page])
            if (vivistickerUtils.checkVersion('1.31')) {
              const newSize = {
                width: page.width * 2,
                height: page.height * 2
              }
              resizeUtils.resizePage(0, page, newSize)
              this.JSONcontentSize = newSize
              this.usingJSON = true
            } else {
              this.JSONcontentSize = {
                width: page.width,
                height: page.height
              }
              this.usingJSON = true
            }
            break
          }
        }
      })
    },
    bgStyles() {
      const screenWidth = window.outerWidth
      const screenHeight = window.outerHeight
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
      vivistickerUtils.isAnyIOSImgOnError = false
      this.extraData = undefined
    },
    onload() {
      console.log('loaded')
      if (this.mode === ScreenShotMode.PAGE) {
        if (vivistickerUtils.isAnyIOSImgOnError) {
          // Inform UIWeb to handle missing img
          vivistickerUtils.sendToIOS('INFORM_WEB', {
            info: {
              event: 'missing-image',
              key: this.extraData.key,
              id: this.extraData.designId,
              thumbType: this.extraData.thumbType
            },
            to: 'UI'
          })
        } else {
          vivistickerUtils.sendDoneLoading(this.JSONcontentSize.width, this.JSONcontentSize.height, this.options, true)
        }
      } else if ([ScreenShotMode.BG_IMG, ScreenShotMode.BG_COLOR].includes(this.mode)) {
        const element = this.$refs.target
        const target: HTMLElement = (element as any).$el ? (element as any).$el : element
        const { width, height } = target.getBoundingClientRect()
        vivistickerUtils.sendDoneLoading(width, height, this.options)
      } else {
        vivistickerUtils.sendDoneLoading(window.outerWidth, window.outerHeight, this.options)
      }
    }
    // fitPageToScreen(width: number, height: number): number {
    //   const screenWidth = window.outerWidth
    //   const screenHeight = window.outerHeight
    //   const screenRatio = screenWidth / screenHeight
    //   const objectRatio = width / height
    //   if (screenRatio > objectRatio) {
    //     this.JSONcontentSize = {
    //       width: screenHeight * objectRatio,
    //       height: screenHeight
    //     }
    //     return screenHeight / height
    //   } else {
    //     this.JSONcontentSize = {
    //       width: screenWidth,
    //       height: screenWidth / objectRatio
    //     }
    //     return screenWidth / width
    //   }
    // },
    // resizePage(data: { x: number, y: number, width: number, height: number, options: string }) {
    //   const { x, y, width, height, options } = data
    //   this.options = options
    //   this.pageTranslate = { x: -x, y: -y }
    //   const page = pageUtils.getPage(0)
    //   this.pageScale = this.fitPageToScreen(width, height)
    //   pageUtils.resizePage({ width: page.width * this.pageScale, height: page.height * this.pageScale })
    //   setTimeout(() => {
    //     console.log('resized')
    //     vivistickerUtils.sendDoneLoading(this.JSONcontentSize.width, this.JSONcontentSize.height, this.options, false)
    //   }, 100)
    // }
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
