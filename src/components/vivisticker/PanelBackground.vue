<template lang="pug">
div(class="panel-bg rwd-container" :class="{'in-category': isInCategory}")
  tabs(v-if="!isInCategory"
        class="panel-bg__tabs"
        :tabs="[$tc('NN0002', 2),$t('NN0017')]"
        v-model="tabIndex")
  div(v-show="showImageTab" class="panel-bg__list-wrapper")
    search-bar(v-if="!isInCategory && showImageTab" class="panel-bg__searchbar"
      :placeholder="$t('NN0092', {target: $tc('NN0004',1)})"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="dark"
      :color="{close: 'black-5', search: 'black-5'}"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    category-list(v-for="item in categoryListArray"
                v-show="item.show" :ref="item.key" :key="item.key"
                class="panel-bg__list"
                :list="item.content" @loadMore="handleLoadMore")
      template(#before)
        div(class="panel-bg__top-item")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
          :list="list"
          :title="title"
          @action="handleCategorySearch")
          template(v-slot:preview="{ item }")
            category-background-item(class="panel-bg__item"
              :item="item"
              :locked="false"
              :style="itemStyles"
              @share="handleShareImage")
      template(v-slot:category-background-item="{ list, title }")
        div(class="panel-bg__items")
          div(v-if="title"
            class="panel-bg__header") {{ title }}
          category-background-item(v-for="item in list"
            class="panel-bg__item"
            :key="item.id"
            :item="item"
            :locked="false"
            :style="itemStyles"
            @share="handleShareImage")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
  div(v-show="!showImageTab" class="panel-bg__color-tab")
    div(class="panel-bg__color-tab-wrapper" :style="colorTabWrapperStyles()")
      div(class="panel-bg__color-area")
        div(class="panel-bg__color-row")
          div(class="panel-bg__color-row-header py-5 text-white")
            div(class="panel-bg__color-row-left")
              div(v-if="showAllRecentlyBgColors" class="panel-bg__color-row-back" @click.prevent.stop="handleShowAllRecentlyBgColors(false)")
                svg-icon(iconName="vivisticker_back" iconColor="white" iconWidth="24px")
              div(class="panel-bg__color-row-title") {{$t('NN0024')}}
            div(v-if="!showAllRecentlyBgColors" class="panel-bg__color-row-more" @click.prevent.stop="handleShowAllRecentlyBgColors(true)") {{$t('NN0082')}}
          div(class="panel-bg__colors")
            div(class="panel-bg__color add-color" @click="handleOpenColorPicker")
            div(v-if="hasNewBgColor"
              class="panel-bg__color"
              :style="colorStyles(currColor)")
            div(v-for="color in recentlyColors"
              class="panel-bg__color"
              :key="color"
              v-press="() => handleShareColor(color)"
              :style="colorStyles(color)"
              @click="setBgColor(color)")
        div(v-if="!showAllRecentlyBgColors" class="panel-bg__color-row")
          div(class="panel-bg__color-row-title text-left py-5 text-white") {{$t('NN0089')}}
          div(class="panel-bg__colors")
            div(v-for="color in defaultBgColor"
              class="panel-bg__color"
              :key="color"
              v-press="() => handleShareColor(color)"
              :style="colorStyles(color)"
              @click="setBgColor(color)")
      div(class="panel-bg__color-controller")
        mobile-slider(:title="`${$t('NN0030')}`"
          :borderTouchArea="true"
          :value="opacity"
          :min="0"
          :max="100"
          theme="light"
          @update="updateOpacity")
        div(v-if="!isInEditor" class="panel-bg__color-controller__hint")
          p(class="panel-bg__color-controller__hint-text") {{ $t('STK0002') }}
          p(class="panel-bg__color-controller__hint-text") {{ $t('STK0003') }}
  div(v-if="isInBgShare" class="panel-bg__share")
    div(class="panel-bg__share__screen" :style="bgSizeStyles")
      div(class="panel-bg__share__screen-inner" :style="shareBgStyles()")
    div(class="panel-bg__share__buttons")
      div(class="panel-bg__share__button")
        div(class="panel-bg__share__button-icon" @click.stop.prevent="handleSave")
          svg-icon(iconName="download_flat" iconColor="white" iconWidth="24px" iconHeight="26.76px")
        div(class="panel-bg__share__button-text") {{ $t('STK0004') }}
      div(class="panel-bg__share__button")
        div(class="panel-bg__share__button-icon" @click.stop.prevent="handleStory")
          svg-icon(iconName="ig_story" iconColor="white" iconWidth="30px")
        div(class="panel-bg__share__button-text") {{ $t('STK0005') }}
</template>

<script lang="ts">
import CategoryBackgroundItem from '@/components/category/CategoryBackgroundItem.vue'
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import SearchBar from '@/components/SearchBar.vue'
import Tabs from '@/components/Tabs.vue'
import i18n from '@/i18n'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import assetUtils from '@/utils/assetUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import pageUtils from '@/utils/pageUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { notify } from '@kyvg/vue3-notification'
import { round } from 'lodash'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  name: 'panel-background',
  components: {
    SearchBar,
    MobileSlider,
    CategoryList,
    CategoryListRows,
    CategoryBackgroundItem,
    Tabs
  },
  props: {
    currPage: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  data() {
    return {
      scrollTop: {
        mainContent: 0,
        searchResult: 0
      },
      tabIndex: 0,
      opacity: 100,
      showAllRecentlyBgColors: false
    }
  },
  computed: {
    ...mapState({
      isTablet: 'isTablet',
      windowSize: 'windowSize'
    }),
    ...mapState('background', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      keyword: 'keyword'
    }),
    ...mapGetters({
      getPage: 'getPage',
      defaultBgColor: 'color/getDefaultViviStickerBgColors',
      getBackgroundColor: 'getBackgroundColor',
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently',
      isInBgShare: 'vivisticker/getIsInBgShare',
      shareItem: 'vivisticker/getShareItem',
      shareColor: 'vivisticker/getShareColor',
      allRecentlyColors: 'vivisticker/getRecentlyBgColors',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
      hasNewBgColor: 'vivisticker/getHasNewBgColor',
      currColor: 'color/currColor',
      pending: 'background/pending',
      isInEditor: 'vivisticker/getIsInEditor',
      currActiveBackgroundTab: 'vivisticker/getCurrActiveBackgroundTab'
    }),
    itemWidth(): number {
      return this.isTablet ? 120 : 80
    },
    itemHeight(): number {
      // const basicWidth = (window.outerWidth - 48 - 10) / 2 // (100vw - panel-left-right-padding - gap) / 2
      // return basicWidth < 145 ? basicWidth : 145 // 145px is the default width
      return round(this.itemWidth / 9 * 16)
    },
    isInCategory(): boolean {
      return this.isTabInCategory('background')
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('background')
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    recentlyColors(): string[] {
      return this.showAllRecentlyBgColors ? this.allRecentlyColors : this.allRecentlyColors.slice(0, 20)
    },
    listCategories(): ICategoryItem[] {
      const titleHeight = 46
      const gap = this.isTablet ? 20 : 14
      const { categories } = this
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0)
        .map((category, index) => ({
          size: this.itemHeight + gap + titleHeight,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.is_recent ? category.list.slice(0, 10) : category.list,
          title: category.title
        }))
    },
    listRecently(): ICategoryItem[] {
      const { categories } = this
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-background-item',
            list: rowItems,
            size: this.itemHeight + 32,
            title: ''
          }
        })
      return result
    },
    listResult(): ICategoryItem[] {
      return this.processListResult(this.rawContent.list, false)
    },
    searchResult(): ICategoryItem[] {
      const list = this.processListResult(this.rawSearchResult.list, true)
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: true })
      }
      return list
    },
    mainContent(): ICategoryItem[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      const list = generalUtils.deepCopy(this.listCategories.concat(this.listResult))
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: true })
      }
      return list
    },
    categoryListArray(): ICategoryList[] {
      return [{
        content: this.searchResult,
        show: this.keyword && this.showImageTab,
        key: 'searchResult'
      }, {
        content: this.mainContent,
        show: !this.keyword && this.showImageTab,
        key: 'mainContent'
      }]
    },
    emptyResultMessage(): string {
      const { keyword, pending } = this
      if (pending || !keyword || this.rawSearchResult.list.length > 0) return ''
      return `${i18n.global.t('NN0393', {
          keyword: this.keywordLabel,
          target: i18n.global.tc('NN0004', 1)
        })}`
    },
    showImageTab(): boolean {
      return this.tabIndex === 0
    },
    itemStyles(): {[key: string]: string} {
      return {
        width: this.itemWidth + 'px',
        height: this.itemHeight + 'px'
      }
    },
    bgSizeStyles() {
      const height = (this.windowSize.height - 44) * 0.73
      return {
        width: `${height / 16 * 9}px`,
        height: `${height}px`
      }
    },
    colorAreaHeight() {
      return this.windowSize.height - (this.isInEditor ? 295 : 176)
    },
    currentPageBackgroundLocked(): boolean {
      const { backgroundImage } = this.currPage
      return backgroundImage && backgroundImage.config.locked
    },
  },
  created() {
    if (this.currActiveBackgroundTab) this.tabIndex = this.currActiveBackgroundTab === 'photos' ? 0 : this.currActiveBackgroundTab === 'color' ? 1 : 0
  },
  mounted() {
    eventUtils.on(PanelEvent.scrollPanelBackgroundToTop, this.scrollToTop)
    if (this.categories.length !== 0 || this.rawContent.list || this.rawSearchResult.list || this.pending) return
    generalUtils.panelInit('bg',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getRecAndCate({ reset, key: 'background' })
        await vivistickerUtils.listAsset('backgroundColor')
      })
  },
  activated() {
    this.$nextTick(() => {
      const mainContent = (this.$refs.mainContent as CCategoryList[])[0].$el
      const searchResult = (this.$refs.searchResult as CCategoryList[])[0].$el
      mainContent.scrollTop = this.scrollTop.mainContent
      searchResult.scrollTop = this.scrollTop.searchResult
      mainContent.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
      searchResult.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
    })
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.scrollPanelBackgroundToTop)
  },
  watch: {
    opacity(newVal) {
      this.opacity = Math.max(Math.min(newVal, 100), 0)
    },
    currActivePanel(newVal, oldVal) {
      if (oldVal === 'color-picker') {
        if (newVal === 'none') {
          vivistickerUtils.commitNewBgColor()
        }
        this.setHasNewBgColor(false)
      }
    },
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          const mainContent = (this.$refs.mainContent as CCategoryList[])[0].$el
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          mainContent.scrollTop = this.scrollTop.mainContent
        })
      }
    },
    showImageTab() {
      this.$nextTick(() => {
        const ref = this.$refs as Record<string, CCategoryList[]>
        for (const name of ['mainContent', 'searchResult']) {
          ref[name][0].$el.scrollTop = this.scrollTop[name as 'mainContent'|'searchResult']
        }
      })
    },
    tabIndex(newVal) {
      this.setCurrActiveBackgroundTab(newVal === 1 ? 'color' : newVal === 0 ? 'photos' : '')
    }
  },
  methods: {
    ...mapActions('background', [
      'getContent',
      'getTagContent',
      'getRecently',
      'getRecAndCate',
      'getMoreContent',
      'resetSearch'
    ]),
    ...mapMutations({
      _setBgColor: 'SET_backgroundColor',
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag',
      setIsInBgShare: 'vivisticker/SET_isInBgShare',
      setShareItem: 'vivisticker/SET_shareItem',
      setShareColor: 'vivisticker/SET_shareColor',
      addRecentlyBgColor: 'vivisticker/UPDATE_addRecentlyBgColor',
      setHasNewBgColor: 'vivisticker/SET_hasNewBgColor',
      setCurrActiveBackgroundTab: 'vivisticker/SET_currActiveBackgroundTab'
    }),
    scrollToTop() {
      for (const list of this.categoryListArray) {
        if (list.show) {
          const categoryList = (this.$refs[list.key] as CCategoryList[])[0]
          const top = categoryList.$el.querySelector('.panel-bg__top-item') as HTMLElement
          top.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    colorStyles(color: string) {
      return {
        backgroundColor: this.getColorOverlappingWhite(color)
      }
    },
    colorTabWrapperStyles() {
      return {
        height: `${this.colorAreaHeight}px`
      }
    },
    shareBgStyles() {
      return this.shareItem ? {
        backgroundImage: `url(https://template.vivipic.com/background/${this.shareItem.id}/larg?ver=${this.shareItem.ver}})`
      } : {
        backgroundColor: `${this.getColorOverlappingWhite(this.shareColor)}`
      }
    },
    setBgColor(color: string) {
      if (this.isInEditor) {
        if (this.currentPageBackgroundLocked) {
          return notify({ group: 'copy', text: i18n.global.tc('NN0804') })
        }
        this._setBgColor({
          pageIndex: pageUtils.currFocusPageIndex,
          color: color
        })
      } else vivistickerUtils.sendScreenshotUrl(this.getColorUrl(color, false))
      vivistickerUtils.addAsset('backgroundColor', { id: color.replace('#', '') })
      this.addRecentlyBgColor(color)
    },
    getColorOverlappingWhite(color: string): string {
      const R1 = parseInt(color.substring(1, 3), 16)
      const G1 = parseInt(color.substring(3, 5), 16)
      const B1 = parseInt(color.substring(5, 7), 16)
      const R = this.combineColors(R1, 255).toString(16)
      const G = this.combineColors(G1, 255).toString(16)
      const B = this.combineColors(B1, 255).toString(16)
      return `#${this.paddingStringFor2(R)}${this.paddingStringFor2(G)}${this.paddingStringFor2(B)}`
    },
    getColorWithOpacity(color: string): string {
      const opstr = this.paddingStringFor2(Math.round(this.opacity * 255 / 100).toString(16)).toUpperCase()
      return color + opstr
    },
    combineColors(a: number, b: number): number {
      return Math.round(b + (a - b) * this.opacity / 100)
    },
    paddingStringFor2(str: string) {
      if (str.length === 1) {
        return '0' + str
      }
      return str
    },
    getColorUrl(color: string, premix: boolean) {
      if (premix) {
        return `type=backgroundColor&id=${this.getColorOverlappingWhite(color).substring(1)}`
      } else {
        return `type=backgroundColor&id=${this.getColorWithOpacity(color).substring(1)}`
      }
    },
    async handleSearch(keyword: string) {
      this.resetSearch()
      if (keyword) {
        this.getTagContent({ keyword })
      }
    },
    async handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        if (keyword === `${this.$t('NN0024')}`) {
          vivistickerUtils.setShowAllRecently('background', true)
        } else {
          this.getContent({ keyword, locale })
        }
        vivistickerUtils.setIsInCategory('background', true)
      } else {
        vivistickerUtils.setShowAllRecently('background', false)
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    handleShareImage(item: IAsset) {
      if (this.isInEditor) return
      this.setShareItem(item)
      this.setIsInBgShare(true)
    },
    handleShareColor(color: string) {
      if (this.isInEditor) return
      this.setShareColor(color)
      this.setIsInBgShare(true)
    },
    handleSave() {
      vivistickerUtils.sendScreenshotUrl(
        this.shareItem ? vivistickerUtils.createUrl(this.shareItem) : this.getColorUrl(this.shareColor, false),
        'download'
      )
      if (this.shareItem) {
        assetUtils.addAssetToRecentlyUsed(this.shareItem, 'background')
      } else {
        vivistickerUtils.addAsset('backgroundColor', { id: this.shareColor.replace('#', '') })
        this.addRecentlyBgColor(this.shareColor)
      }
    },
    handleStory() {
      vivistickerUtils.sendScreenshotUrl(
        this.shareItem ? vivistickerUtils.createUrl(this.shareItem) : this.getColorUrl(this.shareColor, true),
        'IGStory'
      )
      if (this.shareItem) {
        assetUtils.addAssetToRecentlyUsed(this.shareItem, 'background')
      } else {
        vivistickerUtils.addAsset('backgroundColor', { id: this.shareColor.replace('#', '') })
        this.addRecentlyBgColor(this.shareColor)
      }
    },
    handleOpenColorPicker() {
      if (this.isInEditor) return this.$emit('openExtraColorModal', ColorEventType.background, MobileColorPanelType.picker)
      this.$emit('openColorPicker')
      vivistickerUtils.setHasNewBgColor(true)
    },
    handleShowAllRecentlyBgColors(bool: boolean) {
      this.showAllRecentlyBgColors = bool
    },
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      const titleHeight = 46
      const gap = this.isTablet ? 20 : 24
      return new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          const title: string = !isSearch && !idx ? `${this.$t('NN0340')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-background-item',
            list: rowItems,
            size: this.itemHeight + gap + (title ? titleHeight : 0), // (bg height) + 24(gap) + 0/46(title)
            title
          }
        })
    },
    updateOpacity(opacity: number) {
      this.opacity = opacity
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-bg {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  &__tabs {
    margin-top: 24px;
  }
  &__searchbar {
    margin-bottom: 14px;
  }
  &__list-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  &__list {
    flex-grow: 1;
    height: 100%;
  }
  &__item {
    width: 80px;
    height: 142px;
    margin: 0 auto;
    object-fit: cover;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 10px;
  }
  &__header {
    grid-column: 1 / 4;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__color-tab {
    height: 100%;
    overflow: hidden;
  }
  &__color-tab-wrapper {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-columns: 1fr;
  }
  &__color-area {
    overflow-y: scroll;
    @include no-scrollbar;
  }
  &__color-row {
    padding-bottom: 26px;
  }
  &__color-row-header {
    display: flex;
    justify-content: space-between;
  }
  &__color-row-left {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  &__color-row-back {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__color-row-title {
    @include body-MD;
  }
  &__color-row-more {
    @include body-SM;
    &:active {
      color: setColor(black-5);
    }
  }
  &__colors {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    column-gap: 12px;
    row-gap: 12px;
    position: relative;
    padding: 0 12px;
    margin-top: 16px;
  }
  &__color {
    padding-top: calc(100% - 2px);
    cursor: pointer;
    position: relative;
    -webkit-touch-callout: none;
    user-select: none;
    border-radius: 4px;
    border: 1px solid setColor(gray-0, 0.2);
    &.add-color {
      padding-top: 100%;
      background-image: url("~@/assets/img/svg/addColor.svg");
      background-size: cover;
      border: none;
    }
  }
  // &__color-back {
  //   position: absolute;
  //   top: 0;
  //   left: 0;
  //   @include size(100%);
  //   border-radius: 4px;
  //   background: white;
  //   overflow: hidden;
  // }
  // &__color-inner {
  //   @include size(100%);
  // }
  &.in-category:deep(.vue-recycle-scroller__item-wrapper) {
    margin-top: 24px;
  }
  &__color-controller {
    padding-top: 13px;
    height: 203px;
    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    &__opacity-title {
      font-size: 16px;
      height: 24px;
      line-height: 24px;
      color: white;
    }
    &__opacity-value {
      border: 1px solid setColor(gray-4);
      border-radius: 4px;
      width: 54px;
      height: 24px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      & > input {
        background: transparent;
        padding: 0;
        margin: 0;
        border-radius: 0;
        text-align: center;
        width: 100%;
        height: 22px;
        @include body-SM;
        line-height: 22px;
        color: white;
      }
    }
    &__hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 127px;
    }
    &__hint-text {
      margin: 0;
      @include body-SM;
      color: setColor(black-5);
    }
  }
  &__share {
    position: absolute;
    top: 0;
    left: 0;
    @include size(100%);
    background: setColor(black-1);
    &__screen {
      margin-top: 25px;
      margin-left: auto;
      margin-right: auto;
      border-radius: 10px;
      background: white;
    }
    &__screen-inner {
      @include size(100%);
      border-radius: 10px;
      background-position: center center;
      background-size: cover;
    }
    &__buttons {
      position: absolute;
      left: 50%;
      bottom: 44px;
      transform: translateX(-50%);
      display: flex;
      gap: 70px;
    }
    &__button {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    &__button-icon {
      @include size(40px);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
    &__button-text {
      @include body-XS;
      color: white;
      white-space: nowrap;
    }
  }
}
</style>
