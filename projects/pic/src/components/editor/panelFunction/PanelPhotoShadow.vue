<template lang="pug">
div(class="photo-effect-setting" ref="panel" tabindex="0" @keydown.stop)
  div(class="flex-between photo-effect-setting__options mb-10")
    div(v-for="(icon) in shadowOption.slice(0, 3)"
        :key="`shadow-${icon}`"
        class="photo-effect-setting__option pointer"
        :class="{'selected': currentEffect === icon}"
        @click="onEffectClick(icon)")
      svg-icon(v-if="['none'].includes(icon)"
        iconName="no-effect"
        iconWidth="24px"
        iconColor="gray-2"
        v-hint="$t(shadowPropI18nMap[icon]._effectName)")
      img(v-else :src="imgSrc(icon)"
        width="56"
        height="56"
        draggable="false"
        v-hint="$t(shadowPropI18nMap[icon]._effectName)")
  div(v-if="shadowOption.slice(0, 3).includes(currentEffect)"
    :class="['w-full', currentEffect !== 'none' ? 'photo-effect-setting__form' : '']")
    div(v-for="field in shadowFields"
      :key="field")
      div(class="photo-effect-setting__field")
        div(class="photo-effect-setting__field-name") {{$t(shadowPropI18nMap[currentEffect][field])}}
        input(class="photo-effect-setting__value-input body-2 text-gray-2"
          :value="getFieldValue(field)"
          :name="field"
          @input="handleEffectUpdate"
          type="number")
      input(class="photo-effect-setting__range-input input__slider--range"
        v-progress
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
        color-btn(class="photo-effect-setting__color"
                  :color="(currentEffect === 'frame' ? currentStyle.shadow.effects.frameColor : currentStyle.shadow.effects.color) || '#000000'"
                  size="30px" @click="handleColorModal")
      div(class="photo-effect-setting__reset")
        button(@click="reset()") {{ $t('NN0754') }}
  div(class="flex-between photo-effect-setting__options mb-10")
    div(v-for="(icon) in shadowOption.slice(3)"
        :key="`shadow-${icon}`"
        class="photo-effect-setting__option pointer"
        :class="{'selected': currentEffect === icon}"
        @click="onEffectClick(icon)")
      svg-icon(v-if="['none'].includes(icon)"
        iconName="no-effect"
        iconWidth="24px"
        iconColor="gray-2"
        v-hint="$t(shadowPropI18nMap[icon]._effectName)")
      img(v-else :src="imgSrc(icon)"
        width="56"
        height="56"
        draggable="false"
        v-hint="$t(shadowPropI18nMap[icon]._effectName)")
  div(v-if="shadowOption.slice(3).includes(currentEffect)"
    class="w-full photo-effect-setting__form")
    div(v-for="field in shadowFields"
      :key="field")
      div(class="photo-effect-setting__field")
        div(class="photo-effect-setting__field-name") {{$t(shadowPropI18nMap[currentEffect][field])}}
        input(class="photo-effect-setting__value-input body-2 text-gray-2"
          :value="getFieldValue(field)"
          :name="field"
          @input="handleEffectUpdate"
          type="number")
      input(class="photo-effect-setting__range-input input__slider--range"
        v-progress
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
      color-btn(class="photo-effect-setting__color"
                :color="(currentEffect === 'frame' ? currentStyle.shadow.effects.frameColor : currentStyle.shadow.effects.color) || '#000000'"
                size="30px" @click="handleColorModal")
    div(class="photo-effect-setting__reset")
      button(@click="reset()") {{ $t('NN0754') }}
</template>

<script lang="ts">
import ColorBtn from '@nu/vivi-lib/components/global/ColorBtn.vue'
import { ShadowEffectType } from '@nu/vivi-lib/interfaces/imgShadow'
import { IImage, IImageStyle } from '@nu/vivi-lib/interfaces/layer'
import { ColorEventType, FunctionPanelType } from '@nu/vivi-lib/store/types'
import colorUtils from '@nu/vivi-lib/utils/colorUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import imageShadowPanelUtils from '@nu/vivi-lib/utils/imageShadowPanelUtils'
import imageShadowUtils, { fieldRange, shadowPropI18nMap } from '@nu/vivi-lib/utils/imageShadowUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  emits: ['toggleColorPanel'],
  data() {
    return {
      shadowPropI18nMap,
      fieldRange,
      theme: this.$isStk ? 'dark' : 'light'
    }
  },
  components: {
    ColorBtn,
  },
  mounted() {
    imageShadowPanelUtils.mount()
  },
  beforeUnmount() {
    imageShadowPanelUtils.handleShadowUpload()
  },
  unmounted() {
    this.$nextTick(() => {
      this.$store.commit('SET_currFunctionPanelType', FunctionPanelType.photoSetting)
    })
  },
  computed: {
    ...mapGetters({
      currFunctionPanelType: 'getCurrFunctionPanelType'
    }),
    shadowOption(): ShadowEffectType[] {
      return Object.keys(this.effects) as ShadowEffectType[]
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
    handleColorModal() {
      editorUtils.toggleColorSlips(true)
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
    getFieldValue(field: string): number | boolean {
      return (this.currentStyle.shadow.effects as any)[this.currentEffect][field]
    },
    reset(effect?: ShadowEffectType) {
      imageShadowPanelUtils.reset(effect || this.currentEffect)
    },
    imgSrc(icon: string): string {
      return require(`@img/photo-shadow/${this.theme}_icon/photo-shadow-${icon}.png`)
    },
  }
})
</script>

<style lang="scss" scoped>
.photo-effect-setting {
  display: flex;
  align-items: center;
  background-color: setColor(gray-6);
  flex-wrap: wrap;
  justify-content: center;
  font-size: 14px;
  outline: none;

  :deep(.color-btn__color) {
    @include setColors(gray-4, black-5) using ($color) {
      border-color: $color;
    }
  }

  &__form {
    background: #fff;
    margin: 0 10px;
    padding: 10px 8px;
    border-radius: 4px;
    &:last-child {
      margin-bottom: 10px;
    }
  }
  &__name {
    flex: 1;
    padding: 0 12px;
  }
  &__options {
    display: flex;
    width: 212px;
    margin: 10px auto;
  }
  &__option {
    @include size(56px);
    box-sizing: border-box;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    background-color: white;
    background-clip: content-box;
    overflow: hidden;
    > img {
      object-fit: cover;
    }
    &:not(&.selected):hover {
      @include selection-border(2px, blue-hover);
    }
    &.selected {
      @include selection-border(2px);
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
    margin: 12px 0;
    box-sizing: border-box;
  }
  &__value-input {
    border: 1px solid setColor(gray-4);
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
.w-full {
  width: 100%;
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
