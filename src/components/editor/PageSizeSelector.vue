<template lang="pug">
div(class="page-size-selector" :class="{isTouchDevice: $isTouchDevice()}")
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
                  :class="(selectedFormat === 'custom' ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (selectedFormat === 'custom' && isValidate ? widthValid ? '' : ' input-invalid' : '')")
        input(class="body-XS" type="number" min="0"
              :class="selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor"
              :value="valPageSize.width"
              @input="setPageWidth"
              @click="selectFormat('custom')"
              @focus="lastFocusedInput = 'width'"
              @blur="handleInputBlur('width')")
        span(class="body-XS"
            :class="selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") W
      svg-icon(class="pointer"
          :iconName="isLocked ? 'lock' : 'unlock'"
          iconWidth="15px" :iconColor="selectedFormat === 'custom' ? 'blue-1' : isDarkTheme ? 'white' : 'blue'"
          @click="toggleLock()")
      property-bar(class="page-size-selector__body__custom__box"
                  :class="(selectedFormat === 'custom' ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (selectedFormat === 'custom' && isValidate ? heightValid ? '' : ' input-invalid' : '')")
        input(class="body-XS" type="number" min="0"
              :class="selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor"
              :value="valPageSize.height"
              @input="setPageHeight"
              @click="selectFormat('custom')"
              @focus="lastFocusedInput = 'height'"
              @blur="() => handleInputBlur('height')")
        span(class="body-XS"
            :class="selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") H
      property-bar(v-click-outside="() => {showUnitOptions = false}"
                  class="page-size-selector__body__custom__box page-size-selector__body__custom__unit pointer"
                  :class="selectedFormat === 'custom' || showUnitOptions ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`"
          @click="showUnitOptions = !showUnitOptions")
        span(class="page-size-selector__body__custom__unit__label body-XXS" :class="selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") {{selectedUnit}}
        svg-icon(class="page-size-selector__body__custom__unit__icon"
          iconName="chevron-down"
          iconWidth="16px"
          :iconColor="selectedFormat === 'custom' ? 'blue-1' : isDarkTheme ? 'white' : 'gray-2'")
        div(v-if="showUnitOptions" class="page-size-selector__body__custom__unit__option bg-white")
          div(v-for="(unit, index) in unitOptions" class="page-size-selector__body__custom__unit__option__item text-gray-2" :style="unitOptionStyles" @click="selectUnit($event, unit)")
            span(class="body-XS text-gray-1") {{unit}}
      div(v-if="selectedFormat === 'custom' && isValidate && !isCustomValid"
        class="page-size-selector__body__custom__err body-XS text-red text-left") {{errMsg}}
        span(v-if="errMsg.slice(-1) === ' '" class="pointer" @click="fixSize()") {{$t('NN0787')}}
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
        @click="submit")
      svg-icon(v-if="!inReviewMode" iconName="pro" iconWidth="22px" iconColor="alarm")
      span {{$t('NN0022')}}
</template>

