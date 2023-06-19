<template lang="pug">
div(class="panel-bg rwd-container" :class="{'in-category': isInCategory}")
  div(v-show="!isInCategory" class="panel-bg__nav" :style="navStyles")
    template(v-if="!isInCategory")
      template(v-if="isShowSearchBar && showImageTab")
        search-bar(class="panel-bg__nav__searchbar" ref="searchbar"
          :placeholder="$t('NN0092', {target: $tc('NN0004',1)})"
          clear
          :defaultKeyword="keywordLabel"
          vivisticker="dark"
          :color="{close: 'black-5', search: 'black-5'}"
          @search="handleSearch")
        div(class="panel-bg__nav__btn-cancel body-SM" @click="handleCancel") {{ $t('NN0203')}}
      template(v-else)
        div(v-show="showImageTab" class="panel-bg__nav__icon")
          svg-icon(class="pointer"
            iconName="clock"
            iconColor="white"
            iconWidth="24px"
            @click="handleRecent")
        tabs(v-if="!isInCategory"
          class="panel-bg__nav__tabs"
          :tabs="[$tc('NN0002', 2),$t('NN0017')]"
          v-model="tabIndex"
          :style="{marginBottom: '0px'}")
        div(v-show="showImageTab" class="panel-bg__nav__icon")
          svg-icon(class="pointer"
            iconName="search"
            iconColor="white"
            iconWidth="24px"
            @click="showSearchBar")
  div(v-show="showImageTab" class="panel-bg__list-wrapper")
    div(v-if="emptyResultMessage" class="text-white text-left") {{ emptyResultMessage }}
    category-list(v-for="item in categoryListArray"
                v-show="item.show" :ref="item.key" :key="item.key"
                class="panel-bg__list"
                :list="item.content" @loadMore="handleLoadMore")
      template(#before)
        div(class="panel-bg__top-item")
        //- Empty recently used view
        div(v-if="showAllRecently && !item.content.length && !pending" class="panel-bg__recent-empty")
          svg-icon(iconName="vivisticker_design" iconWidth="42px" iconColor="white")
          div(class="panel-bg__recent-empty--title") No content in Recently Used
      template(v-slot:category-list-rows="{ list, title }")
        category-list-rows(
          :list="list"
          :title="title"
          @action="handleCategorySearch")
          template(v-slot:preview="{ item }")
            category-background-item(class="panel-bg__item"
              :item="item"
              :locked="false"
              :style="itemStyles"
              @share="handleShareImage")
      template(v-slot:category-background-item="{ list, title }")
        div(class="panel-bg__items")
          div(v-if="title"
            class="panel-bg__header") {{ title }}
          category-background-item(v-for="item in list"
            class="panel-bg__item"
            :key="item.id"
            :item="item"
            :locked="false"
            :style="itemStyles"
            @share="handleShareImage")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="white"
            iconWidth="20px")
  div(v-show="!showImageTab" class="panel-bg__color-tab")
    div(class="panel-bg__color-tab-wrapper" :style="colorTabWrapperStyles()")
      div(class="panel-bg__color-area")
        div(class="panel-bg__color-row")
          div(class="panel-bg__color-row-header py-5 text-white")
            div(class="panel-bg__color-row-left")
              div(v-if="showAllRecentlyBgColors" class="panel-bg__color-row-back" @click.prevent.stop="handleShowAllRecentlyBgColors(false)")
                svg-icon(iconName="vivisticker_back" iconColor="white" iconWidth="24px")
              div(class="panel-bg__color-row-title") {{$t('NN0024')}}
            div(v-if="!showAllRecentlyBgColors" class="panel-bg__color-row-more" @click.prevent.stop="handleShowAllRecentlyBgColors(true)") {{$t('NN0082')}}
          div(class="panel-bg__colors")
            div(class="panel-bg__color add-color" @click="handleOpenColorPicker")
            div(v-if="hasNewBgColor"
              class="panel-bg__color"
              :style="colorStyles(currColor)")
            div(v-for="color in recentlyColors"
              class="panel-bg__color"
              :key="color"
              v-press="() => handleShareColor(color)"
              :style="colorStyles(color)"
              @click="setBgColor(color)")
        div(v-if="!showAllRecentlyBgColors" class="panel-bg__color-row")
          div(class="panel-bg__color-row-title text-left py-5 text-white") {{$t('NN0089')}}
          div(class="panel-bg__colors")
            div(v-for="color in defaultBgColor"
              class="panel-bg__color"
              :key="color"
              v-press="() => handleShareColor(color)"
              :style="colorStyles(color)"
              @click="setBgColor(color)")
      div(class="panel-bg__color-controller")
        mobile-slider(:title="`${$t('NN0030')}`"
          :borderTouchArea="true"
          :value="opacity"
          :min="0"
          :max="100"
          theme="light"
          @update="updateOpacity")
        div(class="panel-bg__color-controller__hint")
          p(class="panel-bg__color-controller__hint-text") {{ $t('STK0002') }}
          p(class="panel-bg__color-controller__hint-text") {{ $t('STK0003') }}
  div(v-if="isInBgShare" class="panel-bg__share")
    div(class="panel-bg__share__screen" :style="bgSizeStyles")
      div(class="panel-bg__share__screen-inner" :style="shareBgStyles()")
    div(class="panel-bg__share__buttons")
      div(class="panel-bg__share__button")
        div(class="panel-bg__share__button-icon" @click.stop.prevent="handleSave")
          svg-icon(iconName="download_flat" iconColor="white" iconWidth="24px" iconHeight="26.76px")
        div(class="panel-bg__share__button-text") {{ $t('STK0004') }}
      div(class="panel-bg__share__button")
        div(class="panel-bg__share__button-icon" @click.stop.prevent="handleStory")
          svg-icon(iconName="ig_story" iconColor="white" iconWidth="30px")
        div(class="panel-bg__share__button-text") {{ $t('STK0005') }}
