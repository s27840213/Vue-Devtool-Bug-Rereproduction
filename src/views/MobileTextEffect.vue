<template lang="pug">
  div(class="mobile-text-effect")
    div(class="page relative")
      nu-layer(class="nu-layer--p0"
        :data-index="0"
        :data-pindex="0"
        :layerIndex="0"
        :pageIndex="0"
        :config="config")
    div(class="text-effect-setting mt-25")
      div(class="action-bar")
        div(class="flex-between text-effect-setting__options mb-10")
          svg-icon(v-for="(icon, idx) in shadowOption.slice(0, 3)"
            :key="`shadow-${icon}`"
            :iconName="`text-effect-${icon}`"
            @click.native="onEffectClick(icon)"
            class="text-effect-setting__option pointer"
            :class="{ 'text-effect-setting__option--selected': currentEffect === icon }"
            iconWidth="60px"
            iconColor="gray-2"
            v-hint="hintMap[`shadow-${icon}`]"
          )
        div(v-if="shadowOption.slice(0, 3).includes(currentEffect)"
          class="w-full text-effect-setting__form")
          div(v-for="field in shadowFields"
            :key="field"
            class="text-effect-setting__field")
            div(class="text-effect-setting__field-name") {{$t(`${effectI18nMap[field]}`)}}
            input(class="text-effect-setting__range-input input__slider--range"
              :value="currentStyle.textEffect[field]"
              :max="fieldRange[field].max"
              :min="fieldRange[field].min"
              :name="field"
              @input="handleEffectUpdate"
              v-ratio-change
              type="range")
            input(class="text-effect-setting__value-input"
              :value="currentStyle.textEffect[field]"
              :name="field"
              @change="handleEffectUpdate"
              type="number")
          div(v-if="canChangeColor"
            class="text-effect-setting__field")
            div(class="text-effect-setting__field-name") {{$t('NN0017')}}
            div(class="text-effect-setting__value-input"
              :style="{ backgroundColor: currentStyle.textEffect.color }"
              @click="handleColorModal")
            color-picker(v-if="openColorPicker"
              class="text-effect-setting__color-picker"
              v-click-outside="handleColorModal"
              :currentColor="currentStyle.textEffect.color"
              @update="handleColorUpdate")
        div(class="flex-between text-effect-setting__options mb-10")
          svg-icon(v-for="(icon, idx) in shadowOption.slice(3)"
            :key="`shadow-${icon}`"
            :iconName="`text-effect-${icon}`"
            @click.native="onEffectClick(icon)"
            class="text-effect-setting__option pointer"
            :class="{ 'text-effect-setting__option--selected': currentEffect === icon }"
            iconWidth="60px"
            iconColor="gray-2"
            v-hint="hintMap[`shadow-${icon}`]"
          )
        div(v-if="shadowOption.slice(3).includes(currentEffect)"
          class="w-full text-effect-setting__form")
          div(v-for="field in shadowFields"
            :key="field"
            class="text-effect-setting__field")
            div(class="text-effect-setting__field-name") {{ $t(`${effectI18nMap[field]}`) }}
            input(class="text-effect-setting__range-input input__slider--range"
              :value="currentStyle.textEffect[field]"
              :max="fieldRange[field].max"
              :min="fieldRange[field].min"
              :name="field"
              @input="handleEffectUpdate"
              v-ratio-change
              type="range")
            input(class="text-effect-setting__value-input"
              :value="currentStyle.textEffect[field]"
              :name="field"
              @change="handleEffectUpdate"
              type="number")
          div(v-if="canChangeColor"
            class="text-effect-setting__field")
            div(class="text-effect-setting__field-name") {{$t('NN0017')}}
            div(class="text-effect-setting__value-input"
              :style="{ backgroundColor: currentStyle.textEffect.color }"
              @click="handleColorModal")
            color-picker(v-if="openColorPicker"
              class="text-effect-setting__color-picker"
              v-click-outside="handleColorModal"
              :currentColor="currentStyle.textEffect.color"
              @update="handleColorUpdate")
        div(class="w-full text-left mt-10 text-blue-1 text-shape-title") {{$t('NN0070')}}
        div(class="flex-start text-effect-setting__options mb-10")
          svg-icon(v-for="(icon, idx) in shapeOption"
            :key="`shape-${icon}`"
            :iconName="`text-shape-${icon}`"
            @click.native="onShapeClick(icon)"
            class="text-effect-setting__option pointer"
            :class="{ 'text-effect-setting__option--selected': currentShape === icon, 'mx-16': idx % 3 === 1 }"
            iconWidth="60px"
            iconColor="gray-2"
            v-hint="hintMap[`shape-${icon}`]"
          )
        div(class="w-full text-effect-setting__form")
          div(v-for="field in shapeFields"
            :key="field"
            class="text-effect-setting__field")
            div(class="text-effect-setting__field-name") {{$t(`${effectI18nMap[field]}`)}}
            input(class="text-effect-setting__range-input input__slider--range"
              :value="currentStyle.textShape[field]"
              :max="fieldRange[field].max"
              :min="fieldRange[field].min"
              :name="field"
              @input="handleShapeUpdate"
              @mousedown="handleShapeStatus(true)"
              @mouseup="handleShapeStatus(false)"
              v-ratio-change
              type="range")
            input(class="text-effect-setting__value-input"
              :value="currentStyle.textShape[field]"
              :name="field"
              @change="handleShapeUpdate"
              type="number")
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import TextEffectUtils from '@/utils/textEffectUtils'
import TextShapeUtils from '@/utils/textShapeUtils'
import ColorPicker from '@/components/ColorPicker.vue'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType } from '@/store/types'
import TextPropUtils from '@/utils/textPropUtils'
import pageUtils from '@/utils/pageUtils'
import layerUtils from '@/utils/layerUtils'
import { IText } from '@/interfaces/layer'
import groupUtils from '@/utils/groupUtils'

