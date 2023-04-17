<template lang="pug">
div(class="text-effect-setting mt-25")
  //- Tabs to choose effect category: shadow, shape and bg.
  div(class="text-effect-setting-tabs")
    span(v-for="category in textEffects"
      :key="category.name"
      :selected="currTab===category.name"
      @click="switchTab(category.name)") {{category.label}}
  div(class="action-bar")
    template(v-for="effects1d in currCategory.effects2d" :key="effects1d.name")
      //- To choose effect, ex: hollow, splice or echo.
      div(class="text-effect-setting__effects mb-10")
        svg-icon(v-for="effect in effects1d"
          :key="`${currCategory.name}-${effect.key}`"
          :iconName="effectIcon(currCategory, effect)"
          @click="onEffectClick(effect.key)"
          class="text-effect-setting__effect pointer"
          :class="{'selected': currentStyle.name === effect.key }"
          iconWidth="60px"
          iconColor="white"
          v-hint="effect.label")
      //- Effect option UI.
      div(v-if="getOptions(effects1d) && getOptions(effects1d)?.length !== 0"
          class="text-effect-setting-options")
        div(v-for="option in getOptions(effects1d)"
            :key="option.key"
            class="text-effect-setting-options__field")
          div(class="text-effect-setting-options__field--name") {{option.label}}
          //- Option type select
          div(v-if="option.type === 'select'"
              class="text-effect-setting-options__field--select")
            svg-icon(v-for="sel in option.select"
              :key="`${option.key}-${sel.key}`"
              :iconName="`${option.key}-${sel.key}`"
              iconWidth="24px"
              :class="{'selected': currentStyle.endpoint === sel.key }"
              @click="handleSelectInput(option.key, sel.key)")
          //- Option type range
          template(v-if="option.type === 'range'")
            input(class="text-effect-setting-options__field--number"
              :value="getInputValue(currentStyle, option)"
              :name="option.key"
              :max="option.max"
              :min="option.min"
              :step="option.key === 'lineHeight' ? 0.01 : 1"
              @change="(e)=>{handleRangeInput(e, option);recordChange()}"
              type="number")
            input(class="text-effect-setting-options__field--range input__slider--range"
              :value="getInputValue(currentStyle, option)"
              :name="option.key"
              :max="option.max"
              :min="option.min"
              :step="option.key === 'lineHeight' ? 0.01 : 1"
              @input="(e)=>handleRangeInput(e, option)"
              @mousedown="handleRangeMousedown()"
              @mouseup="handleRangeMouseup()"
              v-ratio-change
              type="range")
          //- Option type color
          color-btn(v-if="option.type === 'color'" size="25px"
            :color="colorParser(currentStyle[option.key])"
            :active="option.key === colorTarget && settingTextEffect"
            @click="handleColorModal(currCategory.name, option.key)")
        div(class="text-effect-setting-options__field")
          span
          span(class="text-effect-setting-options__field--reset"
              @click="resetTextEffect()") {{$t('NN0754')}}
</template>

