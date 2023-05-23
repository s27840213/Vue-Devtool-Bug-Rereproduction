<template lang="pug">
div(class="panel-text-effect")
  //- To choose effect category and effect.
  tabs(v-if="state === 'effects'"
      :tabs="textEffects.map(t => t.label)"
      v-model="currTabIndex" theme="light")
  div(v-if="state === 'effects'"
      class="panel-text-effect__effects")
    div(v-for="effect in effectList"
        :key="`${currCategoryName}-${effect.key}`"
        :class="{ 'selected': currEffect?.key === effect.key }"
        @click="onEffectClick(currCategory, effect)")
      svg-icon(v-if="['custom-fill-img'].includes(effect.key)"
              :iconName="effectIcon(currCategory, effect).name"
              :iconWidth="effectIcon(currCategory, effect).size"
              class="panel-text-effect__effects--icon" iconColor="gray-5")
      img(v-else :src="effectIcon(currCategory, effect).name"
          class="panel-text-effect__effects--icon"
          :width="effectIcon(currCategory, effect).size"
          :height="effectIcon(currCategory, effect).size")
      pro-item(v-if="effect.plan" theme="roundedRect")
      div(v-if="currEffect?.key === effect.key && effect.key !== 'none'"
          class="panel-text-effect__effects--more")
        svg-icon(iconName="sliders" iconWidth="20px" iconColor="white")
  //- To set effect optoin.
  div(v-if="state === 'options' && currEffect !== null"
      class="w-full panel-text-effect__form")
    span(class="panel-text-effect__effect-name") {{currEffect.label}}
    div(v-for="option in currEffect.options"
        :key="option.key"
        class="panel-text-effect__field")
      div(v-if="option.key !== 'endpoint' && !['range', 'color'].includes(option.type)"
          class="panel-text-effect__option-name") {{option.label}}
      //- Option type select (endpoint)
      div(v-if="option.type === 'select' && option.key === 'endpoint'"
          class="panel-text-effect__endpoint")
        div(v-for="sel in option.select"
            :key="sel.key"
            :class="{'selected': currentStyle[option.key] === sel.key }"
            @click="handleSelectInput(sel.attrs)")
          img(:src="sel.img")
          span {{sel.label}}
      //- Option type select
      div(v-if="option.type === 'select' && option.key !== 'endpoint'"
          class="panel-text-effect__select")
        div(v-for="sel in option.select" :key="sel.key"
            @click="handleSelectInput(sel.attrs)")
          img(:src="sel.img"
              :class="{'selected': ((currentStyle[option.key] as Record<'key', string>).key ?? currentStyle[option.key]) === sel.key }")
      //- Option type range
      mobile-slider(v-if="option.type === 'range'"
        :borderTouchArea="true"
        :title="option.label"
        :value="getInputValue(currentStyle, option)"
        :max="option.max ?? 100"
        :min="option.min ?? 0"
        :step="option.key === 'lineHeight' ? 0.01 : 1"
        :autoRecord="false"
        :enableDefaultPadding="false"
        @update="(val)=>handleRangeInput(val, option)"
        @pointerdown="setEffectFocus(true)"
        @pointerup="setEffectFocus(false)")
      //- Option type color
      div(v-if="option.type === 'color'"
        class="panel-text-effect__color")
        div {{option.label}}
        color-btn(:color="colorParser(currentStyle[option.key] as string)"
                size="30px" @click="openColorPanel(option.key)")
      //- Option type img
      div(v-if="option.type === 'img'"
          class="panel-text-effect__img"
          @click="chooseImg(option.key)")
        img(:src="getStyleImg")
        div
        svg-icon(class="absolute" iconName="replace" iconColor="white" iconWidth="32px")
    span(class="panel-text-effect__reset"
        @click="resetTextEffect()") {{$t('NN0754')}}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import ProItem from '@/components/payment/ProItem.vue'
