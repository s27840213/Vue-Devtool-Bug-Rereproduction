<template lang="pug">
div(class="panel-bg" :class="{'panel-flash': panelFlash}" @animationend="panelFlash = false")
  tabs(:tabs="[$tc('NN0002', 2),$t('NN0017')]" v-model="tabIndex")
  //- Search bar
  search-bar(v-if="showImageTab" class="mb-15"
    :placeholder="$t('NN0092', {target: $tc('NN0004', 1)})"
    clear
    :defaultKeyword="keywordLabel"
    @search="handleSearch")
  //- BG color tab content
  color-slips(v-show="showColorTab" class="panel-bg__color-sets" mode="PanelBG"
              :selectedColor="currentPageBackgroundColor"
              @selectColor="setBgColor"
              @selectColorEnd="recordChange"
              @openColorPicker="openColorPicker")
  //- Search result empty msg
  div(v-if="emptyResultMessage")
    span {{ emptyResultMessage }}
  //- Search result and main content
  category-list(v-for="item in categoryListArray"
                v-show="item.show" :ref="item.key" :key="item.key"
                :list="item.content" @loadMore="handleLoadMore"
                @scroll.passive="handleScrollTop($event, item.key)")
    template(v-slot:category-list-rows="{ list, title }")
      category-list-rows(
        :list="list"
        :title="title"
        @action="handleCategorySearch")
        template(v-slot:preview="{ item }")
          category-background-item(class="panel-bg__item"
            :item="item"
            :locked="currentPageBackgroundLocked")
    template(v-slot:category-background-item="{ list, title }")
      div(class="panel-bg__items")
        div(v-if="title"
          class="panel-bg__header") {{ title }}
        category-background-item(v-for="item in list"
          class="panel-bg__item"
          :key="item.id"
          :item="item"
          :locked="currentPageBackgroundLocked")
    template(#after)
      //- Loading icon
      div(v-if="pending" class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
      //- BG wishing pool
      div(v-if="keyword && !pending && rawSearchResult.list?.length<=10")
        span {{$t('NN0796', {type: $tc('NN0792', 1)})}}
        nubtn(size="mid" class="mt-30")
          url(:url="$t('NN0791')" :newTab="true")
              span {{$t('NN0790', {type: $tc('NN0792', 1)})}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryBackgroundItem from '@/components/category/CategoryBackgroundItem.vue'
import ColorSlips from '@/components/editor/ColorSlips.vue'
import Tabs from '@/components/Tabs.vue'
import Url from '@/components/global/Url.vue'
import { ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { ColorEventType, MobileColorPanelType } from '@/store/types'
import { IPage } from '@/interfaces/page'
import stepsUtils from '@/utils/stepsUtils'
import pageUtils from '@/utils/pageUtils'
import generalUtils from '@/utils/generalUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import groupUtils from '@/utils/groupUtils'
import i18n from '@/i18n'

export default defineComponent({
  name: 'PanelBackground',
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryBackgroundItem,
    Tabs,
    ColorSlips,
    Url
  },
  emits: ['openExtraColorModal'],
  data() {
    return {
      scrollTop: {
        mainContent: 0,
        searchResult: 0
      },
      tabIndex: 0,
      panelFlash: false
    }
  },
  computed: {
    ...mapState('background', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      pending: 'pending',
      keyword: 'keyword'
    }),
    ...mapGetters({
      getPage: 'getPage'
    }),
    itemWidth(): number {
      const basicWidth = (window.innerWidth - 48 - 10) / 2 // (100vw - panel-left-right-padding - gap) / 2
      return basicWidth < 145 ? basicWidth : 145 // 145px is the default width
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    listCategories(): ICategoryItem[] {
      const { categories } = this
      return (categories as IListServiceContentData[])
        .map((category, index) => ({
          size: this.itemWidth + 10 + 46,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
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
    currPage(): IPage {
      return this.getPage(pageUtils.currFocusPageIndex)
    },
    currentPageBackgroundLocked(): boolean {
      const { backgroundImage } = this.currPage || {}
      return backgroundImage && backgroundImage.config.locked
    },
    currentPageBackgroundColor(): string {
      if (this.currPage.backgroundImage.config?.srcObj.assetId) return ''
      return this.currPage.backgroundColor
    },
    emptyResultMessage(): string {
      const { keyword, pending } = this
      if (pending || !keyword || this.rawSearchResult.list.length > 0) return ''
      return `${this.$t('NN0393', {
          keyword: this.keywordLabel,
          target: this.$tc('NN0004', 1)
        })}`
    },
    showImageTab(): boolean { return this.tabIndex === 0 },
    showColorTab(): boolean { return this.tabIndex === 1 }
  },
  mounted() {
    generalUtils.panelInit('bg',
      this.handleSearch,
      this.handleCategorySearch,
      this.getRecAndCate)
    eventUtils.on(PanelEvent.switchPanelBgInnerTab, (tabIndex: number) => {
      this.switchTab(tabIndex)
      this.panelFlash = true
    })
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.switchPanelBgInnerTab)
  },
  watch: {
    keyword(newVal: string) {
      if (!newVal) {
        this.$nextTick(() => {
          // Will recover scrollTop if do search => switch to other panel => switch back => cancel search.
          const mainContent = (this.$refs.mainContent as CCategoryList[])[0]
          mainContent.$el.scrollTop = this.scrollTop.mainContent
        })
      }
    }
  },
  methods: {
    ...mapActions('background', [
      'getContent',
      'getTagContent',
      'getRecAndCate',
      'getMoreContent',
      'resetSearch'
    ]),
    ...mapMutations({
      _setBgColor: 'SET_backgroundColor',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag'
    }),
    setBgColor(color: string) {
      if (this.currentPageBackgroundLocked) {
        return notify({ group: 'copy', text: i18n.global.tc('NN0804') })
      }
      if (pageUtils.currFocusPageIndex !== pageUtils.addAssetTargetPageIndex) {
        groupUtils.deselect()
        this.setCurrActivePageIndex(pageUtils.addAssetTargetPageIndex)
      }
      this._setBgColor({
        pageIndex: pageUtils.addAssetTargetPageIndex,
        color: color
      })

      if (generalUtils.isTouchDevice()) {
        this.setCloseMobilePanelFlag(true)
      }
    },
    async handleSearch(keyword: string) {
      this.resetSearch()
      if (keyword) {
        await this.getTagContent({ keyword })
      }
    },
    async handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        await this.getContent({ keyword, locale })
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    recordChange() {
      this.$nextTick(() => stepsUtils.record())
    },
    switchTab(tabIndex: number) {
      this.tabIndex = tabIndex
    },
    openColorPicker() { // @openColorPicker will only be trigger in mobile.
      this.$emit('openExtraColorModal', ColorEventType.background, MobileColorPanelType.picker)
    },
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      return new Array(Math.ceil(list.length / 2))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 2, idx * 2 + 2)
          const title: string = !isSearch && !idx ? `${this.$t('NN0340')}` : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-background-item',
            list: rowItems,
            size: title ? (this.itemWidth + 10 + 46) : this.itemWidth + 10,
            title
          }
        })
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
  color: white;
  text-align: left;
  &__color-sets {
    filter: none;
    height: calc(100% - 54px);
    .panel &:deep(.color-panel__scroll) { // push scroll only in desktop
      @include push-scrollbar10;
    }
  }
  &__item {
    width: min(calc((100vw - 10px - 48px) / 2), 145px);
    height: min(calc((100vw - 10px - 48px) / 2), 145px);
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
}

@keyframes flash {
  0%, 50%, 100% {
    background: setColor(gray-1-5);
  }
  25%, 75% {
    background: #353951;
  }
}
.panel-flash {
  animation-name: flash;
  animation-duration: 1s;
}
</style>
