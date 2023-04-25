<template lang="pug">
div(class="panel-text-effect")
  //- To choose effect category: shadow, shape and bg.
  div(v-if="state === 'categories'" class="panel-text-effect__categories flex-evenly")
    div(v-for="category in textEffects"
        :key="category.name"
        class="panel-text-effect__category pointer")
      svg-icon(:iconName="`text-${category.name}-none`"
              iconWidth="60px"
              iconColor="gray-5"
              @click="pushHistory(category.name)")
      span(class="body-3") {{category.label}}
  //- To choose effect, ex: hollow, splice or echo.
  div(v-if="state === 'effects'"
      class="panel-text-effect__effects")
    div(v-for="effect in effectList"
        :key="`${currCategoryName}-${effect.key}`"
        :class="{ 'selected': currEffect?.key === effect.key }"
        @click="onEffectClick(effect)")
      svg-icon(:iconName="effectIcon(currCategory, effect).name"
              :iconWidth="effectIcon(currCategory, effect).size"
              class="panel-text-effect__effects--icon" iconColor="gray-5")
      pro-item(v-if="effect.plan" theme="roundedRect")
      div(v-if="currEffect?.key === effect.key && effect.key !== 'none'"
          class="panel-text-effect__effects--more")
        svg-icon(iconName="sliders" iconWidth="20px" iconColor="white")
  //- To set effect optoin, ex: distance, color.
  div(v-if="state === 'options' && currEffect !== null"
      class="w-full panel-text-effect__form")
    span(class="panel-text-effect__name") {{currEffect.label}}
    div(v-for="option in currEffect.options"
        :key="option.key"
        class="panel-text-effect__field")
      //- Option type select
      div(v-if="option.type === 'select'"
          class="panel-text-effect__select")
        div(v-for="sel in option.select"
            :key="sel.key"
            :class="{'selected': currentStyle[option.key] === sel.key }"
            @click="handleSelectInput(option.key, sel.key)")
          svg-icon(:iconName="`${option.key}-${sel.key}`"
            iconWidth="24px")
          span {{sel.label}}
      //- Option type range
      mobile-slider(v-if="option.type === 'range'"
        :borderTouchArea="true"
        :title="option.label"
        :value="getInputValue(currentStyle, option)"
        :max="option.max ?? 100"
        :min="option.min ?? 0"
        :step="option.key === 'lineHeight' ? 0.01 : 1"
        :autoRecord="false"
        @update="(val)=>handleRangeInput(val, option)"
        @pointerdown="setEffectFocus(true)"
        @pointerup="setEffectFocus(false)")
      //- Option type color
      div(v-if="option.type === 'color'"
        class="panel-text-effect__color")
        div {{option.label}}
        color-btn(:color="colorParser(currentStyle[option.key])"
                size="24px" @click="openColorPanel(option.key)")
      //- Option type img
      //- div(v-if="option.type === 'img'"
      //-     class="panel-text-effect__img")
      //-   img(:src="")
    span(class="panel-text-effect__reset label-mid"
        @click="resetTextEffect()") {{$t('NN0754')}}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import ProItem from '@/components/payment/ProItem.vue'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import { IEffect } from '@/utils/constantData'
import paymentUtils from '@/utils/paymentUtils'
import textBgUtils from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import _ from 'lodash'
import { defineComponent, PropType } from 'vue'
import PanelTextEffectSetting from '../panelFunction/PanelTextEffectSetting.vue'

export default defineComponent({
  name: 'MobilePanelTextEffectSetting',
  extends: PanelTextEffectSetting, // Check desktop TextEffect for common variable
  components: {
    MobileSlider,
    ColorBtn,
    ProItem,
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
    }
  },
  computed: {
    currCategoryName(): 'shadow'|'bg'|'shape'|'fill' {
      return this.panelHistory[this.panelHistory.length - 1] as 'shadow'|'bg'|'shape'|'fill'
    },
    effectList(): IEffect[] | null {
      if (!this.currCategory) return null
      return _.flatten(this.currCategory.effects2d)
    },
    currEffect(): IEffect | null {
      if (!this.currCategory) return null
      return _.find(this.effectList, ['key', this.currentStyle.name]) ?? null
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
  mounted() { /**/ },
  beforeUnmount() { /**/ },
  methods: {
    pushHistory(type: string) {
      this.$emit('pushHistory', type)
    },
    openColorPanel(key: string) {
      if (this.currCategoryName === 'shadow') {
        colorUtils.setCurrEvent(ColorEventType.textEffect)
        this.$emit('openExtraColorModal', ColorEventType.textEffect, MobileColorPanelType.palette)
        textEffectUtils.setColorKey(key)
      } else { // Text BG
        colorUtils.setCurrEvent(ColorEventType.textBg)
        this.$emit('openExtraColorModal', ColorEventType.textBg, MobileColorPanelType.palette)
        textBgUtils.setColorKey(key)
      }
    },
    async onEffectClick(effect: IEffect): Promise<void> {
      if (!paymentUtils.checkPro(effect, 'pro-text')) return
      // if (effect.key === 'custom-fill-img') {
      //   popupUtils.openPopup('replace', undefined, {
      //     selectImg: (img: IAssetPhoto|IPhotoItem) => {
      //       this.setEffect({ effect: { img } })
      //     }
      //   })
      // }
      if (effect.key !== this.currentStyle.name) {
        await this.setEffect({ effectName: effect.key })
        this.recordChange()
      } else if (effect.key !== 'none') {
        this.pushHistory(this.currCategoryName)
      }
    },
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
      justify-content: center;
      align-items: center;
      position: relative;
      width: 56px;
      height: 56px;
      box-sizing: border-box;
      margin: 0px auto 16px auto;
      padding: 2px;
      background-color: setColor(gray-5);
      border-radius: 5px;
      border: 2px solid transparent;
      &.selected {
        border: 2px solid setColor(blue-1);
      }
      > .pro {
        left: -1px;
        top: -6px;
      }
    }
    &--more {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0px;
      left: 0px;
      width: 52px;
      height: 52px;
      border-radius: 3px;
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
      &.selected {
        border-color: setColor(blue-1);;
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
    padding: 10px;
    align-items: center;
    position: relative;
    color: setColor(gray-3);
  }

  &__reset {
    margin-top: 10px;
    color: setColor(blue-1);
  }
}
</style>
