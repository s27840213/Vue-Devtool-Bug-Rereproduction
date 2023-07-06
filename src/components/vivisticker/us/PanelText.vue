<template lang="pug">
div(class="full-size overflow-hidden rwd-container")
  div(class="panel-text" :class="{'in-category': isInCategory, 'with-search-bar': !isInCategory, 'in-editor': isInEditor}")
    search-bar(v-if="!isInCategory"
      class="panel-text__searchbar"
      :placeholder="$t('NN0092', {target: $tc('NN0005',1)})"
      clear
      :defaultKeyword="keywordLabel"
      vivisticker="dark"
      :color="{close: 'black-5', search: 'black-5'}"
      v-model:expanded="isSearchBarExpanded"
      @search="handleSearch")
    Tags(v-show="tags && tags.length"
        class="panel-text__tags"
        :class="{collapsed: !isSearchBarExpanded, 'in-category': isInCategory}"
        :tags="tags"
        :scrollLeft="isInCategory ? 0 : tagScrollLeft"
        ref="tags"
        theme="dark"
        @search="handleSearch"
        @scroll="(scrollLeft: number) => tagScrollLeft = isInCategory ? tagScrollLeft : scrollLeft")
    category-list(v-for="item in categoryListArray"
      :class="{collapsed: tags && tags.length && !isSearchBarExpanded}"
      v-show="item.show" :ref="item.key" :key="item.key"
      :list="item.content" @loadMore="handleLoadMore")
      template(#before)
        div(class="panel-text__top-item")
        //- Empty recently used view
        div(v-if="showAllRecently && !item.content.length && !pending" class="panel-text__recent-empty")
          svg-icon(iconName="vivisticker_design" iconWidth="42px" iconColor="white")
          div(class="panel-text__recent-empty--title") No content in Recently Used
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
            div(class="panel-text__item" :style="itemStyles")
      template(v-slot:category-text-item="{ list }")
        div(class="panel-text__items" :style="itemsStyles")
          div(v-for="item in list"
              class="panel-text__card"
              :class="{recent: item.id === 'recent'}"
              :key="item.id"
              :style="itemStyles()")
            div(v-if="item.id === 'recent'" class="panel-text__card__recent"
                  @click="handleCategorySearch($t('NN0024'))")
              svg-icon(class="pointer"
                iconName="clock"
                iconColor="balck-1"
                iconWidth="24px")
              div(class="overline-SM") RECENTLY USED
            CategoryTextPreview(v-else :item="item" @click="addText(item)")
    btn-add(class="text-H6" :elScrollable="elMainContent" :text="$t('STK0001')" @click="handleAddText")
</template>

<script lang="ts">
import { CCategoryList } from '@/components/category/CategoryList.vue'
import CategoryTextPreview from '@/components/vivisticker/us/CategoryTextPreview.vue'
import { ICategoryItem, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import AssetUtils from '@/utils/assetUtils'
import generalUtils from '@/utils/generalUtils'
import textPropUtils from '@/utils/textPropUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'vuex'
import PanelText from '../PanelText.vue'

export default defineComponent({
  name: 'panel-text-us',
  extends: PanelText,
  components: {
    CategoryTextPreview: CategoryTextPreview
  },
  mounted() {
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getCategories({ writeBack: false, key: 'textStock' })
        await this.getRecently({ writeBack: true, key: 'textStock' })
        await this.getContent()
      })
    this.toggleTransitions(false)
    window.requestAnimationFrame(() => {
      this.toggleTransitions(true)
    })
    this.elMainContent = (this.$refs as Record<string, CCategoryList[]>).mainContent[0].$el as HTMLElement
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
    listRecently(): ICategoryItem[] {
      const { categories } = this
      const gap = 20
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / this.numTextColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.numTextColumns, idx * this.numTextColumns + this.numTextColumns)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            size: this.itemWidth + gap,
            title: ''
          }
        })
      return result
    },
    // extends: PanelText
    // eslint-disable-next-line vue/no-unused-properties
    mainContent(): ICategoryItem[] {
      if (this.showAllRecently) {
        return this.listRecently
      }
      const list = this.listResult
      if (list.length !== 0) {
        Object.assign(list[list.length - 1], { sentinel: true })
      }
      return list
    },
    itemGap(): number {
      return this.isTablet ? 30 : 20
    },
    itemWidth(): number {
      return Math.min((this.windowSize.width - 48 - (this.numTextColumns - 1) * this.itemGap) / this.numTextColumns, 200)
    },
    itemsStyles() {
      return this.isTablet ? {
        gridTemplateColumns: `repeat(${this.numTextColumns}, 200px)`
      } : {
        gridTemplateColumns: `repeat(${this.numTextColumns}, ${this.itemWidth}px)`,
        columnGap: '20px'
      }
    },
    numTextColumns(): number {
      return this.isTablet ? 3 : 2
    }
  },
  methods: {
    ...mapActions('textStock', [
      'getCategories',
    ]),
    // extends: PanelText
    // eslint-disable-next-line vue/no-unused-properties
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      const recentItem = {
        id: 'recent',
        type: NaN,
        ver: NaN
      } as IListServiceContentDataItem
      if (!this.keyword && list.length > 0) list = [recentItem].concat(list)
      return new Array(Math.ceil(list.length / this.numTextColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.numTextColumns, (idx + 1) * this.numTextColumns)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            title: '',
            size: this.itemWidth + this.itemGap
          }
        })
    },
    itemStyles() {
      return {
        width: this.itemWidth + 'px',
        height: this.itemWidth + 'px',
        ...(!this.isTablet && { margin: '0 auto' })
      }
    },
    addText(item: any) {
      if (this.isInEditor) {
        AssetUtils.addAsset(item).then(() => {
          textPropUtils.updateTextPropsState()
        })
      } else {
        vivistickerUtils.startEditing('text', {
          plan: item.plan,
          assetId: item.id
        }, vivistickerUtils.getAssetInitiator(item), vivistickerUtils.getAssetCallback(item))
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-text {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 10px;
  color: white;
  &__searchbar {
    margin-bottom: v-bind("tags && tags.length ? '0' : '10px'");
  }
  &__tags {
    margin: 10px 0;
    color: setColor(black-5);
  }
  &__card {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
    &__recent {
      @include size(100%, 100%);
      display: flex;
      flex-direction: column;
      gap: 14px;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      color: setColor(black-1);
    }
    &.recent {
      background-color: setColor(light-bg);
    }
    // object-fit: contain;
    // vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, auto);
    column-gap: 30px;
    justify-content: center;
  }
  &.with-search-bar {
    height: calc(100% + 52px); // 42px (serach bar height) + 10px (margin-top of tags) = 52px
    .panel-text__tags {
      clip-path: inset(0 0 0 0);
      transition: transform 200ms 100ms ease-in-out, clip-path 200ms 100ms ease-in-out;
      &.collapsed {
        transform: translateY(-52px);
        clip-path: inset(0 42px 0 0);
      }
    }
    .category-list {
      transition: transform 200ms 100ms ease-in-out;
      &.collapsed{
        transform: translateY(-52px) translateZ(0);
      }
    }
    &:deep(.vue-recycle-scroller__item-wrapper) {
      margin-bottom: 52px;
    }
    &:deep(.tags__flex-container-mobile) {
      width: max-content;
      padding-right: 42px;
    }
  }
  &:deep(.vue-recycle-scroller__item-wrapper) {
    margin-top: 10px;
  }
  &.in-editor {
    padding-top: 0;
  }
  &.in-editor:deep(.vue-recycle-scroller__item-wrapper) {
    margin-top: 0;
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
}
</style>
