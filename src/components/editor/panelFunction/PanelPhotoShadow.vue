<template lang="pug">
  div(class="photo-effect-setting mt-25" ref="panel" tabindex="0" @keydown.stop)
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
          v-hint="$t(shadowPropI18nMap[icon]._effectName)")
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
              type="number")
          input(class="photo-effect-setting__range-input"
            :value="getFieldValue(field)"
            :max="fieldRange[currentEffect][field].max"
            :min="fieldRange[currentEffect][field].min"
            :name="field"
            @input="handleEffectUpdate"
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
              type="number")
          input(class="photo-effect-setting__range-input"
            :value="getFieldValue(field)"
            :max="fieldRange[currentEffect][field].max"
            :min="fieldRange[currentEffect][field].min"
            :name="field"
            @input="handleEffectUpdate"
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
import { ColorEventType, FunctionPanelType, LayerProcessType, LayerType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import imageShadowUtils, { CANVAS_SIZE, CANVAS_SPACE, fieldRange, shadowPropI18nMap } from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import { IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { mapActions, mapGetters } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'
import { IUploadAssetResponse } from '@/interfaces/upload'
import pageUtils from '@/utils/pageUtils'
import imageUtils from '@/utils/imageUtils'
import logUtils from '@/utils/logUtils'

export default Vue.extend({
  components: {
    ColorPicker,
    ColorPanel
  },
  data() {
    return {
      shadowPropI18nMap,
      fieldRange
    }
  },
  mounted() {
    colorUtils.on(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.photoShadow)
    const target = layerUtils.getCurrConfig as IImage
    if (target && target.type === LayerType.image) {
      if (typeof layerUtils.subLayerIdx !== 'undefined' && layerUtils.subLayerIdx !== -1) {
        imageShadowUtils.setHandleId({
          pageId: pageUtils.currFocusPage.id,
          layerId: layerUtils.getCurrLayer.id || '',
          subLayerId: target.id || ''
        })
      } else {
        imageShadowUtils.setHandleId({
          pageId: pageUtils.currFocusPage.id,
          layerId: target.id || '',
          subLayerId: ''
        })
      }
    } else {
      console.error('The layer should be image layer')
    }
    setTimeout(() => this.focusOnPanel())
  },
  async beforeDestroy() {
    colorUtils.event.off(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    const layerData = imageShadowUtils.layerData
    logUtils.setLog('phase: start upload shadow')
    if (layerData) {
      const { config: _config, primarylayerId, pageId } = layerData
      console.log(generalUtils.deepCopy(_config))
      const config = generalUtils.deepCopy(_config) as IImage
      const layerId = primarylayerId || config.id || ''
      const subLayerId = primarylayerId ? config.id : ''
      const { pageIndex: _pageIndex, layerIndex: _layerIndex, subLayerIdx: _subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
      /** If the shadow effct has already got the img src, return */
      if (config.type !== LayerType.image || config.styles.shadow.srcObj.type) {
        return
      }
      if (primarylayerId) {
        this.setIsUploading(pageId, primarylayerId, config.id as string, true)
      } else {
        this.setIsUploading(pageId, config.id as string, '', true)
      }
      /** uploadAssetId used to identify the upload-shadow-img in undo/redo step */
      const uploadAssetId = generalUtils.generateRandomString(6)
      this.setUploadingData({ pageId, layerId, subLayerId }, uploadAssetId)
      stepsUtils.record()
      const assetId = generalUtils.generateAssetId()
      this.$store.commit('file/SET_UPLOADING_IMGS', {
        id: assetId,
        adding: true,
        pageIndex: _pageIndex
      })

      imageShadowUtils.setUploadId({
        pageId: pageId,
        layerId: primarylayerId || config.id || '',
        subLayerId: primarylayerId ? config.id || '' : ''
      })

      // Handle the params for drawing
      const img = new Image()
      let MAXSIZE = 1600
      img.crossOrigin = 'anonynous'
      img.src = imageUtils.getSrc(config, ['private', 'public', 'logo-private', 'logo-public', 'background'].includes(config.srcObj.type) ? 'larg' : 1600)
      img.src += `${img.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      await new Promise<void>((resolve) => {
        img.onload = () => {
          resolve()
          MAXSIZE = Math.max(img.naturalWidth, img.naturalHeight)
        }
      })
      logUtils.setLog('phase: finish load max size img')
      const updateCanvas = document.createElement('canvas')
      // const { initWidth: width, initHeight: height, imgWidth, imgHeight } = config.styles
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
        ? (width / imgWidth) * MAXSIZE / drawCanvasWOri
        : (height / imgHeight) * MAXSIZE / drawCanvasHOri

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
      logUtils.setLog('phase: finish drawing')
      // updateCanvas.style.width = (updateCanvas.width).toString() + 'px'
      // updateCanvas.style.height = (updateCanvas.height).toString() + 'px'
      // updateCanvas.style.position = 'absolute'
      // updateCanvas.style.zIndex = '1000'
      // updateCanvas.style.top = '0'

      // document.body.append(updateCanvas)
      // setTimeout(() => document.body.removeChild(updateCanvas), 15000)

      const { right, left, top, bottom } = await imageShadowUtils.getImgEdgeWidth(updateCanvas)
      const leftShadowThickness = ((updateCanvas.width - drawCanvasW) * 0.5 - left) / drawCanvasW
      const topShadowThickness = ((updateCanvas.height - drawCanvasH) * 0.5 - top) / drawCanvasH
      logUtils.setLog('phase: finish calculate edge')

      const uploadCanvas = document.createElement('canvas')
      uploadCanvas.setAttribute('width', (updateCanvas.width - left - right).toString())
      uploadCanvas.setAttribute('height', (updateCanvas.height - top - bottom).toString())
      const ctxUpload = uploadCanvas.getContext('2d') as CanvasRenderingContext2D
      ctxUpload.drawImage(updateCanvas, left, top, updateCanvas.width - right - left, updateCanvas.height - bottom - top, 0, 0, uploadCanvas.width, uploadCanvas.height)

      logUtils.setLog('phase: start uploading result')
      const uploadImg = [uploadCanvas.toDataURL('image/png;base64', 0.5)]
      uploadUtils.uploadAsset('image', uploadImg, {
        addToPage: false,
        needCompressed: false,
        id: assetId,
        isShadow: true,
        pollingCallback: (json: IUploadAssetResponse) => {
          logUtils.setLog('phase: finish uploading')
          imageShadowUtils.setUploadId({ pageId: '', layerId: '', subLayerId: '' })
          imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
          const srcObj = {
            type: this.isAdmin ? 'public' : 'shadow-private',
            userId: json.data.team_id || '',
            assetId: this.isAdmin ? json.data.id || json.data.asset_index : json.data.asset_index
          }
          console.log(generalUtils.deepCopy(config))
          const _width = config.styles.width / config.styles.scale
          const _height = config.styles.height / config.styles.scale
          const newWidth = (updateCanvas.width - right - left) / drawCanvasW * _width
          const newHeight = (updateCanvas.height - top - bottom) / drawCanvasH * _height

          new Promise<void>((resolve) => {
            if (!this.isAdmin) {
              this.addShadowImg([srcObj.assetId])
                .then(() => resolve())
            } else {
              resolve()
            }
          }).then(() => {
            const newImg = new Image()
            newImg.crossOrigin = 'anonynous'
            newImg.onload = () => {
              const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
              layerUtils.updateLayerProps(pageIndex, layerIndex, { isUploading: false, inProcess: LayerProcessType.none }, subLayerIdx)
              const shadowImgStyles = {
                imgWidth: newWidth,
                imgHeight: newHeight,
                imgX: newWidth * 0.5 - (_width * leftShadowThickness + _width * 0.5),
                imgY: newHeight * 0.5 - (_height * topShadowThickness + _height * 0.5)
              }
              /** update the upload img in shadow module */
              imageShadowUtils.addUploadImg({
                id: uploadAssetId,
                owner: { pageId, layerId, subLayerId },
                srcObj,
                styles: shadowImgStyles
              })
              imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, srcObj)
              imageShadowUtils.updateShadowStyles({ pageIndex, layerIndex, subLayerIdx }, shadowImgStyles)
              logUtils.setLog('phase: finish while process')
              imageShadowUtils.clearLayerData()
            }
            newImg.src = imageUtils.getSrc(srcObj, imageUtils.getSrcSize(srcObj.type, Math.max(newWidth, newHeight)))
          }).catch((e: Error) => {
            console.error(e)
            logUtils.setLog('error' + e.message)
            imageShadowUtils.clearLayerData()
          })
        }
      })
    } else {
      imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
    }
  },
  destroyed() {
    this.$nextTick(() => {
      this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.photoSetting)
    })
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
      if (shadow) {
        return shadow.currentEffect || ShadowEffectType.none
      }
      return ShadowEffectType.none
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
    ...mapActions('shadow', {
      addShadowImg: 'ADD_SHADOW_IMG'
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
      const alreadySetEffect = effectName === ShadowEffectType.none || Object.keys((this.currentStyle.shadow as any).effects[effectName]).length
      imageShadowUtils.setEffect(effectName, {
        ...(!alreadySetEffect && imageShadowUtils.getDefaultEffect(effectName))
      })
      this.focusOnPanel()
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
      this.focusOnPanel()
    },
    handleColorUpdate(color: string): void {
      const { currentEffect } = this
      imageShadowUtils.setEffect(currentEffect, { color })
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
    },
    focusOnPanel() {
      const panel = this.$refs.panel as HTMLElement
      panel.focus()
    },
    setUploadingData(layerIdentifier: ILayerIdentifier, id: string) {
      const { pageId, layerId, subLayerId } = layerIdentifier
      const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId || '')
      console.log(pageIndex, layerIndex, subLayerIdx)
      imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, {
        type: 'upload',
        assetId: id,
        userId: ''
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.photo-effect-setting {
  font-size: 14px;
  outline: none;
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
