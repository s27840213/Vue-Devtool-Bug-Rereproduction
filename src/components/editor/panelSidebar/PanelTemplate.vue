<template lang="pug">
  div(class="panel-template")
    div(v-if="showPrompt"
      class="panel-template__prompt body-2")
      span {{$t('NN0247')}}
      svg-icon(class="pointer"
        iconColor="gray-2"
        iconName="close"
        iconWidth="24px"
        @click.native="handleClosePrompt")
    panel-group-template(v-if="currentGroup"
      :showId="showTemplateId"
      :groupItem="currentGroup"
      @close="currentGroup = null")
    div
      div(class="panel-template__search")
        search-bar(class="mb-15"
          :placeholder="`${$t('NN0092', {target: $tc('NN0001',1)})}`"
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
    div(v-if="theme && emptyResultMessage" class="text-white") {{ emptyResultMessage }}
    category-list(ref="list"
      :list="list"
      @loadMore="handleLoadMore")
      template(v-if="!theme || pending" #after)
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
        div(v-if="title" class="panel-template__header") {{ title }}
        div(class="panel-template__items")
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
import { mapActions, mapState, mapMutations, mapGetters } from 'vuex'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import PopupTheme from '@/components/popup/PopupTheme.vue'
import PanelGroupTemplate from '@/components/editor/panelSidebar/PanelGroupTemplate.vue'
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'
import themeUtils from '@/utils/themeUtils'
import GalleryUtils from '@/utils/galleryUtils'

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
  data() {
    return {
      showPrompt: false,
      showTheme: false,
      currentGroup: null,
      scrollTop: 0
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
    ...mapState('user', ['userId', 'role', 'adminMode']),
    ...mapGetters({
      currActivePageIndex: 'getCurrActivePageIndex'
    }),
    showTemplateId(): boolean {
      return (this.role === 0) && this.adminMode
    },
    itemHeight(): number {
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
      const { keyword, theme } = this
      let galleryUtils = null
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      if (['3', '7'].includes(theme)) {
        // 判斷如果版型為IG限時動態(3) or 電商詳情頁(7), 最小高度則為200px
        galleryUtils = new GalleryUtils(300, 200, 10)
      } else {
        galleryUtils = new GalleryUtils(300, 140, 10)
      }
      const result = galleryUtils
        .generate(list.map((template: any) => ({
          ...template,
          width: template.match_cover.width,
          height: template.match_cover.height
        })))
        .map((templates, idx) => {
          const title = !keyword && !idx ? `${this.$t('NN0083')}` : ''
          return {
            id: `result_${templates.map(item => item.id).join('_')}`,
            type: 'category-template-item',
            list: templates,
            title: !keyword && !idx ? `${this.$t('NN0083')}` : '',
            size: title ? (templates[0].preview.height + 70) : templates[0].preview.height + 24
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
    },
    currPageThemeIds(): number[] {
      const pageSize = themeUtils.getFocusPageSize()
      return themeUtils
        .getThemesBySize(pageSize.width, pageSize.height)
        .map(theme => theme.id)
    }
  },
  activated() {
    this.$refs.list.$el.scrollTop = this.scrollTop
    this.$refs.list.$el.addEventListener('scroll', this.handleScrollTop)
  },
  deactivated() {
    this.$refs.list.$el.removeEventListener('scroll', this.handleScrollTop)
  },
  watch: {
    currPageThemeIds(curr: number[] = []) {
      const { theme, userId } = this
      if (theme && !sessionStorage[`${userId}_theme_prompt`]) {
        const themes = theme.split(',')
        const include = curr.some(id => themes.includes(`${id}`))
        this.showPrompt = !include
      } else {
        this.showPrompt = false
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
      this.showPrompt = false
    },
    handleClosePrompt() {
      const { userId } = this
      this.showPrompt = false
      sessionStorage[`${userId}_theme_prompt`] = 'hidden'
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
.panel-template {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__item {
    text-align: center;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    column-gap: 10px;
    grid-auto-flow: column;
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
    background: rgba(0, 0, 0, 0.8);
  }
  &__prompt {
    position: absolute;
    display: flex;
    align-items: center;
    right: -15px;
    top: 10px;
    padding: 8px;
    line-height: 20px;
    border-radius: 5px;
    background-color: setColor(gray-4);
    transform: translateX(100%);
    &:before {
      content: "";
      display: block;
      width: 0;
      height: 0;
      position: absolute;
      left: -8px;
      top: 12px;
      border-style: solid;
      border-width: 8px 10px 8px 0;
      border-color: transparent setColor(gray-4) transparent transparent;
    }
  }
}
</style>
