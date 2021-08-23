<template lang="pug">
  div(class="panel-text")
    search-bar(class="mb-15"
      placeholder="Search from our text"
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
      template(v-slot:default-text="{ list }")
        div
          btn(v-for="type in list"
            :key="type"
            class="panel-text__text-button mb-10"
            :type="`text-${type.toLowerCase()}`"
            @click.native="handleAddText(type)") {{ type }}
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
          v-if="!keyword"
          :list="list"
          :title="title"
          @action="handleSearch")
          template(v-slot:preview="{ id }")
            category-text-item(class="panel-text__item"
              :src="`${host}/${id}/${preview}`"
              :objectId="id"
              @init="getContentJson")
      template(v-slot:category-text-item="{ list, title }")
        div(class="panel-text__items")
          div(v-if="title"
            class="panel-text__header") {{ title }}
          category-text-item(v-for="id in list"
            class="panel-text__item"
            :key="id"
            :src="`${host}/${id}/${preview}`"
            :objectId="id"
            @init="getContentJson")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState, mapGetters } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import TextUtils from '@/utils/textUtils'
export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTextItem
  },
  computed: {
    ...mapGetters({ scaleRatio: 'getPageScaleRatio' }),
    ...mapState(
      'textStock',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'keyword'
      ]
    ),
    listDefaultText(): any[] {
      const { keyword } = this
      if (keyword) { return [] }
      const key = 'default-text'
      return [{
        type: key,
        id: key,
        size: 174,
        list: ['Heading', 'Subheading', 'Body']
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
          type: 'category-text-item',
          list: rowItems,
          title,
          sentinel: !tmpList.length
        })
      }
      return result
    },
    list(): any[] {
      return this.listDefaultText
        .concat(this.listCategories)
        .concat(this.listResult)
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
    ...mapActions('textStock',
      [
        'resetContent',
        'getContent',
        'getCategories',
        'getMoreContent',
        'getContentJson'
      ]
    ),
    handleSearch(keyword: string) {
      this.resetContent()
      this.getContent({ keyword })
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleAddText (type: string) {
      TextUtils.addStanardText(type.toLowerCase())
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-text {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__item {
    width: 145px;
    height: 145px;
    margin: 0 auto;
    object-fit: contain;
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
  &__text-button {
    width: 250px;
  }
}
</style>
