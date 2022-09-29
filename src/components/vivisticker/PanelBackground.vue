<template lang="pug">
  div(class="panel-bg" :class="{'in-category': isInCategory}")
    tabs(v-if="!isInCategory"
          class="panel-bg__tabs"
          :tabs="[$tc('NN0002', 2),$t('NN0017')]"
          :defaultTab="currActiveTabIndex"
          @switchTab="switchTab")
    template(v-if="showImageTab")
      search-bar(v-if="!isInCategory" class="panel-bg__searchbar"
        :placeholder="$t('NN0092', {target: $tc('NN0004',1)})"
        clear
        :defaultKeyword="keywordLabel"
        vivisticker="dark"
        :color="{close: 'black-5', search: 'black-5'}"
        @search="handleSearch")
      div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
      category-list(ref="list"
        class="panel-bg__list"
        :list="list"
        @loadMore="handleLoadMore")
        template(v-if="pending" #after)
          div(class="text-center")
            svg-icon(iconName="loading"
              iconColor="white"
              iconWidth="20px")
        template(v-slot:category-list-rows="{ list, title }")
          category-list-rows(
            v-if="!keyword"
            :list="list"
            :title="title"
            @action="handleCategorySearch")
            template(v-slot:preview="{ item }")
              category-background-item(class="panel-bg__item"
                :item="item"
                :locked="false"
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
              @share="handleShareImage")
    div(v-else class="panel-bg__color-tab")
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
              div(v-if="newBgColor !== ''"
                class="panel-bg__color"
                :style="colorStyles(newBgColor)")
              div(v-for="color in recentlyColors"
                class="panel-bg__color"
                v-press="() => handleShareColor(color)"
                :style="colorStyles(color)"
                @click="setBgColor(color)")
          div(v-if="!showAllRecentlyBgColors" class="panel-bg__color-row")
            div(class="panel-bg__color-row-title text-left py-5 text-white") {{$t('NN0089')}}
            div(class="panel-bg__colors")
              div(v-for="color in defaultBgColor"
                class="panel-bg__color"
                v-press="() => handleShareColor(color)"
                :style="colorStyles(color)"
                @click="setBgColor(color)")
        div(class="panel-bg__color-controller")
          div(class="panel-bg__color-controller__header")
            div(class="panel-bg__color-controller__opacity-title") {{ $t('NN0030') }}
            div(class="panel-bg__color-controller__opacity-value")
              input(type="number" v-model.number="opacity")
          div(class="panel-bg__color-controller__slider-container")
            input(class="panel-bg__color-controller__slider"
                  :style="progressStyles()"
                  type="range"
                  min="0"
                  max="100"
                  v-model.number="opacity")
          div(class="panel-bg__color-controller__hint")
            p(class="panel-bg__color-controller__hint-text") {{ $t('STK0002') }}
            p(class="panel-bg__color-controller__hint-text") {{ $t('STK0003') }}
    div(v-if="isInBgShare" class="panel-bg__share")
      div(class="panel-bg__share__screen" :style="shareBgSizeStyles()")
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
import Vue from 'vue'
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import SearchBar from '@/components/SearchBar.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryBackgroundItem from '@/components/category/CategoryBackgroundItem.vue'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import stepsUtils from '@/utils/stepsUtils'
import colorUtils from '@/utils/colorUtils'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import pageUtils from '@/utils/pageUtils'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'
import Tabs from '@/components/Tabs.vue'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { IAsset } from '@/interfaces/module'
import assetUtils from '@/utils/assetUtils'
export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker,
    CategoryList,
    CategoryListRows,
    CategoryBackgroundItem,
    Tabs
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openColorPicker: false,
      scrollTop: 0,
      currActiveTabIndex: 0,
      opacity: 100,
      showAllRecentlyBgColors: false
    }
  },
  watch: {
    opacity(newVal) {
      this.opacity = Math.max(Math.min(newVal, 100), 0)
    },
    currActivePanel(newVal, oldVal) {
      if (oldVal === 'color-picker' && newVal !== 'color-picker') {
        this.setNewBgColor('')
      }
    }
  },
  computed: {
    ...mapState(
      'background',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'keyword'
      ]
    ),
    ...mapState({
      isMobile: 'isMobile'
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
      newBgColor: 'vivisticker/getNewBgColor'
    }),
    itemWidth(): number {
      // const basicWidth = (window.innerWidth - 48 - 10) / 2 // (100vw - panel-left-right-padding - gap) / 2
      // return basicWidth < 145 ? basicWidth : 145 // 145px is the default width
      return 142
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
    currBackgroundColor(): string {
      return this.getBackgroundColor(pageUtils.currFocusPageIndex)
    },
    recentlyColors(): string[] {
      return this.showAllRecentlyBgColors ? this.allRecentlyColors : this.allRecentlyColors.slice(0, 20)
    },
    listCategories(): any[] {
      const { keyword, categories } = this
      if (keyword) { return [] }
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0)
        .map(category => ({
          size: this.itemWidth + 10 + 46,
          id: `rows_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listRecently(): any[] {
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
            size: this.itemWidth + 32,
            title: ''
          }
        })
      return result
    },
    listResult(): any[] {
      const { keyword } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          const title: string = !keyword && !idx ? `${this.$t('NN0340')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-background-item',
            list: rowItems,
            size: title ? (this.itemWidth + 32 + 46) : this.itemWidth + 32,
            title
          }
        })
      if (result.length) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    list(): any[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      const list = generalUtils.deepCopy(
        this.showImageTab ? this.listCategories
          .concat(this.listResult) : []
      )
      /**
       * @NeedCodeReview with Nathan
       */
      if (this.listResult.length === 0 && list.length !== 0) {
        list[list.length - 1].sentinel = true
      }

      return list
    },
    currentPageColor(): string {
      const { backgroundColor } = this.getPage(pageUtils.currFocusPageIndex) || {}
      return backgroundColor || ''
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length && !this.showAllRecently ? `${i18n.t('NN0393', { keyword: this.keywordLabel, target: i18n.tc('NN0004', 1) })}` : ''
    },
    showImageTab(): boolean {
      return this.currActiveTabIndex === 0
    }
  },
  async mounted() {
    (this.$refs.list as Vue).$el.addEventListener('scroll', (event: Event) => {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    })
    colorUtils.on(ColorEventType.background, this.handleNewBgColor)

    generalUtils.panelInit('bg',
      this.handleSearch,
      this.handleCategorySearch,
      () => {
        this.getRecAndCate('background')
        vivistickerUtils.listAsset('backgroundColor')
      })
  },
  activated() {
    const el = (this.$refs.list as Vue).$el
    el.scrollTop = this.scrollTop
    el.addEventListener('scroll', this.handleScrollTop)
  },
  deactivated() {
    (this.$refs.list as Vue).$el.removeEventListener('scroll', this.handleScrollTop)
  },
  beforeDestroy() {
    colorUtils.event.off(ColorEventType.background, this.handleNewBgColor)
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('background', [
      'resetContent',
      'getContent',
      'getTagContent',
      'getRecently',
      'getRecAndCate',
      'getMoreContent'
    ]),
    ...mapMutations({
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag',
      setIsInBgShare: 'vivisticker/SET_isInBgShare',
      setShareItem: 'vivisticker/SET_shareItem',
      setShareColor: 'vivisticker/SET_shareColor',
      addRecentlyBgColor: 'vivisticker/UPDATE_addRecentlyBgColor',
      setNewBgColor: 'vivisticker/SET_newBgColor'
    }),
    colorStyles(color: string) {
      return {
        backgroundColor: this.getColorOverlappingWhite(color)
      }
    },
    progressStyles() {
      return {
        '--progress': `${this.opacity}%`
      }
    },
    colorTabWrapperStyles() {
      return {
        height: `${window.innerHeight - 176}px`
      }
    },
    shareBgSizeStyles() {
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const height = (screenHeight - 44) * 0.73
      return {
        width: `${height * screenWidth / screenHeight}px`,
        height: `${height}px`
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
      vivistickerUtils.sendScreenshotUrl(this.getColorUrl(color))
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
    getColorUrl(color: string) {
      return `type=backgroundColor&id=${this.getColorWithOpacity(color).substring(1)}`
    },
    async handleSearch(keyword: string) {
      this.resetContent()
      if (keyword) {
        this.getTagContent({ keyword })
      } else {
        this.getRecAndCate('background')
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetContent()
      if (keyword) {
        if (keyword === `${this.$t('NN0024')}`) {
          this.getRecently({ key: 'background', keyword })
          vivistickerUtils.setShowAllRecently('background', true)
        } else {
          this.getContent({ keyword, locale })
        }
        vivistickerUtils.setIsInCategory('background', true)
      } else {
        vivistickerUtils.setShowAllRecently('background', false)
        this.getRecAndCate('background')
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleScrollTop(event: Event) {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    },
    recordChange() {
      this.$nextTick(() => stepsUtils.record())
    },
    switchTab(tabIndex: number) {
      this.currActiveTabIndex = tabIndex
    },
    handleShareImage(item: IAsset) {
      this.setShareItem(item)
      this.setIsInBgShare(true)
    },
    handleShareColor(color: string) {
      this.setShareColor(color)
      this.setIsInBgShare(true)
    },
    handleSave() {
      vivistickerUtils.sendScreenshotUrl(
        this.shareItem ? vivistickerUtils.createUrl(this.shareItem) : this.getColorUrl(this.shareColor),
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
        this.shareItem ? vivistickerUtils.createUrl(this.shareItem) : this.getColorUrl(this.shareColor),
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
      this.$emit('openColorPicker')
    },
    handleNewBgColor(color: string) {
      this.setNewBgColor(color)
    },
    handleShowAllRecentlyBgColors(bool: boolean) {
      this.showAllRecentlyBgColors = bool
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
  overflow-x: hidden;
  padding: 0 24px;
  position: relative;
  &__tabs {
    margin-top: 24px;
  }
  &__searchbar {
    margin-bottom: 14px;
  }
  &__list {
    flex-grow: 1;
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
    padding-top: 100%;
    cursor: pointer;
    position: relative;
    -webkit-touch-callout: none;
    user-select: none;
    border-radius: 4px;
    &.add-color {
      background-image: url("~@/assets/img/svg/addColor.png");
      background-size: cover;
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
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
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
    &__slider-container {
      margin-top: 26px;
    }
    &__slider {
      --lower-color: #{setColor(gray-6)};
      --upper-color: #{setColor(gray-2)};
      @include progressSlider($height: 3px, $thumbSize: 16px, $marginTop: -7.5px);
      margin: 0;
      &::-webkit-slider-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
        position: relative;
      }
      &::-moz-range-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
        position: relative;
      }
    }
    &__hint {
      margin-top: 10px;
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
    }
  }
}
</style>
