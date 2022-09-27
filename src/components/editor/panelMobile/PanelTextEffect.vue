<template lang="pug">
  div(class="panel-text-effect")
    //- To choose effect category: shadow, shape and bg.
    div(v-if="inInitialState" class="panel-text-effect__options flex-evenly")
      div(v-for="category in textEffects"
          class="panel-text-effect__option pointer")
        svg-icon(class="panel-text-effect__option-icon"
                :iconName="`text-${category.name}-none`"
                iconWidth="60px"
                iconColor="gray-5"
                @click.native="pushHistory(category.name)")
        span(class="body-3") {{category.label}}
    //- To choose effect, ex: hollow, splice or echo.
    template(v-else)
      div(class="panel-text-effect__options")
        div(v-for="effect in effectList"
            :key="`${currCategory.name}-${effect.key}`"
            class="panel-text-effect__option pointer")
          svg-icon(:iconName="`text-${currCategory.name}-${effect.key}`"
                  @click.native="onEffectClick(currCategory.name, effect.key)"
                  class="panel-text-effect__option-icon"
                  :class="{ 'panel-text-effect__option-icon--selected': currentStyle[currCategory.name].name === effect.key }"
                  iconWidth="60px"
                  iconColor="gray-5")
          span(class="body-3") {{effect.label}}
      //- Effect option UI.
      div(class="w-full panel-text-effect__form")
        div(v-for="option in currEffect.options"
            class="panel-text-effect__field")
          mobile-slider(v-if="option.type === 'range'"
            :title="option.label"
            :name="option.key"
            :value="currentStyle[currCategory.name][option.key]"
            :max="option.max"
            :min="option.min"
            @update="(e)=>handleRangeInput(e, currCategory.name, option)")
          div(v-if="option.type === 'color'"
            class="panel-text-effect__color")
            div(class="panel-text-effect__color-name") {{option.label}}
            div(class="panel-text-effect__color-slip"
                :style="{ backgroundColor: currentStyle[currCategory.name][option.key] }"
                @click="openColorPanel(option.key)")
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
      return _.find(this.textEffects, ['name', this.panelHistory[this.historySize - 1]])
    },
    effectList(): IEffect[] {
      return _.flatten(this.currCategory.effects2d)
    },
    currEffect(): IEffect {
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
    inInitialState(): boolean {
      return this.historySize === 0
    }
  },
  methods: {
    pushHistory(type: string) {
      this.$emit('pushHistory', type)
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
    onEffectClick(category: string, effectName: string): void {
      switch (category) {
        case 'shadow':
          textEffectUtils.setTextEffect(effectName, { ver: 'v1' })
          break
        case 'bg':
          textBgUtils.setTextBg(effectName)
          textShapeUtils.setTextShape('none') // Bg & shape are exclusive.
          textPropUtils.updateTextPropsState()
          break
        case 'shape':
          textShapeUtils.setTextShape(effectName)
          textPropUtils.updateTextPropsState()
          textBgUtils.setTextBg('none') // Bg & shape are exclusive.
          break
      }
      this.recordChange()
    },
    recordChange() {
      stepsUtils.record()
    },
    getEffectName(category: 'shadow' | 'bg' | 'shape') {
      return this.currentStyle[category].name || 'none'
    },
    handleRangeInput(value: number, category: string, option: IEffectOption) {
      const [max, min] = [option.max as number, option.min as number]
      const newVal = {
        [option.key]: value > max ? max : (value < min ? min : value)
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

  &__options {
    width: 100%;
    display: flex;
    border-radius: 5px;
    overflow-x: scroll;
    @include no-scrollbar;
    padding-top: 2px;
    padding-bottom: 20px;
  }

  &__option {
    margin: 0 8px;
    width: 60px;
    box-sizing: border-box;
  }

  &__option-icon {
    border-radius: 5px;
    border: 2px solid transparent;
    box-sizing: border-box;

    &--selected {
      border-color: setColor(blue-1);
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    padding-bottom: 12px;
  }

  &__field {
    > div:nth-child(n) {
      margin-bottom: 20px;
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
}
</style>
