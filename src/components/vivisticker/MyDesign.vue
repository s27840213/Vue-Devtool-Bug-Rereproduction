<template lang="pug">
div(class="my-design")
  div(class="my-design__tags")
    div(v-for="tag in tags" class="my-design__tag"
        :key="tag.tab"
        :class="{ selected: checkTagSelected(tag) }"
        @click.prevent.stop="selectTag(tag)")
      span(class="my-design__tag-name") {{ $tc(tag.name, 2) }}
  div(v-show="list.length === 0" class="my-design__content center")
    div(class="my-design__empty-icon")
      svg-icon(iconName="vivisticker_design" iconWidth="42px" iconColor="white")
    div(class="my-design__empty-title") {{ $t('STK0020') }}
    div(class="my-design__empty-description") {{ $t('STK0021') }}
  div(v-show="list.length !== 0" class="my-design__content")
    category-list(class="my-design__content__list"
                  :list="myDesignList"
                  ref="content"
                  @loadMore="handleLoadMore")
      template(v-slot:my-design-text-item="{ list }")
        div(class="my-design__texts__items" :style="textItemsStyles")
          my-design-text-item(v-for="item in list"
            class="my-design__texts__item"
            :key="item.id"
            :item="item"
            :style="textItemStyles")
      template(v-slot:my-design-object-item="{ list }")
        div(class="my-design__objects__items")
          my-design-object-item(v-for="item in list"
            class="my-design__objects__item"
            :key="item.id"
            :item="item"
            :style="itemStyles")
</template>

<script lang="ts">
import CategoryList, { CCategoryList } from '@/components/category/CategoryList.vue'
import MyDesignObjectItem from '@/components/vivisticker/mydesign/MyDesignObjectItem.vue'
import MyDesignTextItem from '@/components/vivisticker/mydesign/MyDesignTextItem.vue'
import { IMyDesign, IMyDesignTag } from '@/interfaces/vivisticker'
import editorUtils from '@/utils/editorUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  name: 'my-design',
  data() {
    const tags = vivistickerUtils.getMyDesignTags()
    return {
      tags,
      scrollTops: Object.fromEntries(tags.map(tag => [tag.tab, 0]))
    }
  },
  components: {
    CategoryList,
    MyDesignObjectItem,
    MyDesignTextItem
  },
  mounted() {
    const content = this.$refs.content as CCategoryList
    if (!content) return
    content.$el.addEventListener('scroll', this.handleScroll)
  },
  unmounted() {
    const content = this.$refs.content as CCategoryList
    if (!content) return
    content.$el.removeEventListener('scroll', this.handleScroll)
  },
  computed: {
    ...mapGetters({
      isInMyDesign: 'vivisticker/getIsInMyDesign',
      isInEditor: 'vivisticker/getIsInEditor',
      isInSelectionMode: 'vivisticker/getIsInSelectionMode',
      editorType: 'vivisticker/getEditorType',
      myDesignTab: 'vivisticker/getMyDesignTab',
      myDesignFiles: 'vivisticker/getMyDesignFiles',
      myDesignFileList: 'vivisticker/getMyDesignFileList',
      myDesignNextPage: 'vivisticker/getMyDesignNextPage'
    }),
    ...mapState({
      isTablet: 'isTablet',
      isLandscape: 'isLandscape',
      windowSize: 'windowSize'
    }),
    list(): IMyDesign[] {
      return this.myDesignFileList(this.myDesignTab) as IMyDesign[]
    },
    myDesignList(): any[] {
      let result = [] as any[]
      switch (this.myDesignTab) {
        case 'text':
          result = new Array(Math.ceil(this.list.length / this.numTextColumns))
            .fill('')
            .map((_, idx) => {
              const rowItems = this.list.slice(idx * this.numTextColumns, idx * this.numTextColumns + this.numTextColumns)
              return {
                id: `result_${rowItems.map(item => item.id).join('_')}`,
                type: 'my-design-text-item',
                list: rowItems,
                size: this.textItemWidth + this.textItemGap,
                title: '',
                moreType: 'text'
              }
            })
          break
        case 'object':
          result = new Array(Math.ceil(this.list.length / 3))
            .fill('')
            .map((_, idx) => {
              let rowItems = this.list.slice(idx * 3, idx * 3 + 3)
              rowItems = rowItems.concat(Array(3 - rowItems.length).fill({}))
              return {
                id: `result_${rowItems.map(item => item.id).join('_')}`,
                type: 'my-design-object-item',
                list: rowItems,
                size: this.itemHeight + (this.isTablet ? 30 : 24),
                title: '',
                moreType: 'object'
              }
            })
          break
        case 'image':
          result = new Array(Math.ceil(this.list.length / 3))
            .fill('')
            .map((_, idx) => {
              let rowItems = this.list.slice(idx * 3, idx * 3 + 3)
              rowItems = rowItems.concat(Array(3 - rowItems.length).fill({}))
              return {
                id: `result_${rowItems.map(item => item.id).join('_')}`,
                type: 'my-design-text-item',
                list: rowItems,
                size: this.itemHeight + (this.isTablet ? 30 : 24),
                title: '',
                moreType: 'image'
              }
            })
      }
      if (result.length !== 0) {
        Object.assign(result[result.length - 1], { sentinel: true })
      }
      return result
    },
    itemStyles(): {[key: string]: string} {
      return {
        width: this.itemHeight + 'px',
        height: this.itemHeight + 'px'
      }
    },
    itemHeight(): number {
      return this.isTablet ? 120 : 80
    },
    numTextColumns(): number {
      return this.isTablet ? 3 : 2
    },
    textItemGap(): number {
      return this.isTablet ? 30 : 20
    },
    textItemWidth(): number {
      const { isTablet, isLandscape, windowSize, textItemGap, numTextColumns } = this
      const containerWidthRatio = isTablet ? isLandscape ? 0.56 : 0.8 : 1
      const containerPadding = isTablet ? 0 : 48
      return ((windowSize.width * containerWidthRatio - containerPadding) - textItemGap * (numTextColumns - 1)) / numTextColumns
    },
    textItemStyles() {
      return {
        width: `${this.textItemWidth}px`,
        height: `${this.textItemWidth}px`
      }
    },
    textItemsStyles() {
      return {
        gridTemplateColumns: `repeat(${this.numTextColumns}, ${this.textItemWidth}px)`,
        columnGap: `${this.textItemGap}px`
      }
    }
  },
  watch: {
    isInMyDesign(newVal) {
      if (newVal) {
        this.refreshDesigns(this.myDesignTab)
        const content = this.$refs.content as CCategoryList
        content.$el.scrollTop = 0
        console.log(this.myDesignFiles)
      }
    },
    isInEditor(newVal) {
      if (newVal) {
        this.resetMyDesignFileList(vivistickerUtils.mapEditorType2MyDesignKey(this.editorType))
      } else if (this.isInMyDesign) {
        this.refreshDesigns(this.myDesignTab)
      }
    },
    isInSelectionMode(newVal) {
      if (newVal) {
        editorUtils.setCurrActivePanel('select-design')
        editorUtils.setShowMobilePanel(true)
      } else {
        editorUtils.setCloseMobilePanelFlag(true)
        this.clearSelectedDesigns()
      }
    }
  },
  methods: {
    ...mapMutations({
      resetMyDesignFileList: 'vivisticker/UPDATE_resetMyDesignFileList',
      setmyDesignTab: 'vivisticker/SET_myDesignTab',
      setIsInSelectionMode: 'vivisticker/SET_isInSelectionMode',
      clearSelectedDesigns: 'vivisticker/UPDATE_clearSelectedDesigns'
    }),
    async refreshDesigns(tab: string): Promise<boolean> {
      if (this.myDesignFileList(tab).length !== 0) return false
      await vivistickerUtils.listAsset(`mydesign-${tab}`)
      return true
    },
    handleLoadMore(tab: string) {
      const nextPage = this.myDesignNextPage(tab)
      vivistickerUtils.listMoreAsset(`mydesign-${tab}`, nextPage)
    },
    checkTagSelected(tag: IMyDesignTag) {
      return this.myDesignTab === tag.tab
    },
    selectTag(tag: IMyDesignTag) {
      this.setmyDesignTab(tag.tab)
      this.setIsInSelectionMode(false)
      this.refreshDesigns(tag.tab).then((refetched) => {
        if (!refetched) {
          this.restoreScrollTop(tag.tab)
        }
      })
    },
    handleScroll(event: Event) {
      this.scrollTops[this.myDesignTab] = (event.target as HTMLElement).scrollTop
    },
    restoreScrollTop(tab: string) {
      const content = this.$refs.content as CCategoryList
      if (!content) return
      content.$el.scrollTop = this.scrollTops[tab]
    }
  }
})
</script>

