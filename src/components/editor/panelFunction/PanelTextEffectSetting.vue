<template lang="pug">
div(class="text-effect-setting")
  div(class="text-effect-setting__title") {{ $t('NN0095') }}
  //- Effect category: shadow, shape, bg and fill.
  div(v-for="category in textEffects" :key="category.name"
      class="text-effect-setting__category")
    collapse-title(:active="currCategoryName === category.name"
        @click="switchTab(category.name)") {{category.label}}
    //- Effect icons and options.
    collapse(:when="currCategoryName === category.name"
            class="text-effect-setting__effects2d")
      template(v-for="(effects1d, idx1d) in category.effects2d" :key="idx1d")
        //- Effects, ex: hollow, splice or echo.
        div(class="text-effect-setting__effects1d")
          div(v-for="effect in effects1d"
              :key="`${category.name}-${effect.key}`"
              class="text-effect-setting__effect pointer"
              :class="{'selected': getStyle(category).name === effect.key }"
              @click="onEffectClick(effect)")
            svg-icon(v-if="['custom-fill-img'].includes(effect.key)"
              :iconName="effectIcon(category, effect).name"
              :iconWidth="effectIcon(category, effect).size"
              iconColor="white"
              v-hint="effect.label")
            img(v-else :src="effectIcon(category, effect).name"
              :width="effectIcon(category, effect).size"
              :height="effectIcon(category, effect).size"
              draggable="false"
              v-hint="effect.label")
            pro-item(v-if="effect.plan" theme="roundedRect")
        //- Effect options.
        div(v-if="getOptions(effects1d, category) && getOptions(effects1d, category)?.length !== 0"
            class="text-effect-setting__options")
          div(v-for="option in getOptions(effects1d, category)" :key="option.key"
              class="text-effect-setting__option"
              :class="{disabled: optionDisabled(option)}")
            div(class="text-effect-setting__option--name") {{option.label}}
            //- Option type select
            div(v-if="option.type === 'select'"
                class="text-effect-setting__option--select")
              div(v-for="sel in option.select"
                  :key="`${option.key}-${sel.key}`")
                img(:src="sel.img"
                    :class="{'selected': ((getStyle(category)[option.key] as Record<'key', string>).key ?? getStyle(category)[option.key]) === sel.key }"
                    draggable="false"
                    @click="handleSelectInput(sel.attrs)")
            //- Option type range
            template(v-if="option.type === 'range'")
              input(class="text-effect-setting__option--number"
                :value="getInputValue(getStyle(category), option)"
                :name="option.key"
                :max="option.max"
                :min="option.min"
                :step="option.key === 'lineHeight' ? 0.01 : 1"
                @change="(e)=>{handleRangeInputEvent(e, option);recordChange()}"
                type="number")
              input(class="text-effect-setting__option--range input__slider--range"
                v-progress
                :value="getInputValue(getStyle(category), option)"
                :name="option.key"
                :max="option.max"
                :min="option.min"
                :step="option.key === 'lineHeight' ? 0.01 : 1"
                @input="(e)=>handleRangeInputEvent(e, option)"
                @mousedown="setEffectFocus(true)"
                @mouseup="setEffectFocus(false)"
                v-ratio-change
                type="range")
            //- Option type color
            color-btn(v-if="option.type === 'color' && getStyle(category)[option.key]" size="25px"
              :color="colorParser(getStyle(category)[option.key] as string)"
              :active="option.key === colorTarget && settingTextEffect"
              @click="handleColorModal(option)")
            //- Option type img
            div(v-if="option.type === 'img'"
                class="text-effect-setting__option--img"
                @click="chooseImg(option.key)")
              img(:src="getStyleImg")
              div
              svg-icon(class="absolute" iconName="replace" iconColor="white" iconWidth="16px")
          div(class="text-effect-setting__option")
            span(class="text-effect-setting__option--admin"
                @click="adminTool.action()") {{ adminTool.label }}
            span(class="text-effect-setting__option--reset"
                @click="resetTextEffect()") {{$t('NN0754')}}
</template>