import Tabs from '@/components/Tabs.vue'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import { IEffect, IEffectCategory } from '@/utils/constantData'
import localStorageUtils from '@/utils/localStorageUtils'
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
    Tabs,
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    }
  },
  emits: ['pushHistory', 'openExtraColorModal', 'openExtraPanelReplace'],
  data() {
    return {
    }
  },
  computed: {
    currTabIndex: {
      get: function (): number {
        return {
          shadow: 0,
          shape: 1,
          bg: 2,
          fill: 3
        }[this.currTab as 'shadow'|'bg'|'shape'|'fill'] ?? 0
      },
      set: function (newVal: number) {
        this.currTab = ['shadow', 'shape', 'bg', 'fill'][newVal] ?? 0
        localStorageUtils.set('textEffectSetting', 'tab', this.currTab)
      }
    },
    currCategory(): IEffectCategory {
      return _.find(this.textEffects, ['name', this.currCategoryName]) as IEffectCategory
    },
    effectList(): IEffect[] | null {
      if (!this.currCategory) return null
      return _.flatten(this.currCategory.effects2d)
    },
    currEffect(): IEffect | null {
      if (!this.currCategory) return null
      return _.find(this.effectList, ['key', this.currentStyle.name]) ?? null
    },
    state(): string {
      return this.panelHistory.length === 0 ? 'effects' : 'options'
    }
  },
  mounted() { /**/ },
  beforeUnmount() { /**/ },
  methods: {
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
    async onEffectClick(category: IEffectCategory, effect: IEffect): Promise<void> {
      if (!paymentUtils.checkPro(effect, 'pro-text')) return
      const chooseImgkey = effect.options.find(op => op.type === 'img')?.key ?? ''

      if (effect.key !== this.currentStyle.name) {
        await this.setEffect({ effectName: effect.key })
        this.recordChange()
        if (chooseImgkey && !this.getStyleImg) {
          this.chooseImg(chooseImgkey)
        }
      } else if (effect.key !== 'none') {
        if (chooseImgkey && !this.getStyleImg) {
          this.chooseImg(chooseImgkey)
          return
        }
        this.$emit('pushHistory', effect.key)
      }
    },
    chooseImg(key: string) {
      this.$emit('openExtraPanelReplace', this.replaceImg(key))
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-text-effect {
  @include body-SM;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: 1fr;
  color: setColor(gray-2);
  text-align: left;

  :deep(.tabs) {
    height: 26px;
    margin-bottom: 10px;
    .tabs__item {
      padding-bottom: 2px;
    }
    span {
      @include body-XS;
    }
  }

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
    > img {
      background-color: setColor(gray-5);
    }
  }

  &__effects {
    @include no-scrollbar;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    gap: 16px;
    margin: 0 15px 15px 15px;
    overflow: auto;
    > div {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      width: 56px;
      height: 56px;
      margin: 0px auto;
      border-radius: 5px;
      border: 2px solid transparent;
      overflow: hidden;
      .panel-text-effect__effects--icon {
        background-color: setColor(gray-5);
        border-radius: 5px;
        object-fit: cover;
        &.svg-icon {
          padding: 16px;
        }
      }
      &.selected {
        border: 2px solid setColor(blue-1);
      }
      > .pro {
        left: 1px;
        top: -4px;
      }
    }
    &--more {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0px;
      left: 0px;
      width: 56px;
      height: 56px;
      border-radius: 3px;
      background: rgba(71, 74, 87, 0.6);
      backdrop-filter: blur(2px);
    }
  }

  &__form {
    @include no-scrollbar;
    display: grid;
    gap: 10px;
    margin: 0 15px 15px 15px;
    overflow-y: scroll;
  }

  &__effect-name {
    color: setColor(gray-1);
    text-align: center;
  }

  &__option-name {
    margin-bottom: 4px;
  }

  &__endpoint {
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
      border: 2px solid transparent;
      border-radius: 5px;
      background-color: setColor(gray-5);
      &.selected {
        border-color: setColor(blue-1);
      }
      > img {
        margin-right: 8px;
      }
    }
  }

  &__select {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 10px;
    margin: 0 2px;
    > div {
      position: relative;
      width: 100%;
      height: 0;
      padding-top: 100%;
      > img {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
        top: -1px;
        left: -1px;
        border: 1px solid setColor(gray-5);
        border-radius: 4px;
        transition: all 0.3s;
        &.selected {
          top: -2px;
          left: -2px;
          border: 2px solid setColor(blue-1);
        }
      }
    }
  }

  &__color {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__img {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    border-radius: 2px;
    overflow: hidden;
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

  &__reset {
    @include btn-SM;
    color: setColor(blue-1);
    text-align: center;
  }
}
</style>
