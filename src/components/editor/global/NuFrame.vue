<template lang="pug">
div(:class="[isFrameImg ? 'flex-center full-size' : 'nu-frame__custom']"
    :style="styles")
  div(v-if="shadowSrc()" class="shadow__wrapper" :style="shadowWrapperStyles")
    img(class="shadow__img"
      draggable="false"
      :src="shadowSrc()")
  nu-layer(v-if="hasDecor"
    class="click-disabled"
    :key="`layer-${config.decoration?.id}`"
    :pageIndex="pageIndex"
    :page="page"
    :layerIndex="subLayerIndex !== -1 ? subLayerIndex : layerIndex"
    :inFrame="true"
    :contentScaleRatio="contentScaleRatio"
    :priPrimaryLayerIndex="subLayerIndex !== -1 ? layerIndex : -1"
    :primaryLayer="config"
    :config="config.decoration"
    :isSubLayer="true")
  nu-layer(v-for="(layer,index) in layers"
    :key="`layer-${layer.id}`"
    :pageIndex="pageIndex"
    :page="page"
    :layerIndex="subLayerIndex !== -1 ? subLayerIndex : layerIndex"
    :inFrame="true"
    :inImageFrame="inImageFrame()"
    :subLayerIndex="index"
    :contentScaleRatio="contentScaleRatio"
    :priPrimaryLayerIndex="subLayerIndex !== -1 ? layerIndex : -1"
    :primaryLayer="config"
    :config="layer"
    :isSubLayer="true")
  nu-layer(v-if="hasDecorTop"
    class="click-disabled"
    :key="`layer-${config.decorationTop?.id}`"
    :pageIndex="pageIndex"
    :page="page"
    :layerIndex="subLayerIndex !== -1 ? subLayerIndex : layerIndex"
    :inFrame="true"
    :contentScaleRatio="contentScaleRatio"
    :priPrimaryLayerIndex="subLayerIndex !== -1 ? layerIndex : -1"
    :primaryLayer="config"
    :config="config.decorationTop"
    :isSubLayer="true")
  template(v-if="hasBlendLayers")
    nu-layer(v-for="(layer, index) in config.blendLayers"
      class="click-disabled"
      :key="`layer-${layer.id}`"
      :pageIndex="pageIndex"
      :page="page"
      :layerIndex="subLayerIndex !== -1 ? subLayerIndex : layerIndex"
      :inFrame="true"
      :subLayerIndex="index"
      :contentScaleRatio="contentScaleRatio"
      :priPrimaryLayerIndex="subLayerIndex !== -1 ? layerIndex : -1"
      :primaryLayer="config"
      :config="layer"
      :isSubLayer="true")
</template>

