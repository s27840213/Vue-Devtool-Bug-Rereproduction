<template lang="pug">
div(class="panel-gifs" :class="{'in-category': isInCategory}")
  div(:style="{...((!isInCategory || showFav) && {visibility: 'hidden', height: 0, minHeight: 0, margin: 0})}" class="panel-gifs__categorys")
      div(class="panel-gifs__categorys__category" :class="{'selected': showAllRecently}" @click="handleCategorySearch($t('NN0024'))")
        svg-icon(class="pointer"
          iconName="clock"
          iconColor="white"
          iconWidth="24px")
      div(class="panel-gifs__categorys__vr")
      recycle-scroller(class="panel-gifs__categorys__list" :items="listCategories" direction="horizontal" @scroll-end="(nextCategory !== -1) && getCategories()" ref="categoryIconList")
        template(v-slot="{ item }")
          div(class="panel-gifs__categorys__category" :class="{'selected': item.title === keyword}" :ref="item.title === keyword ? 'selectedCategoryIcon' : undefined" @click="handleCategorySearch(item.title)")
            div(class="panel-gifs__categorys__category__icon" :style="iconStyles(item.list)")
  Tags(v-if="isInCategory && tags && tags.length" class="panel-gifs__tags"
      :tags="tags" theme="dark" @search="handleSearch")
  //- Search result and static main content
  category-list(v-for="item in categoryListArray" :class="{invisible: !item.show}"
                :ref="item.key" :key="item.key"
                :list="item.content" @loadMore="item.loadMore")
    template(#before)
      div(class="panel-gifs__top-item")
      Tags(v-if="!isInCategory && tags && tags.length" class="panel-gifs__tags" style="margin-top: 0"
          :tags="tags" :scrollLeft="tagScrollLeft" theme="dark" @search="handleSearch" @scroll="(scrollLeft: number) => tagScrollLeft = scrollLeft")
      //- Search result empty msg
      div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
      //- Empty favorites view
      div(v-if="showFav && !item.content.length && !pending"
          class="panel-gifs__favorites-empty")
        svg-icon(iconName="favorites-empty" iconWidth="42px" iconColor="white")
        span(class="panel-gifs__favorites-empty--title") {{$t('NN0765')}}
        span(class="text-black-5") {{$t('NN0764')}}
    template(v-slot:category-list-rows="{ list, title, isFavorite }")
      category-list-rows(
        :list="list"
        :title="title"
        :isFavorite="isFavorite")
        template(v-slot:action)
          div(class="panel-gifs__list-rows-action")
            svg-icon(v-if="isFavorite !== undefined"
                    :iconName="isFavorite ? 'favorites-fill' : 'heart'"
                    iconWidth="24px" iconColor="gray-2" @click="toggleFaovoritesCategoryByTitle(title)")
            span(@click="item.categorySearch && item.categorySearch(title)") {{$t('NN0082')}}
        template(v-slot:preview="{ item }")
          category-object-item(class="panel-gifs__item"
            :src="item.src"
            :item="item"
            :style="itemStyles"
            @click4in1="click4in1"
            @dbclick4in1="toggleFavorites4in1"
            @dbclick="toggleFavoritesItem")
    template(v-slot:category-object-item="{ list }")
      div(class="panel-gifs__items")
        category-object-item(v-for="item in list"
          class="panel-gifs__item"
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
import { defineComponent } from 'vue'
import { mapState } from 'vuex'
import PanelObjectGifs from '../PanelObjectGifs.vue'

export default defineComponent({
  extends: PanelObjectGifs,
  emits: ['search'],
  computed: {
    ...mapState('giphy', {
      nextCategory: 'nextCategory'
    }),
    listRecently(): ICategoryItem[] {
      const { rawCategories } = this
      const list = (rawCategories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / 4))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 4, idx * 4 + 4)
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
    categoryHeight(): number {
      const titleHeight = 46
      const gap = this.isTablet ? 20 : 14
      return this.itemHeight + titleHeight + gap
    },
    categoryIconWidth(): number {
      const iconSize = 40
      const gap = 10
      return iconSize + gap
    },
  },
  watch: {
    isInCategory(newVal: boolean, oldVal: boolean) {
      if (newVal && !oldVal) this.scrollCategoryIcon(this.showAllRecently ? 0 : undefined)
    }
  },
  methods: {
    async handleSearch(keyword: string) {
      await PanelObjectGifs.methods?.handleSearch.call(this, keyword)
      this.$emit('search')
    },
    processListCategory(list: IListServiceContentData[]): ICategoryItem[] {
      return list
        .filter(category => category.list.length > 0 && !category.is_recent)
        .map((category, index) => ({
          size: this.isInCategory ? this.categoryIconWidth : this.categoryHeight,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title,
          isFavorite: category.id === -1 ? undefined : this.checkCategoryFavorite(category.id)
        }))
    },
    processListResult(list = [] as IListServiceContentDataItem[]): ICategoryItem[] {
      const gap = this.isTablet ? 20 : 24
      return new Array(Math.ceil(list.length / 4))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * 4, idx * 4 + 4)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-object-item',
            list: rowItems,
            size: this.itemHeight + gap
          }
        })
    },
    iconStyles(list: IListServiceContentDataItem[]): {[key: string]: string} {
      const iconUrl = list[0].src
      return {
        backgroundImage: `url(${iconUrl})`
      }
    },
    scrollCategoryIcon(target?: number) {
      const categoryIconList = (this.$refs.categoryIconList as any).$el as HTMLElement
      if (target !== undefined) {
        categoryIconList.scrollLeft = target
        return
      }

      // scroll category icon list to selected one
      const scrollTop = ((this.$refs as Record<string, CCategoryList[]>).mainContent[0].$el as HTMLElement).scrollTop
      categoryIconList.scrollLeft = scrollTop * (this.categoryIconWidth / this.categoryHeight)
      this.$nextTick(() => {
        const selectedCategoryIcon = this.$refs.selectedCategoryIcon as HTMLElement
        if (!selectedCategoryIcon || !selectedCategoryIcon.parentElement) return

        const transform = selectedCategoryIcon.parentElement.style.transform
        const match = transform.match(/translateX\((\d+)px\)/)
        if (!match || match.length < 2) return

        const scrollLeft = parseInt(match[1])
        categoryIconList.scrollLeft = scrollLeft
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-gifs {
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
    grid-template-columns: repeat(4, 1fr);
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
  .category-list {
    overflow-x: hidden;
  }
  .invisible {
    visibility: hidden;
    height: 0;
    overflow: hidden;
  }
}
</style>
