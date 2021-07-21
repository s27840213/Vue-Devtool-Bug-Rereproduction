<template lang="pug">
  div(class="text-effect-setting")
    action-bar(class="flex-between pointer"
      @click.native="handleStyleModal")
      svg-icon(:iconName="`text-effect-${currentEffect}`"
        iconWidth="44px"
        iconColor="gray-2")
      span(class="text-effect-setting__name text-left") Text Effect
      svg-icon(iconName="caret-down"
        iconWidth="10px"
        iconColor="gray-2")
    action-bar(v-if="openModal"
      class="flex-between"
      v-click-outside="handleStyleModal")
      div(class="w-full text-left") Style
      svg-icon(v-for="icon in shadowOption"
        :key="icon"
        :iconName="`text-effect-${icon}`"
        @click.native="onEffectClick(icon)"
        class="text-effect-setting__option pointer"
        iconWidth="80px"
        iconColor="gray-2")
      div(class="w-full text-left") Shape
      svg-icon(class="text-effect-setting__option pointer"
        iconName="text-effect-shape"
        @click.native="onEffectClick('shape')"
        class="text-effect-setting__option pointer"
        iconWidth="80px"
        iconColor="gray-2")
    action-bar(v-show="fields.length && !openModal"
      class="flex-between")
      div(v-for="field in fields"
        :key="field"
        class="text-effect-setting__field")
        div(class="text-effect-setting__field-name") {{ field }}
        input(class="text-effect-setting__range-input"
          :value="currentLayer[field]"
          :max="fieldRange[field].max"
          :min="fieldRange[field].min"
          :name="field"
          @input="handleEffectUpdate"
          type="range")
        input(class="text-effect-setting__value-input"
          :value="currentLayer[field]"
          :name="field"
          @change="handleEffectUpdate"
          type="number")
      div(v-if="canChangeColor"
        class="text-effect-setting__field")
        div(class="text-effect-setting__field-name") Color
        div(class="text-effect-setting__value-input"
          :style="{ backgroundColor: currentLayer.color }"
          @click="handleColorModal")
        color-picker(v-if="openColorPicker"
          class="text-effect-setting__color-picker"
          v-click-outside="handleColorModal"
          :currentColor="currentLayer.color"
          @update="handleColorUpdate")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import vClickOutside from 'v-click-outside'
import TextEffectUtils from '@/utils/textEffectUtils'
import ColorPicker from '@/components/ColorPicker.vue'

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
      styles: {
        none: [],
        shadow: ['distance', 'angle', 'blur', 'opacity', 'color'],
        lift: ['spread'],
        hollow: ['stroke'],
        splice: ['stroke', 'distance', 'angle', 'color'],
        echo: ['distance', 'angle', 'color'],
        shape: ['bend']
      } as { [key: string]: string[] },
      fieldRange: {
        distance: { max: 100, min: 0 },
        angle: { max: 180, min: -180 },
        blur: { max: 100, min: 0 },
        opacity: { max: 100, min: 0 },
        spread: { max: 100, min: 0 },
        stroke: { max: 100, min: 0 },
        bend: { max: 100, min: -100 }
      }
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    shadowOption (): string[] {
      return Object.keys(this.styles).filter(style => style !== 'shape')
    },
    fields (): string[] {
      const { styles, currentEffect } = this
      return styles[currentEffect].filter(field => field !== 'color')
    },
    canChangeColor (): boolean {
      const { styles, currentEffect } = this
      return styles[currentEffect].includes('color')
    },
    currentLayer (): any {
      const { styles } = this.getLayer(this.lastSelectedPageIndex, this.currSelectedIndex)
      return styles.textEffect || {}
    },
    currentEffect (): string {
      return this.currentLayer.name || 'none'
    }
  },
  methods: {
    handleStyleModal () {
      this.openModal = !this.openModal
    },
    handleColorModal () {
      this.openColorPicker = !this.openColorPicker
    },
    onEffectClick(effectName: string): void {
      this.openModal = false
      TextEffectUtils.setTextEffect(effectName)
    },
    handleEffectUpdate (event: Event): void {
      const { currentEffect, fieldRange } = this
      const { name, value } = event.target as HTMLInputElement
      const { max, min } = (fieldRange as any)[name]
      window.requestAnimationFrame(() => {
        TextEffectUtils.setTextEffect(currentEffect, {
          [name]: value > max ? max : (value < min ? min : value)
        })
      })
    },
    handleColorUpdate (color: string): void {
      const { currentEffect } = this
      window.requestAnimationFrame(() => {
        TextEffectUtils.setTextEffect(currentEffect, { color })
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.text-effect-setting {
  font-size: 14px;
  &__name {
    flex: 1;
    padding: 0 12px;
  }
  &__option {
    box-sizing: border-box;
    margin-top: 10px;
    border-radius: 3px;
    border: 2px solid transparent;
    &:hover {
      border-color: #3C64B1;
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
    color: #18191F;
    text-align: left;
    text-transform: capitalize;
  }
  &__range-input {
    width: 120px;
    appearance: none;
    outline: none;
    background: none;
    &::-webkit-slider-runnable-track {
      height: 2px;
      background-color: #D9DBE1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid #3C64B1;
      transition: .2s;
      margin-top: -5px;
      position: relative;
    }
  }
  &__value-input {
    border: 1px solid #D9DBE1;
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
  padding: 10px 15px;
  flex-wrap: wrap;
}
.w-full {
  @include size(100%, 100%);
}
</style>