<script lang="ts">
import { IListServiceContentDataItem } from '@/interfaces/api'
import { IFrame, IGroup, IImage, IShape, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import AssetUtils from '@/utils/assetUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import ImageUtils from '@/utils/imageUtils'
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object as PropType<IFrame>,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    subLayerIndex: {
      type: Number,
      default: -1
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    primaryLayer: {
      default: undefined,
      type: Object as PropType<IGroup | ITmp>
    },
    inPreview: {
      default: false,
      type: Boolean
    }
  },
  async created() {
    if (this.config.needFetch && this.config.designId) {
      const config = this.config as IFrame
      const asset = {
        type: 8,
        id: config.designId,
        ver: this.getVerUni
      } as IListServiceContentDataItem

      const json = (await AssetUtils.get(asset)).jsonData as IFrame
      layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, {
        initWidth: json.width as number,
        initHeight: json.height as number
      }, this.subLayerIndex)

      config.clips.forEach((_, idx) => {
        if (json.clips[idx]) {
          if (this.subLayerIndex !== -1) {
            frameUtils.updateFrameLayerProps(this.pageIndex, this.subLayerIndex, idx, { clipPath: json.clips[idx].clipPath }, this.layerIndex)
          } else {
            frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, idx, { clipPath: json.clips[idx].clipPath })
          }
        }
      })

      if (json.decoration) {
        if (config.decoration) {
          if (config.decoration.color.length) {
            json.decoration.color = [...config.decoration.color]
          }
          const newDecor = {} as IShape
          Object.entries(config.decoration)
            .forEach(([k, v]) => {
              if (v instanceof Object || v instanceof Array) {
                newDecor[k] = generalUtils.unproxify(v)
              } else {
                newDecor[k] = v
              }
            })
          Object.assign(newDecor, json.decoration)
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { decoration: newDecor }, this.subLayerIndex)
        } else {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { decoration: json.decoration }, this.subLayerIndex)
        }
      } else if (!json.decoration && config.decoration) {
        vivistickerUtils.setLoadingFlag(this.layerIndex, this.subLayerIndex, { k: 'd' })
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { decoration: undefined }, this.subLayerIndex)
      }

      if (json.decorationTop) {
        if (config.decorationTop) {
          if (config.decorationTop.color.length) {
            json.decorationTop.color = [...config.decorationTop.color]
          }
          const newDecorTop = {} as IShape
          Object.entries(config.decorationTop)
            .forEach(([k, v]) => {
              if (v instanceof Object || v instanceof Array) {
                newDecorTop[k] = generalUtils.unproxify(v)
              } else {
                newDecorTop[k] = v
              }
            })
          Object.assign(newDecorTop, json.decorationTop)
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { decorationTop: newDecorTop }, this.subLayerIndex)
        } else {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { decorationTop: json.decorationTop }, this.subLayerIndex)
        }
      } else if (!json.decorationTop && config.decorationTop) {
        vivistickerUtils.setLoadingFlag(this.layerIndex, this.subLayerIndex, { k: 'dt' })
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { decorationTop: undefined }, this.subLayerIndex)
      }

      if (json.blendLayers) {
        if (!this.config.blendLayers) {
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { blendLayers: [] }, this.subLayerIndex)
        }
        json.blendLayers.forEach((l, i) => {
          if (!this.config.blendLayers![i]) {
            const styles = {
              width: this.config.styles.width / this.config.styles.scale,
              height: this.config.styles.height / this.config.styles.scale,
              initWidth: this.config.styles.width / this.config.styles.scale,
              initHeight: this.config.styles.height / this.config.styles.scale,
              vSize: [this.config.styles.width / this.config.styles.scale, this.config.styles.height / this.config.styles.scale]
            }
            if (this.primaryLayer) {
              this.updateFrameBlendLayer({
                pageIndex: this.pageIndex,
                preprimaryLayerIndex: this.layerIndex,
                layerIndex: this.subLayerIndex,
                subLayerIdx: -1,
                shape: layerFactary.newShape({ styles })
              })
            } else {
              this.updateFrameBlendLayer({
                pageIndex: this.pageIndex,
                layerIndex: this.layerIndex,
                subLayerIdx: -1,
                shape: layerFactary.newShape({ styles })
              })
            }
          }
          l.color = this.config.blendLayers![i].color
          const styles = {
            ...this.config.blendLayers![i].styles,
            blendMode: (json.blendLayers as IShape[])[i].blendMode
          }
          const blendLayer = (json.blendLayers as IShape[])[i]
          blendLayer.styles = styles
          if (this.primaryLayer) {
            this.updateFrameBlendLayer({
              pageIndex: this.pageIndex,
              preprimaryLayerIndex: this.layerIndex,
              layerIndex: this.subLayerIndex,
              subLayerIdx: i,
              shape: blendLayer
            })
          } else {
            this.updateFrameBlendLayer({
              pageIndex: this.pageIndex,
              layerIndex: this.layerIndex,
              subLayerIdx: i,
              shape: blendLayer
            })
          }
        })
      }
      layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { needFetch: false }, this.subLayerIndex)
      vivistickerUtils.setLoadingFlag(this.layerIndex, this.subLayerIndex)
    } else vivistickerUtils.setLoadingFlag(this.layerIndex, this.subLayerIndex)
  },
  mounted() {
    if (this.config.clips.length === 1) {
      if (!this.editorTypeTemplate && this.$route.name !== 'Screenshot') frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, 0, { active: true })
      if (this.config.clips[0].srcObj.type === 'frame') {
        /**
         * If the frame contain only one clip, and is not in template editor or init from mydesign or in preview auto popping the photo-selector
         */
        if (!(this.editorTypeTemplate || this.config.initFromMydesign || this.inPreview || this.inScreenshotPreview)) {
          window.requestAnimationFrame(() => {
            if (this.primaryLayer) {
              frameUtils.iosPhotoSelect({
                pageIndex: this.pageIndex,
                priPrimaryLayerIndex: this.layerIndex,
                layerIndex: this.subLayerIndex,
                subLayerIdx: 0,
              }, (this.config as IFrame).clips[0])
            } else {
              frameUtils.iosPhotoSelect({
                pageIndex: this.pageIndex,
                layerIndex: this.layerIndex,
                subLayerIdx: 0,
              }, (this.config as IFrame).clips[0])
            }
          })
        } else {
          layerUtils.deleteLayerProps(this.pageIndex, this.layerIndex, ['initFromMydesign'], this.subLayerIndex)
        }
      }
    }
  },
  watch: {
    'config.needFetch': function (newVal) {
      if (newVal && this.config.designId) {
        const asset = {
          type: 8,
          id: this.config.designId,
          ver: this.getVerUni
        } as IListServiceContentDataItem
        AssetUtils.get(asset).then((res) => {
          const json = res.jsonData as IFrame
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { clips: generalUtils.deepCopy(this.config.clips) }, this.subLayerIndex)
          if (this.config.decoration && json.decoration) {
            json.decoration.color = [...this.config.decoration.color] as [string]
            layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
              decoration: layerFactary.newShape({
                ...json.decoration,
                vSize: [this.config.styles.initWidth, this.config.styles.initHeight],
                styles: {
                  width: this.config.styles.initWidth,
                  height: this.config.styles.initHeight,
                  initWidth: this.config.styles.initWidth,
                  initHeight: this.config.styles.initHeight
                }
              })
            }, this.subLayerIndex)
          }
          if (this.config.decorationTop && json.decorationTop) {
            json.decorationTop.color = [...this.config.decorationTop.color] as [string]
            layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
              decorationTop: layerFactary.newShape({
                ...json.decorationTop,
                vSize: [this.config.styles.initWidth, this.config.styles.initHeight],
                styles: {
                  width: this.config.styles.initWidth,
                  height: this.config.styles.initHeight,
                  initWidth: this.config.styles.initWidth,
                  initHeight: this.config.styles.initHeight
                }
              })
            }, this.subLayerIndex)
          }
          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { needFetch: false }, this.subLayerIndex)
        })
      }
    },
    controllerHidden(val) {
      if (!val) {
        if (!this.editorTypeTemplate && this.config.active && this.config.clips.length === 1) {
          frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, 0, { active: true })
        }
      }
    }
  },
  computed: {
    ...mapGetters('user', ['getVerUni']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      isShowPagePreview: 'page/getIsShowPagePreview',
      controllerHidden: 'vivisticker/getControllerHidden',
      editorTypeTemplate: 'vivisticker/getEditorTypeTemplate',
      inScreenshotPreview: 'getInScreenshotPreview',
    }),
    hasDecor(): boolean {
      const config = this.config as IFrame
      return !!config.decoration && !!config.decoration.svg && !config.clips[0].isFrameImg
    },
    hasDecorTop(): boolean {
      const config = this.config as IFrame
      return !!config.decorationTop && !!config.decorationTop.svg
    },
    hasBlendLayers(): boolean {
      return !!this.config.blendLayers
    },
    layers() {
      const config = this.config as IFrame
      let layers: Array<IImage | IShape> = []
      // if (config.decoration && config.decoration.svg && !config.clips[0].isFrameImg) {
      //   layers = layers.concat(config.decoration)
      // }

      layers = layers.concat(...config.clips)

      // if (config.decorationTop && config.decorationTop.svg) {
      //   layers = layers.concat(config.decorationTop)
      // }

      // if (config.blendLayers) {
      //   layers = layers.concat(config.blendLayers)
      // }
      return layers
    },
    // layerIdxOffset(): number {
    //   const { config } = this
    //   return config.decoration && config.decoration.svg && !config.clips[0].isFrameImg ? 1 : 0
    // },
    shadowWrapperStyles() {
      const shadow = this.config.styles.shadow
      if (shadow && shadow.srcObj?.type) {
        const { imgWidth, imgHeight, imgX, imgY } = shadow.styles
        const { horizontalFlip, verticalFlip, scale } = this.config.styles
        const x = (horizontalFlip ? -imgX : imgX) * scale * this.contentScaleRatio
        const y = (verticalFlip ? -imgY : imgY) * scale * this.contentScaleRatio
        return {
          width: (imgWidth * scale * this.contentScaleRatio).toString() + 'px',
          height: (imgHeight * scale * this.contentScaleRatio).toString() + 'px',
          transform: `translate(${x}px, ${y}px)`
        }
      }
      return {}
    },
    isFrameImg(): boolean {
      return this.config.clips.length === 1 && !!this.config.clips[0].isFrameImg
    },
    styles(): Record<string, string> {
      if (!this.isFrameImg) {
        return {
          width: `${this.config.styles.width / this.config.styles.scale * this.contentScaleRatio}px`,
          height: `${this.config.styles.height / this.config.styles.scale * this.contentScaleRatio}px`,
          // For controll pointer-events from parent, please don't add any pointer-events: initial to layer component.
          ...(this.contentScaleRatio !== 1 && { transform: `scale(${1 / this.contentScaleRatio})` }),
        }
      }
      return {}
    }
  },
  methods: {
    ...mapMutations({
      updateFrameBlendLayer: 'UPDATE_frameBlendLayer'
    }),
    shadowSrc() {
      const shadow = this.config.styles.shadow
      if (shadow && shadow.srcObj && shadow.srcObj.type) {
        const { width, height } = this.config.styles
        const size = ImageUtils.getSrcSize(shadow.srcObj, ImageUtils.getSignificantDimension(width, height) * (this.scaleRatio / 100))
        return ImageUtils.getSrc(shadow.srcObj, ImageUtils.getSrcSize(shadow.srcObj, size))
      }
      return ''
    },
    inImageFrame() {
      return this.config.clips.length === 1 && this.config.clips[0].isFrameImg
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-frame {
  display: flex;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  transform-style: flat;

  &__custom {
    pointer-events: none;
    transform-origin: top left;
  }
}
.shadow {
  &__wrapper {
    flex-shrink: 0;
    position: absolute;
  }
  &__img {
    width: 100%;
    height: 100%;
  }
}
</style>