<!-- eslint-disable vue/no-unused-properties -->
<script lang="ts">
import CollapseTitle from '@/components/global/CollapseTitle.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import ProItem from '@/components/payment/ProItem.vue'
import i18n from '@/i18n'
import { IAssetPhoto, IPhotoItem } from '@/interfaces/api'
import { isTextFill } from '@/interfaces/format'
import { ColorEventType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import constantData, { IEffect, IEffectCategory, IEffectOption, IEffectOptionRange } from '@/utils/constantData'
import editorUtils from '@/utils/editorUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import paymentUtils from '@/utils/paymentUtils'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import textBgUtils from '@/utils/textBgUtils'
import textEffectUtils, { isFocusState } from '@/utils/textEffectUtils'
import textFillUtils from '@/utils/textFillUtils'
import textPropUtils from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import _ from 'lodash'
import { defineComponent } from 'vue'
import { Collapse } from 'vue-collapsed'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'PanelTextEffectSetting',
  components: {
    ColorBtn,
    ProItem,
    Collapse,
    CollapseTitle,
  },
  emits: ['toggleColorPanel'],
  data() {
    return {
      currTab: localStorageUtils.get('textEffectSetting', 'tab') as string,
      textEffects: constantData.textEffects(),
      colorTarget: '',
    }
  },
  computed: {
    ...mapState('text', {
      selectedTextProps: 'props'
    }),
    ...mapGetters('user', {
      isAdmin: 'isAdmin'
    }),
    currCategoryName() {
      return this.currTab
    },
    currentStyle(): {name: string} & Record<string, unknown> {
      const { styles } = textEffectUtils.getCurrentLayer()
      if (!styles) return { name: 'none' }
      return {
        shadow: styles.textEffect,
        bg: styles.textBg,
        shape: styles.textShape,
        fill: styles.textFill,
      }[this.currCategoryName] as {name: string} & Record<string, unknown> ?? {} // Type incorrect
    },
    settingTextEffect(): boolean {
      return colorUtils.currEvent === 'setTextEffectColor' &&
        editorUtils.showColorSlips
    },
    getStyleImg(): string {
      return textFillUtils.getTextFillImg(textEffectUtils.getCurrentLayer(),
        { finalSize: (this.$el as HTMLElement | undefined)?.clientWidth ?? 320 })
    },
    adminTool() {
      if (this.isAdmin && this.currCategoryName === 'fill' && this.currentStyle.name !== 'none') {
        return {
          label: this.currentStyle.name === 'custom-fill-img' ? '上傳文字填滿' : '更新文字填滿',
          action: () => { textFillUtils.uploadTextFill() },
        }
      }
      return { label: '', action: () => { /**/ } }
    },
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
    effectIcon(category: IEffectCategory, effect: IEffect) {
      if (effect.img) { // For TextFill that from appJSON, use web img as icon.
        return {
          name: effect.img,
          size: '56',
        }
      }
      switch (effect.key) {
        case 'text-book':
          return {
            name: require(`@/assets/img/png/text-effect-icon/${category.name}-${effect.key}-${i18n.global.locale}.png`),
            size: '56',
          }
        case 'custom-fill-img': // svg-icon
          return {
            name: 'add-image',
            size: '24px',
          }
        default:
          return {
            name: require(`@/assets/img/png/text-effect-icon/${category.name}-${effect.key}.png`),
            size: '56',
          }
      }
    },
    handleColorModal(option: IEffectOption) {
      const currColor = this.colorParser(this.currentStyle[option.key] as string)

      this.colorTarget = option.key
      editorUtils.toggleColorSlips(true)
      colorUtils.setCurrEvent(ColorEventType.textEffect)
      colorUtils.setCurrColor(currColor)
    },
    switchTab(category: 'shadow'|'bg'|'shape'|'fill') {
      if (category === this.currTab) this.currTab = ''
      else this.currTab = category
      localStorageUtils.set('textEffectSetting', 'tab', this.currTab)
    },
    getStyle(category: IEffectCategory) {
      const { styles } = textEffectUtils.getCurrentLayer()
      return {
        shadow: styles.textEffect,
        bg: styles.textBg,
        shape: styles.textShape,
        fill: styles.textFill,
      }[category.name] as Record<string, unknown> ?? {}
    },
    getOptions(effects1d: IEffect[], category: IEffectCategory) {
      return _.find(effects1d, ['key', this.getStyle(category).name])?.options
    },
    getInputValue(style: Record<string, unknown>, option: IEffectOptionRange) {
      if (['lineHeight', 'fontSpacing'].includes(option.key)) {
        return this.selectedTextProps[option.key]
      } else {
        return style[option.key]
      }
    },
    optionDisabled(option: IEffectOption) {
      const config = textEffectUtils.getCurrentLayer()
      const textFill = config.styles.textFill
      if (this.currCategoryName === 'fill' && isTextFill(textFill) && textFill.size === 100) {
        const { divHeight, divWidth, imgHeight, imgWidth, scaleByWidth } =
          textFillUtils.calcTextFillVar(config)
        if ((option.key === 'xOffset200' && (imgWidth === divWidth || scaleByWidth)) ||
          (option.key === 'yOffset200' && (imgHeight === divHeight || !scaleByWidth))) {
          return true
        }
      }
      return false
    },
    async resetTextEffect() {
      const target = this.currCategoryName === 'shadow' ? textEffectUtils
        : this.currCategoryName === 'shape' ? textShapeUtils
          : this.currCategoryName === 'bg' ? textBgUtils : textFillUtils
      await target.resetCurrTextEffect()
      this.recordChange()
    },
    async setEffect(options:{
      effectName?: string,
      effect?: Record<string, unknown>
    }) {
      let { effectName, effect } = options
      const { textShape } = textEffectUtils.getCurrentLayer().styles
      if (!effectName) {
        effectName = this.currentStyle.name || 'none'
      }

      switch (this.currCategoryName) {
        case 'shadow':
          textEffectUtils.setTextEffect(effectName,
            Object.assign({}, effect, { ver: 'v1' }))
          break
        case 'bg':
          await textBgUtils.setTextBg(effectName, effect)
          if (textShape.name !== 'none') {
            textShapeUtils.setTextShape('none') // Bg & shape are exclusive.
            textPropUtils.updateTextPropsState()
          }
          break
        case 'shape':
          textShapeUtils.setTextShape(effectName, effect)
          textPropUtils.updateTextPropsState()
          await textBgUtils.setTextBg('none') // Bg & shape are exclusive.
          break
        case 'fill':
          await textFillUtils.setTextFill(effectName, effect)
          break
      }
    },
    async onEffectClick(effect: IEffect): Promise<void> {
      if (!paymentUtils.checkPro(effect, 'pro-text')) return
      await this.setEffect({ effectName: effect.key })
      this.recordChange()

      const chooseImgkey = effect.options.find(op => op.type === 'img')?.key ?? ''
      if (chooseImgkey && !this.getStyleImg) {
        this.chooseImg(chooseImgkey)
      }
    },
    async handleSelectInput(attrs: Record<string, unknown>) {
      await this.setEffect({ effect: attrs })
      this.recordChange()
    },
    handleRangeInputEvent(event: Event, option: IEffectOptionRange) {
      this.handleRangeInput(parseFloat((event.target as HTMLInputElement).value), option)
    },
    handleRangeInput(value: number, option: IEffectOptionRange) {
      const newVal = {
        [option.key]: _.clamp(value, option.min, option.max)
      }
      this.setEffect({ effect: newVal })
    },
    setEffectFocus(focus: boolean) {
      if (focus && isFocusState(this.currCategoryName)) {
        textEffectUtils.setFocus(this.currCategoryName)
      } else if (!focus) {
        textEffectUtils.setFocus('none')
      }
      if (!focus) this.recordChange()
    },
    replaceImg(key: string) {
      return (img: IAssetPhoto | IPhotoItem) => {
        this.setEffect({ effect: { [key]: img } })
        this.recordChange()
      }
    },
    chooseImg(key: string) {
      popupUtils.openPopup('replace', undefined, {
        replaceImg: this.replaceImg(key)
      })
    },
    handleColorUpdate(color: string): void {
      this.setEffect({ effect: { [this.colorTarget]: color } })
    },
    colorParser(color: string) {
      return textEffectUtils.colorParser(color, textEffectUtils.getCurrentLayer())
    },
    recordChange() {
      stepsUtils.record()
    },
  }
})
</script>

