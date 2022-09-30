<template lang="pug">
  div(class="panel-objects" :class="{'in-category': isInCategory}")
    search-bar(v-if="!isInCategory"
      class="panel-objects__searchbar"
      :placeholder="$t('NN0092', {target: $tc('NN0003',1)})"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="dark"
      :color="{close: 'black-5', search: 'black-5'}"
      @search="handleSearch")
    div(v-if="isAdmin" class="panel-objects-2html")
      input(type="text" placeholder="項目網址" v-model="panelParams")
      btn(@click.native="downloadAll") Download all
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    category-list(ref="list"
      :list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
          v-if="!keyword"
          :list="list"
          :title="title"
          @action="handleCategorySearch")
          template(v-slot:preview="{ item }")
            category-object-item(class="panel-objects__item"
              :item="item")
      template(v-slot:category-object-item="{ list }")
        div(class="panel-objects__items")
          category-object-item(v-for="item in list"
            class="panel-objects__item"
            :key="item.id"
            :item="item")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import i18n from '@/i18n'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryListRows,
    CategoryObjectItem
  },
  data() {
    return {
      scrollTop: 0,
      // For object2wphtml
      panelParams: ''
    }
  },
  computed: {
    ...mapGetters({
      isAdmin: 'user/isAdmin',
      isTabInCategory: 'vivisticker/getIsInCategory',
      isTabShowAllRecently: 'vivisticker/getShowAllRecently'
    }),
    ...mapState('objects', [
      'categories',
      'content',
      'pending',
      'keyword'
    ]),
    isInCategory(): boolean {
      return this.isTabInCategory('object')
    },
    showAllRecently(): boolean {
      return this.isTabShowAllRecently('object')
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    listCategories(): any[] {
      const { keyword, categories } = this
      if (keyword) { return [] }
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0)
        .map((category, index) => ({
          size: 140,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
    listRecently(): any[] {
      const { categories } = this
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems,
            size: 90,
            title: ''
          }
        })
      return result
    },
    listResult(): any[] {
      const { keyword } = this
      if (!keyword) { return [] }
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems,
            size: 90
          }
        })
      if (result.length) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    list(): any[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      const list = generalUtils.deepCopy(this.listCategories.concat(this.listResult))
      if (this.listResult.length === 0 && list.length !== 0) {
        list[list.length - 1].sentinel = true
      }
      return list
    },
    emptyResultMessage(): string {
      return this.keyword && !this.pending && !this.listResult.length && !this.showAllRecently ? `${i18n.t('NN0393', { keyword: this.keywordLabel, target: i18n.tc('NN0003', 1) })}` : ''
    }
  },
  mounted() {
    (this.$refs.list as Vue).$el.addEventListener('scroll', (event: Event) => {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    })

    generalUtils.panelInit('object',
      this.handleSearch,
      this.handleCategorySearch,
      async () => {
        await this.getRecAndCate('objects')
      }
    )
  },
  activated() {
    const el = (this.$refs.list as Vue).$el
    el.scrollTop = this.scrollTop
    el.addEventListener('scroll', this.handleScrollTop)
  },
  deactivated() {
    (this.$refs.list as Vue).$el.removeEventListener('scroll', this.handleScrollTop)
  },
  destroyed() {
    this.resetContent()
  },
  methods: {
    ...mapActions('objects', [
      'resetContent',
      'getContent',
      'getTagContent',
      'getRecently',
      'getRecAndCate',
      'getMoreContent'
    ]),
    handleSearch(keyword: string) {
      this.resetContent()
      if (keyword) {
        this.panelParams = `http://vivipic.com/editor?panel=object&search=${keyword.replace(/&/g, '%26')}&type=new-design-size&width=1080&height=1080&themeId=1`
        this.getTagContent({ keyword })
      } else {
        this.getRecAndCate('objects')
      }
    },
    handleCategorySearch(keyword: string, locale = '') {
      this.resetContent()
      if (keyword) {
        this.panelParams = `http://vivipic.com/editor?panel=object&category=${keyword.replace(/&/g, '%26')}&category_locale=${i18n.locale}&type=new-design-size&width=1080&height=1080&themeId=1`
        if (keyword === `${this.$t('NN0024')}`) {
          this.getRecently({ key: 'objects', keyword })
          vivistickerUtils.setShowAllRecently('object', true)
        } else {
          this.getContent({ keyword, locale })
        }
        vivistickerUtils.setIsInCategory('object', true)
      } else {
        vivistickerUtils.setShowAllRecently('object', false)
        this.getRecAndCate('objects')
      }
    },
    handleLoadMore() {
      this.getMoreContent()
    },
    handleScrollTop(event: Event) {
      this.scrollTop = (event.target as HTMLElement).scrollTop
    },
    downloadAll() {
      generalUtils.copyText(this.panelParams)
      this.$notify({ group: 'copy', text: '已複製網址到剪貼簿' })
      const links = this.list.map((it) => {
        return it.list.map((it: Record<string, string>) => {
          return `https://template.vivipic.com/svg/${it.id}/prev?ver=${it.ver}`
        }).join('\n')
      }).join('\n')
      generalUtils.downloadTextFile(`${this.keywordLabel}.txt`, links)
    }
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-objects {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  padding: 0 24px;
  &__searchbar {
    margin-top: 24px;
    margin-bottom: 14px;
  }
  &__item {
    width: 80px;
    height: 80px;
    margin: 0 auto;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 48px;
  }
}

.panel-objects-2html {
  > input:focus {
    width: 1000px;
    border: 1px solid black;
  }
  > button { margin: 10px auto; }
}

.space {
  margin-bottom: 33px;
}
</style>
