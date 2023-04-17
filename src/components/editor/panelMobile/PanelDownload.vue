<template lang="pug">
div(class="panel-download" :style="containerStyles")
  //- To choose effect category: shadow, shape and bg.
  div(v-if="polling" class="full-width flex items-center flex-column")
    animation(class="animation-downloading" path="/lottie/download.json")
    div(class="panel-download__progress mt-5")
      div(class="panel-download__progress-value body-SM" :style="{ width: `${progress}%`}")
    span(class="body-SM text-blue-1 py-10") {{$t('NN0824')}}
    span(class="body-SM text-gray-3 py-10") {{$t('NN0825')}}
    btn(class="full-width body-3 rounded" @click="cancelDownload")
      span {{$t('NN0203')}}
  div(v-else-if="downloaded" class="full-width full-width flex items-center flex-column")
    animation(class="animation-downloaded" path="/lottie/downloaded.json" :loop="false")
    span(class="body-SM text-blue-1 py-10") {{$t('NN0826')}}
    btn(class="full-width body-3 rounded" @click="()=> $emit('close')")
      span {{$t('NN0827')}}
  template(v-else-if="currState === 'setting'")
    div(class="text-H6") {{$t('NN0121')}}
    mobile-type-selector(
      :title="selectedType.name"
      :iconName="'chevron-right'"
      @click="handleTypeSelectorAction('type')")
    hr(class="full-width")
    mobile-type-selector(v-if="'scale' in selected"
      :title="`${$t('NN0122')}`"
      :description="`${selected.scale} ${$t('NN0123')}`"
      :iconName="'chevron-right'"
      @click="handleTypeSelectorAction('size')")
    hr(v-if="'scale' in selected" class="full-width")
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
    hr(v-if="'quality' in selected" class="full-width")
    div(class="body-3")
      mobile-props-toggle(class="py-5" v-if="'omitBackground' in selected" :title="`${$t('NN0215')}`" v-model="selectedOmitBg")
      mobile-props-toggle(class="py-5" v-if="selectedTypeVal === 'pdf_print' && 'bleed' in selected"
        :title="`${$t('NN0774')}`"
        :modelValue="selected.bleed === 2"
        @update:modelValue="(bool) => handleUpdate('bleed', bool ? 2 : 1)")
      mobile-props-toggle(v-if="'bleed' in selected" :title="`${$t('NN0775')}`" class="py-5" v-model="selectedBleed")
      hr(v-if="'bleed' in selected && selectedTypeVal !== 'pdf_print'" class="full-width")
      mobile-props-toggle(v-if="selectedTypeVal === 'pdf_print' && 'outline' in selected"
        class="py-5"
        :title="`${$t('NN0794')}`"
        :modelValue="selected.outline===1"
        @update:modelValue="(bool) => handleUpdate('outline', bool ? 1 : 0)")
      mobile-props-toggle(v-if="'outline' in selected"
        class="py-5"
        :title="`${$t('NN0776')}`"
        :modelValue="selected.outline===2"
        @update:modelValue="(bool) => handleUpdate('outline', bool ? 2 : 0)")
      hr(v-if="'outline' in selected" class="full-width")
      mobile-type-selector(
        v-if="selectedTypeVal !== 'jpg' && selectedTypeVal !== 'png'"
        class="py-5"
        :title="`${$t('NN0777')}`"
        :description="colorFormats[selectedTypeVal][selected.cmyk ? 1 : 0].label"
        :iconName="'chevron-right'"
        @click="handleTypeSelectorAction('colorMode')")
      div(class="text-H6") {{$t('NN0124')}}
      mobile-type-selector(
        :title="noPageRange && rangeType === 'spec' ? `${$t('NN0823')}` : rangeTypeText"
        :iconName="'chevron-right'"
        :textSize="'body-SM'"
        :textColor="noPageRange && rangeType === 'spec' ? 'text-red' : 'text-gray-2'"
        @click="handleTypeSelectorAction('selectPage')")
      hr(class="full-width")
      btn(class="full-width body-3 rounded"
        :disabled="isButtonDisabled"
        @click="handleSubmit()")
        div(class="flex items-center")
          svg-icon(v-if="selectedTypeVal === 'pdf_print' && !inReviewMode"
            class="mr-5"
            iconName="pro" iconWidth="22px" iconColor="alarm")
          span {{$t('NN0010')}}
  template(v-else-if="currState === 'type'")
    div(class="flex flex-column")
      div(v-for="option in typeOptions"
          :key="option.value"
          class="flex items-center full-width" @click="handleSelectFileType(option)")
        svg-icon(
          class="mr-10"
          :iconColor="option.value === selectedType.value ? 'blue-1' : 'light-gray'"
          :iconName="option.value === selectedType.value ? 'radio-checked' : 'radio'"
          :iconWidth="'16px'")
        div(class="flex flex-column p-5")
          download-type-option(:name="option.name" :tag="option.tag")
          div(class="body-XS text-gray-3 text-left") {{ option.desc }}
  template(v-else-if="currState === 'size'")
    div(class="flex flex-column")
      div(v-for="option in scaleOptions"
          :key="option"
          class="flex items-center full-width"
          @click="handleUpdate('scale', option)")
        svg-icon(
          class="mr-10"
          :iconColor="option === selected.scale ? 'blue-1' : 'light-gray'"
          :iconName="option === selected.scale ? 'radio-checked' : 'radio'"
          :iconWidth="'16px'")
        div(class="flex flex-between p-5 full-width")
          div(class="body-S text-left") {{ `${option} ${$t('NN0123')}`}}
          div
            span(class="text-gray-4 body-XS") {{ `${Math.round(currPageSize.width * option)}x${Math.round(currPageSize.height * option)}` }}
  template(v-else-if="currState === 'colorMode'")
    div(class="flex flex-column")
      div(v-for="option in colorFormats[selectedTypeVal]"
          :key="option.value"
          class="flex items-center full-width"
          @click="handleColorModeSelect(option)")
        svg-icon(
          class="mr-10"
          :iconColor="option.value === colorFormats[selectedTypeVal][selected.cmyk ? 1 : 0].value ? 'blue-1' : 'light-gray'"
          :iconName="option.value === colorFormats[selectedTypeVal][selected.cmyk ? 1 : 0].value ? 'radio-checked' : 'radio'"
          :iconWidth="'16px'")
        div(class="flex flex-between p-5 full-width")
          div(class="body-XS text-left") {{ `${option.label}`}}
  template(v-else-if="currState === 'selectPage'")
    div(class="flex flex-column")
      div(class="flex flex-between full-width items-center")
        div(class="text-H6") {{$t('NN0124')}}
        div(@click="handleDeselectAll") {{$t('NN0130')}}
      div(v-for="idx in pagesLength"
          :key="idx"
          class="flex items-center"
          @click="handlePageRageSelect(idx-1)")
        svg-icon(class="mr-10"
          :iconColor="pageRange.includes(idx-1) ? 'blue-1' : 'light-gray'"
          :iconName="pageRange.includes(idx-1) ? 'checkbox-checked' : 'checkbox'"
          :iconWidth="'16px'")
        span {{ `${$t('NN0134', { num:`${idx}` })}${currFocusPageIndex === (idx-1) ? `(${$t('NN0125')})` :''}` }}
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

