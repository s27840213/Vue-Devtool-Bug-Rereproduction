<template lang="pug">
  div(class="page-size-selector")
    div(class="page-size-selector__body-row first-row")
      span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0023')}}
    div(class="page-size-selector__body-row")
      //- radio-btn(class="page-size-selector__body__radio"
      //-           :isSelected="selectedFormatKey === 'custom'",
      //-           :circleColor="isDarkTheme ? 'white' : 'gray-2'"
      //-           formatKey="custom",
      //-           @select="selectFormat")
      div(class="page-size-selector__body__custom")
        property-bar(class="page-size-selector__body__custom__box"
                    :class="(selectedFormatKey === 'custom' ? 'border-black-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (isValidate ? widthValid ? '' : ' input-invalid' : '')")
          input(class="body-3" type="number" min="0" ref="inputWidth"
                :class="(selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor)"
                :value="pageWidth || null" :placeholder="$t('NN0163', {term: $t('NN0320')})" @click="selectFormat('custom')" @input="setPageWidth")
          span(class="body-4"
              :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor") W
        svg-icon(class="pointer"
            :iconName="isLocked ? 'lock' : 'unlock'"
            iconWidth="15px" :iconColor="!isLockDisabled ? (selectedFormatKey === 'custom' ? 'black' : (isDarkTheme ? 'white' : 'gray-3')) : 'gray-3'"
            @click.native="toggleLock()")
        property-bar(class="page-size-selector__body__custom__box"
                    :class="(selectedFormatKey === 'custom' ? 'border-black-1' : `border-${isDarkTheme ? 'white' : 'gray-2'}`) + (isValidate ? heightValid ? '' : ' input-invalid' : '')")
          input(class="body-3" type="number" min="0"
                :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor"
                :value="pageHeight || null" :placeholder="$t('NN0163', {term: $t('NN0319')})" @click="selectFormat('custom')" @input="setPageHeight")
          span(class="body-4"
              :class="selectedFormatKey === 'custom' ? 'text-black' : defaultTextColor") H
        div(v-if="isValidate && !isCustomValid"
          class="page-size-selector__body__custom__err text-red") {{errorMsg}}
    div(class="page-size-selector__body__hr horizontal-rule bg-gray-4")
    div(class="page-size-selector__container")
        div(class="page-size-selector__body-row first-row")
          span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0024')}}
        div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
          svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" :iconColor="defaultTextColor")
        div(v-for="(format, index) in recentlyUsed" class="page-size-selector__body-row pointer"
            @click="selectFormat(`recent-${index}`)")
          radio-btn(class="page-size-selector__body__radio"
                    :isSelected="selectedFormatKey === `recent-${index}`",
                    :circleColor="isDarkTheme ? 'white' : 'gray-2'"
                    :formatKey="`recent-${index}`",
                    @select="selectFormat")
          span(class="page-size-selector__body__recently body-3 pointer"
                :class="selectedFormatKey === `recent-${index}` ? 'text-black' : defaultTextColor") {{ makeFormatString(format) }}
        div(class="mt-10")
        div(class="page-size-selector__body-row first-row")
          span(class="page-size-selector__body__title subtitle-2 text-black") {{$t('NN0025')}}
        div(v-if="!isLayoutReady" class="page-size-selector__body-row-center")
          svg-icon(iconName="loading" iconWidth="25px" iconHeight="10px" iconColor="white")
        div(v-for="(format, index) in formatList" class="page-size-selector__body-row pointer"
            @click="selectFormat(`preset-${index}`)")
          radio-btn(class="page-size-selector__body__radio"
                    :isSelected="selectedFormatKey === `preset-${index}`",
                    :circleColor="isDarkTheme ? 'white' : 'gray-2'"
                    :formatKey="`preset-${index}`",
                    @select="selectFormat")
          span(class="page-size-selector__body__typical-name body-3"
                :class="selectedFormatKey === `preset-${index}` ? 'text-black' : defaultTextColor") {{ makeFormatString(format)}}
</template>

<script lang="ts">
import Vue from 'vue'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { ILayout } from '@/interfaces/layout'
import pageUtils from '@/utils/pageUtils'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import groupUtils from '@/utils/groupUtils'
import stepsUtils from '@/utils/stepsUtils'
import listApi from '@/apis/list'
import generalUtils from '@/utils/generalUtils'
import resizeUtils from '@/utils/resizeUtils'

// TODO: merge with @/components/editor/PageSizeSelector.vue

export default Vue.extend({
  props: {
    isDarkTheme: {
      type: Boolean,
      default: false
    },
    isValidate: {
      type: Boolean,
      default: false
    }
  },
  components: {
    RadioBtn
  },
  mounted() {
    this.fetchLayouts();
    (this.$refs.inputWidth as HTMLInputElement).focus()
  },
  data() {
    return {
      // TODO: dafault value
      selectedFormatKey: 'custom',
      pageWidth: NaN,
      pageHeight: NaN,
      aspectRatio: 1,
      isLocked: false,
      errorMsg: '',
      formatList: new Array<ILayout>(),
      recentlyUsed: new Array<ILayout>(),
      isLayoutReady: false
    }
  },
  watch: {
    isValidate() {
      if (this.selectedFormatKey === 'custom' && this.isValidate && !this.isCustomValid) {
        // TODO: translate
        this.errorMsg = '請輸入大於 0 的數字'
      }
    },
    selectedFormat(layout: ILayout) {
      this.$emit('select', layout)
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
    isCustomValid(): boolean {
      return this.widthValid && this.heightValid
    },
    defaultTextColor(): string {
      return this.isDarkTheme ? 'text-white' : 'text-gray-3'
    },
    isFormatApplicable(): boolean {
      return this.selectedFormatKey === 'custom' ? this.isCustomValid : (this.selectedFormatKey !== '')
    },
    widthValid(): boolean {
      return !!this.pageWidth && this.pageWidth > 0
    },
    heightValid(): boolean {
      return !!this.pageHeight && this.pageHeight > 0
    },
    isLockDisabled(): boolean {
      return this.selectedFormatKey !== 'custom' || !this.isCustomValid
    },
    selectedFormat(): ILayout | undefined {
      if (this.selectedFormatKey === 'custom') {
        if (!this.isCustomValid) return undefined
        return { id: '', width: this.pageWidth as number, height: this.pageHeight as number, title: '', description: '' }
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
    // formatList(): ILayout[] {
    //   const targetCategory = this.categories.find((category: IListServiceContentData) => {
    //     return category.title === `${this.$t('NN0025')}`
    //   })
    //   return targetCategory ? targetCategory.list.map((item: any) => ({
    //     id: item.id,
    //     width: item.width ?? 0,
    //     height: item.height ?? 0,
    //     title: item.title ?? '',
    //     description: item.description ?? ''
    //   })) : []
    // },
    // recentlyUsed(): ILayout[] {
    //   const targetCategory = this.categories.find((category: any) => {
    //     return category.title === `${this.$t('NN0024')}`
    //   })
    //   return targetCategory ? targetCategory.list.map((item: any) => ({
    //     id: item.id,
    //     width: item.width ?? 0,
    //     height: item.height ?? 0,
    //     title: item.title ?? '',
    //     description: item.description ?? ''
    //   })) : []
    // }
    // isLayoutReady(): boolean {
    //   return this.formatList.length !== 0
    // }
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
    toggleLock() {
      if (this.isLockDisabled) return
      this.isLocked = !this.isLocked
      if (this.isLocked) {
        this.aspectRatio = (this.pageWidth ?? 1) / (this.pageHeight ?? 1)
      }
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
      this.pageWidth = parseInt(value)
      if (this.isLocked) {
        if (value === '') {
          this.pageHeight = NaN
        } else {
          this.pageHeight = Math.round(parseInt(value) / this.aspectRatio)
        }
      }
      // console.log(this.pageWidth)
    },
    setPageHeight(event: Event) {
      const value = (event.target as HTMLInputElement).value
      this.pageHeight = parseInt(value)
      if (this.isLocked) {
        if (value === '') {
          this.pageWidth = NaN
        } else {
          this.pageWidth = Math.round(parseInt(value) * this.aspectRatio)
        }
      }
    },
    selectFormat(key: string) {
      this.selectedFormatKey = key
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
        if (this.formatList.length > 0) {
          this.isLayoutReady = true
        }
      })
    }
    // applySelectedFormatKey(record = true) {
    //   if (!this.isFormatApplicable) return
    //   const format = this.getSelectedFormatKey()
    //   if (!format) return
    //   this.resizePage(format)
    //   if (this.groupType === 1) {
    //     // resize電商詳情頁時 其他頁面要依width做resize
    //     this.resizeOtherPages([pageUtils.currFocusPageIndex], { width: format.width })
    //   }
    //   listApi.addDesign(format.id, 'layout', format)
    //   const index = this.recentlyUsed.findIndex((recent) => {
    //     return format.id === recent.id && format.width === recent.width && format.height === recent.height
    //   })
    //   this.updateRecentlyUsed({
    //     index,
    //     format
    //   })

    //   if (generalUtils.isTouchDevice()) {
    //     pageUtils.fitPage()
    //   }
    //   if (record) {
    //     stepsUtils.record()
    //   }
    // }
  }
})
</script>

<style lang="scss" scoped>
.page-size-selector {
  text-align: left;
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
      margin-right: auto;
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
      column-gap: 18px;
      align-items: center;
      // width: 85%;
      &__box {
        height: 26px;
        box-sizing: border-box;
        padding: 5px 5px;
        & input {
          line-height: 16px;
          background-color: transparent;
          font-family: Mulish;
          &::placeholder{
            color: setColor(gray-3);
          }
        }
        // &.border-black-1 {
        //   @extend .border-black-1;
        //   border: solid 1px black;
        // }
      }
      &__err{
        grid-column: 1 / 4;
      }
    }
    &__hr {
      margin-top: 24px;
      margin-bottom: 24px;
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
      width: 88%;
    }
    &__typical-size {
      @extend .page-size-selector__body__text;
      width: 45%;
      white-space: nowrap;
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
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
      // background-color: rgba(24, 25, 31, 0.5);
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

.input-invalid {
  border: 1px solid setColor(red) !important;
}
</style>
