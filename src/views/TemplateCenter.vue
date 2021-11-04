<template lang="pug">
  div(class="template-center"
      @scroll="handleScroll")
    nu-header(:noSearchbar="true" :noNavigation="snapToTop")
      transition(name="slide")
        search-bar(v-if="snapToTop"
                :style="absoluteSearchbarStyles()"
                class="template-center__absolute-searchbar"
                :clear="true"
                placeholder="Search from our templates"
                fontFamily="Mulish"
                @search="handleSearch")
    div(class="template-center__search-container")
      div(class="template-center__search")
        div(class="template-center__search__title")
          span 選擇一個心儀的模板著手設計吧！
        div(class="template-center__search__text")
          span 特別設計過的電商模板能讓您簡單又快速的做出電商所需要的圖片。
          br
          span 沒有設計底子也沒問題！只需要輕鬆點擊幾下，一張專屬於品牌的精美圖片馬上出爐！
        search-bar(ref="searchbar"
                  class="template-center__search__searchbar"
                  :style="searchbarStyles()"
                  :clear="true"
                  placeholder="Search from our templates"
                  fontFamily="Mulish"
                  @search="handleSearch")
    div(class="template-center__content")
      div(class="template-center__filter")
        hashtag-row(v-for="hashtag in hashtags" :list="hashtag" @select="handleHashtagSelect")
      div(class="template-center__hr")
      div(class="template-center__sorter")
        div(class="template-center__sorter__left")
          div(class="template-center__sorter__title") Sort by:
          div(v-for="sortingCriterium in sortingCriteria"
              class="template-center__sorter__sort pointer"
              :class="{'selected': selectedSorting === sortingCriterium}"
              @click="handleSelectSorting(sortingCriterium)") {{ sortingCriterium }}
        div(class="template-center__sorter__right")
          div(class="template-center__sorter__color-title") Color
          div(class="template-center__sorter__color-down")
            svg-icon(iconName="chevron-down"
                    iconWidth="24px"
                    iconColor="gray-2")
    nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import NuHeader from '@/components/NuHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import NuFooter from '@/components/NuFooter.vue'
import HashtagRow from '@/components/templates/HashtagRow.vue'
import { IHashtagServiceContentData } from '@/interfaces/api'

export default Vue.extend({
  name: 'MyDesgin',
  components: {
    NuHeader,
    SearchBar,
    NuFooter,
    HashtagRow
  },
  data() {
    const sortingCriteria = [
      'popular',
      'recent'
    ]
    return {
      snapToTop: false,
      searchbarTop: 0,
      searchbarKeyword: '',
      hashtagSelections: {} as {[key: string]: {type: string, selection: string[]}},
      sortingCriteria,
      selectedSorting: sortingCriteria[0]
    }
  },
  mounted() {
    this.getHashtags().then(() => {
      this.hashtagSelections = {}
      for (const hashtag of this.hashtags) {
        this.hashtagSelections[hashtag.title] = {
          type: hashtag.type,
          selection: []
        }
      }
      this.composeKeyword()
    })
  },
  computed: {
    ...mapState('hashtag', {
      hashtags: 'categories'
    }),
    ...mapState('templates', {
      templates: 'categories'
    })
  },
  methods: {
    ...mapActions('hashtag', {
      getHashtags: 'getCategories'
    }),
    ...mapActions('templates', {
      getTemplates: 'getThemeContent'
    }),
    absoluteSearchbarStyles() {
      return { top: `${Math.max(this.searchbarTop, 5)}px` }
    },
    searchbarStyles() {
      return this.snapToTop ? { opacity: 0, pointerEvents: 'none' } : {}
    },
    handleScroll() {
      const searchbar = (this.$refs.searchbar as any).$el as HTMLElement
      this.snapToTop = searchbar.getBoundingClientRect().top <= 50
      this.searchbarTop = searchbar.getBoundingClientRect().top
    },
    handleSearch(keyword: string) {
      this.searchbarKeyword = keyword
      this.composeKeyword()
    },
    handleHashtagSelect(selectinfo: {title: string, selection: string[]}) {
      this.hashtagSelections[selectinfo.title].selection = selectinfo.selection
      this.composeKeyword()
    },
    handleSelectSorting(sortingCriterium: string) {
      this.selectedSorting = sortingCriterium
      this.composeKeyword()
    },
    composeKeyword() {
      const res = ['locale::tw']
      const tags = []
      let themes: string[] = []
      if (this.searchbarKeyword !== '') {
        tags.push(this.searchbarKeyword)
      }
      for (const hashtagSelection of Object.values(this.hashtagSelections)) {
        if (hashtagSelection.type === 'tag' && hashtagSelection.selection.length > 0) {
          tags.push(hashtagSelection.selection.join(' '))
        }
        if (hashtagSelection.type === 'theme') {
          themes = themes.concat(hashtagSelection.selection)
        }
      }
      if (tags.length > 0) {
        res.push('tag::' + tags.join('&&'))
      }
      res.push('order_by::' + this.selectedSorting)
      this.getTemplates({ keyword: res.join(';;'), theme: themes.join(',') })
    }
  }
})
</script>

<style lang="scss" scoped>
.template-center {
  @include size(100%, 100%);
  min-height: 100%;
  overflow-y: auto;
  &__absolute-searchbar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 480px;
    height: 40px;
    border-radius: 3px;
    z-index: 1000;
  }
  &__search-container {
    position: relative;
    width: 100%;
    padding-top: 28%;
    background-size: cover;
    background-position: center center;
    background-image: url('~@/assets/img/jpg/templates/search_background.jpeg');
  }
  &__search {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: fit-content;
    height: 55%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    &__title {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      > span {
        font-family: "NotoSansTC";
        font-weight: 700;
        font-size: 40px;
        line-height: 40px;
        letter-spacing: 0.255em;
        text-indent: 0.255em;
        display: block;
        color: #373F41;
      }
    }
    &__text {
      height: 52px;
      > span {
        font-family: Mulish;
        font-weight: 400;
        font-size: 16px;
        line-height: 26px;
        color: white;
      }
    }
    &__searchbar {
      width: 480px;
      height: 40px;
      border-radius: 3px;
    }
  }
  &__content {
    margin: auto;
    width: 100%;
    max-width: 1110px;
    min-height: 100%;
  }
  &__filter {
    margin-top: 36px;
  }
  &__hr {
    margin-top: 26px;
    width: 100%;
    height: 1px;
    background-color: setColor(gray-5);
  }
  &__sorter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 56px;
    &__left, &__right {
      display: flex;
      align-items: center;
      height: 100%;
    }
    &__title {
      width: 108px;
      font-family: Mulish;
      font-weight: 400;
      font-size: 16px;
      line-height: 36px;
      text-align: center;
      color: black;
    }
    &__sort {
      width: 113px;
      font-family: Mulish;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
      line-height: 40px;
      text-align: left;
      color: setColor(gray-3);
      &.selected {
        color: setColor(blue-1);
      }
    }
    &__color-title {
      width: 80px;
      font-family: Mulish;
      font-weight: 600;
      font-size: 14px;
      line-height: 24px;
      text-align: right;
      color: #373F41;
    }
    &__color-down {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