</template>

<script lang="ts">
import { ICategoryItem, IListServiceContentData } from '@/interfaces/api'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import PanelBackground from '../PanelBackground.vue'

export default defineComponent({
  name: 'panel-background-us',
  extends: PanelBackground,
  data() {
    return {
      isShowSearchBar: false
    }
  },
  deactivated() {
    if (!this.keyword) this.isShowSearchBar = false
  },
  computed: {
    navStyles() {
      return {
        ...(this.isShowSearchBar && { gridTemplateColumns: '1fr auto', columnGap: '10px' }),
        ...(this.isInCategory && { gridTemplateColumns: 'auto' })
      }
    },
    // extends: PanelBackground
    // eslint-disable-next-line vue/no-unused-properties
    listCategories(): ICategoryItem[] {
      const titleHeight = 46
      const gap = this.isTablet ? 20 : 14
      const { categories } = this
      return (categories as IListServiceContentData[])
        .filter(category => category.list.length > 0 && !category.is_recent)
        .map((category, index) => ({
          size: this.itemHeight + gap + titleHeight,
          id: `rows_${index}_${category.list.map(item => item.id).join('_')}`,
          type: 'category-list-rows',
          list: category.list,
          title: category.title
        }))
    },
  },
  methods: {
    handleCancel() {
      this.isShowSearchBar = false
      this.handleSearch('')
    },
    handleRecent() {
      vivistickerUtils.setShowAllRecently('background', true)
      vivistickerUtils.setIsInCategory('background', true)
    },
    showSearchBar() {
      this.isShowSearchBar = true
      this.$nextTick(() => {
        (this.$refs.searchbar as any).focus()
      })
    },
  }
})
</script>

<style lang="scss" scoped>
.search-bar {
  flex: 0 0 auto;
}
.panel-bg {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto auto;
  overflow: hidden;
  position: relative;
  &__nav {
    height: 56px;
    display: grid;
    align-items: center;
    grid-template-columns: 32px auto 32px;
    &__tabs {
      justify-content: space-evenly;
      grid-column: 2 / 3;
    }
    &__icon {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    &__searchbar {
      width: 100%;
    }
    &__btn-cancel {
      padding: 8px;
      color: setColor(gray-7)
    }
  }
  &__list-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  &__list {
    flex-grow: 1;
    height: 100%;
  }
  &__item {
    width: 80px;
    height: 142px;
    margin: 0 auto;
    object-fit: cover;
    vertical-align: middle;
  }
  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 10px;
  }
  &__header {
    grid-column: 1 / 4;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__color-tab {
    height: 100%;
    overflow: hidden;
  }
  &__color-tab-wrapper {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-columns: 1fr;
  }
  &__color-area {
    overflow-y: scroll;
    @include no-scrollbar;
  }
  &__color-row {
    padding-bottom: 26px;
  }
  &__color-row-header {
    display: flex;
    justify-content: space-between;
  }
  &__color-row-left {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  &__color-row-back {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__color-row-title {
    @include body-MD;
  }
  &__color-row-more {
    @include body-SM;
    &:active {
      color: setColor(black-5);
    }
  }
  &__colors {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    column-gap: 12px;
    row-gap: 12px;
    position: relative;
    padding: 0 12px;
    margin-top: 16px;
  }
  &__color {
    padding-top: calc(100% - 2px);
    cursor: pointer;
    position: relative;
    -webkit-touch-callout: none;
    user-select: none;
    border-radius: 4px;
    border: 1px solid setColor(gray-0, 0.2);
    &.add-color {
      padding-top: 100%;
      background-image: url("~@/assets/img/svg/addColor.svg");
      background-size: cover;
      border: none;
    }
  }
  // &__color-back {
  //   position: absolute;
  //   top: 0;
  //   left: 0;
  //   @include size(100%);
  //   border-radius: 4px;
  //   background: white;
  //   overflow: hidden;
  // }
  // &__color-inner {
  //   @include size(100%);
  // }
  &.in-category:deep(.vue-recycle-scroller__item-wrapper) {
    margin-top: 24px;
  }
  &__color-controller {
    padding-top: 13px;
    height: 203px;
    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    &__opacity-title {
      font-size: 16px;
      height: 24px;
      line-height: 24px;
      color: white;
    }
    &__opacity-value {
      border: 1px solid setColor(gray-4);
      border-radius: 4px;
      width: 54px;
      height: 24px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      & > input {
        background: transparent;
        padding: 0;
        margin: 0;
        border-radius: 0;
        text-align: center;
        width: 100%;
        height: 22px;
        @include body-SM;
        line-height: 22px;
        color: white;
      }
    }
    &__hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 127px;
    }
    &__hint-text {
      margin: 0;
      @include body-SM;
      color: setColor(black-5);
    }
  }
  &__share {
    position: absolute;
    top: 0;
    left: 0;
    @include size(100%);
    background: setColor(black-1);
    &__screen {
      margin-top: 25px;
      margin-left: auto;
      margin-right: auto;
      border-radius: 10px;
      background: white;
    }
    &__screen-inner {
      @include size(100%);
      border-radius: 10px;
      background-position: center center;
      background-size: cover;
    }
    &__buttons {
      position: absolute;
      left: 50%;
      bottom: 44px;
      transform: translateX(-50%);
      display: flex;
      gap: 70px;
    }
    &__button {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    &__button-icon {
      @include size(40px);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
    &__button-text {
      @include body-XS;
      color: white;
      white-space: nowrap;
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
}
</style>
