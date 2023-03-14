<template lang="pug">
div(class="panel-text rwd-container" :class="{'in-category': isInCategory}")
  category-list(v-for="item in categoryListArray"
    v-show="item.show" :ref="item.key" :key="item.key"
    :list="item.content" @loadMore="handleLoadMore")
    template(#before)
      div(class="panel-text__top-item")
    template(v-if="pending" #after)
      div(class="text-center")
        svg-icon(iconName="loading"
          iconColor="white"
          iconWidth="20px")
          div(class="panel-text__item" :style="itemStyles")
    template(v-slot:category-text-item="{ list }")
      div(class="panel-text__items" :style="itemsStyles")
        div(class="panel-text__card" :class="{recent: item.id === 'recent'}" v-for="item in list" :style="itemStyles()")
          div(v-if="item.id === 'recent'" class="panel-text__card__recent"
                @click="handleCategorySearch($t('NN0024'))")
            svg-icon(class="pointer"
              iconName="clock"
              iconColor="balck-1"
              iconWidth="24px")
            div(class="overline-SM") {{ "RECENTLY USED" }}
          img(v-else class="panel-text__card__bg" :src="cardBgSrc(item)" @click="addText(item)" @error="imgOnerror")
  div(v-if="!showAllRecently" class="panel-text__text-button-wrapper"
      :style="`font-family: ${localeFont()}`"
      @click="handleAddText")
    span {{ $t('STK0001') }}
    svg-icon(iconName="plus-square" iconWidth="22px" iconColor="white")
</template>

<script lang="ts">
import { ICategoryItem, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import AssetUtils from '@/utils/assetUtils'
import generalUtils from '@/utils/generalUtils'
import textPropUtils from '@/utils/textPropUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import PanelText from '../PanelText.vue'

export default defineComponent({
  name: 'panel-text-us',
  extends: PanelText,
  computed: {
    listRecently(): ICategoryItem[] {
      const { categories } = this
      const gap = 20
      const list = (categories as IListServiceContentData[]).find(category => category.is_recent)?.list ?? []
      const result = new Array(Math.ceil(list.length / this.textColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.textColumns, idx * this.textColumns + this.textColumns)
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
    itemWidth(): number {
      return this.isTablet ? 200 : (window.outerWidth - 48 - (this.textColumns - 1) * 20) / this.textColumns
    },
    itemsStyles() {
      return this.isTablet ? {
        gridTemplateColumns: `repeat(${this.textColumns}, 200px)`,
        justifyContent: 'space-around'
      } : {
        gridTemplateColumns: `repeat(${this.textColumns}, 1fr)`,
        columnGap: '20px'
      }
    },
    textColumns(): number {
      return this.isTablet ? 3 : 2
    },
  },
  mounted() {
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getRecently({ writeBack: true })
        await this.getContent()
      })
  },
  methods: {
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      const gap = 20
      const recentItem = {
        id: 'recent',
        type: NaN,
        ver: NaN
      } as IListServiceContentDataItem
      if (list.length > 0) list = [recentItem].concat(list)
      return new Array(Math.ceil(list.length / this.textColumns))
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx * this.textColumns, (idx + 1) * this.textColumns)
          return {
            id: `result_${rowItems.map(item => item.id).join('_')}`,
            type: 'category-text-item',
            list: rowItems,
            title: '',
            size: this.itemWidth + gap // 80(object height) + 24(gap) + 0/46(title)
          }
        })
    },
    cardBgSrc(item: IListServiceContentDataItem):string {
      return item.id === 'recent' ? '' : `https://template.vivipic.com/text/${item.id}/bg_prev_2x?ver=${item.ver}`
    },
    itemStyles() {
      return {
        width: this.itemWidth + 'px',
        height: this.itemWidth + 'px',
        ...(!this.isTablet && { margin: '0 auto' })
      }
    },
    imgOnerror(e: Event) {
      const target = (e.target as HTMLImageElement)
      target.src = require('@/assets/img/svg/image-preview.svg')
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
.search-bar {
  flex: 0 0 auto;
}
.panel-text {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  transform: rotate(0deg);
  padding-top: 10px;
  &__searchbar {
    margin-top: 24px;
    margin-bottom: 14px;
    &.no-top {
      margin-top: 0;
    }
  }
  &__brand-header {
    margin-top: 10px;
    margin-bottom: 13px;
  }
  &__brand-settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
  &__card {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    overflow: hidden;
    &__bg {
      @include size(100%, 100%);
      object-position: center center;
    }
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
    grid-template-columns: repeat(3, 1fr);
    column-gap: 10px;
  }
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 24px;
  }
  &__header {
    grid-column: 1 / 4;
    line-height: 26px;
    color: #ffffff;
    padding: 10px 0;
    text-align: left;
  }
  &__text-button-wrapper {
    position: fixed;
    left: 50%;
    bottom: 11px;
    width: 255px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 14px 0;
    margin-left: -127.5px;
    box-sizing: border-box;
    background-color: setColor(black-3);
    border-radius: 10px;
    &:active {
      background-color: setColor(black-1-5);
    }
    & > span {
      font-weight: 600;
      font-size: 20px;
      line-height: 28px;
      color: white;
    }
  }
}
</style>
