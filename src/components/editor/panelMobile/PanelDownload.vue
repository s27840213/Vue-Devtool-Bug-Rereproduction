<template lang="pug">
div(class="panel-download" :style="containerStyles")
  //- To choose effect category: shadow, shape and bg.
  div(v-if="polling" class="panel-download__form panel-download__form--polling")
    div(class="flex flex-between text-gray-2 items-center")
      span(class="body-2") {{$t('NN0216')}}
    div(class="panel-download__progress mt-5")
      div(class="panel-download__progress-value" :style="{ width: `${progress}%`}")
  template(v-else-if="showExtraSettings")
    div(class="text-H6") {{$t('NN0121')}}
    div(class="flex flex-between items-center body-MD py-5")
      span {{ selectedType.name }}
      svg-icon(iconName="chevron-right"
                  iconWidth="18px"
                  iconColor="gray-2")
    hr(class="full-width")
    div(v-if="'scale' in selected" class="flex flex-between items-center body-MD py-5")
      div(class="full-width flex flex-between items-center")
        span {{ `${$t('NN0122')}` }}
        span(class="text-gray-3 mr-10") {{ `${selected.scale} ${$t('NN0123')}` }}
      svg-icon(iconName="chevron-right"
                  iconWidth="18px"
                  iconColor="gray-2")
    hr(class="full-width")
    div(v-if="'quality' in selected"
        class="flex flex-column items-center mb-10")
      mobile-slider(
        :title="`${$t('NN0132')}`"
        :borderTouchArea="true"
        :name="`${$t('NN0132')}`"
        :value="selectedTypeQuality"
        :min="1"
        :max="100"
        :enableDefaultPadding="false"
        :optionWidth="'32px'"
        @update="(val)=> selectedTypeQuality = val")
    div(class="body-3")
      div(v-if="'omitBackground' in selected")
        download-check-button(type="checkbox"
          class="mb-10"
          :label="`${$t('NN0215')}`"
          :default-checked="selected.omitBackground === 1"
          @change="({ checked }) => handleUpdate('omitBackground', checked ? 1 : 0)")
      div(v-if="selectedTypeVal === 'pdf_print' && 'bleed' in selected")
        download-check-button(type="checkbox"
          class="mb-10"
          :label="`${$t('NN0774')}`"
          :default-checked="selected.bleed === 2"
          @change="({ checked }) => handleUpdate('bleed', checked ? 2 : 1)")
      div(v-if="'bleed' in selected")
        download-check-button(type="checkbox"
          class="mb-10"
          :label="`${$t('NN0775')}`"
          :default-checked="selected.bleed! > 0"
          @change="({ checked }) => handleUpdate('bleed', checked ? 1 : 0)")
      div(v-if="selectedTypeVal === 'pdf_print' && 'outline' in selected")
        download-check-button(type="checkbox"
          class="mb-10"
          :label="`${$t('NN0794')}`"
          :default-checked="selected.outline===1"
          :info="`${$t('NN0799')}`"
          :infoUrl="`${$t('NN0802')}`"
          @change="({ checked }) => handleUpdate('outline', checked ? 1 : 0)")
      div(v-if="'outline' in selected")
        download-check-button(type="checkbox"
          class="mb-10"
          :label="`${$t('NN0776')}`"
          :default-checked="selected.outline===2"
          :info="`${$t('NN0800')}`"
          :infoUrl="`${$t('NN0803')}`"
          @change="({ checked }) => handleUpdate('outline', checked ? 2 : 0)")
      div(v-if="selectedTypeVal !== 'jpg' && selectedTypeVal !== 'png'"
        class="flex items-center mb-10")
        span {{$t('NN0777')}}
        dropdown(v-if="colorFormats[selectedTypeVal].length > 1" class="mx-5 popup-download__color-format"
          :current="colorFormats[selectedTypeVal][selected.cmyk ? 1 : 0].label"
          :placeholder="colorFormats[selectedTypeVal][0].label"
          :options="colorFormats[selectedTypeVal]"
          @select="handleColorModeSelect")
        div(v-else-if="colorFormats[selectedTypeVal].length === 1" class="popup-download__color-format fixed")
          span(class="body-XS") {{ colorFormats[selectedTypeVal][selected.cmyk ? 1 : 0].label }}
      div(class="mb-10 pt-5 body-MD") {{$t('NN0124')}}
      div
        download-check-button(type="radio"
          class="mb-10"
          group-name="range"
          :label="`${$t('NN0125')}（${$t('NN0134', { num:`${currentPageIndex + 1}` })}）`"
          value="current"
          :default-checked="rangeType === 'current'"
          @change="handleRangeType")
        download-check-button(type="radio"
          class="mb-10"
          group-name="range"
          :label="`${$t('NN0126')}`"
          value="all"
          :default-checked="rangeType === 'all'"
          @change="handleRangeType")
        div(class="flex items-center")
          download-check-button(type="radio"
            group-name="range"
            value="spec"
            :label="`${$t('NN0127')}`"
            :default-checked="rangeType === 'spec'"
            @change="handleRangeType")
          download-page-selection(class="ml-5 w-75"
            :defaultSelected="pageRange"
            @confirm="handleRangeConfirm")
  template(v-else)
    div(v-for="(btn,index) in btnInfo"
        :key="`panel-download-${index}`"
        class="panel-download__action-btn"
        @click="handleBtnAction(btn.icon)")
      div
        svg-icon(
          class="pointer"
          :iconName="btn.icon"
          :iconWidth="'18px'"
          :iconColor="'gray-2'")
      span(class="body-XXS text-gray-2") {{btn.text}}
</template>

<script lang="ts">
import DownloadCheckButton from '@/components/download/DownloadCheckButton.vue'
import DownloadPageSelection from '@/components/download/DownloadPageSelection.vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import SlideToggle from '@/components/global/SlideToggle.vue'
import downloadMixin from '@/mixin/download'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  components: {
    MobileSlider,
    ColorBtn,
    DownloadCheckButton,
    DownloadPageSelection,
    SlideToggle
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    }
  },
  mixins: [downloadMixin],
  emits: ['pushHistory'],
  data() {
    return {
      btnInfo: [
        { text: '儲存當前設計', icon: 'download', disabled: false },
        { text: '儲存所有設計', icon: 'all-file', disabled: false },
        { text: '儲存其他格式', icon: 'file', disabled: false }
        // { text: `${this.$t('NN0082')}`, icon: 'more', disabled: false }
      ],
      showExtraSettings: false
    }
  },
  computed: {
    containerStyles(): { [key: string]: string } {
      return {
        gridAutoRows: this.polling || this.showExtraSettings ? 'auto' : '1fr',
        gridTemplateColumns: this.polling || this.showExtraSettings ? '1fr' : 'repeat(3, 1fr)',
        textAlign: this.showExtraSettings ? 'left' : 'center'
      }
    }
  },
  methods: {
    handleBtnAction(type: string) {
      switch (type) {
        case 'download': {
          this.handleSubmit(false, 'current')
          break
        }
        case 'all-file': {
          this.handleSubmit(false, 'all')
          break
        }
        case 'file': {
          this.showExtraSettings = true
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-download {
  width: 100%;
  height: 100%;
  display: grid;

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;

    > div {
      box-sizing: border-box;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: setColor(gray-6);
      margin-bottom: 4px;
    }
  }

  &__progress {
    width: 100%;
    height: 8px;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f1f1f1;
  }
  &__progress-value {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    transition: 0.3s;
    border-radius: 4px;
    background-color: setColor(blue-1);
  }
}
</style>
