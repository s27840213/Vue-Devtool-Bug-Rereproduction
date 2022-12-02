<template lang="pug">
  div(class="page-size-selector" :class="{isTouchDevice}")
    div(class="page-size-selector__body-row first-row")
      span(class="page-size-selector__body__title subtitle-2"
        :class="defaultTextColor") {{$t('NN0023')}}
    div(class="page-size-selector__body__custom")
        radio-btn(class="page-size-selector__body__radio"
                  :isSelected="selectedFormat === 'custom'",
                  :circleColor="isDarkTheme ? 'white' : 'gray-2'"
                  formatKey="custom",
                  @select="selectFormat")
        property-bar(class="page-size-selector__body__custom__box"
                    :class="selectedFormat === 'custom' ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`")
          input(class="body-XS" type="number" min="0"
                :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor"
                :value="pageWidth" @input="setPageWidth" @click="selectFormat('custom')")
          span(class="body-XS"
              :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") W
        svg-icon(class="pointer"
            :iconName="isLocked ? 'lock' : 'unlock'"
            iconWidth="15px" :iconColor="selectedFormat === 'custom' ? 'blue-1' : isDarkTheme ? 'white' : 'blue'"
            @click.native="toggleLock()")
        property-bar(class="page-size-selector__body__custom__box"
                    :class="selectedFormat === 'custom' ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`")
          input(class="body-XS" type="number" min="0"
                :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor"
                :value="pageHeight" @input="setPageHeight" @click="selectFormat('custom')")
          span(class="body-XS"
              :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") H
        property-bar(v-click-outside="() => {showUnitOptions = false}"
                    class="page-size-selector__body__custom__box page-size-selector__body__custom__unit pointer"
                    :class="selectedFormat === 'custom' || showUnitOptions ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`"
            @click.native="showUnitOptions = !showUnitOptions")
          span(class="page-size-selector__body__custom__unit__label body-XXS" :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") {{unitOptions[selectedUnit]}}
          svg-icon(class="page-size-selector__body__custom__unit__icon"
            iconName="chevron-down"
            iconWidth="16px"
            :iconColor="selectedFormat === 'custom' ? 'blue-1' : this.isDarkTheme ? 'white' : 'gray-2'")
          div(v-if="showUnitOptions" class="page-size-selector__body__custom__unit__option" :class="`bg-${this.isDarkTheme ? 'white' : 'gray-1-5'}`")
            div(v-for="(unit, index) in unitOptions" class="page-size-selector__body__custom__unit__option__item text-gray-2" @click="selectUnit($event, index)")
              span(class="body-XS"
                  :class="`text-${isDarkTheme ? 'gray-1' : 'white'}`") {{unit}}
    div(class="page-size-selector__body__hr first bg-gray-4")
    div(class="page-size-selector__container")
        div(class="page-size-selector__body-row first-row")
          span(class="page-size-selector__body__title subtitle-2"
            :class="defaultTextColor") {{$t('NN0024')}}
        div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
          svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" :iconColor="defaultTextColor")
        div(v-for="(format, index) in recentlyUsed" class="page-size-selector__body-row pointer"
            @click="selectFormat(`recent-${index}`)")
          radio-btn(class="page-size-selector__body__radio"
                    :isSelected="selectedFormat === `recent-${index}`",
                    :circleColor="isDarkTheme ? 'white' : 'gray-2'"
                    :formatKey="`recent-${index}`",
                    @select="selectFormat")
          span(class="page-size-selector__body__recently body-3 pointer"
                :class="selectedFormat === `recent-${index}` ? 'text-blue-1' : defaultTextColor"
                @click="selectFormat(`recent-${index}`)") {{ makeFormatTitle(format) }}
        div(class="page-size-selector__body-row first-row")
          span(class="page-size-selector__body__title subtitle-2"
              :class="defaultTextColor") {{$t('NN0025')}}
        div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
          svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" iconColor="white")
        div(v-for="(format, index) in formatList" class="page-size-selector__body-row typical-row pointer"
            @click="selectFormat(`preset-${index}`)")
          radio-btn(class="page-size-selector__body__radio"
                    :isSelected="selectedFormat === `preset-${index}`",
                    :circleColor="isDarkTheme ? 'white' : 'gray-2'"
                    :formatKey="`preset-${index}`",
                    @select="selectFormat")
          span(class="page-size-selector__body__typical-name body-4"
                :class="selectedFormat === `preset-${index}` ? 'text-blue-1' : defaultTextColor") {{ format.title }}
          span(class="page-size-selector__body__typical-size body-4"
                :class="selectedFormat === `preset-${index}` ? 'text-blue-1' : defaultTextColor") {{ makeFormatDescription(format) }}
    div(class="page-size-selector__body__hr second bg-gray-4")
    div(class="page-size-selector__body__submit")
      div(class="page-size-selector__body__submit__option body-XS")
        checkbox(v-model="copyBeforeApply" class="pointer") {{$t('NN0211')}}
      btn(class="page-size-selector__body__button"
          :disabled="!isFormatApplicable"
          @click.native="submit")
        svg-icon(iconName="pro" iconWidth="22px" iconColor="alarm")
        span {{$t('NN0022')}}
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import SearchBar from '@/components/SearchBar.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import Checkbox from '@/components/global/Checkbox.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { ILayout } from '@/interfaces/layout'
import pageUtils from '@/utils/pageUtils'
import { IListServiceContentData } from '@/interfaces/api'
import groupUtils from '@/utils/groupUtils'
import stepsUtils from '@/utils/stepsUtils'
import listApi from '@/apis/list'
import generalUtils from '@/utils/generalUtils'
import resizeUtils from '@/utils/resizeUtils'
import paymentUtils from '@/utils/paymentUtils'
import editorUtils from '@/utils/editorUtils'
import { throttle } from 'lodash'

export default Vue.extend({
  props: {
    isDarkTheme: {
      type: Boolean,
      default: true
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    SearchBar,
    RadioBtn,
    Checkbox
  },
  mounted() {
    this.handleCurrFocusPageIndexChange()
  },
  data() {
    return {
      selectedFormat: '',
      pageWidth: NaN,
      pageHeight: NaN,
      pageTransWidths: [] as number[],
      pageTransHeights: [] as number[],
      isLocked: true,
      unitOptions: ['px', 'cm', 'mm', 'in'],
      mulUnits: [
        // px cm mm in
        [1, 1 / 96 * 2.54, 1 / 96 * 25.4, 1 / 96], // px
        [96 / 2.54, 1, 10, 1 / 2.54], // cm
        [96 / 25.4, 1 / 10, 1, 1 / 25.4], // mm
        [96, 2.54, 25.4, 1] // in
      ],
      selectedUnit: 0,
      showUnitOptions: false,
      copyBeforeApply: true
    }
  },
  watch: {
    currFocusPageIndex: function () {
      this.handleCurrFocusPageIndexChange()
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapState(
      'layouts',
      [
        'categories'
      ]
    ),
    ...mapGetters({
      getPage: 'getPage',
      token: 'user/getToken',
      getAsset: 'getAsset',
      groupId: 'getGroupId',
      groupType: 'getGroupType',
      pagesLength: 'getPagesLength',
      getPageSize: 'getPageSize'
    }),
    isTouchDevice() {
      return generalUtils.isTouchDevice()
    },
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    currentPageWidth(): number {
      const currPage = this.getPage(pageUtils.currFocusPageIndex)
      return this.currentPageUnit
        ? Math.round((currPage?.physicalWidth ?? 0) * this.mulPrecision) / this.mulPrecision
        : Math.round(currPage?.width ?? 0)
    },
    currentPageHeight(): number {
      const currPage = this.getPage(pageUtils.currFocusPageIndex)
      return this.currentPageUnit
        ? Math.round((currPage?.physicalHeight ?? 0) * this.mulPrecision) / this.mulPrecision
        : Math.round(currPage?.height ?? 0)
    },
    currentPageUnit(): number {
      return this.unitOptions.indexOf(this.getPage(pageUtils.currFocusPageIndex)?.unit ?? 'px')
    },
    aspectRatio(): number {
      return (this.getPage(pageUtils.currFocusPageIndex)?.width ?? 1) / this.getPage(pageUtils.currFocusPageIndex)?.height ?? 1
    },
    isCustomValid(): boolean {
      return this.widthValid && this.heightValid
    },
    defaultTextColor(): string {
      return this.isDarkTheme ? 'text-white' : 'text-gray-2'
    },
    isFormatApplicable(): boolean {
      return this.selectedFormat === 'custom' ? this.isCustomValid : (this.selectedFormat !== '')
    },
    widthValid(): boolean {
      return !!this.pageWidth && this.pageWidth > 0
    },
    heightValid(): boolean {
      return !!this.pageHeight && this.pageHeight > 0
    },
    formatList(): ILayout[] {
      const targetCategory = this.categories.find((category: IListServiceContentData) => {
        return category.title === `${this.$t('NN0025')}`
      })
      return targetCategory ? targetCategory.list.map((item: any) => ({
        id: item.id,
        width: item.width ?? 0,
        height: item.height ?? 0,
        title: item.title ?? '',
        description: item.description ?? '',
        unit: item.unit ?? 'px'
      })) : []
    },
    recentlyUsed(): ILayout[] {
      const targetCategory = this.categories.find((category: any) => {
        return category.title === `${this.$t('NN0024')}`
      })
      return targetCategory ? targetCategory.list.map((item: any) => ({
        id: item.id,
        width: item.width ?? 0,
        height: item.height ?? 0,
        title: item.title ?? '',
        description: item.description ?? '',
        unit: item.unit ?? 'px'
      })) : []
    },
    isLayoutReady(): boolean {
      return this.formatList.length !== 0
    },
    mulPrecision(): number {
      return this.selectedUnit === 0 ? 1 : 1e3
    }
  },
  methods: {
    ...mapMutations({
      updatePageProps: 'UPDATE_pageProps',
      addPageToPos: 'ADD_pageToPos',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setIsloading: 'SET_isGlobalLoading',
      updateRecentlyUsed: 'layouts/UPDATE_RECENTLY_PAGE'
    }),
    ...mapActions('layouts',
      [
        'getCategories',
        'getRecently'
      ]
    ),
    getSelectedFormat(): ILayout | undefined {
      if (this.selectedFormat === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth, height: this.pageHeight, title: '', description: '', unit: this.unitOptions[this.selectedUnit] }
      } else if (this.selectedFormat.startsWith('recent')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.recentlyUsed[parseInt(index)]
        return format
      } else if (this.selectedFormat.startsWith('preset')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.formatList[parseInt(index)]
        return format
      } else {
        return undefined
      }
    },
    toggleLock() {
      this.isLocked = !this.isLocked
    },
    makeFormatTitle(format: ILayout) {
      if (format.id !== '') {
        return `${format.title} ${this.makeFormatDescription(format)}`
      } else {
        return `${format.width} x ${format.height} ${format.unit}`
      }
    },
    makeFormatDescription(format: ILayout): string {
      return format.description.includes(' ') ? format.description.replace(' ', ` ${format.unit ?? 'px'} `) : `${format.description} ${format.unit ?? 'px'}`
    },
    transSize(size: number) {
      return this.mulUnits[this.selectedUnit].map((mulTransUnit, idx) => {
        const mulPrecision = idx === 0 ? 1 : 1e3
        return Math.round(size * mulTransUnit * mulPrecision) / mulPrecision
      })
    },
    handleCurrFocusPageIndexChange() {
      this.selectedUnit = this.currentPageUnit
      this.pageWidth = this.currentPageWidth
      this.pageHeight = this.currentPageHeight
      this.pageTransWidths = this.transSize(this.pageWidth)
      this.pageTransHeights = this.transSize(this.pageHeight)
    },
    setPageWidth(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageWidth = typeof value === 'string' ? parseFloat(value) : value
      this.pageWidth = Math.floor(this.pageWidth * this.mulPrecision) / this.mulPrecision
      this.pageTransWidths = this.transSize(this.pageWidth)
      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageHeight = NaN
        } else {
          this.pageHeight = Math.round(parseFloat(value) / this.aspectRatio * this.mulPrecision) / this.mulPrecision
          this.pageTransHeights = this.transSize(this.pageHeight)
        }
      }
    },
    setPageHeight(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageHeight = typeof value === 'string' ? parseFloat(value) : value
      this.pageHeight = Math.floor(this.pageHeight * this.mulPrecision) / this.mulPrecision
      this.pageTransHeights = this.transSize(this.pageHeight)
      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageHeight = NaN
        } else {
          this.pageWidth = Math.round(parseFloat(value) * this.aspectRatio * this.mulPrecision) / this.mulPrecision
          this.pageTransWidths = this.transSize(this.pageWidth)
        }
      }
    },
    selectFormat(key: string) {
      this.selectedFormat = key
    },
    selectUnit(evt: Event, key: number) {
      evt.stopPropagation()
      this.selectedFormat = 'custom'
      this.showUnitOptions = false
      if (this.selectedUnit === key) return
      this.pageWidth = this.pageTransWidths[key]
      this.pageHeight = this.pageTransHeights[key]
      this.selectedUnit = key
      this.$emit('selectUnit', key)
    },
    fetchLayouts() {
      this.isLayoutReady = false
      this.formatList = []
      this.recentlyUsed = []
      this.getRecently().then(() => {
        for (const category of this.categories as IListServiceContentData[]) {
          if (category.title === `${this.$t('NN0025')}`) {
            this.formatList = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? '',
              unit: item.unit ?? 'px'
            }))
          }
          if (category.title === `${this.$t('NN0024')}`) {
            this.recentlyUsed = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? '',
              unit: item.unit ?? 'px'
            }))
          }
        }
        this.isLayoutReady = true
      })
    },
    applySelectedFormat(record = true) {
      if (!this.isFormatApplicable) return
      const format = this.getSelectedFormat()
      if (!format) return
      // translate physical size to px size
      let pxWidth = format.width
      let pxHeight = format.height
      if (format.unit !== 'px') {
        const idxUnit = this.unitOptions.indexOf(format.unit)
        pxWidth *= this.mulUnits[idxUnit][0]
        pxHeight *= this.mulUnits[idxUnit][0]
      }
      pxWidth = Math.round(pxWidth)
      pxHeight = Math.round(pxHeight)

      // resize page with px size
      this.resizePage({
        width: pxWidth,
        height: pxHeight,
        physicalWidth: format.width,
        physicalHeight: format.height,
        unit: format.unit
      })
      if (this.groupType === 1) {
        // resize電商詳情頁時 其他頁面要依width做resize
        this.resizeOtherPages([pageUtils.currFocusPageIndex], { width: pxWidth })
      }

      // update recently used size
      listApi.addDesign(format.id, 'layout', format)
      const index = this.recentlyUsed.findIndex((recent) => {
        return format.id === recent.id && format.width === recent.width && format.height === recent.height && format.unit === recent.unit
      })
      this.updateRecentlyUsed({
        index,
        format
      })

      if (generalUtils.isTouchDevice()) {
        pageUtils.fitPage()
      }
      if (record) {
        stepsUtils.record()
      }
    },
    copyAndApplySelectedFormat() {
      if (!this.isFormatApplicable) return
      const page = generalUtils.deepCopy(this.getPage(pageUtils.currFocusPageIndex))
      page.designId = ''
      this.addPageToPos({
        newPage: page,
        pos: pageUtils.currFocusPageIndex + 1
      })
      groupUtils.deselect()
      this.setCurrActivePageIndex(pageUtils.currFocusPageIndex + 1)
      this.applySelectedFormat(false)
      stepsUtils.record()
      this.$nextTick(() => { pageUtils.scrollIntoPage(pageUtils.currFocusPageIndex) })
    },
    submit: throttle(function(this: any) {
      // Use throttle to prevent submit multiple times.
      if (!paymentUtils.checkPro({ plan: 1 }, 'page-resize')) return
      if (this.copyBeforeApply) {
        this.copyAndApplySelectedFormat()
      } else {
        this.applySelectedFormat()
      }
      editorUtils.setShowMobilePanel(false) // For mobile
      this.$emit('close') // For PC
    }, 2000, { trailing: false }),
    resizePage(format: { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string}) {
      resizeUtils.resizePage(pageUtils.currFocusPageIndex, this.getPage(pageUtils.currFocusPageIndex), format)
    },
    resizeOtherPages(excludes: number[] = [], format: { [key: string]: number }) {
      const { pagesLength, getPageSize } = this
      for (let pageIndex = 0; pageIndex < pagesLength; pageIndex++) {
        if (excludes.includes(pageIndex)) continue
        const { width, height, unit } = getPageSize(pageIndex)
        const newWidth = Math.round(format.width || width * (format.height / height))
        const newHeight = Math.round(format.height || height * (format.width / width))
        const mulPrecision = unit === 'px' ? 1 : 1e3
        const newSize = {
          width: newWidth,
          height: newHeight,
          physicalWidth: Math.round(newWidth * this.mulUnits[0][this.unitOptions.indexOf(unit)] * mulPrecision) / mulPrecision,
          physicalHeight: Math.round(newHeight * this.mulUnits[0][this.unitOptions.indexOf(unit)] * mulPrecision) / mulPrecision,
          unit
        }
        resizeUtils.resizePage(pageIndex, this.getPage(pageIndex), newSize)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.page-size-selector {
  height: 100%;
  display: grid;
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
      display: grid;
      grid-template-columns: 12px auto;
      grid-template-rows: auto;
      column-gap: 12px;
      width: 100%;
      padding: 3px 22px 3px 10px;
      align-items: center;
      box-sizing: border-box;
      text-align: left;
      &-center {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      &.first-row {
        display: block;
        padding: 0px;
        margin: 0px;
        > span {
          display: block;
          height: 16px;
          word-spacing: 1.5px;
          text-transform: uppercase;
        }
      }
      &.typical-row  {
        grid-template-columns: 12px calc((100% - 36px) * 0.5) auto;
      }
    }
    &__close {
      margin-left: auto;
      width: fit-content;
      height: 19px;
    }
    &__title {
      font-weight: 700;
    }
    &__custom {
      display: grid;
      grid-template-columns: 12px auto 15px auto 50px;
      grid-template-rows: auto;
      column-gap: 6px;
      align-items: center;
      margin-top: 16px;
      margin-left: 10px;
      &__box {
        height: 28px;
        box-sizing: border-box;
        padding: 5px 5px;
        & input {
          line-height: 16px;
          background-color: transparent;
        }
      }
      &__unit {
        display: flex;
        align-items: center;
        position: relative;
        &__label {
          height: 18px;
          line-height: 18px;
        }
        &__option {
          position: absolute;
          top: 36px;
          left: 0px;
          right: 0px;
          border-radius: 4px;
          box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
          display: grid;
          overflow: hidden;
          padding: 4px;
          &__item {
            height: 30px;
            padding: 4px;
            box-sizing: border-box;
            border-radius: 4px;
            &:hover {
              background-color: setColor(blue-3);
            }
            > span {
              display: block;
              text-align: left;
              height: 100%;
            }
          }
        }
      }
    }
    &__hr {
      width: 100%;
      height: 1px;
      :not(.isTouchDevice) > &.first {
        margin: 16px 0;
      }
      .isTouchDevice > &.first {
        margin: 20px 0 12px 0;
      }
      :not(.isTouchDevice) > &.second {
        height: 0px;
        margin: 8px 0;
      }
      .isTouchDevice > &.second {
        margin: 0 0 15.5px 0;
      }
    }
    &__buttons {
      display: flex;
      width: 95%;
      margin-left: auto;
      margin-right: auto;
      margin-top: 29px;
      margin-bottom: 17.43px;
      gap: 11px;
    }
    &__button {
      flex-grow: 1;
      border-radius: 3px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 4px;
      text-align: center;
      &__text {
        font-weight: 700;
        font-size: 12px;
      }
    }
    &__submit {
      display: grid;
      gap: 16px;
      width: 100%;
      &__option {
        padding: 3px 0px;
      }
      > .checkbox {
        @include body-SM;
        margin: 0 auto 20px 0;
        .isTouchDevice > & {
          margin-bottom: 15.5px;
        }
      }
    }
    &__button {
      @include body-SM;
      width: 100%;
      height: 36px;
      border: none;
      svg {
        margin-right: 10px;
        vertical-align: middle;
      }
    }
  }
  &__footer {
    height: 20px;
  }
  &__container {
    display: grid;
    gap: 4px;
    overflow-y: auto; // overlay is not supported in Firefox
    scrollbar-width: thin;
    :not(.isTouchDevice) > & {
      // Set maxHeight 500px to scroll container in PC
      max-height: 500px;
    }
    @include firefoxOnly {
      scrollbar-width: thin;
      scrollbar-color: setColor(gray-3) transparent;
    }
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background-color: setColor(gray-3);
    }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: 0.3s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.border-blue-1 {
  border: 1px solid setColor(blue-1);
}

@media (max-width: 1260px) {

}
</style>
