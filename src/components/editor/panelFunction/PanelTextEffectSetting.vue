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
            @click.native="onEffectClick(effect.key)"
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
                      :value="currentStyle[currCategory.name][option.key]"
                      @input="(v)=>handleSelectInput(option.key, v)"
                      :options="option.selectOptions")
            //- Effect type range
            template(v-if="option.type === 'range'")
              input(class="text-effect-setting-options__field--number"
                :value="currentStyle[currCategory.name][option.key]"
                :name="option.key"
                :max="option.max"
                :min="option.min"
                @change="(e)=>handleRangeInput(e, option)"
                @blur="recordChange"
                type="number")
              input(class="text-effect-setting-options__field--range input__slider--range"
                :value="currentStyle[currCategory.name][option.key]"
                :name="option.key"
                :max="option.max"
                :min="option.min"
                @input="(e)=>handleRangeInput(e, option)"
                @mousedown="handleRangeMousedown()"
                @mouseup="handleRangeMouseup()"
                v-ratio-change
                type="range")
            //- Effect type color
            template(v-if="option.type === 'color'")
              div(class="text-effect-setting-options__field--btn"
                :style="{ backgroundColor: currentStyle[currCategory.name][option.key] }"
                @click="handleColorModal(currCategory.name, option.key)")
          div(class="text-effect-setting-options__field")
            span
            span(class="text-effect-setting-options__field--reset"
                @click="resetTextEffect()") Reset
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
import localStorageUtils from '@/utils/localStorageUtils'
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
      currTab: localStorageUtils.get('textEffectSetting', 'tab') as 'shadow'|'bg'|'shape',
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
    switchTab(category: 'shadow'|'bg'|'shape') {
      this.currTab = category
      localStorageUtils.set('textEffectSetting', 'tab', category)
    },
    getOptions(effects1d: IEffect[]) {
      return _.find(effects1d, ['key',
        this.currentStyle[this.currTab].name])?.options
    },
    setEffect(options:{
      effectName?: string,
      effect?: Record<string, string|number|boolean>
    }) {
      let { effectName, effect } = options
      if (!effectName) {
        effectName = this.currentStyle[this.currTab].name || 'none'
      }

      switch (this.currTab) {
        case 'shadow':
          textEffectUtils.setTextEffect(effectName,
            Object.assign({}, effect, { ver: 'v1' }))
          break
        case 'bg':
          textBgUtils.setTextBg(effectName, Object.assign({}, effect))
          if (this.currentStyle.shape.name !== 'none') {
            textShapeUtils.setTextShape('none') // Bg & shape are exclusive.
            TextPropUtils.updateTextPropsState()
          }
          break
        case 'shape':
          textShapeUtils.setTextShape(effectName, Object.assign({}, effect))
          TextPropUtils.updateTextPropsState()
          textBgUtils.setTextBg('none') // Bg & shape are exclusive.
          break
      }
    },
    onEffectClick(effectName: string): void {
      this.setEffect({ effectName })
      this.recordChange()
    },
    resetTextEffect() {
      const target = this.currTab === 'shadow' ? textEffectUtils
        : this.currTab === 'shape' ? textShapeUtils : textBgUtils
      target.resetCurrTextEffect()
    },
    handleSelectInput(key: string, newVal: string) {
      this.setEffect({ effect: { [key]: newVal } })
    },
    handleRangeInput(event: Event, option: IEffectOption) {
      const name = (event.target as HTMLInputElement).name
      const value = parseInt((event.target as HTMLInputElement).value)
      const [max, min] = [option.max as number, option.min as number]
      const newVal = {
        [name]: value > max ? max : (value < min ? min : value)
      }
      this.setEffect({ effect: newVal })
    },
    handleRangeMouseup() {
      if (this.currTab === 'shape') {
        this.setEffect({ effect: { focus: false } })
      }
      this.recordChange()
    },
    handleRangeMousedown() {
      if (this.currTab === 'shape') {
        this.setEffect({ effect: { focus: true } })
      }
    },
    handleColorUpdate(color: string): void {
      const key = this.colorTarget.key
      this.setEffect({ effect: { [key]: color } })
    },
    recordChange() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.text-effect-setting {
  &-tabs {
    @include caption-MD;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    // grid-template-columns: repeat(2, 1fr);
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
    column-gap: 7.5px;
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
    @include body-SM;
    display: grid;
    gap: 10px;
    width: 100%;
    padding: 10px;
    background: #fff;
    box-shadow: 0 0 4px rgba(0,0,0,.25);
  }
  &-options__field {
    display: grid;
    grid-template-columns: auto 1fr;
    justify-items: end;
    row-gap: 10px;
    &--name {
      justify-self: start;
    }
    &--options {
      box-sizing: border-box;
      width: 100px;
      height: 25px;
      padding: 0;
    }
    &--number,
    &--btn {
      box-sizing: border-box;
      width: 30px;
      height: 25px;
      border: 1px solid setColor(gray-4);;
      border-radius: 3px;
    }
    &--range {
      grid-column: 1/3;
    }
    &--reset {
      color: setColor(blue-1);
      cursor: pointer;
    }
  }
}
.action-bar {
  padding: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
