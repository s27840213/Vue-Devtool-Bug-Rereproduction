<template lang="pug">
  div(class="panel-bg")
    search-bar(class="mb-15"
      placeholder="Search from our background"
      clear
      :defaultKeyword="keyword"
      @search="handleSearch")
    div(v-if="emptyResultMessage" class="text-white") {{ emptyResultMessage }}
    category-list(ref="list"
      :list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:default-background-colors)
        div
          div(class="text-left py-5 text-white") 顏色
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
import { ColorEventType } from '@/store/types'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  components: {
    SearchBar,
    ColorPicker,
    CategoryList,
    CategoryListRows,
    CategoryBackgroundItem
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      openColorPicker: false,
      scrollTop: 0
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
    ...mapGetters({
      getPage: 'getPage',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      defaultBgColor: 'color/getDefaultBgColors',
      getBackgroundColor: 'getBackgroundColor'
    }),
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
        size: 150
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
          const title: string = !keyword && !idx ? '所有結果' : ''
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
      return this.defaultBackgroundColors
        .concat(this.listCategories)
        .concat(this.listResult)
    },
    currentPageColor(): string {
      const { backgroundColor } = this.getPage(this.lastSelectedPageIndex) || {}
      return backgroundColor || ''
    },
    currentPageBackgroundLocked(): boolean {
      const { backgroundImage } = this.getPage(this.lastSelectedPageIndex) || {}
      return backgroundImage && backgroundImage.config.locked
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length ? `Sorry, we couldn't find any background for "${this.keyword}".` : ''
    }
  },
  async mounted() {
    (this.$refs.list as Vue).$el.addEventListener('scroll', (event: Event) => {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    })
    colorUtils.on(ColorEventType.background, (color: string) => {
      this.setBgColor(color)
    })

    await this.getCategories()
    this.getContent()
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
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('background',
      [
        'resetContent',
        'getContent',
        'getTagContent',
        'getCategories',
        'getMoreContent'
      ]
    ),
    ...mapMutations({
      _setBgColor: 'SET_backgroundColor'
    }),
    colorStyles(color: string) {
      return {
        backgroundColor: color
      }
    },
    setBgColor(color: string) {
      if (this.currentPageBackgroundLocked) {
        return this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
      }
      this._setBgColor({
        pageIndex: this.lastSelectedPageIndex,
        color: color
      })
      stepsUtils.record()
    },
    async handleSearch(keyword: string) {
      this.resetContent()
      if (keyword) {
        this.getTagContent({ keyword })
      } else {
        await this.getCategories()
        this.getContent()
      }
    },
    handleCategorySearch(keyword: string) {
      this.resetContent()
      this.getContent({ keyword })
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleColorModal(color: string) {
      colorUtils.setCurrEvent(ColorEventType.background)
      colorUtils.setCurrColor(color)
      this.$emit('toggleColorPanel', true)
      console.log('handle')
    },
    handleScrollTop(event: Event) {
      this.scrollTop = (event.target as HTMLElement).scrollTop
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
    row-gap: 10px;
    position: relative;
  }
  &__color {
    aspect-ratio: 1/1;
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
