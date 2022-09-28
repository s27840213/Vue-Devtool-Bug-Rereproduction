<template lang="pug">
  div(class="panel-text-effect")
    //- To choose effect category: shadow, shape and bg.
    div(v-if="state === 'categories'" class="panel-text-effect__categories flex-evenly")
      div(v-for="category in textEffects"
          class="panel-text-effect__category pointer")
        svg-icon(:iconName="`text-${category.name}-none`"
                iconWidth="60px"
                iconColor="gray-5"
                @click.native="pushHistory(category.name)")
        span(class="body-3") {{category.label}}
    //- To choose effect, ex: hollow, splice or echo.
    div(v-if="state === 'effects'"
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
          svg-icon(iconName="adjust" iconWidth="20px" iconColor="white")
    //- To set effect optoin, ex: distance, color.
    div(v-if="state === 'options'"
        class="w-full panel-text-effect__form")
      span(class="panel-text-effect__name") {{currEffect.label}}
      div(v-for="option in currEffect.options"
          class="panel-text-effect__field")
        //- Option type select
        div(v-if="option.type === 'select'"
            class="panel-text-effect__select")
          div(v-for="sel in option.select"
              :class="{'selected': currentStyle[currCategory.name].endpoint === sel.key }"
              @click="handleSelectInput(option.key, sel.key)")
            svg-icon(:iconName="`${option.key}-${sel.key}`"
              iconWidth="24px")
            span {{sel.label}}
        //- Option type range
        mobile-slider(v-if="option.type === 'range'"
          :title="option.label"
          :name="option.key"
          :value="currentStyle[currCategory.name][option.key]"
          :max="option.max"
          :min="option.min"
          @update="(e)=>handleRangeInput(e, option)")
        //- Option type color
        div(v-if="option.type === 'color'"
          class="panel-text-effect__color")
          div(class="panel-text-effect__color-name") {{option.label}}
          div(class="panel-text-effect__color-slip"
              :style="{ backgroundColor: currentStyle[currCategory.name][option.key] }"
              @click="openColorPanel(option.key)")
      span(class="panel-text-effect__reset label-mid"
          @click="resetTextEffect()") {{$t('NN0754')}}
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import textEffectUtils from '@/utils/textEffectUtils'
import stepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import constantData, { IEffect, IEffectCategory, IEffectOption } from '@/utils/constantData'
import { ITextBgEffect, ITextEffect, ITextShape } from '@/interfaces/format'
import textBgUtils from '@/utils/textBgUtils'
import _ from 'lodash'

export default Vue.extend({
  components: {
    MobileSlider
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  data() {
    return {
      textEffects: constantData.textEffects()
    }
  },
  computed: {
    currCategory(): IEffectCategory {
      return _.find(this.textEffects, ['name', _.nth(this.panelHistory, -1)])
    },
    effectList(): IEffect[] | null {
      if (!this.currCategory) return null
      return _.flatten(this.currCategory.effects2d)
    },
    currEffect(): IEffect | null {
      if (!this.currCategory) return null
      return _.find(this.effectList, ['key',
        this.currentStyle[this.currCategory.name as 'shadow' | 'bg' | 'shape'].name])
    },
    currentStyle(): { shadow: ITextEffect, bg: ITextBgEffect, shape: ITextShape } {
      const { styles } = textEffectUtils.getCurrentLayer()
      return {
        shadow: Object.assign({ name: 'none' }, styles.textEffect as ITextEffect),
        bg: styles.textBg as ITextBgEffect,
        shape: Object.assign({ name: 'none' }, styles.textShape as ITextShape)
      }
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
        this.$emit('openExtraColorModal', ColorEventType.textEffect, MobileColorPanelType.palette)
        textEffectUtils.setColorKey(key)
      } else { // Text BG
        this.$emit('openExtraColorModal', ColorEventType.textBg, MobileColorPanelType.palette)
        textBgUtils.setColorKey(key)
      }
    },
    setEffect(options:{
      effectName?: string,
      effect?: Record<string, string|number|boolean>
    }) {
      let { effectName, effect } = options
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
          if (this.currentStyle.shape.name !== 'none') {
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
    },
    onEffectClick(effectName: string): void {
      if (effectName !== this.currentStyle[this.currCategory.name as 'shadow' | 'bg' | 'shape'].name) {
        this.setEffect({ effectName })
        this.recordChange()
      } else if (effectName !== 'none') {
        this.pushHistory(this.currCategory.name)
      }
    },
    handleSelectInput(key: string, newVal: string) {
      this.setEffect({ effect: { [key]: newVal } })
    },
    handleRangeInput(value: number, option: IEffectOption) {
      const [max, min] = [option.max as number, option.min as number]
      const newVal = {
        [option.key]: value > max ? max : (value < min ? min : value)
      }
      this.setEffect({ effect: newVal })
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
      &.selected {
        margin-top: 0;
        border: 2px solid setColor(blue-1);
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
      &.selected {
        border: 2px solid #4EABE6;
      }
      > svg {
        margin-right: 8px;
      }
    }
  }

  &__color {
    flex: 1;
    display: flex;
    justify-content: space-between;
    padding: 10px;
    align-items: center;
    position: relative;
    color: setColor(gray-3);
    &-slip {
      height: 24px;
      width: 32px;
      box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.2);
    }
  }

  &__reset {
    margin-top: 5px;
    color: setColor(blue-1);
  }
}
</style>
