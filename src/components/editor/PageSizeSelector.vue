<template lang="pug">
div(class="page-size-selector")
  div(class="page-size-selector__body-row first-row")
    span(class="page-size-selector__body__title subtitle-2"
      :class="defaultTextColor") {{$t('NN0023')}}
  div(class="page-size-selector__body-row")
    radio-btn(class="page-size-selector__body__radio"
              :isSelected="selectedFormat === 'custom'",
              :circleColor="isDarkTheme ? 'white' : 'gray-2'"
              formatKey="custom",
              @select="selectFormat")
    div(class="page-size-selector__body__custom")
      property-bar(class="page-size-selector__body__custom__box"
                  :class="selectedFormat === 'custom' ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`")
        input(class="body-3" type="number" min="0"
              :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor"
              :value="pageWidth" @input="setPageWidth" @click="selectFormat('custom')")
        span(class="body-4"
            :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") W
      svg-icon(class="pointer"
          :iconName="isLocked ? 'lock' : 'unlock'"
          iconWidth="15px" :iconColor="selectedFormat === 'custom' ? 'blue-1' : isDarkTheme ? 'white' : 'blue'"
          @click.native="toggleLock()")
      property-bar(class="page-size-selector__body__custom__box"
                  :class="selectedFormat === 'custom' ? 'border-blue-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`")
        input(class="body-3" type="number" min="0"
              :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor"
              :value="pageHeight" @input="setPageHeight" @click="selectFormat('custom')")
        span(class="body-4"
            :class="this.selectedFormat === 'custom' ? 'text-blue-1' : defaultTextColor") H
  div(class="page-size-selector__body__hr horizontal-rule bg-gray-4")
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
              @click="selectFormat(`recent-${index}`)") {{ makeFormatString(format) }}
      div(class="mt-10")
      div(class="page-size-selector__body-row first-row")
        span(class="page-size-selector__body__title subtitle-2"
         :class="defaultTextColor") {{$t('NN0025')}}
      div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
        svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" iconColor="white")
      div(v-for="(format, index) in formatList" class="page-size-selector__body-row pointer"
          @click="selectFormat(`preset-${index}`)")
        radio-btn(class="page-size-selector__body__radio"
                  :isSelected="selectedFormat === `preset-${index}`",
                  :circleColor="isDarkTheme ? 'white' : 'gray-2'"
                  :formatKey="`preset-${index}`",
                  @select="selectFormat")
        span(class="page-size-selector__body__typical-name body-4"
              :class="selectedFormat === `preset-${index}` ? 'text-blue-1' : defaultTextColor") {{ format.title }}
        span(class="page-size-selector__body__typical-size body-4"
              :class="selectedFormat === `preset-${index}` ? 'text-blue-1' : defaultTextColor") {{ format.description }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { ILayout } from '@/interfaces/layout'
import pageUtils from '@/utils/pageUtils'
import { IListServiceContentData } from '@/interfaces/api'
import groupUtils from '@/utils/groupUtils'
import stepsUtils from '@/utils/stepsUtils'
import listApi from '@/apis/list'
import generalUtils from '@/utils/generalUtils'
import resizeUtils from '@/utils/resizeUtils'

export default defineComponent({
  props: {
    isDarkTheme: {
      type: Boolean,
      default: true
    }
  },
  components: {
    SearchBar,
    RadioBtn
  },
  mounted() {
    this.pageWidth = this.currentPageWidth
    this.pageHeight = this.currentPageHeight
  },
  data() {
    return {
      selectedFormat: '',
      pageWidth: '' as string | number,
      pageHeight: '' as string | number,
      isLocked: true
    }
  },
  watch: {
    currentPageWidth: function (newVal) {
      this.pageWidth = newVal
      this.pageHeight = this.currentPageHeight
    },
    currentPageHeight: function (newVal) {
      this.pageWidth = this.currentPageWidth
      this.pageHeight = newVal
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
    currentPageWidth(): number {
      return Math.round(this.getPage(pageUtils.currFocusPageIndex)?.width ?? 0)
    },
    currentPageHeight(): number {
      return Math.round(this.getPage(pageUtils.currFocusPageIndex)?.height ?? 0)
    },
    aspectRatio(): number {
      return (this.getPage(pageUtils.currFocusPageIndex)?.width ?? 1) / this.getPage(pageUtils.currFocusPageIndex)?.height ?? 1
    },
    isCustomValid(): boolean {
      return this.pageWidth !== '' && this.pageHeight !== ''
    },
    defaultTextColor(): string {
      return this.isDarkTheme ? 'text-white' : 'text-gray-2'
    },
    isFormatApplicable(): boolean {
      return this.selectedFormat === 'custom' ? this.isCustomValid : (this.selectedFormat !== '')
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
        description: item.description ?? ''
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
        description: item.description ?? ''
      })) : []
    },
    isLayoutReady(): boolean {
      return this.formatList.length !== 0
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
        return { id: '', width: this.pageWidth as number, height: this.pageHeight as number, title: '', description: '' }
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
    makeFormatString(format: ILayout) {
      if (format.id !== '') {
        return `${format.title} ${format.description}`
      } else {
        return `${format.width} x ${format.height}`
      }
    },
    setPageWidth(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageWidth = typeof value === 'string' ? parseInt(value) : value
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
      this.pageHeight = typeof value === 'string' ? parseInt(value) : value
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
      this.$emit('selectFormat', key)
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
              description: item.description ?? ''
            }))
          }
          if (category.title === `${this.$t('NN0024')}`) {
            this.recentlyUsed = category.list.map(item => ({
              id: item.id,
              width: item.width ?? 0,
              height: item.height ?? 0,
              title: item.title ?? '',
              description: item.description ?? ''
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
      this.resizePage(format)
      if (this.groupType === 1) {
        // resize電商詳情頁時 其他頁面要依width做resize
        this.resizeOtherPages([pageUtils.currFocusPageIndex], { width: format.width })
      }
      listApi.addDesign(format.id, 'layout', format)
      const index = this.recentlyUsed.findIndex((recent) => {
        return format.id === recent.id && format.width === recent.width && format.height === recent.height
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
    resizePage(format: { width: number, height: number }) {
      resizeUtils.resizePage(pageUtils.currFocusPageIndex, this.getPage(pageUtils.currFocusPageIndex), format)
      this.updatePageProps({
        pageIndex: pageUtils.currFocusPageIndex,
        props: {
          width: format.width,
          height: format.height
        }
      })
    },
    resizeOtherPages(excludes: number[] = [], format: { [key: string]: number }) {
      const { pagesLength, getPageSize } = this
      for (let pageIndex = 0; pageIndex < pagesLength; pageIndex++) {
        if (excludes.includes(pageIndex)) continue
        const { width, height } = getPageSize(pageIndex)
        const newSize = {
          width: format.width || width * (format.height / height),
          height: format.height || height * (format.width / width)
        }
        resizeUtils.resizePage(pageIndex, this.getPage(pageIndex), newSize)
        this.updatePageProps({
          pageIndex,
          props: newSize
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.page-size-selector {
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
      &-center {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
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
        // &.border-blue-1 {
        //   @extend .border-blue-1;
        // }
        // &.border-white {
        //   @extend .border-white;
        // }
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
      @extend .page-size-selector__body__text;
      width: 88%;
    }
    &__typical-name {
      @extend .page-size-selector__body__text;
      width: 37%;
    }
    &__typical-size {
      @extend .page-size-selector__body__text;
      width: 45%;
      white-space: nowrap;
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
  }
  &__footer {
    height: 20px;
  }
  &__container {
    max-height: 500px;
    margin-right: -5px;
    padding-right: 5px;
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
.horizontal-rule {
  height: 1px;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
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
</style>
