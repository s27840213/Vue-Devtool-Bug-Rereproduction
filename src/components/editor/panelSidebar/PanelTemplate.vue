<template lang="pug">
div(class="panel-template" ref="panel")
  div(v-if="showPrompt && !currentGroup"
    class="panel-template__prompt body-2")
    span {{$t('NN0247')}}
    svg-icon(class="pl-5 pointer"
      iconColor="gray-2"
      iconName="close"
      iconWidth="24px"
      @click="handleClosePrompt")
  //- Group template UI
  panel-group-template(v-if="currentGroup"
    :showId="showAdminTool"
    :groupItem="currentGroup"
    @close="currentGroup = null")
  //- Search bar and themes
  div
    div(class="panel-template__search")
      search-bar(class="mb-15"
        :placeholder="$t('NN0092', {target: $tc('NN0001',1)})"
        clear
        :defaultKeyword="keywordLabel"
        @search="handleSearch")
        nubtn(theme="icon" icon="sliders" :status="!allThemesChecked?'active':'default'"
            @click="onAdvancedClicked()" :hint="$t('NN0795')")
      popup-theme(v-if="showTheme"
        class="panel-template__theme"
        :style="themeStyle()"
        :preSelected="theme.split(',')"
        @change="handleTheme"
        @close="showTheme = false")
    div(v-if="showTheme" class="panel-template__wrap")
  //- Search result empty msg
  div(v-if="theme && emptyResultMessage") {{ emptyResultMessage }}
  //- Search result counter (only for admin)
  div(v-if="showAdminTool && keyword && !pending && !emptyResultMessage"
    class="pb-10")
    span {{sum}} {{sum === 1 ? 'item' : 'items'}} in total (not work for category search)
  //- Search result and main content
  category-list(v-for="item in categoryListArray"
                v-show="item.show" :ref="item.key" :key="item.key"
                :list="item.content" @loadMore="handleLoadMore"
                @scroll.passive="handleScrollTop($event, item.key as 'mainContent'|'searchResult')")
    template(v-slot:category-list-rows="{ list, title }")
      category-list-rows(:list="list" :title="title"
        @action="handleCategorySearch")
        template(v-slot:preview="{ item }")
          component(class="panel-template__item"
            :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
            :showId="showAdminTool"
            :item="item"
            @clickGroupItem="handleShowGroup")
    template(v-slot:category-template-item="{ list, title }")
      div(v-if="title" class="panel-template__header") {{ title }}
      div(class="panel-template__items")
        component(v-for="item in list"
          class="panel-template__item"
          :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
          :showId="showAdminTool"
          :item="item"
          :key="item.group_id"
          @clickGroupItem="handleShowGroup")
    template(#after)
      //- Loading icon
      div(v-if="!theme || pending" class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
      //- Template wishing pool
      div(v-if="keyword && theme && !pending && resultGroupCounter<=10")
        span {{$t('NN0796', {type: $tc('NN0001', 3)})}}
        nubtn(size="mid-center" class="mt-30")
          url(:url="$t('NN0791')" :newTab="true")
            span {{$t('NN0790', {type: $tc('NN0001', 3)})}}
</template>

<script lang="ts">
import listService from '@/apis/list'
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import PanelGroupTemplate from '@/components/editor/panelSidebar/PanelGroupTemplate.vue'
import Url from '@/components/global/Url.vue'
import PopupTheme from '@/components/popup/PopupTheme.vue'
import SearchBar from '@/components/SearchBar.vue'
import { IAssetTemplate, ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { Itheme } from '@/interfaces/theme'
import GalleryUtils from '@/utils/galleryUtils'
import generalUtils from '@/utils/generalUtils'
import themeUtils from '@/utils/themeUtils'
import _ from 'lodash'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  name: 'PanelTemplate',
  emits: [],
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryTemplateItem,
    PopupTheme,
    CategoryGroupTemplateItem,
    PanelGroupTemplate,
    Url
  },
  data() {
    return {
      showPrompt: false,
      showTheme: false,
      currentGroup: null as IListServiceContentDataItem | null,
      scrollTop: {
        mainContent: 0,
        searchResult: 0
      }
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    const groupId = urlParams.get('group_id')
    if (groupId) {
      listService.getList({ type: 'group', groupId, cache: true }).then(result => {
        const { content } = result.data.data
        this.currentGroup = {
          group_type: 0,
          group_id: groupId,
          type: 6,
          content_ids: content[0].list,
          id: content[0].list[0].id,
          ver: 0
        }
        const query = Object.assign({}, this.$route.query)
        delete query.group_id
        this.$router.replace({ query })
      })
    }

    themeUtils.refreshTemplateState().then(() => {
      generalUtils.panelInit('template',
        this.handleSearch,
        this.handleCategorySearch,
        this.getRecAndCate
      )
    })
  },
  computed: {
    ...mapState('templates', {
      categories: 'categories',
      rawContent: 'content',
      rawSearchResult: 'searchResult',
      pending: 'pending',
      keyword: 'keyword',
      theme: 'theme',
      sum: 'sum'
    }),
    ...mapState('user', ['userId']),
    ...mapGetters({
      editorThemes: 'getEditThemes'
    }),
    ...mapGetters({
      showAdminTool: 'user/showAdminTool'
    }),
    keywordLabel():string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    itemHeight(): number {
      return generalUtils.getListRowItemSize() + (this.showAdminTool ? 34 : 10)
    },
    listCategories(): ICategoryItem[] {
      const { categories, itemHeight } = this
      return (categories as IListServiceContentData[])
        .map((category, index) => ({
          size: itemHeight + 46,
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
        show: this.keyword,
        key: 'searchResult'
      }, {
        content: this.mainContent,
        show: !this.keyword,
        key: 'mainContent'
      }]
    },
    resultGroupCounter(): number {
      return this.rawSearchResult.list?.length || 0
    },
    emptyResultMessage(): string {
      const { keyword, pending } = this
      if (pending || !keyword || this.searchResult.length > 0) return ''
      return keyword
        ? `${this.$t('NN0393', {
          keyword: this.keywordLabel,
          target: this.$tc('NN0001', 1)
        })}`
        : `${this.$t('NN0394', {
          target: this.$tc('NN0001', 1)
        })}`
    },
    currPageThemeIds(): number[] {
      const pageSize = themeUtils.getFocusPageSize()
      return themeUtils
        .getThemesBySize(pageSize.width, pageSize.height)
        .map(theme => theme.id)
    },
    allThemesChecked(): boolean {
      const editorThemesString = _.sortBy((this.editorThemes as Itheme[]).map(theme => theme.id)).join(',')
      return editorThemesString === this.theme
    }
  },
  activated() {
    this.$nextTick(() => {
      const mainContent = (this.$refs.mainContent as CCategoryList[])[0]
      const searchResult = (this.$refs.searchResult as CCategoryList[])[0]
      mainContent.$el.scrollTop = this.scrollTop.mainContent
      searchResult.$el.scrollTop = this.scrollTop.searchResult
    })
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
    },
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
    ...mapActions('templates', [
      'getRecAndCate',
      'getContent',
      'getTagContent',
      'getMoreContent',
      'resetSearch',
      'resetContent',
      'getSum'
    ]),
    ...mapMutations('templates', {
      _setTemplateState: 'SET_STATE'
    }),
    async handleSearch(keyword?: string) {
      this.resetSearch()
      if (keyword) {
        await this.getTagContent({ keyword })
        if (this.showAdminTool) this.getSum({ keyword })
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
    handleShowGroup(group: IListServiceContentDataItem) {
      this.currentGroup = group
    },
    async handleTheme(selected: { [key: string]: boolean }) {
      const theme = Object
        .entries(selected)
        .reduce((prev, [id, checked]) => {
          checked && prev.push(id)
          return prev
        }, [] as string[])
        .join(',')
      const oldKeyword = this.keyword as string

      this.showTheme = false
      this.showPrompt = false
      this._setTemplateState({ theme })
      this.resetContent()
      if (oldKeyword.startsWith('tag::')) await this.handleSearch(oldKeyword)
      else if (oldKeyword) await this.handleCategorySearch(oldKeyword)
      this.getRecAndCate({ reset: false })
    },
    handleClosePrompt() {
      const { userId } = this
      this.showPrompt = false
      sessionStorage[`${userId}_theme_prompt`] = 'hidden'
    },
    handleScrollTop(event: Event, key: 'mainContent'|'searchResult') {
      this.scrollTop[key] = (event.target as HTMLElement).scrollTop
    },
    onAdvancedClicked() {
      this.showTheme = !this.showTheme
      if (this.showPrompt) {
        this.handleClosePrompt()
      }
    },
    isSubsetOf(set: Array<unknown>, subset: Array<unknown>) {
      return new Set([...set, ...subset]).size === set.length
    },
    themeStyle(): Record<string, string> {
      const gapTop = this.$isTouchDevice ? 60 : 80
      return {
        maxHeight: `${(this.$refs.panel as HTMLElement).clientHeight - gapTop}px`
      }
    },
    processListResult(list = [] as IAssetTemplate[], isSearch: boolean): ICategoryItem[] {
      const { theme } = this
      let galleryUtils = null
      if (this.isSubsetOf(['3', '7', '13'], theme.split(','))) {
        // 判斷如果版型為IG限時動態(3) or 電商詳情頁(7), 最小高度則為200px
        galleryUtils = new GalleryUtils(this.$isTouchDevice ? window.innerWidth - 30 : 300, 200, 10)
      } else {
        galleryUtils = new GalleryUtils(this.$isTouchDevice ? window.innerWidth - 30 : 300, 140, 10)
      }
      const idContainerHeight = this.showAdminTool ? 24 : 0
      const result = galleryUtils
        .generate(list.map((template: IAssetTemplate) => ({
          ...template,
          width: template.match_cover.width,
          height: template.match_cover.height
        })))
        .map((templates, idx) => {
          const title = !isSearch && !idx ? `${this.$t('NN0083')}` : ''
          const height = idContainerHeight + templates[0].preview.height
          return {
            id: `result_${templates.map(item => item.id).join('_')}`,
            type: 'category-template-item',
            list: templates as IListServiceContentDataItem[],
            title,
            // 上下margin 10px, 如果有title則再加上title的高度46px
            size: title ? (height + 56) : height + 10
          }
        })
      return result
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
  overflow-x: hidden;
  color: white;
  text-align: left;
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
    color: setColor(blue-3);
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
    text-align: left;
    left: 10px;
    top: 55px;
    width: 284px;
    padding: 12px 8px;
    line-height: 20px;
    border-radius: 5px;
    background-color: setColor(gray-4);
    z-index: 99;
    filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
    > span {
      width: 255px;
    }
    &:before {
      content: "";
      display: block;
      width: 0;
      height: 0;
      position: absolute;
      right: 20px;
      top: -12px;
      transform: rotate(90deg);
      border-style: solid;
      border-width: 8px 10px 8px 0;
      border-color: transparent setColor(gray-4) transparent transparent;
    }
  }
}

.set-all-templatebtn-btn {
  color: setColor("blue-1");
  text-decoration: underline;
}
</style>
