<template lang="pug">
  div(class="text-effect-setting mt-25")
    div(class="action-bar")
      template(v-for="category in textEffects")
        div(class="w-full text-left mt-10 text-blue-1 text-effect-setting__title") {{category.label}}
        template(v-for="effects1d in category.effects2d")
          div(class="text-effect-setting__effects mb-10")
            svg-icon(v-for="effect in effects1d"
              :key="`${category.name}-${effect.key}`"
              :iconName="`text-${category.name}-${effect.key}`"
              @click.native="onEffectClick(category.name, effect.key)"
              class="text-effect-setting__effect pointer"
              :class="{'text-effect-setting__effect--selected': currentStyle[category.name].name === effect.key }"
              iconWidth="60px"
              iconColor="white"
              v-hint="effect.label")
          template(v-for="effect in effects1d")
            div(v-if="effect.key === currentStyle[category.name].name"
                v-for="option in effect.options"
                class="w-full text-effect-setting__form")
              div(v-if="option.type === 'range'"
                  :key="option.key"
                  class="text-effect-setting__field")
                div(class="text-effect-setting__field-name") {{option.label}}
                input(class="text-effect-setting__range-input input__slider--range"
                  :value="currentStyle[category.name][option.key]"
                  @input="(e)=>handleRangeInput(e, category.name, option)"
                  :max="option.max"
                  :min="option.min"
                  :name="option.key"
                  @mousedown="handleRangeMousedown(category.name)"
                  @mouseup="handleRangeMouseup(category.name)"
                  v-ratio-change
                  type="range")
                input(class="text-effect-setting__value-input"
                  :value="currentStyle[category.name][option.key]"
                  @change="(e)=>handleRangeInput(e, category.name, option)"
                  :max="option.max"
                  :min="option.min"
                  :name="option.key"
                  @blur="recordChange"
                  type="number")
              div(v-if="option.type === 'color'"
                  class="text-effect-setting__field")
                div(class="text-effect-setting__field-name") {{option.label}}
                div(class="text-effect-setting__value-input"
                  :style="{ backgroundColor: currentStyle[category.name][option.key] }"
                  @click="handleColorModal(category.name, option.key)")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import textEffectUtils from '@/utils/textEffectUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import textBgUtils from '@/utils/textBgUtils'
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import TextPropUtils from '@/utils/textPropUtils'
import constantData from '@/utils/constantData'
import { ITextBox, ITextEffect, ITextShape, ITextUnderline } from '@/interfaces/format'

export default Vue.extend({
  components: {
    ColorPicker
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openColorPicker: false,
      textEffects: constantData.textEffects(),
      colorTarget: {
        category: '',
        key: ''
      }
    }
  },
  computed: {
    currentStyle(): { shadow: ITextEffect, bg: ITextBox|ITextUnderline, shape: ITextShape } {
      const { styles } = textEffectUtils.getCurrentLayer()
      return {
        shadow: Object.assign({ name: 'none' }, styles.textEffect as ITextEffect),
        bg: styles.textBg as ITextBox | ITextUnderline,
        shape: Object.assign({ name: 'none' }, styles.textShape as ITextShape)
      }
    }
  },
  mounted() {
    colorUtils.on(ColorEventType.textEffect, (color: string) => this.handleColorUpdate(color))
    colorUtils.onStop(ColorEventType.textEffect, this.recordChange)
  },
  beforeDestroy() {
    colorUtils.event.off(ColorEventType.textEffect, (color: string) => this.handleColorUpdate(color))
    colorUtils.offStop(ColorEventType.textEffect, this.recordChange)
  },
  methods: {
    handleColorModal(category: string, key: string) {
      this.colorTarget = { category, key }
      this.$emit('toggleColorPanel', true)
      colorUtils.setCurrEvent(ColorEventType.textEffect)
      colorUtils.setCurrColor(this.currentStyle.shadow.color as string)
    },
    onEffectClick(category: string, effectName: string): void {
      switch (category) {
        case 'shadow':
          textEffectUtils.setTextEffect(effectName, { ver: 'v1' })
          break
        case 'bg':
          textBgUtils.setTextBg(effectName)
          break
        case 'shape':
          textShapeUtils.setTextShape(effectName)
          TextPropUtils.updateTextPropsState()
          break
      }
      this.recordChange()
    },
    getEffectName(category: 'shadow' | 'bg' | 'shape') {
      return this.currentStyle[category].name || 'none'
    },
    handleRangeInput(event: Event, category: string, opiton: ReturnType<typeof constantData.textEffects>[0]['effects2d'][0][0]['options'][0]) {
      const name = (event.target as HTMLInputElement).name
      const value = parseInt((event.target as HTMLInputElement).value)
      const [max, min] = [opiton.max as number, opiton.min as number]
      const newVal = {
        [name]: value > max ? max : (value < min ? min : value)
      }

      switch (category) {
        case 'shadow':
          textEffectUtils.setTextEffect(this.getEffectName('shadow'), newVal)
          break
        case 'bg':
          textBgUtils.setTextBg(this.getEffectName('bg'), newVal)
          break
        case 'shape':
          textShapeUtils.setTextShape(this.getEffectName('shape'), newVal)
          break
      }
    },
    handleRangeMouseup(category: string) {
      if (category === 'shape') {
        textShapeUtils.setTextShape(this.getEffectName('shape'), { focus: false })
      }
      this.recordChange()
    },
    handleRangeMousedown(category: string) {
      if (category === 'shape') {
        textShapeUtils.setTextShape(this.getEffectName('shape'), { focus: true })
      }
    },
    handleColorUpdate(color: string): void {
      const key = this.colorTarget.key
      switch (this.colorTarget.category) {
        case 'shadow':
          textEffectUtils.setTextEffect(this.getEffectName('shadow'), { [key]: color })
          break
        case 'bg':
          textBgUtils.setTextBg(this.getEffectName('bg'), { [key]: color })
          break
      }
    },
    recordChange() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.text-effect-setting {
  font-size: 14px;
  &__title {
    font-size: 16px;
    font-weight: bold;
  }
  &__form {
    background: #fff;
  }
  &__effects {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 16px;
    width: 212px;
  }
  &__effect {
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
    margin: 0;
    &::-webkit-slider-thumb {
      width: 12px;
      height: 12px;
      border: 2px solid setColor(blue-1);
      margin-top: -5px;
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
}
.action-bar {
  padding: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.w-full {
  @include size(100%, 100%);
}
</style>
