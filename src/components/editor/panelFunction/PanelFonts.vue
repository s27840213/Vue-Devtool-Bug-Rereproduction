<template lang="pug">
  div(class="panel-fonts")
    div(class="panel-fonts__title")
      span(class="text-blue-1 label-lg") Fonts
      svg-icon(class="panel-fonts__close pointer"
        :iconName="'close'"
        :iconWidth="'30px'"
        :iconColor="'gray-2'"
        @click.native="closeFontsPanel")
    search-bar(:placeholder="'Search font'")
    category-list(:list="list"
      @loadMore="handleLoadMore")
      template(v-if="pending" #after)
        div(class="text-center")
          svg-icon(iconName="loading"
            iconColor="gray-1"
            iconWidth="20px")
      template(v-slot:category-font-item="{ list }")
        category-font-item(v-for="item in list"
          :host="host"
          :preview="preview"
          :preview2="preview2"
          :objectId="item.id")
    btn(class="full-width" :type="'primary-mid'" @click.native="FileUtils.importFont(updateFontPreset)") Upload Font
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MappingUtils from '@/utils/mappingUtils'
import { mapGetters, mapState, mapActions } from 'vuex'
import FileUtils from '@/utils/fileUtils'
import TextUtils from '@/utils/textUtils'
import CategoryFontItem from '@/components/category/CategoryFontItem.vue'
import CategoryListFont from '@/components/category/CategoryListFont.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'

export default Vue.extend({
  components: {
    SearchBar,
    CategoryList,
    CategoryFontItem,
    CategoryListFont
  },
  data() {
    return {
      FileUtils
    }
  },
  mounted() {
    this.getContent()
    // this.getCategories()
  },
  computed: {
    ...mapState(
      'font',
      [
        'categories',
        'content',
        'pending',
        'host',
        'preview',
        'preview2',
        'keyword'
      ]
    ),
    ...mapState('text', ['sel', 'props', 'fontPreset']),
    ...mapGetters('font', ['hasNextPage']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer'
    }),
    list(): any[] {
      const { hasNextPage } = this
      const { list = [] } = this.content as { list: IListServiceContentDataItem[] }
      const result = new Array(list.length)
        .fill('')
        .map((_, idx) => {
          const rowItems = list.slice(idx, idx + 1)
          return {
            id: `${rowItems.map(item => item.id).join('_')}`,
            size: 35,
            type: 'category-font-item',
            list: rowItems,
            sentinel: hasNextPage && idx === (list.length - 1)
          }
        })
      return result
    }
    // listCategories(): any[] {
    //   const { categories } = this
    //   return (categories as IListServiceContentData[])
    //     .map((category, idx) => ({
    //       id: `list_${category.list.map(list => list.id).join('_')}`,
    //       type: 'category-list-font',
    //       list: category.list,
    //       title: category.title,
    //       sentinel: !idx
    //     }))
    // }
  },
  methods: {
    ...mapActions('font',
      [
        'resetContent',
        'getContent',
        'getCategories',
        'getMoreContent'
      ]
    ),
    mappingIcons(type: string) {
      return MappingUtils.mappingIconSet(type)
    },
    closeFontsPanel() {
      this.$emit('closeFontsPanel')
    },
    // TODO //
    updateFontPreset(e: any) {
      const target = e.target.files[0]
      const fontName: string = target.name.split('.')[0]
      const objectUrl = window.URL.createObjectURL(target)
      const style = document.createElement('style')
      style.innerHTML = `
      @font-face {
        font-family: ${fontName};
        src: url(${objectUrl});
      }
    `
      document.head.appendChild(style)
      TextUtils.updateFontFace({ name: fontName, face: fontName })
    },
    handleLoadMore() {
      console.log('loadmore')
      this.getMoreContent()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-fonts {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  &__title {
    text-align: center;
    position: relative;
    margin-bottom: 5px;
  }
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }
  &__close {
    position: absolute;
    right: 5px;
  }
  &__items {
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: auto;
    grid-gap: 10px;
    margin-left: auto;
  }
}
.category-list::v-deep::-webkit-scrollbar-thumb {
  border: 3px solid #ffffff;
}
</style>
