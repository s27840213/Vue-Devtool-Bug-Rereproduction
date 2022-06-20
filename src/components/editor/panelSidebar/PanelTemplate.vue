<template lang="pug">
  div(class="panel-template")
    div(v-if="showPrompt && !currentGroup"
      class="panel-template__prompt body-2")
      span {{$t('NN0247')}}
      svg-icon(class="pl-5 pointer"
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
          :placeholder="$t('NN0092', {target: $tc('NN0001',1)})"
          clear
          :defaultKeyword="keyword"
          @search="handleSearch")
          svg-icon(class="ml-5 pointer panel-template__advanced"
            :class="{ 'panel-template__advanced--active': theme }"
            iconName="advanced"
            iconColor="gray-6"
            iconWidth="20px"
            @click.native="onAdvancedClicked()")
        popup-theme(v-if="showTheme"
          class="panel-template__theme"
          :preSelected="theme.split(',')"
          @change="handleTheme"
          @close="showTheme = false")
      div(v-if="showTheme" class="panel-template__wrap")
    div(v-if="theme && emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    div(v-if="showTemplateId && keyword && !pending && !emptyResultMessage"
      class="text-white text-left pb-10")
      span {{sum}} {{sum === 1 ? 'item' : 'items'}} in total (not work for category search)
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
    div(v-if="keyword && theme && !pending && resultGroupCounter<=3 && !allThemesChecked"
      class="text-white text-left")
      span {{resultTooLess[0]}}
      span(class="set-all-templatebtn-btn pointer" @click="setAllTemplate") {{resultTooLess[1]}}
      span {{resultTooLess[2]}}
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapActions, mapState, mapMutations } from 'vuex'
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
      scrollTop: 0
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    const groupId = urlParams.get('group_id')
    if (!groupId) return
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
        'theme',
        'sum'
      ]
    ),
    ...mapState('user', ['userId', 'role', 'adminMode']),
    ...mapState(['themes']),
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
      if (this.isSubsetOf(['3', '7', '13'], theme.split(','))) {
        // 判斷如果版型為IG限時動態(3) or 電商詳情頁(7), 最小高度則為200px
        galleryUtils = new GalleryUtils(generalUtils.isTouchDevice() ? window.innerWidth : 300, 200, 10)
      } else {
        galleryUtils = new GalleryUtils(generalUtils.isTouchDevice() ? window.innerWidth : 300, 140, 10)
      }
      const idContainerHeight = this.showTemplateId ? 24 : 0
      const result = galleryUtils
        .generate(list.map((template: any) => ({
          ...template,
          width: template.match_cover.width,
          height: template.match_cover.height
        })))
        .map((templates, idx) => {
          const title = !keyword && !idx ? `${this.$t('NN0083')}` : ''
          const height = idContainerHeight + templates[0].preview.height
          return {
            id: `result_${templates.map(item => item.id).join('_')}`,
            type: 'category-template-item',
            list: templates,
            title: !keyword && !idx ? `${this.$t('NN0083')}` : '',
            // 上下margin 10px, 如果有title則再加上title的高度46px
            size: title ? (height + 56) : height + 10
          }
        })
      if (result.length) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    resultGroupCounter(): number {
      return this.content.list?.length || 0
    },
    list(): any[] {
      const list = generalUtils.deepCopy(this.listCategories.concat(this.listResult))
      if (this.listResult.length === 0 && list.length !== 0) {
        list[list.length - 1].sentinel = true
      }
      return list
    },
    emptyResultMessage(): string {
      const { keyword, pending, listResult } = this
      return !pending && !this.list.length ? (keyword ? `${i18n.t('NN0393', { keyword: this.keyword, target: i18n.tc('NN0001', 1) })}` : `${i18n.t('NN0394', { target: i18n.tc('NN0001', 1) })}`) : ''
    },
    currPageThemeIds(): number[] {
      const pageSize = themeUtils.getFocusPageSize()
      return themeUtils
        .getThemesBySize(pageSize.width, pageSize.height)
        .map(theme => theme.id)
    },
    resultTooLess(): string[] {
      return (i18n.t('NN0398') as string).split('<html>')
    },
    allThemesChecked(): boolean {
      const allThemeString = _.sortBy(this.themes.map((item: Itheme) => item.id)).join(',')
      return allThemeString === this.theme
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
        'getRecAndCate',
        'getMoreContent',
        'getSum'
      ]
    ),
    ...mapMutations('templates', {
      _setTemplateState: 'SET_STATE'
    }),
    async handleSearch(keyword?: string) {
      this.resetContent()
      if (keyword) {
        this.getTagContent({ keyword })
        this.getSum({ keyword })
      } else {
        this.getRecAndCate()
      }
    },
    handleCategorySearch(keyword: string) {
      this.resetContent()
      this.getContent({ keyword })
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
    },
    onAdvancedClicked() {
      this.showTheme = !this.showTheme
      if (this.showPrompt) {
        this.handleClosePrompt()
      }
    },
    isSubsetOf(set: Array<unknown>, subset: Array<unknown>) {
      return new Set([...set, ...subset]).size === set.length
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
    max-height: calc(100vh - 85px);
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
