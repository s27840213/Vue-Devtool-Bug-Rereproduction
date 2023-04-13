<template lang="pug">
div(class="page-size-selector")
  div(v-if="isMobile" class="page-size-selector__body-row first-row")
    span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0023')}}
  div(class="page-size-selector__body-row")
    div(class="page-size-selector__body__custom")
      property-bar(class="page-size-selector__body__custom__box"
                  :class="(selectedFormatKey === 'custom' ? 'border-black-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (selectedFormatKey === 'custom' && isValidate ? widthValid ? '' : ' input-invalid' : '')")
        input(class="body-3 page-size-selector__body__custom__box__input" type="number" min="0" ref="inputWidth"
              :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor"
              :style="{position: isInputFocused ? 'static' : 'fixed'}"
              :value="valPageSize.width" :placeholder="isMobile ? $t('NN0320') : $t('NN0163', {term: $t('NN0320')})"
              @click="selectFormat('custom')"
              @input="setPageWidth"
              @focus="lastFocusedInput = 'width'"
              @blur="handleInputBlur('width')")
        input(v-if="!isInputFocused"
              class="body-3 page-size-selector__body__custom__box__input dummy" type="number" min="0"
              readonly
              :class="(selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor)"
              :value="valPageSize.width" :placeholder="isMobile ? $t('NN0320') : $t('NN0163', {term: $t('NN0320')})"
              @click="handleDummyClick($event, $refs.inputWidth, 'width')")
        span(class="body-4 page-size-selector__body__custom__box__input-label"
            :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor") W
      svg-icon(class="pointer"
          :iconName="isLocked ? 'lock' : 'unlock'"
          iconWidth="20px" :iconColor="selectedFormatKey === 'custom' ? 'black' : (isDarkTheme ? 'white' : 'gray-4')"
          @click="toggleLock()")
      property-bar(class="page-size-selector__body__custom__box"
                  :class="(selectedFormatKey === 'custom' ? 'border-black-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (selectedFormatKey === 'custom' && isValidate ? heightValid ? '' : ' input-invalid' : '')")
        input(class="body-3 page-size-selector__body__custom__box__input" type="number" min="0" ref="inputHeight"
              :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor"
              :style="{position: isInputFocused ? 'static' : 'fixed'}"
              :value="valPageSize.height" :placeholder="isMobile ? $t('NN0319') : $t('NN0163', {term: $t('NN0319')})"
              @click="selectFormat('custom')"
              @input="setPageHeight"
              @focus="lastFocusedInput = 'height'"
              @blur="handleInputBlur('height')")
        input(v-if="!isInputFocused"
              class="body-3 page-size-selector__body__custom__box__input dummy" type="number" min="0"
              readonly
              :class="(selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor)"
              :value="valPageSize.height" :placeholder="isMobile ? $t('NN0319') : $t('NN0163', {term: $t('NN0319')})"
              @click="handleDummyClick($event, $refs.inputHeight, 'height')")
        span(class="body-4 page-size-selector__body__custom__box__input-label"
            :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor") H
      property-bar(v-click-outside="() => {showUnitOptions = false}"
                    class="page-size-selector__body__custom__box page-size-selector__body__custom__unit pointer"
                    @click="showUnitOptions = !showUnitOptions")
        span(class="page-size-selector__body__custom__unit__label body-XXS" :class="selectedFormatKey === 'custom' ? 'black' : defaultTextColor") {{selectedUnit}}
        svg-icon(class="page-size-selector__body__custom__unit__icon"
          iconName="chevron-down"
          iconWidth="16px"
          :iconColor="selectedFormatKey === 'custom' ? 'black' : 'gray-3'")
        div(v-if="showUnitOptions" class="page-size-selector__body__custom__unit__option bg-white")
          div(v-for="(unit) in unitOptions" :key="unit" class="page-size-selector__body__custom__unit__option__item text-black" @click="selectUnit($event, unit)")
            span(class="body-XS text-black") {{unit}}
      div(v-if="selectedFormatKey === 'custom' && isValidate && !isCustomValid"
        class="page-size-selector__body__custom__err body-XS text-red") {{errMsg}}
        span(v-if="errMsg.slice(-1) === ' '" class="pointer" @click="fixSize()") {{'Fix it for me.'}}
  div(class="page-size-selector__body__hr horizontal-rule bg-gray-4")
  div(class="page-size-selector__container"
    @touchmove="handleTouchMove")
      div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
        svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" :iconColor="defaultTextColor")
      div(v-if="isLayoutReady && recentlyUsed.length > 0" class="page-size-selector__body-row first-row")
        span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0024')}}
      div(v-for="(format, index) in recentlyUsed"
          :key="format.id"
          class="page-size-selector__body-row item pointer"
          @click="selectFormat(`recent-${index}`)")
        radio-btn(class="page-size-selector__body-row__radio"
                  :isSelected="selectedFormatKey === `recent-${index}`",
                  :circleColor="isDarkTheme ? 'white' : 'light-gray'"
                  :formatKey="`recent-${index}`",
                  @select="selectFormat")
        div(v-if="isMobile" class="page-size-selector__body-row__content")
          span(class="page-size-selector__body__recently body-3 pointer"
                :class="selectedFormatKey === `recent-${index}` ? 'text-black' : defaultTextColor") {{ format.description ? format.title : makeFormatTitle(format) }}
          span(v-if="format.description" class="page-size-selector__body__recently body-3 pointer"
                :class="selectedFormatKey === `recent-${index}` ? 'text-black' : defaultTextColor") {{ makeFormatDescription(format) }}
        div(v-else class="page-size-selector__body-row__content")
          span(class="page-size-selector__body__recently body-3 pointer"
            :class="selectedFormatKey === `recent-${index}` ? 'text-black' : defaultTextColor") {{ makeFormatTitle(format) }}
      div(v-if="isLayoutReady && formatList.length > 0" class="page-size-selector__body-row first-row")
        span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0025')}}
      div(v-for="(format, index) in formatList"
          :key="format.id"
          class="page-size-selector__body-row item pointer"
          @click="selectFormat(`preset-${index}`)")
        radio-btn(class="page-size-selector__body-row__radio"
                  :isSelected="selectedFormatKey === `preset-${index}`",
                  :circleColor="isDarkTheme ? 'white' : 'light-gray'"
                  :formatKey="`preset-${index}`",
                  @select="selectFormat")
        div(v-if="isMobile" class="page-size-selector__body-row__content")
          span(class="page-size-selector__body__typical-name body-4"
                :class="selectedFormatKey === `preset-${index}` ? 'text-blue-1' : defaultTextColor") {{ format.title }}
          span(class="page-size-selector__body__typical-size body-4"
                :class="selectedFormatKey === `preset-${index}` ? 'text-blue-1' : defaultTextColor") {{ makeFormatDescription(format) }}
        div(v-else class="page-size-selector__body-row__content")
          span(class="page-size-selector__body__typical-name body-4"
                :class="selectedFormatKey === `preset-${index}` ? 'text-blue-1' : defaultTextColor") {{ makeFormatTitle(format) }}
</template>

<script lang="ts">
import RadioBtn from '@/components/global/RadioBtn.vue'
import { IListServiceContentData } from '@/interfaces/api'
import { ILayout } from '@/interfaces/layout'
import pageUtils from '@/utils/pageUtils'
import unitUtils, { IMapSize, PRECISION, STR_UNITS } from '@/utils/unitUtils'
import vClickOutside from 'click-outside-vue3'
import { ceil, floor, round } from 'lodash'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

const component = defineComponent({
  props: {
    isDarkTheme: {
      type: Boolean,
      default: false
    },
    isValidate: {
      type: Boolean,
      default: false
    },
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    RadioBtn
  },
  emits: ['select'],
  created() {
    this.pageSizes = unitUtils.convertAllSize(0, 0, this.selectedUnit)
  },
  mounted() {
    document.addEventListener('scroll', this.handleScroll)
    this.fetchLayouts()
    const inputWidth = this.$refs.inputWidth as HTMLInputElement
    inputWidth.focus({ preventScroll: true })
    if (this.isMobile) {
      // prevent document scroll
      setTimeout(() => {
        this.isInputFocused = true
      }, 100)
    } else {
      // disable dummy inputs
      this.isInputFocused = true
    }
  },
  beforeUnmount() {
    document.removeEventListener('scroll', this.handleScroll)
  },
  data() {
    return {
      selectedFormatKey: 'custom',
      valPageSize: { width: '', height: '' },
      pageWidth: 0,
      pageHeight: 0,
      pageSizes: {} as IMapSize,
      aspectRatio: 1,
      isLocked: false,
      unitOptions: STR_UNITS,
      selectedUnit: 'px',
      showUnitOptions: false,
      formatList: new Array<ILayout>(),
      recentlyUsed: new Array<ILayout>(),
      isLayoutReady: false,
      isInputFocused: false,
      lastFocusedInput: 'width'
    }
  },
  watch: {
    selectedFormat(layout: ILayout) {
      this.$emit('select', layout)
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
      pagesLength: 'getPagesLength'
    }),
    isCustomValid(): boolean {
      return this.widthValid && this.heightValid && !this.isOverArea()
    },
    defaultTextColor(): string {
      return this.isDarkTheme ? 'text-white' : 'text-gray-3'
    },
    // Call by PanelSize and PopupSize.vue
    // eslint-disable-next-line vue/no-unused-properties
    isFormatApplicable(): boolean {
      return this.selectedFormatKey === 'custom' ? this.isCustomValid : (this.selectedFormatKey !== '')
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
    selectedFormat(): ILayout | undefined {
      if (this.selectedFormatKey === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth, height: this.pageHeight, title: '', description: '', unit: this.selectedUnit }
      } else if (this.selectedFormatKey.startsWith('recent')) {
        const [type, index] = this.selectedFormatKey.split('-')
        const format = this.recentlyUsed[parseInt(index)]
        return format
      } else if (this.selectedFormatKey.startsWith('preset')) {
        const [type, index] = this.selectedFormatKey.split('-')
        const format = this.formatList[parseInt(index)]
        return format
      } else {
        return undefined
      }
    }
  },
  methods: {
    ...mapMutations({
      updateRecentlyUsed: 'layouts/UPDATE_RECENTLY_PAGE'
    }),
    ...mapActions('layouts',
      [
        'getRecently'
      ]
    ),
    isOverArea(): boolean {
      return this.pageSizes.px.width * this.pageSizes.px.height > pageUtils.MAX_AREA
    },
    isOverSize(size: number): boolean {
      return size > pageUtils.MAX_SIZE
    },
    isUnderSize(size: number): boolean {
      return size < pageUtils.MIN_SIZE
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

      this.selectFormat('custom')
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

      this.selectFormat('custom')
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
      this.selectedFormatKey = key
    },
    selectUnit(evt: Event, unit: string) {
      evt.stopPropagation()
      this.selectFormat('custom')
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
            })).filter((layout: ILayout) => {
              const pxSize = unitUtils.convertSize(layout.width, layout.height, layout.unit, 'px')
              return !(pxSize.width * pxSize.height > pageUtils.MAX_AREA)
            })
          }
        }
        if (this.formatList.length > 0) {
          this.isLayoutReady = true
        }
      })
    },
    handleTouchMove(evt: Event) {
      evt.stopPropagation()
    },
    handleScroll() {
      (this.$refs.inputWidth as HTMLElement).blur();
      (this.$refs.inputHeight as HTMLElement).blur()
    },
    handleDummyClick(evt: Event, target: any, targetKey: string) {
      evt.preventDefault()
      this.selectFormat('custom')
      target = target as HTMLInputElement
      target.focus({ preventScroll: true })
      this.lastFocusedInput = targetKey
      // prevent document scroll
      setTimeout(() => {
        this.isInputFocused = true
      }, 100)
    },
    handleInputBlur(target: string) {
      if ((target === 'width' || this.isLocked) && isNaN(this.pageWidth)) {
        this.pageWidth = 0
        this.valPageSize.width = ''
      }
      if ((target === 'height' || this.isLocked) && isNaN(this.pageHeight)) {
        this.pageHeight = 0
        this.valPageSize.height = ''
      }
      this.pageSizes = unitUtils.convertAllSize(this.pageWidth, this.pageHeight, this.selectedUnit)
      if (this.isMobile) {
        setTimeout(() => {
          if (document.activeElement !== this.$refs.inputWidth && document.activeElement !== this.$refs.inputHeight) this.isInputFocused = false
        }, 0)
      }
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

export default component
export type CPageSizeSelector = InstanceType<typeof component>
</script>

<style lang="scss" scoped>
.page-size-selector {
  height: 100%;
  text-align: left;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  &__body {
    background-color: setColor(gray-1-5);
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
    padding: 11.57px;
    &-row {
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      width: 100%;
      margin-left: auto;
      margin-top: 15px;
      margin-right: auto;
      align-items: center;
      &-center {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      &.first-row {
        display: block;
        margin-top: 0px;
        color: setColor(gray-2);
        letter-spacing: 1.5px;
      }
      &.item {
        display: grid;
        margin: 0px;
        padding: 2px 16px;
        grid-template-columns: 28px 1fr;
        justify-content: left;
      }
      &__radio {
        height: 24px;
        display: flex;
        align-items: center;
      }
      &__content {
        height: 24px;
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
        justify-content: space-between;
        white-space: nowrap;
        line-height: 20px;
      }
    }
    &__title {
      font-weight: 700;
    }
    &__custom {
      width: 100%;
      display: grid;
      grid-template-columns: auto 20px auto 50px;
      grid-template-rows: auto;
      column-gap: 6px;
      align-items: center;
      &__box {
        height: 30px;
        box-sizing: border-box;
        padding: 5px 5px;
        &__input-label {
          width: 30px;
          font-weight: 700;
          text-align: center;
        }
        &__input {
          position: fixed;
          top: -99999px;
          background-color: transparent;
          &::placeholder {
            /* Chrome, Firefox, Opera, Safari 10.1+ */
            color: setColor(gray-3);
            opacity: 1; /* Firefox */
          }
          &:-ms-input-placeholder {
            /* Internet Explorer 10-11 */
            color: setColor(gray-3);
          }
          &::-ms-input-placeholder {
            /* Microsoft Edge */
            color: setColor(gray-3);
          }
          &.dummy{
            position: static;
          }
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
      &__err{
        grid-column: 1 / span 4;
        > span {
          cursor: pointer;
          text-decoration: underline;
        }
      }
    }
    &__hr {
      width: 100%;
      margin-top: 20px;
      margin-bottom: 20px;
    }
  }
  &__container {
    display: grid;
    gap: 4px;
    overflow-y: auto; // overlay is not supported in Firefox
    scrollbar-width: thin;
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
.horizontal-rule {
  height: 1px;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
}

.input-invalid {
  border: 1px solid setColor(red) !important;
}

@media screen and (max-width: 540px) {
  .page-size-selector__body-row {
    padding: 0px 8px;
  }

  .page-size-selector__body-row.item {
    padding: 4px 16px;
  }
}
</style>
