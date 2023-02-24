<template lang="pug">
div(class="panel-text-effect")
  //- To choose effect category: shadow, shape and bg.
  div(v-if="state === 'categories'" class="panel-text-effect__categories flex-evenly")
    div(v-for="category in textEffects"
        class="panel-text-effect__category pointer")
      svg-icon(:iconName="`text-${category.name}-none`"
              iconWidth="60px"
              iconColor="gray-5"
              @click="pushHistory(category.name)")
      span(class="body-3") {{category.label}}
  //- To choose effect, ex: hollow, splice or echo.
  div(v-if="state === 'effects' && currEffect !== null"
      class="panel-text-effect__effects")
    div(v-for="effect in effectList"
        :key="`${currCategory.name}-${effect.key}`"
        :class="{ 'selected': currEffect.key === effect.key }"
        @click="onEffectClick(effect.key)")
      svg-icon(:iconName="`text-${currCategory.name}-${effect.key}`"
              class="panel-text-effect__effects--icon"
              iconWidth="100%" iconColor="gray-5")
      div(v-if="currEffect.key === effect.key && effect.key !== 'none'"
          class="panel-text-effect__effects--more")
        svg-icon(iconName="sliders" iconWidth="20px" iconColor="white")
  //- To set effect optoin, ex: distance, color.
  div(v-if="state === 'options' && currEffect !== null"
      class="w-full panel-text-effect__form")
    span(class="panel-text-effect__name") {{currEffect.label}}
    div(v-for="option in currEffect.options"
        class="panel-text-effect__field")
      //- Option type select
      div(v-if="option.type === 'select'"
          class="panel-text-effect__select")
        div(v-for="sel in option.select"
            :class="{'selected': currentStyle.endpoint === sel.key }"
            @click="handleSelectInput(option.key, sel.key)")
          svg-icon(:iconName="`${option.key}-${sel.key}`"
            iconWidth="24px")
          span {{sel.label}}
      //- Option type range
      mobile-slider(v-if="option.type === 'range'"
        :borderTouchArea="true"
        :title="option.label"
        :name="option.key"
        :value="currentStyle[option.key]"
        :max="option.max ?? 100"
        :min="option.min ?? 0"
        @update="(e)=>handleRangeInput(e, option)"
        @pointerdown="shapeFocus(true)"
        @pointerup="shapeFocus(false)")
      //- Option type color
      div(v-if="option.type === 'color'"
        class="panel-text-effect__color")
        div {{option.label}}
        color-btn(:color="colorParser(currentStyle[option.key])"
                size="24px" @click="openColorPanel(option.key)")
    span(class="panel-text-effect__reset label-mid"
        @click="resetTextEffect()") {{$t('NN0754')}}
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import textEffectUtils from '@/utils/textEffectUtils'
import stepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import constantData, { IEffect, IEffectCategory, IEffectOption } from '@/utils/constantData'
import textBgUtils from '@/utils/textBgUtils'
import colorUtils from '@/utils/colorUtils'
import _ from 'lodash'

