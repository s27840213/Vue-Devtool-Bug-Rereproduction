<template lang="pug">
  div(class="panel-bg" :class="{'in-category': isInCategory}")
    tabs(v-if="!isInCategory"
          class="panel-bg__tabs"
          :tabs="[$tc('NN0002', 2),$t('NN0017')]"
          :defaultTab="currActiveTabIndex"
          @switchTab="switchTab")
    search-bar(v-if="showImageTab && !isInCategory" class="panel-bg__searchbar"
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
      template(v-slot:default-background-colors)
        div(ref="colorBlock")
          div(class="text-left py-5 text-white") {{$t('NN0089')}}
          div(class="panel-bg__colors")
            div(v-for="color in defaultBgColor"
              class="panel-bg__color"
              v-press="() => handleShareColor(color)"
              :style="colorStyles(color)"
              @click="setBgColor(color)")
              //- div(class="panel-bg__color-back")
                div(class="panel-bg__color-inner" :style="colorStyles(color)")
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
    div(v-if="!showImageTab" class="panel-bg__color-controller")
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
      opacity: 100
    }
  },
  watch: {
    opacity(newVal) {
      this.opacity = Math.max(Math.min(newVal, 100), 0)
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
      isInBgShare: 'vivisticker/getIsInBgShare',
      shareItem: 'vivisticker/getShareItem',
      shareColor: 'vivisticker/getShareColor'
    }),
    itemWidth(): number {
      // const basicWidth = (window.innerWidth - 48 - 10) / 2 // (100vw - panel-left-right-padding - gap) / 2
      // return basicWidth < 145 ? basicWidth : 145 // 145px is the default width
      return 142
    },
    isInCategory(): boolean {
      return this.isTabInCategory('background')
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    currBackgroundColor(): string {
      return this.getBackgroundColor(pageUtils.currFocusPageIndex)
    },
    defaultBackgroundColors(): any[] {
      const { keyword } = this
      if (keyword) { return [] }
      const key = 'default-background-colors'
      return [{
        id: key,
        type: key,
        size: generalUtils.isTouchDevice() ? window.innerWidth / 2 : 157
      }]
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
      const list = generalUtils.deepCopy(
        this.showImageTab ? this.listCategories
          .concat(this.listResult) : this.defaultBackgroundColors
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
      return this.keyword && !this.pending && !this.listResult.length ? `${i18n.t('NN0393', { keyword: this.keywordLabel, target: i18n.tc('NN0004', 1) })}` : ''
    },
    showImageTab(): boolean {
      return this.currActiveTabIndex === 0
    }
  },
  async mounted() {
    (this.$refs.list as Vue).$el.addEventListener('scroll', (event: Event) => {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    })
    colorUtils.on(ColorEventType.background, (color: string) => {
      this.setBgColor(color)
    })
    colorUtils.onStop(ColorEventType.background, this.recordChange)

    generalUtils.panelInit('bg',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        await this.getRecAndCate()
        vivistickerUtils.listAsset('background')
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
    colorUtils.event.off(ColorEventType.background, (color: string) => {
      this.setBgColor(color)
    })
    colorUtils.offStop(ColorEventType.background, this.recordChange)
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('background', [
      'resetContent',
      'getContent',
      'getTagContent',
      'getRecAndCate',
      'getMoreContent'
    ]),
    ...mapMutations({
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag',
      setIsInBgShare: 'vivisticker/SET_isInBgShare',
      setShareItem: 'vivisticker/SET_shareItem',
      setShareColor: 'vivisticker/SET_shareColor'
    }),
    colorStyles(color: string) {
      return {
        backgroundColor: this.getColorWithOpacity(color)
      }
    },
    progressStyles() {
      return {
        '--progress': `${this.opacity}%`
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
        backgroundColor: `${this.getColorWithOpacity(this.shareColor)}`
      }
    },
    setBgColor(color: string) {
      vivistickerUtils.sendScreenshotUrl(this.getColorUrl(color))
    },
    getColorWithOpacity(color: string): string {
      const R1 = parseInt(color.substring(1, 3), 16)
      const G1 = parseInt(color.substring(3, 5), 16)
      const B1 = parseInt(color.substring(5, 7), 16)
      const R = this.combineColors(R1, 255).toString(16)
      const G = this.combineColors(G1, 255).toString(16)
      const B = this.combineColors(B1, 255).toString(16)
      return `#${this.paddingStringFor2(R)}${this.paddingStringFor2(G)}${this.paddingStringFor2(B)}`
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
        this.getRecAndCate().then(() => { vivistickerUtils.listAsset('background') })
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetContent()
      if (keyword) {
        this.getContent({ keyword, locale })
        vivistickerUtils.setIsInCategory('background', true)
      } else {
        this.getRecAndCate().then(() => { vivistickerUtils.listAsset('background') })
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleColorModal(color: string) {
      if (generalUtils.isTouchDevice()) {
        this.$emit('openExtraColorModal', ColorEventType.background, MobileColorPanelType.picker)
        return
      }
      colorUtils.setCurrEvent(ColorEventType.background)
      colorUtils.setCurrColor(color)
      this.$emit('toggleColorPanel', true)
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
      }
    },
    handleStory() {
      vivistickerUtils.sendScreenshotUrl(
        this.shareItem ? vivistickerUtils.createUrl(this.shareItem) : this.getColorUrl(this.shareColor),
        'IGStory'
      )
      if (this.shareItem) {
        assetUtils.addAssetToRecentlyUsed(this.shareItem, 'background')
      }
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
  &__color-picker {
    position: absolute;
    z-index: 99;
    top: 40px;
    left: 40px;
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
    height: 190px;
    flex-shrink: 0;
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
