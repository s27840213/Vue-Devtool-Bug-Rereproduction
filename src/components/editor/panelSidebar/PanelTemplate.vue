<template lang="pug">
  div(class="panel-template" ref="panel")
    div(v-if="showPrompt && !currentGroup"
      class="panel-template__prompt body-2")
      span {{$t('NN0247')}}
      svg-icon(class="pl-5 pointer"
        iconColor="gray-2"
        iconName="close"
        iconWidth="24px"
        @click.native="handleClosePrompt")
    //- Group template UI
    panel-group-template(v-if="currentGroup"
      :showId="inAdminMode && enableAdminView"
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
          svg-icon(class="ml-5 pointer panel-template__advanced"
            :class="{ 'panel-template__advanced--active': theme }"
            iconName="advanced"
            iconColor="gray-6"
            iconWidth="20px"
            @click.native="onAdvancedClicked()")
        popup-theme(v-if="showTheme"
          class="panel-template__theme"
          :style="themeStyle()"
          :preSelected="theme.split(',')"
          @change="handleTheme"
          @close="showTheme = false")
      div(v-if="showTheme" class="panel-template__wrap")
    //- Search result empty msg
    div(v-if="theme && emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    //- Search result counter (only for admin)
    div(v-if="inAdminMode && keyword && !pending && !emptyResultMessage"
      class="text-white text-left pb-10")
      span {{sum}} {{sum === 1 ? 'item' : 'items'}} in total (not work for category search)
    //- Search result and main content
    category-list(v-for="item in categoryListArray"
                  v-show="item.show" :ref="item.key" :key="item.key"
                  :list="item.content" @loadMore="handleLoadMore")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(:list="list" :title="title"
          @action="handleCategorySearch")
          template(v-slot:preview="{ item }")
            component(class="panel-template__item"
              :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
              :showId="inAdminMode && enableAdminView"
              :item="item"
              @click="handleShowGroup")
      template(v-slot:category-template-item="{ list, title }")
        div(v-if="title" class="panel-template__header") {{ title }}
        div(class="panel-template__items")
          component(v-for="item in list"
            class="panel-template__item"
            :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
            :showId="inAdminMode && enableAdminView"
            :item="item"
            :key="item.group_id"
            @click="handleShowGroup")
      template(#after)
        //- Loading icon
        div(v-if="!theme || pending" class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
        //- Search result too few msg
        div(v-if="keyword && theme && !pending && resultGroupCounter<=3 && !allThemesChecked"
            class="text-white text-left")
          span {{resultTooFew[0]}}
          span(class="set-all-templatebtn-btn pointer" @click="setAllTemplate") {{resultTooFew[1]}}
          span {{resultTooFew[2]}}
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapActions, mapState, mapMutations, mapGetters } from 'vuex'
import { IAssetTemplate, ICategoryItem, ICategoryList, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import PopupTheme from '@/components/popup/PopupTheme.vue'
import PanelGroupTemplate from '@/components/editor/panelSidebar/PanelGroupTemplate.vue'
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'
import themeUtils from '@/utils/themeUtils'
import GalleryUtils from '@/utils/galleryUtils'
import { Itheme } from '@/interfaces/theme'
import _ from 'lodash'
import listService from '@/apis/list'
import generalUtils from '@/utils/generalUtils'

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

    // panelInit for PanelTemplate at themeUtils.fetchTemplateContent
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
    ...mapState('user', ['userId', 'role', 'adminMode']),
    ...mapState(['themes']),
    ...mapGetters({
      enableAdminView: 'user/getEnableAdminView'
    }),
    keywordLabel():string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    inAdminMode(): boolean {
      return (this.role === 0) && this.adminMode
    },
    itemHeight(): number {
      return generalUtils.getListRowItemSize() + (this.inAdminMode ? 34 : 10)
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
        ? `${i18n.t('NN0393', {
          keyword: this.keywordLabel,
          target: i18n.tc('NN0001', 1)
        })}`
        : `${i18n.t('NN0394', {
          target: i18n.tc('NN0001', 1)
        })}`
    },
    currPageThemeIds(): number[] {
      const pageSize = themeUtils.getFocusPageSize()
      return themeUtils
        .getThemesBySize(pageSize.width, pageSize.height)
        .map(theme => theme.id)
    },
    resultTooFew(): string[] {
      return (i18n.t('NN0398') as string).split('<html>')
    },
    allThemesChecked(): boolean {
      const allThemeString = _.sortBy(this.themes.map((item: Itheme) => item.id)).join(',')
      return allThemeString === this.theme
    }
  },
  activated() {
    this.$refs.mainContent[0].$el.scrollTop = this.scrollTop.mainContent
    this.$refs.searchResult[0].$el.scrollTop = this.scrollTop.searchResult
    this.$refs.mainContent[0].$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    this.$refs.searchResult[0].$el.addEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
  },
  deactivated() {
    this.$refs.mainContent[0].$el.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'mainContent'))
    this.$refs.searchResult[0].$el.removeEventListener('scroll', (e: Event) => this.handleScrollTop(e, 'searchResult'))
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
          this.$refs.mainContent[0].$el.scrollTop = this.scrollTop.mainContent
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
    handleSearch(keyword?: string) {
      this.resetSearch()
      if (keyword) {
        this.getTagContent({ keyword })
        if (this.inAdminMode) this.getSum({ keyword })
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetSearch()
      if (keyword) {
        this.getContent({ keyword, locale })
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleShowGroup(group: IListServiceContentDataItem) {
      this.currentGroup = group
    },
    setAllTemplate(): void {
      const allTheme: { [key: string]: boolean } = {}
      this.themes.forEach((theme: Itheme) => {
        allTheme[theme.id] = true
      })
      this.handleTheme(allTheme)
    },
    handleTheme(selected: { [key: string]: boolean }) {
      const theme = Object
        .entries(selected)
        .reduce((prev, [id, checked]) => {
          checked && prev.push(id)
          return prev
        }, [] as string[])
        .join(',')
      this._setTemplateState({ theme })
      this.resetContent()
      this.getRecAndCate()
      this.showTheme = false
      this.showPrompt = false
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
      return {
        maxHeight: `${this.$refs.panel.clientHeight - 80}px`
      }
    },
    processListResult(list = [] as IAssetTemplate[], isSearch: boolean): ICategoryItem[] {
      const { theme } = this
      let galleryUtils = null
      if (this.isSubsetOf(['3', '7', '13'], theme.split(','))) {
        // 判斷如果版型為IG限時動態(3) or 電商詳情頁(7), 最小高度則為200px
        galleryUtils = new GalleryUtils(generalUtils.isTouchDevice() ? window.innerWidth - 30 : 300, 200, 10)
      } else {
        galleryUtils = new GalleryUtils(generalUtils.isTouchDevice() ? window.innerWidth - 30 : 300, 140, 10)
      }
      const idContainerHeight = this.inAdminMode ? 24 : 0
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
