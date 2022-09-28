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
            :style="{ backgroundColor: currentEffect === 'frame' ? currentStyle.shadow.effects.frameColor : currentStyle.shadow.effects.color || '#000000' }"
            @click="handleColorModal")
        div(class="photo-effect-setting__reset")
          button(@click="reset()") {{ 'Reset' }}
</template>

<script lang="ts">
import Vue from 'vue'
import ColorPicker from '@/components/ColorPicker.vue'
import ColorPanel from '@/components/editor/ColorSlips.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType, FunctionPanelType } from '@/store/types'
import imageShadowUtils, { fieldRange, shadowPropI18nMap } from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { IImage, IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import { IShadowEffects, ShadowEffectType } from '@/interfaces/imgShadow'
import { mapActions, mapGetters } from 'vuex'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'

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
    imageShadowPanelUtils.mount()
  },
  beforeDestroy() {
    imageShadowPanelUtils.handleShadowUpload()
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
      if (!alreadySetEffect) {
        const data = imageShadowUtils.getLocalEffectAttrs(effectName) || (imageShadowUtils.getDefaultEffect(effectName) as any)[effectName]
        const color = imageShadowUtils.getLocalEffectColor(effectName) || '#000000'
        if (effectName === ShadowEffectType.frame) {
          imageShadowUtils.setEffect(effectName, { [effectName]: data, frameColor: color })
        } else {
          imageShadowUtils.setEffect(effectName, { [effectName]: data, color })
        }
      } else {
        if (effectName === ShadowEffectType.frame) {
          const color = this.currentStyle.shadow.effects.frameColor || this.currentStyle.shadow.effects.color || '#000000'
          imageShadowUtils.setEffect(effectName, { frameColor: color })
        } else {
          imageShadowUtils.setEffect(effectName, {})
        }
      }
    },
    handleEffectUpdate(event: Event): void {
      const { name, value } = event.target as HTMLInputElement
      imageShadowPanelUtils.handleEffectUpdate(name, value)
    },
    handleColorUpdate(color: string): void {
      const { currentEffect } = this
      imageShadowUtils.setEffect(currentEffect, { color })
    },
    getFieldValue(field: string): number | boolean {
      return (this.currentStyle.shadow.effects as any)[this.currentEffect][field]
    },
    reset(effect?: ShadowEffectType) {
      imageShadowPanelUtils.reset(effect || this.currentEffect)
    },
    setIsUploading(pageId: string, layerId: string, subLayerId: string, isUploading: boolean) {
      const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        isUploading
      }, subLayerIdx)
    },
    // focusOnPanel() {
    //   const panel = this.$refs.panel as HTMLElement
    //   panel.focus()
    // },
    setUploadingData(layerIdentifier: ILayerIdentifier, id: string) {
      const { pageId, layerId, subLayerId } = layerIdentifier
      const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId || '')
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