<style lang="scss" scoped>
.my-design {
  position: relative;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: setColor(black-2);
  padding: 24px;
  padding-bottom: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;

  @include layout-tablet{
    padding: 0 10%;
    padding-top: 24px;
    @include layout-landscape{
      padding: 0 22%;
      padding-top: 24px;
    }
  }

  &__tags {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
  }

  &__tag {
    background-color: setColor(black-3);
    padding: 5.5px 8px;
    display: flex;
    align-content: center;
    justify-content: center;
    border-radius: 10px;
    &-name {
      @include body-SM;
      display: block;
      color: setColor(black-5);
    }
    &.selected {
      background-color: setColor(black-6);
      & > span {
        color: setColor(black-1);
      }
    }
  }

  &__content {
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    @include no-scrollbar;
    &.center {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    &__list {
      height: 100%;
    }
  }

  &__empty-icon {
    @include size(42px);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__empty-title {
    margin-top: 12px;
    @include text-H6;
    color: white;
  }

  &__empty-description {
    margin-top: 24px;
    @include btn-SM;
    color: setColor(black-5);
    max-width: 272px;
    text-align: center;
  }

  &__texts {
    &__item {
      width: calc(50vw - 32px);
      height: calc(50vw - 32px);
    }
    &__items {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      column-gap: 20px;
      justify-content: center;
    }
  }

  &__objects {
    &__item {
      width: 80px;
      height: 80px;
      margin: 0 auto;
      @include layout-tablet{
        margin: 0
      }
    }
    &__items {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      @include layout-tablet{
        grid-template-columns: repeat(3, auto);
        justify-content: space-between;
      }
    }
  }
}
</style>
