<template lang="pug">
  div(class="panel-text-effect")
    div(v-if="inInitialState" class="panel-text-effect__options flex-evenly")
      div(class="panel-text-effect__option pointer")
        svg-icon(
          :iconName="'text-effect-none'"
          iconWidth="60px"
          iconColor="gray-5"
          @click.native="pushHistory('text-effect')"
        )
        span(class="body-3") {{$t('NN0112')}}
      div(class="panel-text-effect__option pointer")
        svg-icon(
          :iconName="'text-shape-none'"
          iconWidth="60px"
          iconColor="gray-5"
          @click.native="pushHistory('text-shape')"
        )
        span(class="body-3") {{$t('NN0070')}}
    div(v-if="showTextEffect" class="panel-text-effect__options")
      div(v-for="(icon, idx) in shadowOption"
          :key="`shadow-${icon}`"
          class="panel-text-effect__option pointer")
        svg-icon(
          :iconName="`text-effect-${icon}`"
          @click.native="onEffectClick(icon)"
          :class="{ 'panel-text-effect__option--selected': currentEffect === icon }"
          iconWidth="60px"
          iconColor="gray-5")
        span(class="body-3") {{i18nMap[`shadow-${icon}`]}}
    div(v-if="showTextEffect && shadowOption.includes(currentEffect)"
      class="w-full panel-text-effect__form")
      div(v-for="field in shadowFields"
        :key="field"
        class="panel-text-effect__field")
        mobile-slider(
          :title="$t(`${effectI18nMap[field]}`)"
          :name="field"
          :value="currentStyle.textEffect[field]"
          :max="fieldRange[field].max"
          :min="fieldRange[field].min"
          @update="handleEffectUpdate")
    div(v-if="showTextShapeEffect" class="panel-text-effect__options")
      div(v-for="(icon, idx) in shapeOption"
          :key="`shadow-${icon}`"
          class="panel-text-effect__option pointer")
        svg-icon(
          :iconName="`text-shape-${icon}`"
          @click.native="onShapeClick(icon)"
          :class="{ 'panel-text-effect__option--selected': currentShape === icon }"
          iconWidth="60px"
          iconColor="gray-5")
        span(class="body-3") {{i18nMap[`shape-${icon}`]}}
    div(v-if="showTextShapeEffect && shapeOption.includes(currentShape)"
      class="w-full panel-text-effect__form")
      div(v-for="field in shapeFields"
        :key="field"
        class="panel-text-effect__field")
        mobile-slider(
          :title="$t(`${effectI18nMap[field]}`)"
          :name="field"
          :value="currentStyle.textShape[field]"
          :max="fieldRange[field].max"
          :min="fieldRange[field].min"
          @update="handleShapeUpdate")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import textEffectUtils from '@/utils/textEffectUtils'
import stepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'

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
      fieldRange: {
        distance: { max: 100, min: 0 },
        angle: { max: 180, min: -180 },
        blur: { max: 100, min: 0 },
        opacity: { max: 100, min: 0 },
        spread: { max: 100, min: 0 },
        stroke: { max: 100, min: 0 },
        bend: { max: 100, min: -100 }
      },
      effects: {
        none: [],
        shadow: ['distance', 'angle', 'blur', 'opacity', 'color'],
        lift: ['spread'],
        hollow: ['stroke'],
        splice: ['stroke', 'distance', 'angle', 'color'],
        echo: ['distance', 'angle', 'color']
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
      i18nMap: {
        'shadow-none': `${this.$t('NN0111')}`,
        'shadow-shadow': `${this.$t('NN0112')}`,
        'shadow-lift': `${this.$t('NN0113')}`,
        'shadow-hollow': `${this.$t('NN0114')}`,
        'shadow-splice': `${this.$t('NN0115')}`,
        'shadow-echo': `${this.$t('NN0116')}`,
        'shape-none': `${this.$t('NN0117')}`,
        'shape-curve': `${this.$t('NN0118')}`
      },
      shapes: {
        none: [],
        curve: ['bend']
      } as { [key: string]: string[] }
    }
  },
  computed: {
    shadowFields(): string[] {
      const { effects, currentEffect } = this
      return effects[currentEffect].filter(field => field !== 'color')
    },
    shapeFields(): string[] {
      const { shapes, currentShape } = this
      return shapes[currentShape]
    },
    shapeOption(): string[] {
      return Object.keys(this.shapes)
    },
    canChangeColor(): boolean {
      const { effects, currentEffect } = this
      return effects[currentEffect].includes('color')
    },
    historySize(): number {
      return this.panelHistory.length
    },
    inInitialState(): boolean {
      return this.historySize === 0
    },
    showTextEffect(): boolean {
      return !this.inInitialState && this.panelHistory[this.historySize - 1] === 'text-effect'
    },
    showTextShapeEffect(): boolean {
      return !this.inInitialState && this.panelHistory[this.historySize - 1] === 'text-shape'
    },
    shadowOption(): string[] {
      return Object.keys(this.effects)
    },
    currentStyle(): any {
      const { styles } = textEffectUtils.getCurrentLayer()
      return styles || {}
    },
    currentEffect(): string {
      const { textEffect = {} } = this.currentStyle
      return textEffect.name || 'none'
    },
    currentShape(): string {
      const { textShape = {} } = this.currentStyle
      return textShape.name || 'none'
    }
  },
  methods: {
    pushHistory(type: string) {
      this.$emit('pushHistory', type)
    },
    onEffectClick(effectName: string): void {
      textEffectUtils.setTextEffect(effectName, { ver: 'v1' })
      stepsUtils.record()
    },
    handleEffectUpdate(value: number, name: string): void {
      const { currentEffect, fieldRange } = this
      const { max, min } = (fieldRange as any)[name]
      textEffectUtils.setTextEffect(currentEffect, {
        [name]: value > max ? max : (value < min ? min : value)
      })
    },
    recordChange() {
      stepsUtils.record()
    },
    onShapeClick(shapeName: string): void {
      textShapeUtils.setTextShape(shapeName)
      textPropUtils.updateTextPropsState()
      this.recordChange()
    },
    handleShapeStatus(focus: boolean): void {
      const { currentShape } = this
      textShapeUtils.setTextShape(currentShape, { focus })
      !focus && this.recordChange()
    },
    handleShapeUpdate(value: number, name: string): void {
      const { currentShape, fieldRange } = this
      const { max, min } = (fieldRange as any)[name]
      textShapeUtils.setTextShape(currentShape, {
        [name]: value > max ? max : (value < min ? min : value)
      })
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
    align-items: center;
    border-radius: 5px;
    overflow-x: scroll;
    @include no-scrollbar;
    padding-bottom: 20px;
  }

  &__option {
    margin: 0 8px;
    width: 60px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
  }

  &__field {
    > div:nth-child(n) {
      margin-bottom: 20px;
    }
  }
}
</style>