export default defineComponent({
  components: {
    MobileSlider,
    ColorBtn
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    }
  },
  emits: ['pushHistory', 'openExtraColorModal'],
  data() {
    return {
      textEffects: constantData.textEffects()
    }
  },
  computed: {
    currCategory(): IEffectCategory {
      return _.find(this.textEffects, ['name', _.nth(this.panelHistory, -1)]) as IEffectCategory
    },
    effectList(): IEffect[] | null {
      if (!this.currCategory) return null
      return _.flatten(this.currCategory.effects2d)
    },
    currEffect(): IEffect | null {
      if (!this.currCategory) return null
      return _.find(this.effectList, ['key',
        this.currentStyle.name]) as IEffect
    },
    currentStyle(): Record<string, string> {
      const { styles } = textEffectUtils.getCurrentLayer()
      if (!this.currCategory) return { name: 'none' }
      return {
        shadow: Object.assign({ name: 'none' }, styles?.textEffect),
        bg: styles.textBg,
        shape: Object.assign({ name: 'none' }, styles.textShape)
      }[this.currCategory.name] as Record<string, string>
    },
    historySize(): number {
      return this.panelHistory.length
    },
    state(): string {
      return this.historySize === 0 ? 'categories'
        : this.historySize === 1 ? 'effects'
          : 'options'
    }
  },
  methods: {
    pushHistory(type: string) {
      this.$emit('pushHistory', type)
    },
    recordChange() {
      stepsUtils.record()
    },
    openColorPanel(key: string) {
      if (this.currCategory.name === 'shadow') {
        colorUtils.setCurrEvent(ColorEventType.textEffect)
        this.$emit('openExtraColorModal', ColorEventType.textEffect, MobileColorPanelType.palette)
        textEffectUtils.setColorKey(key)
      } else { // Text BG
        colorUtils.setCurrEvent(ColorEventType.textBg)
        this.$emit('openExtraColorModal', ColorEventType.textBg, MobileColorPanelType.palette)
        textBgUtils.setColorKey(key)
      }
    },
    setEffect(options:{
      effectName?: string,
      effect?: Record<string, string|number|boolean>
    }) {
      let { effectName, effect } = options
      const { textShape } = textEffectUtils.getCurrentLayer().styles
      if (!effectName) {
        effectName = this.currEffect?.key || 'none'
      }

      switch (this.currCategory.name) {
        case 'shadow':
          textEffectUtils.setTextEffect(effectName,
            Object.assign({}, effect, { ver: 'v1' }))
          break
        case 'bg':
          textBgUtils.setTextBg(effectName, Object.assign({}, effect))
          if (textShape.name !== 'none') {
            textShapeUtils.setTextShape('none') // Bg & shape are exclusive.
            textPropUtils.updateTextPropsState()
          }
          break
        case 'shape':
          textShapeUtils.setTextShape(effectName, Object.assign({}, effect))
          textPropUtils.updateTextPropsState()
          textBgUtils.setTextBg('none') // Bg & shape are exclusive.
          break
      }
    },
    resetTextEffect() {
      const target = this.currCategory.name === 'shadow' ? textEffectUtils
        : this.currCategory.name === 'shape' ? textShapeUtils : textBgUtils
      target.resetCurrTextEffect()
      this.recordChange()
    },
    onEffectClick(effectName: string): void {
      if (effectName !== this.currentStyle.name) {
        this.setEffect({ effectName })
        this.recordChange()
      } else if (effectName !== 'none') {
        this.pushHistory(this.currCategory.name)
      }
    },
    handleSelectInput(key: string, newVal: string) {
      this.setEffect({ effect: { [key]: newVal } })
      this.recordChange()
    },
    handleRangeInput(value: number, option: IEffectOption) {
      const [max, min] = [option.max as number, option.min as number]
      const newVal = {
        [option.key]: value > max ? max : (value < min ? min : value)
      }
      this.setEffect({ effect: newVal })
    },
    shapeFocus(focus: boolean) {
      if (this.currCategory.name === 'shape') {
        this.setEffect({ effect: { focus } })
      }
    },
    colorParser(color: string) {
      return textEffectUtils.colorParser(color, textEffectUtils.getCurrentLayer())
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-text-effect {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: 1fr;

  &__categories {
    @include no-scrollbar;
    width: 100%;
    display: flex;
    border-radius: 5px;
    overflow-x: scroll;
    padding-top: 2px;
    padding-bottom: 20px;
  }

  &__category {
    margin: 0 8px;
    width: 60px;
    box-sizing: border-box;
  }

  &__effects {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    column-gap: 16px;
    > div {
      display: flex;
      position: relative;
      margin: 2px auto 16px auto;
      width: 56px;
      height: 56px;
      border-radius: 5px;
      border: 2px solid transparent;
      &.selected {
        border-color: setColor(black-5);
      }
    }
    &--more {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(71, 74, 87, 0.6);
      backdrop-filter: blur(2px);
    }
  }

  &__name {
    margin-bottom: 20px;
  }

  &__form {
    @include no-scrollbar;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    padding-bottom: 12px;
  }

  &__select {
    display: grid;
    grid-auto-flow: column;
    grid-gap: 18px;
    padding: 10px;
    > div {
      @include btn-SM;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      height: 42px;
      border-radius: 5px;
      color: setColor(gray-2);
      background-color: setColor(gray-5);
      border: 2px solid transparent;
      &.selected {
        border-color: setColor(black-5);
      }
      > svg {
        margin-right: 8px;
      }
    }
  }

  &__color {
    @include body-SM;
    flex: 1;
    display: flex;
    justify-content: space-between;
    padding: 4px 10px;
    align-items: center;
    position: relative;
    color: setColor(gray-3);
  }

  &__reset {
    margin-top: 10px;
    color: setColor(black-3);
  }
}
</style>