<!-- eslint-disable vue/no-unused-properties -->
<script lang="ts">
import Animation from '@/components/Animation.vue'
import DownloadTypeOption from '@/components/download/DownloadTypeOption.vue'
import MobilePropsToggle from '@/components/editor/mobile/MobilePropsToggle.vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import MobileTypeSelector from '@/components/editor/mobile/MobileTypeSelector.vue'
import Btn from '@/components/global/Btn.vue'
import { ITypeOption, PanelDownloadState } from '@/interfaces/download'
import downloadMixin from '@/mixin/download'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'
export default defineComponent({
  components: {
    Animation,
    MobileSlider,
    MobileTypeSelector,
    MobilePropsToggle,
    DownloadTypeOption,
    Btn
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    }
  },
  mixins: [downloadMixin],
  emits: ['pushHistory', 'back', 'close'],
  data() {
    return {
      btnInfo: [
        { text: '儲存當前設計', icon: 'download', disabled: false },
        { text: '儲存所有設計', icon: 'all-file', disabled: false },
        { text: '儲存其他格式', icon: 'file', disabled: false }
        // { text: `${this.$t('NN0082')}`, icon: 'more', disabled: false }
      ]
    }
  },
  computed: {
    ...mapGetters({
      pagesLength: 'getPagesLength',
      currFocusPageIndex: 'getCurrFocusPageIndex',
      getPageSize: 'getPageSize'
    }),
    containerStyles(): { [key: string]: string } {
      return {
        gridAutoRows: this.currState === 'setting' ? 'auto' : '1fr',
        gridTemplateColumns: this.historySize !== 0 || this.polling || this.downloaded ? '1fr' : '1fr 1fr 1fr',
        textAlign: this.currState === 'setting' ? 'left' : 'center'
      }
    },
    historySize(): number {
      return this.panelHistory.length
    },
    currState(): PanelDownloadState {
      return this.panelHistory[this.historySize - 1] as PanelDownloadState
    },
    noPageRange(): boolean {
      return this.pageRange.length === 0
    },
    currPageSize(): {width: number, height: number} {
      return this.getPageSize(this.currFocusPageIndex) as {width: number, height: number}
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
          this.pushHistory('setting')
        }
      }
    },
    handleTypeSelectorAction(type: PanelDownloadState) {
      switch (type) {
        case 'colorMode':
        case 'size':
        case 'type': {
          break
        }
        case 'selectPage': {
          this.rangeType = 'spec'
          this.pageRange = [this.currentPageIndex]
          break
        }
      }
      this.pushHistory(type)
    },
    pushHistory(type: PanelDownloadState) {
      this.$emit('pushHistory', type)
    },
    handleSelectFileType(type: ITypeOption) {
      this.handleSelectType(type)
      this.$emit('back')
    },
    handlePageRageSelect(idx: number) {
      if (this.pageRange.includes(idx)) {
        this.pageRange.splice(idx, 1)
      } else {
        this.pageRange.push(idx)
      }
    },
    handleDeselectAll() {
      this.pageRange = []
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

  hr {
    margin: 12px 0px;
    height: 1px;
    background-color: setColor(gray-4);
    border: none;
  }
}

.animation {
  &-downloading {
    width: 80%;
  }

  &-downloaded {
    width: 40%;
  }
}
</style>
