<template lang="pug">
  div(class="page-setting")
    div(class="page-setting-row page-setting__title")
      span(class="text-gray-2 label-mid") 頁面尺寸
    div(class="page-setting-row page-setting__size")
      property-bar(class="page-setting__size__box pointer" @click.native="setSuggestionPanel(true)")
        span(class="body-3 text-gray-2") {{ currentPageWidth }}
        span(class="body-4 text-gray-3") W
      svg-icon(class="pointer"
          :iconName="isLocked ? 'lock' : 'unlock'" :iconWidth="'20px'" :iconColor="'gray-2'"
          @click.native="toggleLock()")
      property-bar(class="page-setting__size__box pointer" @click.native="setSuggestionPanel(true)")
        span(class="body-3 text-gray-2") {{ currentPageHeight }}
        span(class="body-4 text-gray-3") H
    div(class="page-setting-row page-setting__apply text-white bg-blue-1 pointer"
        @click="toggleSuggestionPanel()")
      span(class="page-setting__apply__text") 調 整 尺 寸
    //- div(class="page-setting__hr horizontal-rule")
    //- div(class="page-setting-row page-setting__suggestion text-gray-2 pointer relative"
    //-     @click="toggleSuggestion()")
    //-   span(class="page-setting__suggestion__text") 常用尺寸
    //-   svg-icon(class="page-setting__suggestion__icon" :style="dropDownStyles()"
    //-       iconName="drop-down" iconWidth="10px" iconHeight="5px" iconColor="gray-2")
    div(v-if="panelOpened"
        class="page-setting__suggestion-panel")
        img(class="page-setting__suggestion-panel__arrow" :src="require('@/assets/img/svg/up-arrow.svg')")
        div(class="page-setting__suggestion-panel__body")
          div(class="page-setting__suggestion-panel__body__close pointer"
              @click="setSuggestionPanel(false)")
            svg-icon(class="page-setting__suggestion-panel__body__close"
                    iconName="close" iconWidth="19px" iconColor="white")
          div(class="page-setting__suggestion-panel__body-row first-row")
            span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") 自訂尺寸
          div(class="page-setting__suggestion-panel__body-row")
            radio-btn(class="page-setting__suggestion-panel__body__radio"
                      :isSelected="selectedFormat === 'custom'",
                      formatKey="custom",
                      @select="selectFormat")
            div(class="page-setting__suggestion-panel__body__custom")
              property-bar(class="page-setting__suggestion-panel__body__custom__box"
                          :class="selectedFormat === 'custom' ? 'border-blue-1' : 'border-white'")
                input(class="body-3" type="number" min="0"
                      :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'"
                      :value="pageWidth" @input="setPageWidth" @click="selectFormat('custom')")
                span(class="body-4"
                    :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'") W
              svg-icon(class="pointer"
                  :iconName="isLocked ? 'lock' : 'unlock'"
                  iconWidth="15px" :iconColor="selectedFormat === 'custom' ? 'blue-1' : 'white'"
                  @click.native="toggleLock()")
              property-bar(class="page-setting__suggestion-panel__body__custom__box"
                          :class="selectedFormat === 'custom' ? 'border-blue-1' : 'border-white'")
                input(class="body-3" type="number" min="0"
                      :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'"
                      :value="pageHeight" @input="setPageHeight" @click="selectFormat('custom')")
                span(class="body-4"
                    :class="selectedFormat === 'custom' ? 'text-blue-1' : 'text-white'") H
          div(class="page-setting__suggestion-panel__body__hr horizontal-rule")
          div(class="page-setting__suggestion-panel__body-row first-row")
            span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") 最近使用
          div(v-for="(format, index) in recentlyUsed" class="page-setting__suggestion-panel__body-row")
            radio-btn(class="page-setting__suggestion-panel__body__radio"
                      :isSelected="selectedFormat === `recent-${index}`",
                      :formatKey="`recent-${index}`",
                      @select="selectFormat")
            span(class="page-setting__suggestion-panel__body__recently body-3 pointer"
                  :class="selectedFormat === `recent-${index}` ? 'text-blue-1' : 'text-white'"
                  @click="selectFormat(`recent-${index}`)") {{ makeFormatString(format) }}
          div(class="page-setting__suggestion-panel__body__hr horizontal-rule")
          div(class="page-setting__suggestion-panel__body-row first-row")
            span(class="page-setting__suggestion-panel__body__title subtitle-2 text-white") 常用尺寸
          div(v-for="[id, format] in Array.from(formatList)" class="page-setting__suggestion-panel__body-row")
            radio-btn(class="page-setting__suggestion-panel__body__radio"
                      :isSelected="selectedFormat === `preset-${format.id}`",
                      :formatKey="`preset-${format.id}`",
                      @select="selectFormat")
            span(class="page-setting__suggestion-panel__body__typical-name body-4 pointer"
                  :class="selectedFormat === `preset-${format.id}` ? 'text-blue-1' : 'text-white'"
                  @click="selectFormat(`preset-${format.id}`)") {{ format.name }}
            span(class="page-setting__suggestion-panel__body__typical-size body-4 pointer"
                  :class="selectedFormat === `preset-${format.id}` ? 'text-blue-1' : 'text-white'"
                  @click="selectFormat(`preset-${format.id}`)") {{ format.size }}
          div(class="page-setting__suggestion-panel__body__buttons")
            div(class="page-setting__suggestion-panel__body__button text-white"
                :class="isFormatApplicable ? 'bg-blue-1 pointer' : 'bg-gray-3'"
                @click="applySelectedFormat")
              span(class="page-setting__suggestion-panel__body__button__text") 調整尺寸
            div(class="page-setting__suggestion-panel__body__button text-white"
                :class="isFormatApplicable ? 'bg-blue-1 pointer' : 'bg-gray-3'"
                @click="copyAndApplySelectedFormat")
              span(class="page-setting__suggestion-panel__body__button__text") 複製並調整尺寸
    div(class="page-setting__footer")
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { mapGetters, mapMutations } from 'vuex'
import StepsUtils from '@/utils/stepsUtils'
import ResizeUtils from '@/utils/resizeUtils'
import GeneralUtils from '@/utils/generalUtils'
import GroupUtils from '@/utils/groupUtils'

export default Vue.extend({
  components: {
    SearchBar,
    RadioBtn
  },
  mounted() {
    const formatPresets = [
      {
        id: '0',
        name: 'Facebook',
        width: 1080,
        height: 1080,
        size: '1080x1080'
      },
      {
        id: '1',
        name: 'Instagram',
        width: 1080,
        height: 1080,
        size: '1080x1080'
      },
      {
        id: '2',
        name: 'IG 限時動態',
        width: 1080,
        height: 1920,
        size: '1080x1920 (9:16)'
      },
      {
        id: '3',
        name: 'Line',
        width: 1040,
        height: 1040,
        size: '1040x1040'
      },
      {
        id: '4',
        name: '電商-商品圖',
        width: 1080,
        height: 1080,
        size: '1080x1080'
      },
      {
        id: '5',
        name: '電商-Banner',
        width: 2000,
        height: 1000,
        size: '2000x1000 (2:1)'
      }
    ]
    for (const format of formatPresets) {
      this.formatList.set(format.id, format)
    }
  },
  data() {
    return {
      formatList: new Map(),
      recentlyUsed: [
        {
          type: 'preset',
          id: '0'
        },
        {
          type: 'preset',
          id: '4'
        },
        {
          type: 'custom',
          id: '0',
          width: 1080,
          height: 720
        },
        {
          type: 'custom',
          id: '1',
          width: 1200,
          height: 1200
        },
        {
          type: 'preset',
          id: '2'
        }
      ],
      selectedFormat: '',
      pageWidth: '' as string | number,
      pageHeight: '' as string | number,
      isLocked: true,
      panelOpened: false
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      lastSelectedPageIndex: 'getLastSelectedPageIndex'
    }),
    currentPageWidth(): number {
      return Math.round(this.getPage(this.lastSelectedPageIndex).width)
    },
    currentPageHeight(): number {
      return Math.round(this.getPage(this.lastSelectedPageIndex).height)
    },
    aspectRatio(): number {
      return this.getPage(this.lastSelectedPageIndex).width / this.getPage(this.lastSelectedPageIndex).height
    },
    isCustomValid(): boolean {
      return this.pageWidth !== '' && this.pageHeight !== ''
    },
    isFormatApplicable(): boolean {
      return this.selectedFormat === 'custom' ? this.isCustomValid : (this.selectedFormat !== '')
    }
  },
  methods: {
    ...mapMutations({
      updatePageProps: 'UPDATE_pageProps',
      addPageToPos: 'ADD_pageToPos',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex'
    }),
    getSelectedFormat(): { id: string, width: number, height: number } | undefined {
      if (this.selectedFormat === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth as number, height: this.pageHeight as number }
      } else if (this.selectedFormat.startsWith('recent')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.recentlyUsed[parseInt(index)]
        if (format.type === 'preset') {
          return this.formatList.get(format.id)
        } else {
          return { id: format.id, width: format.width as number, height: format.height as number }
        }
      } else if (this.selectedFormat.startsWith('preset')) {
        const [type, id] = this.selectedFormat.split('-')
        return this.formatList.get(id)
      } else {
        return undefined
      }
    },
    applySelectedFormat() {
      const format = this.getSelectedFormat()
      if (format) {
        this.resizePage(format)
      }
    },
    copyAndApplySelectedFormat() {
      const page = GeneralUtils.deepCopy(this.getPage(this.lastSelectedPageIndex))
      page.name += ' (copy)'
      page.designId = ''
      console.log(page)
      this.addPageToPos({
        newPage: page,
        pos: this.lastSelectedPageIndex + 1
      })
      GroupUtils.deselect()
      this.setLastSelectedPageIndex(this.lastSelectedPageIndex + 1)
      this.setCurrActivePageIndex(this.lastSelectedPageIndex + 1)
      this.applySelectedFormat()
    },
    resizePage(format: { id: string, width: number, height: number }) {
      ResizeUtils.resizePage(this.lastSelectedPageIndex, this.getPage(this.lastSelectedPageIndex), format)
      this.updatePageProps({
        pageIndex: this.lastSelectedPageIndex,
        props: {
          width: format.width,
          height: format.height
        }
      })
      this.pageWidth = ''
      this.pageHeight = ''
      StepsUtils.record()
    },
    toggleLock() {
      this.isLocked = !this.isLocked
    },
    setSuggestionPanel(opened: boolean) {
      this.panelOpened = opened
    },
    toggleSuggestionPanel() {
      this.setSuggestionPanel(!this.panelOpened)
    },
    dropDownStyles() {
      return this.panelOpened ? { transform: 'translateX(-50%) rotate(180deg)' } : {}
    },
    makeFormatString(format: { type: string, width?: number, height?: number, id: string }) {
      if (format.type === 'preset') {
        const presetFormat = this.formatList.get(format.id)
        return `${presetFormat.name} ${presetFormat.size}`
      } else {
        return `${format.width} x ${format.height}`
      }
    },
    setPageWidth(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageWidth = value
      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageHeight = ''
        } else {
          this.pageHeight = Math.round(parseInt(value) / this.aspectRatio)
        }
      }
    },
    setPageHeight(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageHeight = value
      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageWidth = ''
        } else {
          this.pageWidth = Math.round(parseInt(value) * this.aspectRatio)
        }
      }
    },
    selectFormat(key: string) {
      this.selectedFormat = key
    }
  }
})
</script>

