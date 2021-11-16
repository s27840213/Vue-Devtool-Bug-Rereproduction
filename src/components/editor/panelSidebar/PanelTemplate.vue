<template lang="pug">
  div(class="panel-template")
    panel-group-template(v-if="currentGroup"
      :showId="showTemplateId"
      :groupItem="currentGroup"
      @close="currentGroup = null")
    div
      div(class="panel-template__search")
        search-bar(class="mb-15"
          placeholder="Search from our templates"
          clear
          :defaultKeyword="keyword"
          @search="handleSearch")
          svg-icon(class="ml-5 pointer panel-template__advanced"
            :class="{ 'panel-template__advanced--active': theme }"
            iconName="advanced"
            iconColor="gray-6"
            iconWidth="20px"
            @click.native="showTheme = !showTheme")
        popup-theme(v-if="showTheme"
          class="panel-template__theme"
          :preSelected="theme.split(',')"
          @change="handleTheme"
          @close="showTheme = false")
      div(v-if="showTheme" class="panel-template__wrap")
    div(v-if="emptyResultMessage" class="text-white") {{ emptyResultMessage }}
    category-list(:list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(v-if="!keyword"
          :list="list"
          :title="title"
          @action="handleCategorySearch")
          template(v-slot:preview="{ item }")
            component(class="panel-template__item"
              :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
              :showId="showTemplateId"
              :item="item"
              @click="handleShowGroup")
      template(v-slot:category-template-item="{ list, title }")
        div(class="panel-template__items")
          div(v-if="title" class="panel-template__header") {{ title }}
          component(v-for="item in list"
            class="panel-template__item"
            :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
            :showId="showTemplateId"
            :item="item"
            :key="item.group_id"
            @click="handleShowGroup")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapState, mapMutations } from 'vuex'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import PopupTheme from '@/components/popup/PopupTheme.vue'
import PanelGroupTemplate from '@/components/editor/panelSidebar/PanelGroupTemplate.vue'
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTemplateItem,
    PopupTheme,
    CategoryGroupTemplateItem,
    PanelGroupTemplate
  },
  data () {
    return {
      showTheme: false,
      currentGroup: null
    }
  },
  computed: {
    ...mapState(
      'templates',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'keyword',
        'theme'
      ]
    ),
    ...mapState('user', ['role', 'adminMode']),
    showTemplateId (): boolean {
      return (this.role === 0) && this.adminMode
    },
    itemHeight (): number {
      return this.showTemplateId ? 179 : 155
    },
    listCategories(): any[] {
      const { keyword, categories, itemHeight } = this
      if (keyword) { return [] }
      return (categories as IListServiceContentData[])
        .map(category => ({
          size: itemHeight + 46,
          id: `rows_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listResult(): any[] {
      const { keyword, itemHeight } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 2))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 2, idx * 2 + 2)
          const title = !keyword && !idx ? '所有模板' : ''
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-template-item',
            list: rowItems,
            title,
            size: title ? (itemHeight + 46) : itemHeight
          }
        })
      if (result.length) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    list(): any[] {
      return this.listCategories.concat(this.listResult)
    },
    emptyResultMessage(): string {
      const { keyword, pending, listResult } = this
      return !pending && !listResult.length ? (keyword ? `Sorry, we couldn't find any templates for "${this.keyword}".` : 'Sorry, we couldn\'t find any templates') : ''
    }
  },
  mounted() {
    this._setTemplateState({ pending: true })
  },
  destroyed() {
    // this.resetContent()
  },
  watch: {
    async theme (curr, prev) {
      if (!prev && curr) {
        const queryString = new URLSearchParams(window.location.search)
        const keyword = queryString.get('search')
        if (keyword) {
          this.getTagContent({ keyword })
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          await this.getCategories()
          this.getContent()
        }
      }
    }
  },
  methods: {
    ...mapActions('templates',
      [
        'resetContent',
        'getContent',
        'getTagContent',
        'getCategories',
        'getMoreContent'
      ]
    ),
    ...mapMutations('templates', {
      _setTemplateState: 'SET_STATE'
    }),
    async handleSearch(keyword?: string) {
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
    handleShowGroup(group: any) {
      this.currentGroup = group
    },
    handleTheme(selected: { [key: string]: boolean }) {
      const { keyword } = this
      const theme = Object
        .entries(selected)
        .reduce((prev, [id, checked]) => {
          checked && prev.push(id)
          return prev
        }, [] as string[])
        .join(',')
      this._setTemplateState({ theme })
      this.handleSearch(keyword)
      this.showTheme = false
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-template {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__item {
    width: 145px;
    text-align: center;
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
  &__advanced--active {
    color: setColor(gray-4);
  }
  &__advanced:hover {
    color: #e0e0e0;
  }
  &__theme {
    position: absolute;
    left: 20px;
    right: 20px;
  }
  &__search {
    position: relative;
    z-index: 2;
  }
  &__wrap {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    background: rgba(0, 0, 0, .8);
  }
}
</style>
