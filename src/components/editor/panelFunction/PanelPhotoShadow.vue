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
        div(v-if="!['none', 'halo'].includes(currentEffect)"
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
import { ColorEventType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import imageShadowUtils, { CANVAS_SCALE, fieldRange, shadowPropI18nMap } from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import { IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { mapActions, mapGetters } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'
import { IUploadAssetResponse } from '@/interfaces/upload'
import pageUtils from '@/utils/pageUtils'
import imageUtils from '@/utils/imageUtils'

export default Vue.extend({
  components: {
    ColorPicker,
    ColorPanel
  },
  data() {
    return {
      shadowPropI18nMap,
      fieldRange,
      update: undefined as number | undefined
    }
  },
  mounted() {
    colorUtils.on(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
  },
  async beforeDestroy() {
    colorUtils.event.off(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    const layerData = imageShadowUtils.layerData
    if (layerData) {
      const { config, img } = layerData
      const { width, height, imgWidth, imgHeight } = config.styles
      const updateCanvas = document.createElement('canvas')
      const pageId = layerUtils.getPage(layerUtils.pageIndex).id
      updateCanvas.setAttribute('width', (width * CANVAS_SCALE).toString())
      updateCanvas.setAttribute('height', (height * CANVAS_SCALE).toString())
      await imageShadowUtils.draw(updateCanvas, img, config, height, 0)

      const { right, left, top, bottom } = imageShadowUtils.getImgEdgeWidth(updateCanvas)
      const imgHeightInCanvas = height
      const imgWidthInCanvas = width
      const leftShadowThickness = (updateCanvas.width - imgWidthInCanvas) * 0.5 - left
      const topShadowThickness = (updateCanvas.height - imgHeightInCanvas) * 0.5 - top
      const newWidth = updateCanvas.width - right - left
      const newHeight = updateCanvas.height - top - bottom

      const uploadCanvas = document.createElement('canvas')
      uploadCanvas.setAttribute('width', (updateCanvas.width - left - right).toString())
      uploadCanvas.setAttribute('height', (updateCanvas.height - top - bottom).toString())
      const ctx = uploadCanvas.getContext('2d') as CanvasRenderingContext2D

      const drawnImg = new Image()
      drawnImg.src = updateCanvas.toDataURL('image/png;base64', 1)
      await new Promise<void>((resolve) => {
        drawnImg.onload = () => {
          ctx.drawImage(drawnImg, left, top, updateCanvas.width - right - left, updateCanvas.height - bottom - top, 0, 0, uploadCanvas.width, uploadCanvas.height)
          resolve()
        }
      })

      // uploadUtils.uploadAsset('image', [uploadCanvas.toDataURL('image/png;base64', 1)], false, (json: IUploadAssetResponse) => {
      //   const srcObj = {
      //     type: this.isAdmin ? 'public' : 'private',
      //     userId: json.data.team_id,
      //     assetId: this.isAdmin ? json.data.id : json.data.asset_index
      //   }
      //   const pageIndex = pageUtils.getPageIndexById(pageId)
      //   const layerIndex = layerUtils.getLayerIndexById(pageIndex, config.id || '')
      //   if (pageIndex !== -1 && layerIndex !== -1) {
      //     layerUtils.updateLayerProps(pageIndex, layerIndex, { srcObj })
      //     layerUtils.updateLayerStyles(pageIndex, layerIndex, {
      //       width: newWidth,
      //       height: newHeight,
      //       imgWidth: newWidth,
      //       imgHeight: newHeight,
      //       initWidth: newWidth,
      //       initHeight: newHeight,
      //       imgX: 0,
      //       imgY: 0,
      //       x: config.styles.x - leftShadowThickness,
      //       y: config.styles.y - topShadowThickness,
      //       scale: 1
      //     })
      //     this.resetAllShadowProps(pageIndex, layerIndex)
      //   }
      // })
      imageShadowUtils.clearLayerData()
    }
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
        halo: imageShadowUtils.getKeysOf(ShadowEffectType.halo),
        frame: imageShadowUtils.getKeysOf(ShadowEffectType.frame),
        projection: imageShadowUtils.getKeysOf(ShadowEffectType.projection)
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
      const alreadySetEffect = effectName in this.currentStyle.shadow.effects
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
      this.recordChange()
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
