<template lang="pug">
  div(class="text-effect-setting mt-25")
    //- Tabs to choose effect category: shadow, shape and bg.
    div(class="text-effect-setting-tabs")
      span(v-for="category in textEffects"
          :selected="currTab===category.name"
          @click="switchTab(category.name)") {{category.label}}
    div(class="action-bar")
      template(v-for="effects1d in currCategory.effects2d")
        //- To choose effect, ex: hollow, splice or echo.
        div(class="text-effect-setting__effects mb-10")
          svg-icon(v-for="effect in effects1d"
            :key="`${currCategory.name}-${effect.key}`"
            :iconName="`text-${currCategory.name}-${effect.key}`"
            @click.native="onEffectClick(currCategory.name, effect.key)"
            class="text-effect-setting__effect pointer"
            :class="{'text-effect-setting__effect--selected': currentStyle[currCategory.name].name === effect.key }"
            iconWidth="60px"
            iconColor="white"
            v-hint="effect.label")
        //- Effect option UI.
        div(v-if="getOptions(effects1d) && getOptions(effects1d).length !== 0"
            class="text-effect-setting-options")
          div(v-for="option in getOptions(effects1d)"
              :key="option.key"
              class="text-effect-setting-options__field")
            div(class="text-effect-setting-options__field--name") {{option.label}}
            //- Effect type select
            template(v-if="option.type === 'select'")
              options(class="text-effect-setting-options__field--options"
                      v-model="currentStyle[currCategory.name][option.key]"
                      :options="option.selectOptions")
            template(v-if="option.type === 'range'")
              input(class="text-effect-setting-options__field--number"
                :value="currentStyle[currCategory.name][option.key]"
                :name="option.key"
                :max="option.max"
                :min="option.min"
                @change="(e)=>handleRangeInput(e, currCategory.name, option)"
                @blur="recordChange"
                type="number")
              input(class="text-effect-setting-options__field--range input__slider--range"
                :value="currentStyle[currCategory.name][option.key]"
                :name="option.key"
                :max="option.max"
                :min="option.min"
                @input="(e)=>handleRangeInput(e, currCategory.name, option)"
                @mousedown="handleRangeMousedown(currCategory.name)"
                @mouseup="handleRangeMouseup(currCategory.name)"
                v-ratio-change
                type="range")
            //- Effect type color
            template(v-if="option.type === 'color'")
              div(class="text-effect-setting-options__field--btn"
                :style="{ backgroundColor: currentStyle[currCategory.name][option.key] }"
                @click="handleColorModal(currCategory.name, option.key)")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import textEffectUtils from '@/utils/textEffectUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import textBgUtils from '@/utils/textBgUtils'
import ColorPicker from '@/components/ColorPicker.vue'
import Options from '@/components/global/Options.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType } from '@/store/types'
import stepsUtils from '@/utils/stepsUtils'
import TextPropUtils from '@/utils/textPropUtils'
import constantData, { IEffect, IEffectCategory, IEffectOption } from '@/utils/constantData'
import { ITextBgEffect, ITextEffect, ITextShape } from '@/interfaces/format'
import _ from 'lodash'

export default Vue.extend({
  components: {
    ColorPicker,
    Options
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openColorPicker: false,
      currTab: 'shadow',
      textEffects: constantData.textEffects(),
      colorTarget: {
        category: '',
        key: ''
      }
    }
  },
  computed: {
    currCategory():IEffectCategory {
      return _.find(this.textEffects, ['name', this.currTab])
    },
    currentStyle(): { shadow: ITextEffect, bg: ITextBgEffect, shape: ITextShape } {
      const { styles } = textEffectUtils.getCurrentLayer()
      return {
        shadow: Object.assign({ name: 'none' }, styles.textEffect as ITextEffect),
        bg: styles.textBg as ITextBgEffect,
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
    switchTab(category: string) {
      this.currTab = category
    },
    getOptions(effects1d: IEffect[]) {
      return _.find(effects1d, ['key',
        this.currentStyle[this.currCategory.name as 'shadow'|'bg'|'shape'].name])?.options
    },
    onEffectClick(category: string, effectName: string): void {
      switch (category) {
        case 'shadow':
          textEffectUtils.setTextEffect(effectName, { ver: 'v1' })
          break
        case 'bg':
          textBgUtils.setTextBg(effectName)
          textShapeUtils.setTextShape('none') // Bg & shape are exclusive.
          TextPropUtils.updateTextPropsState()
          break
        case 'shape':
          textShapeUtils.setTextShape(effectName)
          TextPropUtils.updateTextPropsState()
          textBgUtils.setTextBg('none') // Bg & shape are exclusive.
          break
      }
      this.recordChange()
    },
    getEffectName(category: 'shadow' | 'bg' | 'shape') {
      return this.currentStyle[category].name || 'none'
    },
    handleRangeInput(event: Event, category: string, option: IEffectOption) {
      const name = (event.target as HTMLInputElement).name
      const value = parseInt((event.target as HTMLInputElement).value)
      const [max, min] = [option.max as number, option.min as number]
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
  &-tabs {
    @include caption-MD;
    display: grid;
    // grid-template-columns: repeat(3, 1fr);
    grid-template-columns: repeat(2, 1fr);
    column-gap: 2.5px;
    height: 36px;
    > span {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      &[selected] {
        background-color: setColor(gray-6);
      }
    }
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
  &-options {
    display: grid;
    gap: 10px;
    width: 100%;
    padding: 10px;
    background: #fff;
    box-shadow: 0 0 4px rgba(0,0,0,.25);
  }
  &-options__field {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    justify-items: start;
    row-gap: 10px;
    &--options {
      justify-self: end;
      box-sizing: border-box;
      height: 25px;
      padding: 0;
    }
    &--number,
    &--btn {
      justify-self: end;
      box-sizing: border-box;
      width: 30px;
      height: 25px;
      border: 1px solid setColor(gray-4);;
      border-radius: 3px;
    }
    &--range {
      grid-column: 1/3;
    }
  }
}
.action-bar {
  padding: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
