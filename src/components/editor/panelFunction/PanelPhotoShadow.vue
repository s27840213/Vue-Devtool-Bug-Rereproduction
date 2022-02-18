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
          v-hint="hintMap[`shadow-${icon}`]"
        )
      div(v-if="shadowOption.slice(0, 3).includes(currentEffect)"
        class="w-full photo-effect-setting__form")
        div(v-for="field in shadowFields"
          :key="field"
          class="photo-effect-setting__field")
          div(class="photo-effect-setting__field-name") {{field}}
          input(class="photo-effect-setting__range-input"
            :value="getFieldValue(field)"
            :max="fieldRange[currentEffect][field].max"
            :min="fieldRange[currentEffect][field].min"
            :name="field"
            @input="handleEffectUpdate"
            @mouseup="recordChange"
            v-ratio-change
            type="range")
          input(class="photo-effect-setting__value-input"
            :value="getFieldValue(field)"
            :name="field"
            @change="handleEffectUpdate"
            @blur="recordChange"
            type="number")
        div(v-if="currentEffect !== 'none'"
          class="photo-effect-setting__field")
          div(class="photo-effect-setting__field-name") {{$t('NN0017')}}
          div(class="photo-effect-setting__value-input"
            :style="{ backgroundColor: currentStyle.shadow.effects.color }"
            @click="handleColorModal")
          color-picker(v-if="openColorPicker"
            class="photo-effect-setting__color-picker"
            v-click-outside="handleColorModal"
            :currentColor="currentStyle.shadow.effects.color"
            @update="handleColorUpdate")
      div(class="flex-between photo-effect-setting__options mb-10")
        svg-icon(v-for="(icon, idx) in shadowOption.slice(3)"
          :key="`shadow-${icon}`"
          :iconName="`photo-shadow-${icon}`"
          @click.native="onEffectClick(icon)"
          class="photo-effect-setting__option pointer"
          :class="{ 'photo-effect-setting__option--selected': currentEffect === icon }"
          iconWidth="60px"
          iconColor="gray-2"
          v-hint="hintMap[`shadow-${icon}`]"
        )
      div(v-if="shadowOption.slice(3).includes(currentEffect)"
        class="w-full photo-effect-setting__form")
        div(v-for="field in shadowFields"
          :key="field"
          class="photo-effect-setting__field")
          div(class="photo-effect-setting__field-name") {{ field }}
          input(class="photo-effect-setting__range-input"
            :value="getFieldValue(field)"
            :max="fieldRange[currentEffect][field].max"
            :min="fieldRange[currentEffect][field].min"
            :name="field"
            @input="handleEffectUpdate"
            @mouseup="recordChange"
            v-ratio-change
            type="range")
          input(class="photo-effect-setting__value-input"
            :value="getFieldValue(field)"
            :name="field"
            @change="handleEffectUpdate"
            @blur="recordChange"
            type="number")
        div(v-if="currentEffect !== 'none'"
          class="photo-effect-setting__field")
          div(class="photo-effect-setting__field-name") {{$t('NN0017')}}
          div(class="photo-effect-setting__value-input"
            :style="{ backgroundColor: currentStyle.shadow.effects.color }"
            @click="handleColorModal")
          color-picker(v-if="openColorPicker"
            class="photo-effect-setting__color-picker"
            v-click-outside="handleColorModal"
            :currentColor="currentStyle.textEffect.color"
            @update="handleColorUpdate")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import imageShadowUtils, { HALO_SPREAD_LIMIT } from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { IImage, IImageStyle } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import { IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'

export default Vue.extend({
  components: {
    ColorPicker
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openModal: false,
      openColorPicker: false,
      effectI18nMap: {
        distance: 'NN0063',
        angle: 'NN0064',
        blur: 'NN0065',
        opacity: 'NN0066',
        color: 'NN0067',
        spread: 'NN0068',
        stroke: 'NN0069',
        shape: 'NN0070',
        bend: 'NN0071'
      },
      hintMap: {
        'shadow-none': `${this.$t('NN0111')}`,
        'shadow-shadow': `${this.$t('NN0112')}`,
        'shadow-lift': `${this.$t('NN0113')}`,
        'shadow-hollow': `${this.$t('NN0114')}`,
        'shadow-splice': `${this.$t('NN0115')}`,
        'shadow-echo': `${this.$t('NN0116')}`,
        'shape-none': `${this.$t('NN0117')}`,
        'shape-curve': `${this.$t('NN0118')}`
      }
    }
  },
  computed: {
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
    },
    fieldRange(): any {
      return {
        shadow: {
          x: { max: 100, min: -100 },
          y: { max: 100, min: -100 },
          radius: { max: 50, min: 0 },
          opacity: { max: 100, min: 0 },
          spread: { max: 50, min: 0 }
        },
        blur: {
          radius: { max: 120, min: 0 },
          spread: { max: 50, min: 0 },
          opacity: { max: 100, min: 0 }
        },
        halo: {
          radius: { max: 120, min: 50 },
          spread: { max: HALO_SPREAD_LIMIT, min: 30 },
          opacity: { max: 100, min: 0 }
        },
        frame: {
          spread: { max: 72, min: 0 },
          opacity: { max: 100, min: 0 },
          radius: { max: 100, min: 0 }
        }
      }
    }
  },
  mounted() {
    colorUtils.on(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
  },
  beforeDestroy() {
    colorUtils.event.off(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
  },
  methods: {
    optionStyle(idx: number) {
      return { 'ml-auto': idx % 3 === 0, 'mx-16': idx % 3 === 1, 'mr-auto': idx % 3 === 2 }
    },
    handleStyleModal() {
      this.openModal = !this.openModal
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
          [currentEffect]: Object.assign(oldEffect, {
            [name]: +value > max ? max : (+value < min ? min : +value)
          })
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
    getFieldValue(field: string): number {
      return (this.currentStyle.shadow.effects as any)[this.currentEffect][field]
    }
  }
})
</script>

<style lang="scss" scoped>
.photo-effect-setting {
  font-size: 14px;
  &__form {
    background: #fff;
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
    flex: 1;
    display: flex;
    padding: 10px;
    align-items: center;
    position: relative;
  }
  &__field-name {
    flex: 1;
    color: #18191f;
    text-align: left;
    text-transform: capitalize;
    white-space: nowrap;
  }
  &__range-input {
    width: 90px;
    appearance: none;
    outline: none;
    background: none;
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
    margin-left: 10px;
    text-align: center;
  }
  &__color-picker {
    position: absolute;
    right: 0px;
    bottom: 0px;
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