export default Vue.extend({
  name: 'MobileTextEffect',
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
      shapes: {
        none: [],
        curve: ['bend']
      } as { [key: string]: string[] },
      fieldRange: {
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
    shapeOption(): string[] {
      return Object.keys(this.shapes)
    },
    shadowFields(): string[] {
      const { effects, currentEffect } = this
      return effects[currentEffect].filter(field => field !== 'color')
    },
    shapeFields(): string[] {
      const { shapes, currentShape } = this
      return shapes[currentShape]
    },
    canChangeColor(): boolean {
      const { effects, currentEffect } = this
      return effects[currentEffect].includes('color')
    },
    config(): IText {
      return layerUtils.getLayer(0, 0) as IText
    },
    currentStyle(): any {
      // const { styles } = TextEffectUtils.getCurrentLayer()
      const { styles } = this.config
      return styles || {}
    },
    currentEffect(): string {
      const { textEffect = {} } = this.currentStyle
      console.log(textEffect.name)
      return textEffect.name || 'none'
    },
    currentShape(): string {
      const { textShape = {} } = this.currentStyle
      return textShape.name || 'none'
    }
  },
  created() {
    pageUtils.setPages([
      {
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        backgroundImage: {
          config: {
            type: 'image',
            src: 'none',
            clipPath: '',
            active: false,
            shown: false,
            locked: false,
            moved: false,
            imgControl: false,
            isClipper: false,
            dragging: false,
            designId: '',
            styles: {
              x: 0,
              y: 0,
              scale: 1,
              scaleX: 0,
              scaleY: 0,
              rotate: 0,
              width: 0,
              height: 0,
              initWidth: 0,
              initHeight: 0,
              imgX: 0,
              imgY: 0,
              imgWidth: 0,
              imgHeight: 0,
              zindex: -1,
              opacity: 100
            }
          },
          posX: -1,
          posY: -1
        },
        name: '',
        layers: [
          {
            type: 'text',
            id: 'bbOp2nkA',
            widthLimit: -1,
            isTyping: false,
            active: false,
            shown: false,
            locked: false,
            moved: false,
            editing: false,
            dragging: true,
            designId: '',
            isEdited: true,
            contentEditable: true,
            styles: {
              x: 0,
              y: 0,
              scale: 1,
              scaleX: 1,
              scaleY: 1,
              rotate: 0,
              width: 400,
              height: 117,
              initWidth: 400,
              initHeight: 117,
              zindex: 1,
              writingMode: 'initial',
              align: 'center',
              horizontalFlip: false,
              verticalFlip: false,
              textEffect: {},
              textShape: {},
              opacity: 100,
              body: {},
              widthLimit: 400
            },
            paragraphs: [
              {
                spans: [
                  {
                    text: '新增主標題',
                    styles: {
                      font: 'OOcHgnEpk9RHYBOiWllz',
                      weight: 'normal',
                      size: 60,
                      decoration: 'none',
                      style: 'normal',
                      color: '#000000',
                      opacity: 1
                    }
                  }
                ],
                styles: {
                  font: 'undefined',
                  lineHeight: 1.4,
                  fontSpacing: 0,
                  size: 60,
                  align: 'center'
                }
              }
            ],
            selection: {
              from: 14,
              to: 14
            },
            isHeading: true
          }
        ],
        documentColors: [],
        designId: '',
        guidelines: {
          v: [],
          h: []
        }
      }
    ])
  },
  mounted() {
    colorUtils.on(ColorEventType.textEffect, (color: string) => this.handleColorUpdate(color))
    groupUtils.select(0, [0])
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
      // this.$emit('toggleColorPanel', true)
      colorUtils.setCurrEvent(ColorEventType.textEffect)
      colorUtils.setCurrColor(this.currentStyle.textEffect.color)
      this.openColorPicker = !this.openColorPicker
    },
    onEffectClick(effectName: string): void {
      TextEffectUtils.setTextEffect(effectName, { ver: 'v1' })
    },
    onShapeClick(shapeName: string): void {
      TextShapeUtils.setTextShape(shapeName)
      TextPropUtils.updateTextPropsState()
    },
    handleEffectUpdate(event: Event): void {
      const { currentEffect, fieldRange } = this
      const { name, value } = event.target as HTMLInputElement
      const { max, min } = (fieldRange as any)[name]
      TextEffectUtils.setTextEffect(currentEffect, {
        [name]: value > max ? max : (value < min ? min : value)
      })
    },
    handleShapeUpdate(event: Event): void {
      const { currentShape, fieldRange } = this
      const { name, value } = event.target as HTMLInputElement
      const { max, min } = (fieldRange as any)[name]
      TextShapeUtils.setTextShape(currentShape, {
        [name]: value > max ? max : (value < min ? min : value)
      })
    },
    handleShapeStatus(focus: boolean): void {
      const { currentShape } = this
      TextShapeUtils.setTextShape(currentShape, { focus })
    },
    handleColorUpdate(color: string): void {
      const { currentEffect } = this
      TextEffectUtils.setTextEffect(currentEffect, { color })
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-text-effect {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  > .page {
    width: 100%;
    height: 300px;
  }
  > span {
    font-size: 30px;
  }
}

.text-effect-setting {
  width: 300px;
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
.text-shape-title {
  font-size: 16px;
  font-weight: bold;
}
</style>