<script lang="ts">
import ColorBtn from '@/components/global/ColorBtn.vue'
import i18n from '@/i18n'
import { ColorEventType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import constantData, { IEffect, IEffectCategory, IEffectOptionRange } from '@/utils/constantData'
import editorUtils from '@/utils/editorUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import stepsUtils from '@/utils/stepsUtils'
import textBgUtils from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import textPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import _ from 'lodash'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'

export default defineComponent({
  components: {
    ColorBtn
  },
  emits: ['toggleColorPanel'],
  data() {
    return {
      currTab: localStorageUtils.get('textEffectSetting', 'tab') as 'shadow'|'bg'|'shape',
      textEffects: constantData.textEffects(),
      colorTarget: ''
    }
  },
  computed: {
    ...mapState('text', {
      selectedTextProps: 'props'
    }),
    currCategory():IEffectCategory {
      return _.find(this.textEffects, ['name', this.currTab]) as IEffectCategory
    },
    currentStyle(): Record<string, string> {
      const { styles } = textEffectUtils.getCurrentLayer()
      return {
        shadow: styles.textEffect,
        bg: styles.textBg,
        shape: styles.textShape
      }[this.currTab] as Record<string, string>
    },
    settingTextEffect(): boolean {
      return colorUtils.currEvent === 'setTextEffectColor' &&
        editorUtils.showColorSlips
    }
  },
  mounted() {
    colorUtils.on(ColorEventType.textEffect, (color: string) => this.handleColorUpdate(color))
    colorUtils.onStop(ColorEventType.textEffect, this.recordChange)
  },
  beforeUnmount() {
    colorUtils.event.off(ColorEventType.textEffect, (color: string) => this.handleColorUpdate(color))
    colorUtils.offStop(ColorEventType.textEffect, this.recordChange)
  },
  methods: {
    effectIcon(category: IEffectCategory, effect: IEffect): string {
      const postfix = effect.key === 'text-book' ? `-${i18n.global.locale}` : ''
      return `text-${category.name}-${effect.key}${postfix}`
    },
    handleColorModal(category: 'shadow'|'bg'|'shape', key: string) {
      const currColor = this.colorParser(this.currentStyle[key])

      this.colorTarget = key
      editorUtils.toggleColorSlips(true)
      colorUtils.setCurrEvent(ColorEventType.textEffect)
      colorUtils.setCurrColor(currColor)
    },
    switchTab(category: 'shadow'|'bg'|'shape') {
      this.currTab = category
      localStorageUtils.set('textEffectSetting', 'tab', category)
    },
    getOptions(effects1d: IEffect[]) {
      return _.find(effects1d, ['key', this.currentStyle.name])?.options
    },
    getInputValue(style: Record<string, string>, option: IEffectOptionRange) {
      if (['lineHeight', 'fontSpacing'].includes(option.key)) {
        return this.selectedTextProps[option.key]
      } else {
        return style[option.key]
      }
    },
    async setEffect(options:{
      effectName?: string,
      effect?: Record<string, string|number|boolean>
    }) {
      let { effectName, effect } = options
      const { textShape } = textEffectUtils.getCurrentLayer().styles
      if (!effectName) {
        effectName = this.currentStyle.name || 'none'
      }

      switch (this.currTab) {
        case 'shadow':
          textEffectUtils.setTextEffect(effectName,
            Object.assign({}, effect, { ver: 'v1' }))
          break
        case 'bg':
          await textBgUtils.setTextBg(effectName, Object.assign({}, effect))
          if (textShape.name !== 'none') {
            textShapeUtils.setTextShape('none') // Bg & shape are exclusive.
            textPropUtils.updateTextPropsState()
          }
          break
        case 'shape':
          textShapeUtils.setTextShape(effectName, Object.assign({}, effect))
          textPropUtils.updateTextPropsState()
          await textBgUtils.setTextBg('none') // Bg & shape are exclusive.
          break
      }
    },
    async onEffectClick(effectName: string): Promise<void> {
      await this.setEffect({ effectName })
      this.recordChange()
    },
    resetTextEffect() {
      const target = this.currTab === 'shadow' ? textEffectUtils
        : this.currTab === 'shape' ? textShapeUtils : textBgUtils
      target.resetCurrTextEffect()
      this.recordChange()
    },
    async handleSelectInput(key: string, newVal: string) {
      await this.setEffect({ effect: { [key]: newVal } })
      this.recordChange()
    },
    handleRangeInput(event: Event, option: IEffectOptionRange) {
      const name = (event.target as HTMLInputElement).name
      const value = parseFloat((event.target as HTMLInputElement).value)
      const newVal = {
        [name]: _.clamp(value, option.min, option.max)
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
      this.setEffect({ effect: { [this.colorTarget]: color } })
    },
    colorParser(color: string) {
      return textEffectUtils.colorParser(color, textEffectUtils.getCurrentLayer())
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
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    column-gap: 2.5px;
    height: 36px;
    > span {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      &[selected=true] {
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
    &:not(.selected):hover {
      border-color: setColor(blue-1, 0.5);
    }
    &.selected {
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
    &--number {
      box-sizing: border-box;
      width: 35px;
      height: 25px;
      border: 1px solid setColor(gray-4);;
      border-radius: 3px;
    }
    &--select {
      svg + svg {
        margin-left: 8px
      }
      &>svg.selected {
        box-sizing: border-box;
        border: 1px solid setColor(blue-1);;
      }
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
