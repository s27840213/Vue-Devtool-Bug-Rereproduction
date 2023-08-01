<template lang="pug">
div(class="panel-template-content" ref="panel" :class="{'in-category': isInCategory, 'in-group-template': isInGroupTemplate, 'with-search-bar': isInMainContent, 'rwd-container': isInEditor}")
  Tags(v-show="tags && tags.length"
      class="panel-template-content__tags"
      :tags="tags"
      :scrollLeft="isInCategory ? 0 : tagScrollLeft"
      ref="tags"
      theme="dark"
      @search="(keyword?: string) => $emit('search', keyword)"
      @scroll="(scrollLeft: number) => tagScrollLeft = (isInCategory || isInGroupTemplate) ? tagScrollLeft : scrollLeft")
  div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
  //- Search result and main content
  category-list(v-for="item in categoryListArray"
                :class="{invisible: !item.show}"
                :ref="item.key" :key="item.key"
                :list="item.content" @loadMore="handleLoadMore"
                @scroll.passive="handleScrollTop($event, item.key as 'mainContent'|'searchResult')")
    template(#before)
      div(class="panel-template-content__top-item")
    template(v-slot:category-list-rows="{ list, title }")
      category-list-rows(:list="list" :title="title" :columnGap="12"
        @action="handleCategorySearch")
        template(v-slot:preview="{ item }")
          component(class="panel-template-content__item"
            :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
            :item="item"
            :style="itemStyles"
            @clickGroupItem="handleShowGroup")
    template(v-slot:category-template-item="{ list, title }")
      div(v-if="title" class="panel-template-content__header") {{ title }}
      div(class="panel-template-content__items")
        component(v-for="item in list"
          class="panel-template-content__item"
          :is="item.content_ids && item.content_ids.length > 1 ? 'category-group-template-item' : 'category-template-item'"
          :item="item"
          :key="item.group_id"
          :style="itemStyles"
          @clickGroupItem="handleShowGroup"
          :groupItem="currentGroup")
    template(#after)
      //- Loading icon
      div(v-if="pending" class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
  btn-add(class="text-H6" v-show="!isInCategory && !isInGroupTemplate && !keyword" :elScrollable="elMainContent" :text="strBtnAdd" @click="addTemplate")
  div(v-if="isInGroupTemplate" class="panel-template-content__btn-add-group-template" @click="addGroupTemplate")
    svg-icon(class="panel-template-content__btn-add-group-template__icon"
            iconName="add-page"
            iconColor="gray-2"
            iconWidth="24px")
    span(class="body-SM text-black-3") {{ $t('STK0065', {num: currentGroup?.content_ids.length ?? 0}) }}
</template>

<script lang="ts">
import PanelTemplateContent from '@/components/vivisticker/PanelTemplateContent.vue'
import { ICategoryItem, IListServiceContentData } from '@/interfaces/api'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'panel-template-content',
  extends: PanelTemplateContent,
  emits: ['search'],
  data() {
    return {
    }
  },
  watch: {
  },
  computed: {
    // extends: PanelTemplateContent
    // eslint-disable-next-line vue/no-unused-properties
    listCategories(): ICategoryItem[] {
      const { categories, itemHeight } = this
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0 && !category.is_recent)
        .map((category, index) => ({
          size: itemHeight + 46,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-template-content {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  color: white;
  text-align: left;
  &__tags {
    margin-bottom: 10px;
    color: setColor(black-5);
  }
  &__item {
    text-align: center;
    vertical-align: middle;
    margin: 0 auto;
    >div {
      border-radius: 5px;
      overflow: hidden;
    }
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(v-bind(numColumns), 1fr);
  }
  &.with-search-bar {
    height: calc(100% + 56px); // 42px (serach bar height) + 14px (margin-top of tags) = 56px
    .panel-template-content__tags {
      clip-path: inset(0 0 0 0);
      transition: transform 200ms 100ms ease-in-out, clip-path 200ms 100ms ease-in-out;
      &.collapsed {
        transform: translateY(-56px);
        clip-path: inset(0 42px 0 0);
      }
    }
    .category-list {
      transition: transform 200ms 100ms ease-in-out;
      &.collapsed{
        transform: translateY(-56px) translateZ(0);
      }
    }
    &::v-deep .vue-recycle-scroller__item-wrapper {
      margin-bottom: 56px;
    }
    &::v-deep .tags__flex-container-mobile {
      width: max-content;
      padding-right: 42px;
    }
  }
  &.in-category, &.in-group-template::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 24px;
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
  &__btn-add-group-template {
    position: absolute;
    right: 40px;
    left: 40px;
    bottom: 24px;
    width: min-content;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 16px;
    margin: 0 auto;
    box-sizing: border-box;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    white-space: nowrap;
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