<style lang="scss" scoped>
.page-setting {
  @include size(100%, 100%);
  font-family: NotoSansTC;
  text-align: left;
  &__title {
    & span {
      line-height: 18px;
    }
  }
  &-row {
    margin-top: 15px;
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__size {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: auto;
    column-gap: 5px;
    align-items: center;
    &__box {
      height: 26px;
      box-sizing: border-box;
      & input {
        line-height: 16px;
        font-family: NotoSansTC;
      }
    }
  }
  &__apply {
    height: 28px;
    border-radius: 3px;
    text-align: center;
    margin-top: 19px;
    width: 88%;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    &__text {
      font-weight: 700;
      font-size: 12px;
      line-height: 16px;
    }
  }
  &__hr {
    margin-top: 19px;
    width: 95%;
  }
  &__suggestion {
    height: 28px;
    box-sizing: border-box;
    border: 1.2px solid setColor(gray-2);
    border-radius: 3px;
    text-align: center;
    margin-top: 20px;
    width: 88%;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    &__text {
      font-weight: 700;
      font-size: 12px;
      line-height: 16px;
    }
    &__icon {
      position: absolute;
      left: calc(50% + 36px);
      transform: translateX(-50%);
      transition: all 0.2s ease 0s;
    }
  }
  &__suggestion-panel {
    &__arrow {
      margin-left: auto;
      margin-right: 30%;
      margin-top: 15px;
      margin-bottom: -5px;
      display: block;
    }
    &__body {
      background-color: setColor(gray-1-5);
      box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.25);
      border-radius: 4px;
      padding: 11.57px;
      &-row {
        display: flex;
        justify-content: space-between;
        width: 87%;
        margin-left: auto;
        margin-top: 15px;
        margin-right: 10px;
        align-items: center;
        &.first-row {
          margin-top: 0px;
        }
      }
      &__close {
        margin-left: auto;
        width: fit-content;
        height: 19px;
      }
      &__title {
        font-weight: 700;
        margin-left: -16px;
      }
      &__custom {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        grid-template-rows: auto;
        column-gap: 5px;
        align-items: center;
        width: 85%;
        &__box {
          height: 26px;
          box-sizing: border-box;
          padding: 5px 5px;
          & input {
            line-height: 16px;
            background-color: transparent;
            font-family: NotoSansTC;
          }
          &.border-blue-1 {
            @extend .border-blue-1;
          }
          &.border-white {
            @extend .border-white;
          }
        }
      }
      &__hr {
        margin-top: 31px;
        margin-bottom: 31px;
      }
      &__text {
        font-family: Mulish;
      }
      &__recently {
        @extend .page-setting__suggestion-panel__body__text;
        width: 88%;
      }
      &__typical-name {
        @extend .page-setting__suggestion-panel__body__text;
        width: 37%;
      }
      &__typical-size {
        @extend .page-setting__suggestion-panel__body__text;
        width: 45%;
        white-space: nowrap;
        transform: scale(0.85);
      }
      &__buttons {
        display: flex;
        justify-content: space-between;
        width: 95%;
        margin-left: auto;
        margin-right: auto;
        margin-top: 29px;
        margin-bottom: 17.43px;
      }
      &__button {
        border-radius: 3px;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 27px;
        padding: 0 18px;
        &__text {
          font-weight: 700;
          font-size: 12px;
        }
      }
    }
  }
  &__footer {
    height: 20px;
  }
}
.horizontal-rule {
  @extend .bg-gray-4;
  height: 1px;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
}
</style>
