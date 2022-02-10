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
            :value="currentStyle.shadow[currentEffect][field]"
            :max="fieldRange[field].max"
            :min="fieldRange[field].min"
            :name="field"
            @input="handleEffectUpdate"
            @mouseup="recordChange"
            v-ratio-change
            type="range")
          input(class="photo-effect-setting__value-input"
            :value="currentStyle.shadow[currentEffect][field]"
            :name="field"
            @change="handleEffectUpdate"
            @blur="recordChange"
            type="number")
        div(v-if="canChangeColor"
          class="photo-effect-setting__field")
          div(class="photo-effect-setting__field-name") {{$t('NN0017')}}
          div(class="photo-effect-setting__value-input"
            :style="{ backgroundColor: currentStyle.textEffect.color }"
            @click="handleColorModal")
          color-picker(v-if="openColorPicker"
            class="photo-effect-setting__color-picker"
            v-click-outside="handleColorModal"
            :currentColor="currentStyle.textEffect.color"
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
          div(class="photo-effect-setting__field-name") {{ $t(`${effectI18nMap[field]}`) }}
          input(class="photo-effect-setting__range-input"
            :value="currentStyle.shadow[currentEffect][field]"
            :max="fieldRange[field].max"
            :min="fieldRange[field].min"
            :name="field"
            @input="handleEffectUpdate"
            @mouseup="recordChange"
            v-ratio-change
            type="range")
          input(class="photo-effect-setting__value-input"
            :value="currentStyle.textEffect[field]"
            :name="field"
            @change="handleEffectUpdate"
            @blur="recordChange"
            type="number")
        div(v-if="canChangeColor"
          class="photo-effect-setting__field")
          div(class="photo-effect-setting__field-name") {{$t('NN0017')}}
          div(class="photo-effect-setting__value-input"
            :style="{ backgroundColor: currentStyle.textEffect.color }"
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
import TextEffectUtils from '@/utils/textEffectUtils'
import TextShapeUtils from '@/utils/textShapeUtils'
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import TextPropUtils from '@/utils/textPropUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import generalUtils from '@/utils/generalUtils'
import { IShadowEffect, IShadowProps } from '@/interfaces/imgShadow'

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
      effects: {
        none: [],
        shadow: [...Object.keys(imageShadowUtils.getDefaultEffect('shadow').shadow as IShadowEffect)],
        halo: ['spread'],
        frame: ['stroke'],
        projection: ['stroke', 'distance', 'angle', 'color'],
        blur: ['distance', 'angle', 'color']
      } as { [key: string]: string[] },
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
      shapes: {
        none: [],
        curve: ['bend']
      } as { [key: string]: string[] },
      fieldRange: {
        x: { max: 100, min: 0 },
        y: { max: 100, min: 0 },
        radius: { max: 20, min: 0 },
        distance: { max: 100, min: 0 },
        angle: { max: 180, min: -180 },
        blur: { max: 100, min: 0 },
        opacity: { max: 100, min: 0 },
        spread: { max: 100, min: 0 },
        stroke: { max: 100, min: 0 },
        bend: { max: 100, min: -100 }
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
      return effects[currentEffect].filter(field => field !== 'color')
    },
    canChangeColor(): boolean {
      const { effects, currentEffect } = this
      return effects[currentEffect].includes('color')
    },
    currentStyle(): IImageStyle {
      const { styles } = layerUtils.getCurrConfig as IImage
      return styles || {}
    },
    currentEffect(): string {
      const { shadow = {} } = this.currentStyle as any
      return shadow.currentEffect || 'none'
    }
  },
  mounted() {
    colorUtils.on(ColorEventType.textEffect, (color: string) => this.handleColorUpdate(color))
  },
  beforeDestroy() {
    colorUtils.event.off(ColorEventType.textEffect, (color: string) => this.handleColorUpdate(color))
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
      colorUtils.setCurrEvent(ColorEventType.textEffect)
      // colorUtils.setCurrColor(this.currentStyle.textEffect.color)
    },
    onEffectClick(effectName: string): void {
      const alreadySetEffect = effectName in this.currentStyle.shadow
      imageShadowUtils.setEffect(effectName, {
        ...(!alreadySetEffect && imageShadowUtils.getDefaultEffect(effectName))
      })
      this.recordChange()
    },
    handleEffectUpdate(event: Event): void {
      const { currentEffect, fieldRange } = this
      const { name, value } = event.target as HTMLInputElement
      const { max, min } = (fieldRange as any)[name]
      const oldEffect = generalUtils
        .deepCopy((layerUtils.getCurrConfig as IImage).styles.shadow[currentEffect]) as IShadowProps
      imageShadowUtils.setEffect(currentEffect, {
        [currentEffect]: Object.assign(oldEffect, {
          [name]: +value > max ? max : (+value < min ? min : +value)
        })
      })
    },
    handleColorUpdate(color: string): void {
      const { currentEffect } = this
      TextEffectUtils.setTextEffect(currentEffect, { color })
      this.recordChange()
    },
    recordChange() {
      stepsUtils.record()
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
