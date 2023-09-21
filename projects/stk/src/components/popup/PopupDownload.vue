<template lang="pug">
div(class="popup-download text-left"
  :style="containerStyles"
  v-click-outside="handleClose")
  div(v-if="polling" class="popup-download__form popup-download__form--polling")
    div(class="body-3 text-gray-3") {{ name || `${$t('NN0079')}` }}
    div(class="flex flex-between text-gray-2 items-center")
      span(class="body-2") {{$t('NN0216')}}
      svg-icon(class="pointer"
        iconName="close"
        iconWidth="16px"
        iconColor="gray-2"
        @click="$emit('close')")
    div(class="popup-download__progress mt-5")
      div(class="popup-download__progress-value" :style="{ width: `${progress}%`}")
  div(v-else class="popup-download__form")
    div(class="body-3 mb-10") {{$t('NN0121')}}
    dropdown(class="mb-10"
      :options="typeOptions"
      @select="handleSelectType")
      download-type-option(:name="selectedType.name" :tag="selectedType.tag")
      template(v-slot:option="{ data }")
        div(class="popup-download__type")
          download-type-option(:name="data.name" :tag="data.tag")
          div(class="popup-download__type-desc") {{ data.desc }}
    div(class="body-3")
      div(v-if="'omitBackground' in selected")
        download-check-button(type="checkbox"
          class="mb-10"
          :label="`${$t('NN0215')}`"
          :default-checked="selected.omitBackground === 1"
          @change="({ checked }) => handleUpdate('omitBackground', checked ? 1 : 0)")
      div(v-if="'scale' in selected"
        class="flex items-center mb-10")
        span {{`${$t('NN0122')} x`}}
        dropdown(class="mx-5 popup-download__size-scale"
          :options="scaleOptions"
          @select="(option:number) => handleUpdate('scale', option)") {{ selected.scale }}
        span {{$t('NN0123')}}
      div(v-if="'quality' in selected"
        class="flex flex-column items-center mb-10")
        div(class="flex items-center full-width mb-5")
          span {{$t('NN0132')}}
          property-bar(class="popup-download__size-scale ml-15")
            input(class="px-0"
              type="text"
              v-model.number="selectedTypeQuality")
        input(class="popup-download__range-input input__slider--range"
          v-progress
          v-model.number="selected.quality"
          max="100"
          min="1"
          v-ratio-change
          type="range")
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
      div(v-if="isDetailPage" class="mb-10 pt-5") {{ $t('NN0344') }}
        dropdown(class="mt-5"
          :options="detailPageDownloadOptions"
          @select="handleDetailPageOption") {{ detailPageOptionLabel }}
        div(v-if="selectedDetailPage.option === 'splice' && !selectedTypeVal.includes('pdf')"
          class="mt-10")
          download-check-button(type="radio"
            class="mb-10"
            group-name="product_page"
            :label="$t('NN0345')"
            :default-checked="selectedDetailPage.noLimit"
            @change="handleDetailPageIsLimited"
            value="no-limit")
          div
            download-check-button(type="radio"
              class="mb-5"
              group-name="product_page"
              :label="$t('NN0346')"
              :default-checked="!selectedDetailPage.noLimit"
              @change="handleDetailPageIsLimited"
              value="height-limit")
            div(class="flex items-center")
              property-bar(class="popup-download__size-scale ml-20 mr-5")
                input(type="text"
                  v-model.number="selectedDetailPage.height"
                  :disabled="selectedDetailPage.noLimit"
                  @blur="handleMaxHeight")
              span px
      div(class="mb-10 pt-5") {{$t('NN0124')}}
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
      template(v-if="isAdmin || onDev")
        hr(class="popup-download__hr my-15")
        div(class="dev-selector mb-10")
          dropdown(class="body-3 full-width"
                  :options="devs"
                  @select="handleDevSelect") {{ selectedDevLabel }}
        div
          nubtn(size="sm-full"
              :disabled="isButtonDisabled"
              @click="handleSubmit(true)") {{`${$t('NN0010')} (${$t('NN0460')})`}}
      hr(class="popup-download__hr my-15")
      download-check-button(type="checkbox"
        class="mb-20"
        :label="`${$t('NN0129')}`"
        :default-checked="saveSubmission"
        @change="({ checked }) => handleSubmission(checked)")
    div
      nubtn(:theme="selectedTypeVal === 'pdf_print' && !inReviewMode ? 'icon_text' : 'primary'"
          size="sm-full"
          :icon="['pro', 'alarm']"
          :disabled="isButtonDisabled"
          @click="handleSubmit()") {{$t('NN0010')}}
</template>

<!-- eslint-disable vue/no-unused-properties -->
<script lang="ts">
import DownloadCheckButton from '@/components/download/DownloadCheckButton.vue'
import DownloadPageSelection from '@/components/download/DownloadPageSelection.vue'
import DownloadTypeOption from '@/components/download/DownloadTypeOption.vue'
import downloadMixin from '@/mixin/download'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    DownloadCheckButton,
    DownloadTypeOption,
    DownloadPageSelection
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    useExternelJSON: {
      type: Boolean,
      default: false
    },
    pageIndex: {
      type: Number,
      required: true
    },
    hideContainer: {
      default: false,
      type: Boolean
    }
  },
  emits: ['close', 'inprogress'],
  mixins: [downloadMixin],
  computed: {
    containerStyles(): { [index: string]: string } {
      return this.hideContainer ? {
      } : {
        padding: '18px',
        'border-radius': '5px',
        'box-shadow': '0px 4px 13px rgba(0, 0, 0, 0.25)',
        'background-color': 'white'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-download {
  // width: 100%;
  width: 210px;
  display: grid;
  grid-template-columns: 1fr;
  box-sizing: border-box;
  &__form {
    min-height: 340px;
    transition: 0.3s;
    &--polling {
      min-height: 50px;
    }
  }
  &__type {
    padding: 5px 10px 0;
    line-height: 18px;
    cursor: pointer;
    &:hover {
      background-color: setColor(gray-5);
    }
  }
  &__type-desc {
    font-size: 18px;
    color: setColor(gray-3);
    transform: scale(0.5);
    transform-origin: left;
    width: 200%;
  }
  &__hr {
    border: none;
    border-top: 1px solid setColor(gray-4);
  }
  &__size-scale {
    width: 65px;
  }
  &__color-format {
    width: 65px;
    &.fixed {
      width: auto;
      margin-left: 8px;
      padding: 0px 8px;
      border: 1px solid setColor(gray-4);
      border-radius: 4px;
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
  .property-bar,
  .property-bar {
    box-sizing: border-box;
  }
  .property-bar,
  input {
    font-size: 12px;
    line-height: 22px;
  }
  input {
    padding: 0;
  }
  .dev-selector {
    display: flex;
  }
}
</style>
