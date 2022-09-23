<template lang="pug">
  div(class="panel-bg")
    tabs(:tabs="[$tc('NN0002', 2),$t('NN0017')]" @switchTab="switchTab")
    search-bar(v-if="showImageTab" class="mb-15"
      :placeholder="$t('NN0092', {target: $tc('NN0004',1)})"
      clear
      :defaultKeyword="keywordLabel"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    category-list(ref="list"
      :list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:default-background-colors)
        div(ref="colorBlock")
          div(class="text-left py-5 text-white") {{$t('NN0017')}}
          div(class="panel-bg__colors")
            div(class="panel-bg__color"
              @click="handleColorModal(currBackgroundColor)")
            div(v-for="color in defaultBgColor"
              class="panel-bg__color"
              :style="colorStyles(color)"
              @click="setBgColor(color)")
            div(class="panel-bg__color"
              @click="setBgColor('#ffffff00')")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
          v-if="!keyword"
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
      currActiveTabIndex: 0
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
      defaultBgColor: 'color/getDefaultBgColors',
      getBackgroundColor: 'getBackgroundColor'
    }),
    itemWidth(): number {
      const basicWidth = (window.innerWidth - 48 - 10) / 2 // (100vw - panel-left-right-padding - gap) / 2
      return basicWidth < 145 ? basicWidth : 145 // 145px is the default width
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
        .map((category, index) => ({
          size: this.itemWidth + 10 + 46,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
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
            size: title ? (this.itemWidth + 10 + 46) : this.itemWidth + 10,
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
    currentPageBackgroundLocked(): boolean {
      const { backgroundImage } = this.getPage(pageUtils.currFocusPageIndex) || {}
      return backgroundImage && backgroundImage.config.locked
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
      _setBgColor: 'SET_backgroundColor',
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag'
    }),
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    setBgColor(color: string) {
      // if (colorUtils.isColorPickerOpen) {
      //   colorUtils.setIsColorPickerOpen(false)
      // }
      if (this.currentPageBackgroundLocked) {
        return this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
      }
      this._setBgColor({
        pageIndex: pageUtils.currFocusPageIndex,
        color: color
      })

      if (generalUtils.isTouchDevice()) {
        this.setCloseMobilePanelFlag(true)
      }
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
    row-gap: 10px;
    position: relative;
  }
  &__color {
    padding-top: 100%;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    &:nth-child(1) {
      background-image: url("~@/assets/img/svg/addColor.svg");
      background-size: cover;
    }
    &:last-child {
      background-image: url("~@/assets/img/svg/transparent.svg");
      background-size: cover;
    }
  }
  &::v-deep .vue-recycle-scroller__item-view:first-child {
    z-index: 1;
  }
}
</style>
