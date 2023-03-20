<template lang="pug">
div(class="panel-static" :class="{'in-category': isInCategory}")
  div(class="panel-static__categorys" :class="{invisible: hideCategoryIconList}")
    div(class="panel-static__categorys__category" :class="{'selected': showAllRecently}" @click="handleCategorySearch($t('NN0024'))")
      svg-icon(class="pointer"
        iconName="clock"
        iconColor="white"
        iconWidth="24px")
    div(class="panel-static__categorys__vr")
    recycle-scroller(class="panel-static__categorys__list"
      :key="'panel-static__categorys-icon-list' + (isInCategory ? '--cat' : '')"
      :items="listCategoryItems"
      direction="horizontal"
      @scroll-end="(nextCategory !== -1) && getCategories()"
      :ref="!hideCategoryIconList ? 'categoryIconList' : undefined")
      template(v-slot="{ item }")
        div(class="panel-static__categorys__category" :class="{'selected': item.title === keyword}"
        :ref="!hideCategoryIconList && item.title === keyword ? 'selectedCategoryIcon' : undefined"
        @click="handleCategorySearch(item.title)")
          div(class="panel-static__categorys__category__icon" :style="iconStyles(item.list, item.coverId)")
  Tags(v-if="isInCategory && tags && tags.length" class="panel-static__tags"
      :tags="tags" theme="dark" @search="handleSearch")
  //- Search result and static main content
  category-list(v-for="item in categoryListArray" :class="{invisible: !item.show}"
                :ref="item.key" :key="item.key"
                :list="item.content"
                @loadMore="item.loadMore")
    template(#before)
      div(class="panel-static__top-item")
      Tags(v-if="!isInCategory && tags && tags.length" class="panel-static__tags" style="margin-top: 0"
          :tags="tags" :scrollLeft="tagScrollLeft" theme="dark" @search="handleSearch" @scroll="(scrollLeft: number) => tagScrollLeft = scrollLeft")
      //- Search result empty msg
      div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
      //- Empty favorites view
      div(v-if="showFav && !item.content.length && !pending"
            class="panel-static__favorites-empty")
          svg-icon(iconName="favorites-empty" iconWidth="42px" iconColor="white")
          span(class="panel-static__favorites-empty--title") {{$t('NN0765')}}
          span(class="text-black-5") {{$t('NN0764')}}
      //- Empty recently used view
      div(v-if="showAllRecently && !item.content.length && !pending" class="panel-static__recent-empty")
          svg-icon(iconName="vivisticker_design" iconWidth="42px" iconColor="white")
          div(class="panel-static__recent-empty--title") No content in Recently Used
    template(v-slot:category-list-rows="{ list, title, isFavorite }")
      category-list-rows(
          :list="list"
          :title="title"
          :isFavorite="isFavorite")
          template(v-slot:action)
            div(class="panel-static__list-rows-action")
              svg-icon(v-if="isFavorite !== undefined"
                      :iconName="isFavorite ? 'favorites-fill' : 'heart'"
                      iconWidth="24px" iconColor="gray-2" @click="toggleFaovoritesCategoryByTitle($event, title)")
              span(@click="item.categorySearch && item.categorySearch(title)") {{$t('NN0082')}}
          template(v-slot:preview="{ item }")
            category-object-item(class="panel-static__item"
              :src="item.src"
              :item="item"
              :style="itemStyles"
              @click4in1="click4in1"
              @dbclick4in1="toggleFavorites4in1"
              @dbclick="toggleFavoritesItem")
    template(v-slot:category-object-card="{ list }")
      div(class="panel-static__card-row")
        category-object-card(v-for="card in list"
          :key="card.id"
          :title="card.title"
          :isFavorite="card.isFavorite"
          :coverUrl="card.coverUrl"
          :scrollTop="mainContentScrollTop"
          :style="cardStyles"
          @cardClick="item.categorySearch && item.categorySearch(card.title)"
          @favClick="toggleFaovoritesCategoryByTitle($event, card.title)")
    template(v-slot:category-object-item="{ list }")
      div(class="panel-static__items")
        category-object-item(v-for="item in list"
          class="panel-static__item"
          :key="item.id"
          :src="item.src"
          :item="item"
          :style="itemStyles"
          @click4in1="click4in1"
          @dbclick4in1="toggleFavorites4in1"
          @dbclick="toggleFavoritesItem")
    template(v-if="pending" #after)
      div(class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
</template>

<script lang="ts">
import { CCategoryList } from '@/components/category/CategoryList.vue'
import { ICategoryItem, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { IAsset, isITag, ITagExtend } from '@/interfaces/module'
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'vuex'
import PanelObjectStatic from '../PanelObjectStatic.vue'
import CategoryObjectCard from './CategoryObjectCard.vue'

export default defineComponent({
  extends: PanelObjectStatic,
  emits: ['search'],
  components: {
    CategoryObjectCard
  },
  data() {
    return {
      mainContentScrollTop: 0,
      elMainContent: undefined as HTMLElement | undefined
    }
  },
  activated() {
    this.$nextTick(() => {
      this.elMainContent = (this.$refs as Record<string, CCategoryList[]>).mainContent[0].$el as HTMLElement
      this.elMainContent.addEventListener('scroll', this.handleMainContentScroll)
    })
  },
  deactivated() {
    this.elMainContent?.removeEventListener('scroll', this.handleMainContentScroll)
  },
  computed: {
    ...mapState({
      isLandscape: 'isLandscape',
      windowSize: 'windowSize'
    }),
    ...mapState('objects', {
      nextCategory: 'nextCategory'
    }),
    hideCategoryIconList(): boolean {
      return !this.isInCategory || this.showFav
    },
    listRecently(): ICategoryItem[] {
      const { rawCategories } = this
      const list = (rawCategories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems,
            size: this.itemHeight + 10,
            title: ''
          }
        })
      return result
    },
    numCardColumns(): number {
      if (this.isTablet) return 2
      return 1
    },
    cardGap(): number {
      if (this.isTablet) return 20
      return 10
    },
    cardHeight(): number {
      const { isTablet, isLandscape } = this
      const containerWidthRatio = isTablet ? isLandscape ? 0.64 : 0.9 : 1
      const containerPadding = isTablet ? 0 : 32
      const cardAspectRatio = 16 / 9
      return ((this.windowSize.width * containerWidthRatio - containerPadding) / cardAspectRatio - this.cardGap * (this.numCardColumns - 1)) / this.numCardColumns
    },
    cardStyles(): {[key: string]: string} {
      return {
        height: `${this.cardHeight}px`,
      }
    },
    categoryHeight(): number {
      const titleHeight = 46
      const gap = this.isTablet ? 20 : 14
      return this.itemHeight + titleHeight + gap
    },
    categoryCardHeight(): number {
      return this.cardHeight + this.cardGap
    },
    categoryIconWidth(): number {
      const iconSize = 40
      const gap = 10
      return iconSize + gap
    },
    listCategoryItems() {
      return this.processListCategory(this.rawCategories)
    },
    listCategoryCards() {
      return this.processListCategoryCard(this.rawCategories)
    },
    listCategories(): ICategoryItem[] {
      if (!this.showFav && !this.isInCategory && !this.showAllRecently) return this.listCategoryCards
      return this.listCategoryItems
    },
  },
  watch: {
    isInCategory(newVal: boolean, oldVal: boolean) {
      if (newVal && !oldVal) this.scrollCategoryIcon(this.showAllRecently ? 0 : undefined)
    }
  },
  methods: {
    ...mapActions('objects', [
      'getCategories',
    ]),
    async handleSearch(keyword: string) {
      await PanelObjectStatic.methods?.handleSearch.call(this, keyword)
      this.$emit('search')
    },
    toggleFaovoritesCategoryByTitle(evt: Event, title: string) {
      evt.stopPropagation()
      PanelObjectStatic.methods?.toggleFaovoritesCategoryByTitle.call(this, title)
    },
    processListCategory(list: IListServiceContentData[]): ICategoryItem[] {
      return list
        .filter(category => category.list.length > 0 && !category.is_recent)
        .map((category, index) => ({
          size: this.showFav ? this.categoryHeight
            : this.isInCategory ? this.categoryIconWidth
              : this.categoryCardHeight,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title,
          isFavorite: category.id === -1 ? undefined : this.checkCategoryFavorite(category.id),
          coverId: category.cover_id,
          coverUrl: category.cover_url,
        }))
    },
    processListCategoryCard(list: IListServiceContentData[]): {id: string, type: string, size: number, list: any[]}[] {
      list = list.filter(category => category.list.length > 0 && !category.is_recent)
      return new Array<ICategoryItem>(Math.ceil(list.length / this.numCardColumns))
        .fill({} as ICategoryItem)
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.numCardColumns, idx * this.numCardColumns + this.numCardColumns)
          return {
            id: `rows_${idx}_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-object-card',
            size: this.categoryCardHeight,
            list: rowItems.map(category => ({
              id: category.id,
              title: category.title,
              isFavorite: category.id === -1 ? undefined : this.checkCategoryFavorite(category.id),
              coverUrl: category.cover_url,
            }))
          }
        })
    },
    processListResult(list = [] as IListServiceContentDataItem[]|ITagExtend[]): ICategoryItem[] {
      const gap = this.isTablet ? 20 : 24
      return new Array(Math.ceil(list.length / 3))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 3, idx * 3 + 3)
          return {
            id: `result_${rowItems.map(item => isITag(item) ? item.keyword : item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems as IAsset[],
            size: this.itemHeight + gap
          }
        })
    },
    iconStyles(list: IListServiceContentDataItem[], coverId?: string): {[key: string]: string} {
      const iconUrl = `https://template.vivipic.com/svg/${coverId || list[0].id}/prev`
      return {
        backgroundImage: `url(${iconUrl})`
      }
    },
    handleMainContentScroll() {
      this.mainContentScrollTop = this.elMainContent?.scrollTop ?? 0
    },
    scrollCategoryIcon(target?: number) {
      if (this.hideCategoryIconList) return
      this.$nextTick(() => {
        const categoryIconList = (this.$refs.categoryIconList as any).$el as HTMLElement
        if (target !== undefined) {
          categoryIconList.scrollLeft = target
          return
        }

        // scroll category icon list to selected one
        const scrollTop = this.mainContentScrollTop
        setTimeout(() => {
          categoryIconList.scrollLeft = (scrollTop / this.numCardColumns) * (this.categoryIconWidth / this.categoryCardHeight)
          const selectedCategoryIcon = this.$refs.selectedCategoryIcon as HTMLElement
          if (!selectedCategoryIcon || !selectedCategoryIcon.parentElement) return

          const transform = selectedCategoryIcon.parentElement.style.transform
          const match = transform.match(/translateX\((\d+(?:[.]\d*?)?)px\)/)
          if (!match || match.length < 2) return

          const scrollLeft = parseFloat(match[1])
          categoryIconList.scrollLeft = scrollLeft
        }, 2)
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-static {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  color: setColor(white);
  overflow: hidden;
  &__categorys {
    display: grid;
    grid-template-columns: 1fr 2px auto;
    column-gap: 10px;
    min-height: 40px;
    margin: 10px 0;
    overflow: hidden;
    &__vr {
      background-color: rgba(255, 255, 255, 0.2);
      width: 2px;
    }
    &__category {
      @include size(40px, 40px);
      display: flex;
      justify-content: center;
      align-items: center;
      &__icon {
        width: 24px;
        height: 24px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
      }
      &.selected {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 5px;
      }
    }
    &__list::-webkit-scrollbar{
      display: none;
    }
  }
  &__tags {
    margin: 10px 0 10px 0;
    color: setColor(black-5);
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
  &__card-row {
    display: grid;
    grid-template-columns: repeat(v-bind(numCardColumns), 1fr);
    column-gap: 20px;
  }
  &.in-category::v-deep .category-list .vue-recycle-scroller__item-wrapper {
    margin-top: 24px;
  }
  &__list-rows-action {
    display: flex;
    align-items: center;
    > svg {
      margin-right: 20px;
      padding-right: 20px;
      border-right: 1px solid setColor(gray-2);
    }
  }
  &__favorites-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: calc((100vh - 229px) * 0.8);
    &--title {
      margin: 12px 0 24px 0;
    }
  }
  &__recent-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: calc((100vh - 161px) * 0.8);
    &--title {
      margin: 12px 0 24px 0;
      color: white;
    }
  }
  .category-list {
    overflow-x: hidden;
  }
  .invisible {
    visibility: hidden;
    height: 0;
    min-height: 0;
    margin: 0;
    overflow: hidden;
  }
}
</style>
