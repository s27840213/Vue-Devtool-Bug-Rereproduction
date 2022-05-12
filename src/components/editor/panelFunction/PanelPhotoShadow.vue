<template lang="pug">
  div(class="photo-effect-setting mt-25")
    div(class="action-bar")
      div(class="flex-between photo-effect-setting__options mb-10")
        svg-icon(v-for="(icon, idx) in shadowOption.slice(0, 3)"
          :key="`shadow-${icon}`"
          :iconName="`photo-shadow-${icon}`"
          @click.native="onEffectClick(icon)"
          class="photo-effect-setting__option pointer"
          :class="{ 'photo-effect-setting__option--selected': currentEffect === icon }"
          iconWidth="60px"
          iconColor="gray-2"
          v-hint="$t(shadowPropI18nMap[icon]._effectName)"
        )
      div(v-if="shadowOption.slice(0, 3).includes(currentEffect)"
        :class="['w-full', currentEffect !== 'none' ? 'photo-effect-setting__form' : '']")
        div(v-for="field in shadowFields"
          :key="field")
          div(class="photo-effect-setting__field")
            div(class="photo-effect-setting__field-name") {{$t(shadowPropI18nMap[currentEffect][field])}}
            input(class="photo-effect-setting__value-input"
              :value="getFieldValue(field)"
              :name="field"
              @change="handleEffectUpdate"
              @blur="recordChange"
              type="number")
          input(class="photo-effect-setting__range-input"
            :value="getFieldValue(field)"
            :max="fieldRange[currentEffect][field].max"
            :min="fieldRange[currentEffect][field].min"
            :name="field"
            @input="handleEffectUpdate"
            @mouseup="recordChange"
            v-ratio-change
            type="range")
        template(v-if="currentEffect !== 'none'")
          div(class="photo-effect-setting__field")
            div(class="photo-effect-setting__field-name") {{$t('NN0017')}}
            div(class="photo-effect-setting__value-input"
              :style="{ backgroundColor: currentStyle.shadow.effects.color || '#000000' }"
              @click="handleColorModal")
          div(class="photo-effect-setting__reset")
            button(@click="reset()") {{ 'Reset' }}
      div(class="flex-between photo-effect-setting__options mb-10")
        svg-icon(v-for="(icon, idx) in shadowOption.slice(3)"
          :key="`shadow-${icon}`"
          :iconName="`photo-shadow-${icon}`"
          @click.native="onEffectClick(icon)"
          class="photo-effect-setting__option pointer"
          :class="{ 'photo-effect-setting__option--selected': currentEffect === icon }"
          iconWidth="60px"
          iconColor="gray-2"
          v-hint="$t(shadowPropI18nMap[icon]._effectName)"
        )
      div(v-if="shadowOption.slice(3).includes(currentEffect)"
        class="w-full photo-effect-setting__form")
        div(v-for="field in shadowFields"
          :key="field")
          div(class="photo-effect-setting__field")
            div(class="photo-effect-setting__field-name") {{$t(shadowPropI18nMap[currentEffect][field])}}
            input(class="photo-effect-setting__value-input"
              :value="getFieldValue(field)"
              :name="field"
              @change="handleEffectUpdate"
              @blur="recordChange"
              type="number")
          input(class="photo-effect-setting__range-input"
            :value="getFieldValue(field)"
            :max="fieldRange[currentEffect][field].max"
            :min="fieldRange[currentEffect][field].min"
            :name="field"
            @input="handleEffectUpdate"
            @mouseup="recordChange"
            v-ratio-change
            type="range")
        div(v-if="!['none', 'imageMatched'].includes(currentEffect)"
          class="photo-effect-setting__field")
          div(class="photo-effect-setting__field-name") {{$t('NN0017')}}
          div(class="photo-effect-setting__value-input"
            :style="{ backgroundColor: currentStyle.shadow.effects.color || '#000000' }"
            @click="handleColorModal")
        div(class="photo-effect-setting__reset")
          button(@click="reset()") {{ 'Reset' }}
          //- @toggleColorPanel="toggleColorPanel")
          //- color-picker(v-if="openColorPicker"
          //-   class="photo-effect-setting__color-picker"
          //-   v-click-outside="handleColorModal"
          //-   :currentColor="currentStyle.shadow.color"
          //-   @update="handleColorUpdate")
