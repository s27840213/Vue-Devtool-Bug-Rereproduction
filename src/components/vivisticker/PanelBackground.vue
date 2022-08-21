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
      vivisticker
      :color="{close: 'white', search: 'white'}"
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
              @click="setBgColor(color)")
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
              :locked="false")
      template(v-slot:category-background-item="{ list, title }")
        div(class="panel-bg__items")
          div(v-if="title"
            class="panel-bg__header") {{ title }}
          category-background-item(v-for="item in list"
            class="panel-bg__item"
            :key="item.id"
            :item="item"
            :locked="false")
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
      isTabInCategory: 'vivisticker/getIsInCategory'
    }),
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
        .map(category => ({
          size: 201,
          id: `rows_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): any[] {
      const { keyword } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 2))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 2, idx * 2 + 2)
          const title: string = !keyword && !idx ? `${this.$t('NN0340')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-background-item',
            list: rowItems,
            size: title ? (155 + 46) : 155,
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
      this.getRecAndCate)
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
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag'
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
    setBgColor(color: string) {
      vivistickerUtils.sendScreenshotUrl(`type=backgroundColor&id=${this.getColorWithOpacity(color).substring(1)}`)
    },
    getColorWithOpacity(color: string) {
      let hexOpacity = Math.round(this.opacity * 255 / 100).toString(16).toUpperCase()
      if (hexOpacity.length === 1) {
        hexOpacity = '0' + hexOpacity
      }
      return `${color}${hexOpacity}`
    },
    async handleSearch(keyword: string) {
      this.resetContent()
      if (keyword) {
        this.getTagContent({ keyword })
      } else {
        this.getRecAndCate()
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetContent()
      if (keyword) {
        this.getContent({ keyword, locale })
        vivistickerUtils.setIsInCategory('background', true)
      } else {
        this.getRecAndCate()
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
    width: 145px;
    height: 145px;
    margin: 0 auto;
    object-fit: cover;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 10px;
  }
  &__header {
    grid-column: 1 / 3;
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
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    background-color: white;
  }
  &__color-inner {
    position: absolute;
    top: 0;
    left: 0;
    @include size(100%);
    border-radius: 4px;
  }
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
      border: 1px solid #D9DBE1;
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
      --lower-color: #{setColor(blue-1)};
      --upper-color: white;
      @include progressSlider($height: 3px, $thumbSize: 16px, $marginTop: -7.5px);
      margin: 0;
      &::-webkit-slider-thumb {
        box-shadow: none;
        border: 3px solid setColor(blue-1);
        position: relative;
      }
      &::-moz-range-thumb {
        box-shadow: none;
        border: 3px solid setColor(blue-1);
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
      color: setColor(gray-3);
    }
  }
}
</style>
