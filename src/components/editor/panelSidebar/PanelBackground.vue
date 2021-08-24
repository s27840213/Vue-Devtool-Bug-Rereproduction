<template lang="pug">
  div(class="panel-bg")
    search-bar(class="mb-15"
      placeholder="Search from our background"
      clear
      :defaultKeyword="keyword"
      @search="handleSearch")
    category-list(:list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:default-background-colors)
        div
          div(class="text-left py-5 text-white") Color
          div(class="panel-bg__colors mb-15")
            color-picker(v-if="openColorPicker"
              v-click-outside="handleColorPicker"
              class="panel-bg__color-picker"
              :currentColor="currentPageColor"
              @update="setBgColor")
            div(class="panel-bg__color"
              @click="handleColorPicker")
              svg-icon(iconName="rainbow")
            div(v-for="color in defaultBgColor"
              class="panel-bg__color"
              :style="colorStyles(color)"
              @click="setBgColor(color)")
            div(class="panel-bg__color"
              @click="setBgColor('#ffffff00')")
              svg-icon(iconName="transparent")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
          v-if="!keyword"
          :list="list"
          :title="title"
          @action="handleSearch")
          template(v-slot:preview="{ id }")
            category-background-item(class="panel-bg__item"
              :src="`${host}/${id}/${preview}`"
              :objectId="id"
              @init="getContentJson")
      template(v-slot:category-background-item="{ list, title }")
        div(class="panel-bg__items")
          div(v-if="title"
            class="panel-bg__header") {{ title }}
          category-background-item(v-for="id in list"
            class="panel-bg__item"
            :key="id"
            :src="`${host}/${id}/${preview}`"
            :objectId="id"
            @init="getContentJson")
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
      openColorPicker: false
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
      defaultBgColor: 'color/getDefaultBgColor'
    }),
    defaultBackgroundColors(): any[] {
      const { keyword } = this
      if (keyword) { return [] }
      const key = 'default-background-colors'
      return [{
        id: key,
        type: key,
        size: 136
      }]
    },
    listCategories(): any[] {
      const { keyword, categories } = this
      if (keyword) { return [] }
      return (categories as any[])
        .map(category => ({
          size: 201,
          id: `rows_${category.list.join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): any[] {
      const { keyword } = this
      const { list = [] } = this.content
      const tmpList = [...list]
      const result = []
      while (tmpList.length) {
        const title: string = !keyword && !result.length ? '所有結果' : ''
        const rowItems = tmpList.splice(0, 2)
        result.push({
          id: `result_${rowItems.join('_')}`,
          size: title ? (155 + 46) : 155,
          type: 'category-background-item',
          list: rowItems,
          title,
          sentinel: !tmpList.length
        })
      }
      return result
    },
    list(): any[] {
      return this.defaultBackgroundColors
        .concat(this.listCategories)
        .concat(this.listResult)
    },
    currentPageColor(): string {
      return this.getPage(this.lastSelectedPageIndex).backgroundColor
    }
  },
  mounted() {
    this.getCategories()
    this.getContent()
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('background',
      [
        'resetContent',
        'getContent',
        'getCategories',
        'getMoreContent',
        'getContentJson'
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
      this._setBgColor({
        pageIndex: this.lastSelectedPageIndex,
        color: color
      })
    },
    handleSearch(keyword: string) {
      this.resetContent()
      this.getContent({ keyword })
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleColorPicker() {
      this.openColorPicker = !this.openColorPicker
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
    grid-template-columns: repeat(6, 1fr);
    column-gap: 8px;
    row-gap: 10px;
    position: relative;
  }
  &__color {
    @include size(clamp(42px, 2vw, 50px), clamp(42px, 2vw, 50px));
    border-radius: 4px;
    cursor: pointer;
    position: relative;
  }
  &::v-deep .vue-recycle-scroller__item-view:first-child {
    z-index: 1;
  }
}
</style>