</template>

<script lang="ts">
import Vue from 'vue'
import ColorPicker from '@/components/ColorPicker.vue'
import ColorPanel from '@/components/editor/ColorPanel.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType, FunctionPanelType, LayerType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import imageShadowUtils, { CANVAS_FLOATING_SCALE, CANVAS_SCALE, CANVAS_SIZE, CANVAS_SPACE, fieldRange, shadowPropI18nMap } from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import { IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { mapActions, mapGetters } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'
import { IUploadAssetResponse } from '@/interfaces/upload'
import pageUtils from '@/utils/pageUtils'
import imageUtils from '@/utils/imageUtils'
import groupUtils, { calcTmpProps } from '@/utils/groupUtils'
import mathUtils from '@/utils/mathUtils'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { SrcObj } from '@/interfaces/gallery'

export default Vue.extend({
  components: {
    ColorPicker,
    ColorPanel
  },
  data() {
    return {
      shadowPropI18nMap,
      fieldRange,
      notUpload: false
    }
  },
  mounted() {
    colorUtils.on(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.photoShadow)
  },
  async beforeDestroy() {
    colorUtils.event.off(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    if (this.notUpload) return
    const layerData = imageShadowUtils.layerData
    if (layerData) {
      const { config, primarylayerId } = layerData
      if (config.styles.shadow.srcObj.type) {
        return
      }

      const pageId = layerUtils.getPage(layerUtils.pageIndex).id
      if (primarylayerId) {
        this.setIsUploading(pageId, primarylayerId, config.id as string, true)
      } else {
        this.setIsUploading(pageId, config.id as string, '', true)
      }

      const assetId = generalUtils.generateAssetId()
      this.$store.commit('file/SET_UPLOADING_IMGS', {
        id: assetId,
        adding: true,
        pageIndex: pageUtils.currFocusPageIndex
      })

      const img = new Image()
      img.crossOrigin = 'anonynous'
      img.src = imageUtils.getSrc(config, ['public', 'private'].includes(config.srcObj.type) ? 'larg' : 1600)
      img.src += `${img.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
      })
      const updateCanvas = document.createElement('canvas')
      const { width, height, imgWidth, imgHeight } = config.styles
      const drawCanvasW = width / imgWidth * img.naturalWidth
      const drawCanvasH = height / imgHeight * img.naturalHeight
      let spaceScale = Math.max((height > width ? height : width) / CANVAS_SIZE, 0.3)
      const _canvasW = (width + CANVAS_SPACE * spaceScale)
      const _canvasH = (height + CANVAS_SPACE * spaceScale)
      const canvasRatio = _canvasH / _canvasW
      const canvasWOri = _canvasW >= _canvasH ? CANVAS_SIZE : CANVAS_SIZE / canvasRatio
      const canvasHOri = _canvasW < _canvasH ? CANVAS_SIZE : CANVAS_SIZE * canvasRatio
      const drawCanvasWOri = width * canvasWOri / _canvasW
      const drawCanvasHOri = height * canvasHOri / _canvasH

      spaceScale *= width > height ? CANVAS_SIZE / _canvasW : CANVAS_SIZE / _canvasH
      spaceScale *= imgWidth > imgHeight
        ? (width / imgWidth) * 1600 / drawCanvasWOri
        : (height / imgHeight) * 1600 / drawCanvasHOri

      const canvasW = drawCanvasW + CANVAS_SPACE * spaceScale
      const canvasH = drawCanvasH + CANVAS_SPACE * spaceScale
      updateCanvas.setAttribute('width', `${canvasW}`)
      updateCanvas.setAttribute('height', `${canvasH}`)

      switch (config.styles.shadow.currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.blur:
        case ShadowEffectType.frame: {
          await imageShadowUtils.drawShadow(updateCanvas, img, config, { timeout: 0, drawCanvasW, drawCanvasH })
          break
        }
        case ShadowEffectType.imageMatched:
          await imageShadowUtils.drawImageMatchedShadow(updateCanvas, img, config, { timeout: 0, drawCanvasW, drawCanvasH })
          break
        case ShadowEffectType.floating: {
          await imageShadowUtils.drawFloatingShadow(updateCanvas, img, config, { timeout: 0, drawCanvasW, drawCanvasH })
          break
        }
        case ShadowEffectType.none:
          return
        default:
          generalUtils.assertUnreachable(config.styles.shadow.currentEffect)
      }

      // updateCanvas.style.width = (updateCanvas.width / 4).toString() + 'px'
      // updateCanvas.style.height = (updateCanvas.height / 4).toString() + 'px'
      // updateCanvas.style.position = 'absolute'
      // updateCanvas.style.zIndex = '1000'
      // updateCanvas.style.top = '0'

      // document.body.append(updateCanvas)
      // setTimeout(() => document.body.removeChild(updateCanvas), 15000)

      const { right, left, top, bottom } = imageShadowUtils.getImgEdgeWidth(updateCanvas)
      const leftShadowThickness = ((updateCanvas.width - drawCanvasW) * 0.5 - left) / drawCanvasW
      const topShadowThickness = ((updateCanvas.height - drawCanvasH) * 0.5 - top) / drawCanvasH

      const uploadCanvas = document.createElement('canvas')
      uploadCanvas.setAttribute('width', (updateCanvas.width - left - right).toString())
      uploadCanvas.setAttribute('height', (updateCanvas.height - top - bottom).toString())
      const ctxUpload = uploadCanvas.getContext('2d') as CanvasRenderingContext2D

      const drawnImg = new Image()
      drawnImg.src = updateCanvas.toDataURL('image/png;base64', 0.5)
      await new Promise<void>((resolve) => {
        drawnImg.onload = () => {
          ctxUpload.drawImage(drawnImg, left, top, updateCanvas.width - right - left, updateCanvas.height - bottom - top, 0, 0, uploadCanvas.width, uploadCanvas.height)
          resolve()
        }
      })

      const srcObjIdentifier = config.srcObj.type + config.srcObj.userId + config.srcObj.assetId
      uploadUtils.uploadAsset('image', [uploadCanvas.toDataURL('image/png;base64', 0.5)], {
        addToPage: false,
        needCompressed: false,
        pollingCallback: (json: IUploadAssetResponse) => {
          const srcObj = {
            type: this.isAdmin ? 'public' : 'private',
            userId: json.data.team_id,
            assetId: this.isAdmin ? json.data.id : json.data.asset_index
          }
          const { pageIndex, layerIndex, subLayerIdx } = primarylayerId
            ? layerUtils.getLayerInfoById(pageId, primarylayerId, config.id as string)
            : layerUtils.getLayerInfoById(pageId, config.id as string, '')

          if (pageIndex !== -1 && layerIndex !== -1) {
            const layer = layerUtils.getLayer(pageIndex, layerIndex)
            const newWidth = (updateCanvas.width - right - left) / drawCanvasW * config.styles.width
            const newHeight = (updateCanvas.height - top - bottom) / drawCanvasH * config.styles.height

            const newImg = new Image()
            newImg.crossOrigin = 'anonynous'
            newImg.onload = () => {
              if (srcObjIdentifier !== config.srcObj.type + config.srcObj.userId + config.srcObj.assetId) {
                return
              }
              imageShadowUtils.updateShadowStyles({ pageIndex, layerIndex, subLayerIdx }, {
                imgWidth: newWidth,
                imgHeight: newHeight,
                imgX: newWidth * 0.5 - (config.styles.width * leftShadowThickness + config.styles.width * 0.5),
                imgY: newHeight * 0.5 - (config.styles.height * topShadowThickness + config.styles.height * 0.5)
              })
              layerUtils.updateLayerProps(pageIndex, layerIndex, { isUploading: false, inProcess: false }, subLayerIdx)
              layerUtils.updateLayerStyles(pageIndex, layerIndex, { scale: 1 }, subLayerIdx)
              imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, srcObj)
              if (subLayerIdx !== -1) {
                /** Handle the primary layer size update */
                const primaryLayer = layer as IGroup
                const { width, height, initWidth, initHeight } = mathUtils
                  .multipy(primaryLayer.styles.scale, calcTmpProps(primaryLayer.layers) as { [key: string] : number }) as ICalculatedGroupStyle
                layerUtils.updateLayerStyles(pageIndex, layerIndex, { width, height, initWidth, initHeight })
                /** Handle the sub-layer styles update */
                const leftMargin = primaryLayer.layers.find(l => l.styles.x < 0)?.styles.x ?? 0
                const topMargin = primaryLayer.layers.find(l => l.styles.y < 0)?.styles.y ?? 0
                if (leftMargin || topMargin) {
                  primaryLayer.layers
                    .forEach((l, i) => {
                      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
                        x: l.styles.x - leftMargin,
                        y: l.styles.y - topMargin
                      }, i)
                    })
                  layerUtils.updateLayerStyles(pageIndex, layerIndex, {
                    x: primaryLayer.styles.x + leftMargin * primaryLayer.styles.scale,
                    y: primaryLayer.styles.y + topMargin * primaryLayer.styles.scale
                  })
                }
              }
            }
            newImg.src = imageUtils.getSrc(srcObj, imageUtils.getSrcSize(srcObj.type, Math.max(newWidth, newHeight)))
          }
          imageShadowUtils.clearLayerData()
        }
      })
    }
  },
  destroyed() {
    this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.none)
  },
  computed: {
    ...mapGetters({
      isAdmin: 'user/isAdmin',
      currFunctionPanelType: 'getCurrFunctionPanelType'
    }),
    shadowOption(): string[] {
      return Object.keys(this.effects)
    },
    shadowFields(): string[] {
      const { effects, currentEffect } = this
      return effects[currentEffect]
    },
    currentStyle(): IImageStyle {
      const { styles } = layerUtils.getCurrConfig as IImage
      return styles || {}
    },
    currentEffect(): ShadowEffectType {
      const { shadow } = this.currentStyle as IImageStyle
      return shadow.currentEffect || 'none'
    },
    effects(): { [key: string]: string[] } {
      return {
        none: [],
        shadow: imageShadowUtils.getKeysOf(ShadowEffectType.shadow),
        blur: imageShadowUtils.getKeysOf(ShadowEffectType.blur),
        imageMatched: imageShadowUtils.getKeysOf(ShadowEffectType.imageMatched),
        frame: imageShadowUtils.getKeysOf(ShadowEffectType.frame),
        floating: imageShadowUtils.getKeysOf(ShadowEffectType.floating)
      }
    }
  },
  methods: {
    ...mapActions({
      removeBg: 'user/removeBg'
    }),
    optionStyle(idx: number) {
      return { 'ml-auto': idx % 3 === 0, 'mx-16': idx % 3 === 1, 'mr-auto': idx % 3 === 2 }
    },
    handleColorModal() {
      this.$emit('toggleColorPanel', true)
      colorUtils.setCurrEvent(ColorEventType.photoShadow)
      colorUtils.setCurrColor(this.currentStyle.shadow.effects.color)
    },
    onEffectClick(effectName: ShadowEffectType): void {
      const alreadySetEffect = effectName === ShadowEffectType.none
        ? true : Object.keys((this.currentStyle.shadow as any).effects[effectName]).length
      imageShadowUtils.setEffect(effectName, {
        ...(!alreadySetEffect && imageShadowUtils.getDefaultEffect(effectName))
      })
      this.recordChange()
    },
    handleEffectUpdate(event: Event): void {
      const { currentEffect, fieldRange } = this
      const { name, value } = event.target as HTMLInputElement
      const { max, min } = (fieldRange as any)[this.currentEffect][name]
      if (currentEffect !== ShadowEffectType.none) {
        const oldEffect = generalUtils
          .deepCopy((layerUtils.getCurrConfig as IImage).styles.shadow.effects[currentEffect]) as IShadowProps
        imageShadowUtils.setEffect(currentEffect, {
          [currentEffect]:
            Object.assign(oldEffect, { [name]: +value > max ? max : (+value < min ? min : +value) })
        })
      }
    },
    handleColorUpdate(color: string): void {
      const { currentEffect } = this
      imageShadowUtils.setEffect(currentEffect, { color })
    },
    recordChange() {
      stepsUtils.record()
    },
    getFieldValue(field: string): number | boolean {
      return (this.currentStyle.shadow.effects as any)[this.currentEffect][field]
    },
    reset(effect: ShadowEffectType = ShadowEffectType.none, pageIndex = -1, layerIndex = -1, subLayerIdx = -1) {
      if (effect === ShadowEffectType.none) {
        if (subLayerIdx === -1) {
          effect = pageIndex !== -1 && layerIndex !== -1
            ? (layerUtils.getLayer(pageIndex, layerIndex) as IImage).styles.shadow.currentEffect
            : this.currentEffect
        } else if (pageIndex !== -1 && layerIndex !== -1) {
          effect = ((layerUtils.getLayer(pageIndex, layerIndex) as IGroup)
            .layers[subLayerIdx] as IImage)
            .styles.shadow.currentEffect
        }
      }
      if (effect !== ShadowEffectType.none) {
        const defaultProps = imageShadowUtils.getDefaultEffect(effect)[effect]
        imageShadowUtils.setEffect(effect, {
          [effect]: defaultProps,
          color: '#000000'
        }, pageIndex, layerIndex, subLayerIdx)
      }
    },
    resetAllShadowProps(pageIndex = -1, layerIndex = -1, subLayerIdx = -1) {
      Object.keys(ShadowEffectType)
        .forEach(k => this.reset(k as ShadowEffectType, pageIndex, layerIndex, subLayerIdx))
      imageShadowUtils.setEffect(ShadowEffectType.none, {}, pageIndex, layerIndex, subLayerIdx)
    },
    setIsUploading(pageId: string, layerId: string, subLayerId: string, isUploading: boolean) {
      const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        isUploading
      }, subLayerIdx)
    }
  }
})
</script>

<style lang="scss" scoped>
.photo-effect-setting {
  font-size: 14px;
  &__form {
    background: #fff;
    padding: 12px;
  }
  &__name {
    flex: 1;
    padding: 0 12px;
  }
  &__options {
    display: flex;
    width: 212px;
  }
  &__option {
    box-sizing: border-box;
    margin-top: 10px;
    border-radius: 3px;
    border: 2px solid transparent;
    &:not(&--selected):hover {
      border-color: setColor(blue-1, 0.5);
    }
    &--selected {
      border-color: setColor(blue-1);
    }
  }
  &__field {
    display: flex;
    justify-content: space-between;
  }
  &__field-name {
    color: #18191f;
    text-align: left;
    text-transform: capitalize;
    white-space: nowrap;
  }
  &__range-input {
    appearance: none;
    outline: none;
    background: none;
    width: 98%;
    margin: 12px 0;
    box-sizing: border-box;
    &::-webkit-slider-runnable-track {
      height: 2px;
      background-color: #d9dbe1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid setColor(blue-1);
      transition: 0.2s;
      margin-top: -5px;
      position: relative;
    }
  }
  &__value-input {
    border: 1px solid #d9dbe1;
    width: 32px;
    height: 24px;
    box-sizing: border-box;
    line-height: 20px;
    border-radius: 3px;
    text-align: center;
  }
  &__color-picker {
    position: absolute;
    right: 0px;
    bottom: 0px;
  }
  &__reset {
    margin: 12px 0 0 0;
    text-align: right;
    > button {
      color: setColor(blue-1);
      font-size: 14px;
      padding: 0;
    }
  }
}
.action-bar {
  padding: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.w-full {
  @include size(100%, 100%);
}
.mx-16 {
  margin-left: 16px;
  margin-right: 16px;
}
.photo-shape-title {
  font-size: 16px;
  font-weight: bold;
}
</style>
