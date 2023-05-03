<template lang="pug">
div(class="panel-text" :class="{'in-category': isInCategory, 'in-editor': isInEditor}")
  category-list(v-for="item in categoryListArray"
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
  btn-add(:elScrollable="elMainContent" :text="$t('STK0001')" @click="handleAddText")
</template>

<script lang="ts">
import { CCategoryList } from '@/components/category/CategoryList.vue'
import BtnAdd from '@/components/vivisticker/BtnAdd.vue'
import CategoryTextPreview from '@/components/vivisticker/us/CategoryTextPreview.vue'
import { ICategoryItem, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import AssetUtils from '@/utils/assetUtils'
import generalUtils from '@/utils/generalUtils'
import textPropUtils from '@/utils/textPropUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'
import PanelText from '../PanelText.vue'

export default defineComponent({
  name: 'panel-text-us',
  extends: PanelText,
  components: {
    CategoryTextPreview: CategoryTextPreview,
    BtnAdd
  },
  data() {
    return {
      elMainContent: undefined as HTMLElement | undefined,
    }
  },
  mounted() {
    generalUtils.panelInit('text',
      this.handleSearch,
      this.handleCategorySearch,
      async ({ reset }: {reset: boolean}) => {
        await this.getRecently({ writeBack: true, key: 'textStock' })
        await this.getContent()
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
    // extends: PanelText
    // eslint-disable-next-line vue/no-unused-properties
    processListResult(list = [] as IListServiceContentDataItem[], isSearch: boolean): ICategoryItem[] {
      const recentItem = {
        id: 'recent',
        type: NaN,
        ver: NaN
      } as IListServiceContentDataItem
      if (list.length > 0) list = [recentItem].concat(list)
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
  overflow-x: hidden;
  padding-top: 10px;
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
  &.in-category::v-deep .vue-recycle-scroller__item-wrapper {
    margin-top: 24px;
  }
  &.in-editor {
    padding-top: 0;
  }
  &.in-editor::v-deep .vue-recycle-scroller__item-wrapper {
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