<script lang="ts">
import listApi from '@/apis/list'
import Checkbox from '@/components/global/Checkbox.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import SearchBar from '@/components/SearchBar.vue'
import { IListServiceContentData } from '@/interfaces/api'
import { ILayout } from '@/interfaces/layout'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import paymentUtils from '@/utils/paymentUtils'
import webViewUtils from '@/utils/picWVUtils'
import resizeUtils from '@/utils/resizeUtils'
import stepsUtils from '@/utils/stepsUtils'
import unitUtils, { IMapSize, PRECISION, STR_UNITS } from '@/utils/unitUtils'
import vClickOutside from 'click-outside-vue3'
import { ceil, floor, round, throttle } from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  props: {
    isDarkTheme: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close'],
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
      valPageSize: { width: '', height: '' },
      pageWidth: NaN,
      pageHeight: NaN,
      pageSizes: {} as IMapSize,
      aspectRatio: NaN,
      isLocked: true,
      selectedUnit: '',
      showUnitOptions: false,
      copyBeforeApply: true,
      isValidate: false,
      lastFocusedInput: 'width'
    }
  },
  watch: {
    currFocusPageIndex: function () {
      this.handleCurrFocusPageIndexChange()
    }
  },
  computed: {
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
    inReviewMode(): boolean {
      return webViewUtils.inReviewMode
    },
    unitOptions(): string[] {
      return STR_UNITS
    },
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    isCustomValid(): boolean {
      return this.widthValid && this.heightValid && !this.isOverArea()
    },
    defaultTextColor(): string {
      return this.isDarkTheme ? 'text-white' : 'text-gray-2'
    },
    isFormatApplicable(): boolean {
      return this.selectedFormat === 'custom' ? this.isCustomValid : (this.selectedFormat !== '')
    },
    widthValid(): boolean {
      if (!this.pageWidth) return false
      if (this.pageWidth < 0) return false
      const pxWidth = unitUtils.convert(this.pageWidth, this.selectedUnit, 'px')
      if (this.isOverSize(pxWidth) || this.isUnderSize(pxWidth)) return false
      if ((this.isOverArea() && (this.isLocked || this.lastFocusedInput === 'width'))) return false
      return true
    },
    heightValid(): boolean {
      if (!this.pageHeight) return false
      if (this.pageHeight < 0) return false
      const pxHeight = unitUtils.convert(this.pageHeight, this.selectedUnit, 'px')
      if (this.isOverSize(pxHeight) || this.isUnderSize(pxHeight)) return false
      if ((this.isOverArea() && (this.isLocked || this.lastFocusedInput === 'height'))) return false
      return true
    },
    fixedSize(): {[key: string]: number, width: number, height: number} {
      const res = {
        width: this.pageWidth,
        height: this.pageHeight
      }
      if (this.isOverArea()) {
        const pxSize = this.pageSizes.px
        if (this.isLocked) {
          res.height = Math.sqrt(pageUtils.MAX_AREA / pxSize.width * pxSize.height)
          res.width = res.height / pxSize.height * pxSize.width
        } else {
          res.height = pageUtils.MAX_AREA / pxSize.width
          res.width = pageUtils.MAX_AREA / pxSize.height
        }
      } else return res
      return unitUtils.convertSize(floor(res.width), floor(res.height), 'px', this.selectedUnit)
    },
    errMsg(): string {
      const pxSize = {
        width: unitUtils.convert(this.pageWidth, this.selectedUnit, 'px'),
        height: unitUtils.convert(this.pageHeight, this.selectedUnit, 'px')
      }
      if (
        this.isOverSize(pxSize.width) ||
        this.isUnderSize(pxSize.width) ||
        this.isOverSize(pxSize.height) ||
        this.isUnderSize(pxSize.height)
      ) {
        if (this.selectedUnit === 'px') return this.$t('NN0785', { size1: pageUtils.MIN_SIZE + 'px', size2: pageUtils.MAX_SIZE + 'px' }).toString()
        const minSize: {[index: string]: number} = {
          width: unitUtils.convert(pageUtils.MIN_SIZE, 'px', this.selectedUnit),
          height: unitUtils.convert(pageUtils.MIN_SIZE, 'px', this.selectedUnit)
        }
        const maxSize: {[index: string]: number} = {
          width: unitUtils.convert(pageUtils.MAX_SIZE, 'px', this.selectedUnit),
          height: unitUtils.convert(pageUtils.MAX_SIZE, 'px', this.selectedUnit)
        }
        return this.$t('NN0785', { size1: `${ceil(minSize[this.lastFocusedInput], PRECISION)}${this.selectedUnit}`, size2: `${floor(maxSize[this.lastFocusedInput], PRECISION)}${this.selectedUnit}` }).toString()
      }
      if (this.isOverArea()) {
        return this.$t('NN0786', {
          size: `${this.isLocked ? `${floor(this.fixedSize.width, PRECISION)} x ${floor(this.fixedSize.height, PRECISION)}`
                : floor(this.fixedSize[this.lastFocusedInput], PRECISION)} ${this.selectedUnit}`
        }).toString() + ' '
      }
      return ''
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
      })).filter((layout: ILayout) => {
        const pxSize = unitUtils.convertSize(layout.width, layout.height, layout.unit, 'px')
        if (pxSize.width * pxSize.height > pageUtils.MAX_AREA) return false
        return true
      }) : []
    },
    isLayoutReady(): boolean {
      return this.formatList.length !== 0
    },
    unitOptionStyles(): {[key: string]: string} {
      return { '--color-hover': this.isDarkTheme ? '#C9DBFF' : '#E7EFFF' }
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
    isOverArea() {
      return this.pageSizes.px.width * this.pageSizes.px.height > pageUtils.MAX_AREA
    },
    isOverSize(size: number): boolean {
      return size > pageUtils.MAX_SIZE
    },
    isUnderSize(size: number): boolean {
      return size < pageUtils.MIN_SIZE
    },
    getSelectedFormat(): ILayout | undefined {
      if (this.selectedFormat === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth, height: this.pageHeight, title: '', description: '', unit: this.selectedUnit }
      } else if (this.selectedFormat.startsWith('recent')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.recentlyUsed[parseInt(index)]
        this.pageSizes = unitUtils.convertAllSize(format.width, format.height, format.unit)
        return format
      } else if (this.selectedFormat.startsWith('preset')) {
        const [type, index] = this.selectedFormat.split('-')
        const format = this.formatList[parseInt(index)]
        this.pageSizes = unitUtils.convertAllSize(format.width, format.height, format.unit)
        return format
      } else {
        return undefined
      }
    },
    toggleLock() {
      this.isLocked = !this.isLocked
      if (this.isLocked) this.aspectRatio = this.pageWidth * this.pageHeight <= 0 ? 1 : this.pageWidth / this.pageHeight
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
    handleCurrFocusPageIndexChange() {
      const { width, height, physicalWidth, physicalHeight, unit } = pageUtils.currFocusPageSize
      this.selectedUnit = unit ?? 'px'
      this.pageWidth = physicalWidth ?? width ?? 0
      this.pageHeight = physicalHeight ?? height ?? 0
      this.pageSizes = unitUtils.convertAllSize(this.pageWidth, this.pageHeight, this.selectedUnit)
      this.aspectRatio = this.pageWidth / this.pageHeight
      this.valPageSize.width = round(this.pageWidth, this.selectedUnit === 'px' ? 0 : PRECISION).toString()
      this.valPageSize.height = round(this.pageHeight, this.selectedUnit === 'px' ? 0 : PRECISION).toString()
    },
    setPageWidth(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.valPageSize.width = value
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      const striped = numValue.toString() !== value
      const roundedValue = round(numValue, this.selectedUnit === 'px' ? 0 : PRECISION)
      const rounded = this.pageWidth !== roundedValue
      this.pageWidth = roundedValue
      // set input value to this.pageWidth if no trailing zeros in value or value has been rounded
      if (!striped || rounded) this.valPageSize.width = this.pageWidth.toString()

      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageWidth = NaN
          this.pageHeight = NaN
        } else {
          this.pageHeight = this.pageWidth / this.aspectRatio
          if (this.selectedUnit === 'px') this.pageHeight = round(this.pageHeight)
          this.valPageSize.height = round(this.pageHeight, PRECISION).toString()
        }
      }
      this.pageSizes = unitUtils.convertAllSize(this.pageWidth, this.pageHeight, this.selectedUnit)
    },
    setPageHeight(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.valPageSize.height = value
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      const striped = numValue.toString() !== value
      const roundedValue = round(numValue, this.selectedUnit === 'px' ? 0 : PRECISION)
      const rounded = this.pageHeight !== roundedValue
      this.pageHeight = roundedValue
      // set input value to this.pageHeight if no trailing zeros in value or value has been rounded
      if (!striped || rounded) this.valPageSize.height = this.pageHeight.toString()

      this.selectedFormat = 'custom'
      if (this.isLocked) {
        if (value === '') {
          this.pageWidth = NaN
          this.pageHeight = NaN
        } else {
          this.pageWidth = this.pageHeight * this.aspectRatio
          if (this.selectedUnit === 'px') this.pageWidth = round(this.pageWidth)
          this.valPageSize.width = round(this.pageWidth, PRECISION).toString()
        }
      }
      this.pageSizes = unitUtils.convertAllSize(this.pageWidth, this.pageHeight, this.selectedUnit)
    },
    selectFormat(key: string) {
      this.selectedFormat = key
    },
    selectUnit(evt: Event, unit: string) {
      evt.stopPropagation()
      this.selectedFormat = 'custom'
      this.showUnitOptions = false
      if (this.selectedUnit === unit) return
      this.pageWidth = this.pageSizes[unit].width
      this.pageHeight = this.pageSizes[unit].height
      if (unit === 'px') {
        this.pageWidth = round(this.pageWidth)
        this.pageHeight = round(this.pageHeight)
      }
      this.valPageSize.width = round(this.pageWidth, PRECISION).toString()
      this.valPageSize.height = round(this.pageHeight, PRECISION).toString()
      this.selectedUnit = unit
      // this.fixSize(false)
      this.isValidate = true
    },
    applySelectedFormat(record = true) {
      if (!this.isFormatApplicable) return
      const format = this.getSelectedFormat()
      if (!format) return
      if (this.groupType !== 1) {
        // resize page with px size
        const { width, height } = this.pageSizes.px
        this.resizePage({
          width,
          height,
          physicalWidth: format.width,
          physicalHeight: format.height,
          unit: format.unit
        })
      } else {
        // resize電商詳情頁時 其他頁面要依width做resize
        const { pagesLength, getPageSize } = this
        const resizingPage = pageUtils.getPage(this.currFocusPageIndex)
        for (let pageIndex = 0; pageIndex < pagesLength; pageIndex++) {
          const isNewUnitPx = format.unit === 'px'
          if (pageIndex === this.currFocusPageIndex) { // resize current page
            this.resizePage({
              width: isNewUnitPx ? format.width : resizingPage.width,
              height: isNewUnitPx ? format.height : round(resizingPage.width / format.width * format.height),
              physicalWidth: format.width,
              physicalHeight: format.height,
              unit: format.unit
            })
          } else { // resize other pages to same px width and unit
            const { width, height, physicalWidth, physicalHeight } = getPageSize(pageIndex)
            const newWidth = format.width
            const newHeight = round(newWidth / physicalWidth * physicalHeight, isNewUnitPx ? 0 : PRECISION)
            resizeUtils.resizePage(pageIndex, this.getPage(pageIndex), {
              width: isNewUnitPx ? newWidth : width,
              height: isNewUnitPx ? newHeight : height,
              physicalWidth: newWidth,
              physicalHeight: newHeight,
              unit: format.unit
            })
          }
        }
      }

      // update recently used size
      const precision = format.unit === 'px' ? 0 : PRECISION
      format.width = round(format.width, precision)
      format.height = round(format.height, precision)

      listApi.addDesign(format.id, 'layout', format)
      const index = this.recentlyUsed.findIndex((recent) => {
        return format.id === recent.id && format.width === recent.width && format.height === recent.height && format.unit === recent.unit
      })
      this.updateRecentlyUsed({
        index,
        format
      })

      if (this.$isTouchDevice()) {
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
      page.id = generalUtils.generateRandomString(8)
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
    handleInputBlur(target: string) {
      this.isValidate = true
      if ((target === 'width' || this.isLocked) && isNaN(this.pageWidth)) {
        this.pageWidth = 0
        this.valPageSize.width = '0'
      }
      if ((target === 'height' || this.isLocked) && isNaN(this.pageHeight)) {
        this.pageHeight = 0
        this.valPageSize.height = '0'
      }
      this.pageSizes = unitUtils.convertAllSize(this.pageWidth, this.pageHeight, this.selectedUnit)
    },
    fixSize(convert = true) {
      const fixedSize = this.fixedSize
      if (this.lastFocusedInput === 'width' || this.isLocked) {
        this.pageWidth = floor(fixedSize.width, PRECISION)
        this.valPageSize.width = this.pageWidth.toString()
      }
      if (this.lastFocusedInput === 'height' || this.isLocked) {
        this.pageHeight = floor(fixedSize.height, PRECISION)
        this.valPageSize.height = this.pageHeight.toString()
      }
      if (convert) this.pageSizes = unitUtils.convertAllSize(this.pageWidth, this.pageHeight, this.selectedUnit)
    }
  }
})
</script>

<style lang="scss" scoped>
.page-size-selector {
  display: grid;
  // Set height to scroll container
  height: calc(100% - 19px);
  &.isTouchDevice {
    height: 100%;
  }
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
              background-color: var(--color-hover);
            }
            > span {
              display: block;
              text-align: left;
              height: 100%;
            }
          }
        }
      }
      &__err{
        grid-column: 2 / span 4;
        > span {
          cursor: pointer;
          text-decoration: underline;
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

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.border-blue-1 {
  border: 1px solid setColor(blue-1);
}

.input-invalid {
  border: 1px solid setColor(red) !important;
  > * {
    color: setColor(red);
  }
}

@media (max-width: 1260px) {

}
</style>