<style lang="scss" scoped>
.text-effect-setting {
  text-align: left;
  &__title {
    @include text-H6;
    color: setColor(blue-1);
    margin: 15px 0;
  }
  &__category {
    @include body-SM;
    color: setColor(gray-1);
    > span {
      height: 33px;
    }
  }
  &__effects2d {
    display: grid; // Prevent margin collapse
    background: setColor(gray-6);
    transition: all 0.5s ease-in-out
  }
  &__effects1d {
    display: grid;
    grid-template-columns: repeat(3, 56px);
    gap: 20px;
    margin: 10px auto;
    width: 208px;
  }
  &__effect {
    @include size(56px);
    box-sizing: border-box;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    background-color: white;
    background-clip: content-box;
    overflow: hidden;
    > img {
      object-fit: cover;
    }
    .pro {
      left: 1px;
      top: -4px;
    }
    &:not(.selected):hover {
      @include selection-border(2px, blue-hover);
    }
    &.selected {
      @include selection-border(2px);
    }
  }
  &__options {
    display: grid;
    gap: 8px;
    margin: 0 10px;
    padding: 10px 8px;
    background-color: white;
    border-radius: 4px;
    color: setColor(gray-2);
    &:last-child {
      margin-bottom: 10px;
    }
  }
  &__option {
    display: grid;
    grid-template-columns: auto 1fr;
    justify-items: end;
    row-gap: 4px;
    &.disabled {
      > * {
        color: setColor(gray-4);
        pointer-events: none;
      }
      > *::-webkit-slider-thumb {
        border: 2px solid setColor(gray-4);
      }
    }
    &--range, &--img, &--select {
      grid-column: 1/3;
    }
    &--name {
      justify-self: start;
    }
    &--number {
      @include body-XS;
      box-sizing: border-box;
      width: 30px;
      height: 24px;
      border: 1px solid setColor(gray-4);
      border-radius: 3px;
      text-align: center;
      color: setColor(gray-2);
    }
    &--range {
      height: 15px;
      margin-top: 6px;
    }
    &--select {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px 7.25px;
      width: 100%;
      > div {
        position: relative;
        width: 100%;
        height: 0;
        padding-top: 100%;
        > img {
          @include selection-border(1px, gray-5);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          &.selected {
            @include selection-border(2px);
          }
        }
      }
    }
    &--img {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      border-radius: 2px;
      overflow: hidden;
      cursor: pointer;
      > img {
        width: 100%;
        max-height: 120px;
        object-fit: cover;
      }
      > div { // dark mask on img
        position: absolute;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.2);
      }
    }
    &--reset, &--admin {
      color: setColor(blue-1);
      cursor: pointer;
    }
  }
}
</style>
