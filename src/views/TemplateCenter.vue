<template lang="pug">
  div(ref="body"
      class="template-center"
      @scroll="handleScroll")
    nu-header(:noSearchbar="true" :noNavigation="snapToTop")
      transition(name="slide")
        search-bar(v-if="snapToTop"
                :style="absoluteSearchbarStyles()"
                class="template-center__absolute-searchbar"
                :clear="true"
                :defaultKeyword="searchbarKeyword"
                placeholder="Search from our templates"
                fontFamily="Mulish"
                @update="handleUpdate"
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
                  :defaultKeyword="searchbarKeyword"
                  placeholder="Search from our templates"
                  fontFamily="Mulish"
                  @update="handleUpdate"
                  @search="handleSearch")
    div(class="template-center__content")
      div(class="template-center__filter")
        hashtag-category-row(v-for="hashtag in hashtags"
                            :list="hashtag"
                            :defaultSelection="hashtagSelections[hashtag.title] ? hashtagSelections[hashtag.title].selection : []"
                            @select="handleHashtagSelect")
      div(class="template-center__hr")
      div(class="template-center__sorter")
        div(class="template-center__sorter__left")
          div(class="template-center__sorter__title") Sort by:
          div(v-for="sortingCriterium in sortingCriteria"
              class="template-center__sorter__sort pointer"
              :class="{'selected': selectedSorting === sortingCriterium}"
              @click="handleSelectSorting(sortingCriterium)") {{ sortingCriterium }}
        div(class="template-center__sorter__right")
          //- div(class="template-center__sorter__color-title") Color
          //- div(class="template-center__sorter__color-down")
          //-   svg-icon(iconName="chevron-down"
          //-           iconWidth="24px"
          //-           iconColor="gray-2")
      div(class="template-center__waterfall")
        div(v-for="waterfallTemplate in waterfallTemplates" class="template-center__waterfall__column")
          div(v-for="template in waterfallTemplate"
              class="template-center__waterfall__column__template"
              :style="templateStyles(template.prev_height)"
              @click="handleClickWaterfall(template)")
            div(class="template-center__waterfall__column__template__container")
              img(:src="template.url")
            div(class="template-center__waterfall__column__template__theme") {{ getThemeTitle(template.theme_id) }}
            div(v-if="template.content_ids.length > 1" class="template-center__waterfall__column__template__multi")
              svg-icon(iconName="multiple-file"
                      iconWidth="24px"
                      iconColor="gray-7")
      div(v-if="!isTemplateReady" class="template-center__loading")
        svg-icon(iconName="loading"
                iconWidth="24px"
                iconColor="gray-2")
      observer-sentinel(v-if="isTemplateReady && hasNextPage"
                        @callback="handleLoadMore")
    nu-footer
    transition(name="fade-scale")
      div(v-if="snapToTop" class="template-center__to-top pointer" @click="scrollToTop")
        img(:src="require('@/assets/img/svg/to_top.svg')")
    transition(name="fade-scale-center")
      div(v-if="modal === 'pages'" class="template-center__multi"
          v-click-outside="() => { modal = '' }")
        div(class="template-center__multi__header")
          div(class="template-center__multi__header__close"
              @click="() => { modal = '' }")
            svg-icon(iconName="close"
                    iconWidth="20px"
                    iconColor="gray-2")
        div(class="template-center__multi__content")
          div(class="template-center__multi__gallery")
            div(v-for="content in content_ids" class="template-center__multi__gallery-item"
                :style="`background-image: url(${getPrevUrl(content)})`"
                @click="handleTemplateClick(content)")
    transition(name="fade-scale-center")
      div(v-if="modal === 'template'" class="template-center__multi-split"
          v-click-outside="() => { modal = '' }")
        div(class="template-center__multi__content-left")
          div(class="template-center__multi__template"
              :style="`background-image: url(${getPrevUrl(contentBuffer)})`")
        div(class="template-center__multi__content-right")
          div(class="template-center__multi__header")
            div(class="template-center__multi__header__close"
                @click="() => { modal = 'pages' }")
              svg-icon(iconName="close"
                      iconWidth="20px"
                      iconColor="gray-2")
          div(class="template-center__multi__title")
            span 選擇設計主題：
          div(class="template-center__multi__themes")
            div(v-for="theme in matchedThemes" class="template-center__multi__themes__row"
                :class="checkSelected(theme) ? 'selected' : ''"
                @click="handleThemeSelect(theme)")
              div(class="template-center__multi__themes__title")
                span {{ theme.title }}
              div(class="template-center__multi__themes__description")
                span {{ `${theme.width}x${theme.height}` }}
          div(class="template-center__multi__button"
              :class="selectedTheme ? '' : 'disabled'"
              @click="handleThemeSubmit")
            span 使用此模板
    div(v-if="modal !== ''" class="dim-background")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import hashtag from '@/store/module/hashtag'
import vClickOutside from 'v-click-outside'
import NuHeader from '@/components/NuHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import NuFooter from '@/components/NuFooter.vue'
import HashtagCategoryRow from '@/components/templates/HashtagCategoryRow.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import { IContentTemplate, ITemplate } from '@/interfaces/template'
import { Itheme } from '@/interfaces/theme'
import templateCenterUtils from '@/utils/templateCenterUtils'
import themeUtils from '@/utils/themeUtils'

export default Vue.extend({
  name: 'TemplateCenter',
  components: {
    NuHeader,
    SearchBar,
    NuFooter,
    HashtagCategoryRow,
    ObserverSentinel
  },
  directives: {
    clickOutside: vClickOutside.directive
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
      selectedSorting: sortingCriteria[0],
      waterfallTemplates: [] as ITemplate[][],
      isTemplateReady: false,
      themes: [] as Itheme[],
      matchedThemes: [] as Itheme[],
      selectedTheme: undefined as Itheme | undefined,
      content_ids: [] as IContentTemplate[],
      contentBuffer: undefined as IContentTemplate | undefined,
      modal: ''
    }
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search)
    const q = urlParams.get('q')
    const tags = urlParams.get('tags')
    let tagStrs: string[] = []
    const themes = urlParams.get('themes')
    let themeIds: number[] = []
    const sortingCriterium = urlParams.get('sort')
    if (q) {
      this.searchbarKeyword = q
    }
    if (tags) {
      tagStrs = tags.split(',')
    }
    if (themes) {
      themeIds = themes.split(',').map(Number)
    }
    if (sortingCriterium && this.sortingCriteria.includes(sortingCriterium)) {
      this.selectedSorting = sortingCriterium
    }
    this.getHashtags().then(() => {
      this.hashtagSelections = {}
      for (const hashtag of this.hashtags) {
        let selection: string[] = []
        if (hashtag.type === 'theme') {
          selection = hashtag.list
            .filter((tag: {id: number}) => themeIds.includes(tag.id))
            .map((tag: {id: number}) => tag.id.toString())
        } else {
          selection = hashtag.list
            .filter((tag: {name: string}) => tagStrs.includes(tag.name))
            .map((tag: {name: string}) => tag.name)
        }
        this.hashtagSelections[hashtag.title] = {
          type: hashtag.type,
          selection
        }
      }
      this.composeKeyword()
    })
    themeUtils.checkThemeState().then(() => {
      this.themes = themeUtils.themes
    })
  },
  beforeCreate() {
    this.$store.registerModule('hashtag', hashtag)
  },
  beforeDestroy() {
    this.$store.unregisterModule('hashtag')
  },
  computed: {
    ...mapState('hashtag', {
      hashtags: 'categories'
    }),
    ...mapState('templates', {
      templates: 'content'
    }),
    ...mapGetters('templates', {
      hasNextPage: 'hasNextPage'
    })
  },
  methods: {
    ...mapActions('hashtag', {
      getHashtags: 'getCategories'
    }),
    ...mapActions('templates', {
      getTemplates: 'getThemeContent',
      getMoreTemplates: 'getMoreContent'
    }),
    absoluteSearchbarStyles() {
      return { top: `${Math.max(this.searchbarTop, 5)}px` }
    },
    searchbarStyles() {
      return this.snapToTop ? { opacity: 0, pointerEvents: 'none' } : {}
    },
    templateStyles(heightPercent: number) {
      return { paddingTop: `${heightPercent}%` }
    },
    handleScroll() {
      const searchbar = (this.$refs.searchbar as any).$el as HTMLElement
      this.snapToTop = searchbar.getBoundingClientRect().top <= 50
      this.searchbarTop = searchbar.getBoundingClientRect().top
    },
    handleUpdate(keyword: string) {
      this.searchbarKeyword = keyword
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
    handleClickWaterfall(template: ITemplate) {
      if (template.content_ids.length === 1) {
        const matchedTheme = this.themes.find(theme => theme.id.toString() === template.theme_id)
        const format = matchedTheme ? {
          width: matchedTheme.width.toString(),
          height: matchedTheme.height.toString()
        } : {
          width: template.width.toString(),
          height: template.height.toString()
        }
        const route = this.$router.resolve({
          name: 'Editor',
          query: {
            type: 'new-design-template',
            design_id: template.id,
            width: format.width,
            height: format.height
          }
        })
        window.open(route.href, '_blank')
      } else {
        this.content_ids = template.content_ids
        this.modal = 'pages'
      }
    },
    scrollToTop() {
      (this.$refs.body as HTMLElement).scrollTo({
        top: 0,
        behavior: 'smooth'
      })
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
      this.waterfallTemplates = []
      this.isTemplateReady = false
      this.getTemplates({ keyword: res.join(';;'), theme: themes.join(',') }).then(() => {
        this.waterfallTemplates = templateCenterUtils.generateWaterfall(this.templates)
        this.isTemplateReady = true
      })
    },
    handleLoadMore() {
      console.log('load more')
      this.isTemplateReady = false
      this.getMoreTemplates().then(() => {
        this.waterfallTemplates = templateCenterUtils.generateWaterfall(this.templates)
        this.isTemplateReady = true
      })
    },
    handleTemplateClick(content: IContentTemplate) {
      if (content.themes.length > 1) {
        this.modal = 'template'
        this.contentBuffer = content
        this.matchedThemes = this.themes.filter((theme) => content.themes.includes(theme.id.toString()))
        this.selectedTheme = undefined
      } else {
        const matchedTheme = this.themes.find(theme => theme.id.toString() === content.themes[0])
        const format = matchedTheme ? {
          width: matchedTheme.width.toString(),
          height: matchedTheme.height.toString()
        } : {
          width: content.width.toString(),
          height: content.height.toString()
        }
        const route = this.$router.resolve({
          name: 'Editor',
          query: {
            type: 'new-design-template',
            design_id: content.id,
            width: format.width,
            height: format.height
          }
        })
        window.open(route.href, '_blank')
      }
    },
    handleThemeSelect(theme: Itheme) {
      this.selectedTheme = theme
    },
    handleThemeSubmit() {
      if (!this.selectedTheme || !this.contentBuffer) return
      const route = this.$router.resolve({
        name: 'Editor',
        query: {
          type: 'new-design-template',
          design_id: this.contentBuffer.id,
          width: this.selectedTheme.width.toString(),
          height: this.selectedTheme.height.toString()
        }
      })
      window.open(route.href, '_blank')
    },
    getPrevUrl(content: IContentTemplate): string {
      return templateCenterUtils.getPrevUrl(content)
    },
    getThemeTitle(themeId: string): string {
      const theme = this.themes.find((theme) => theme.id.toString() === themeId)
      return theme ? theme.title : '未指定主題'
    },
    checkSelected(theme: Itheme): boolean {
      return this.selectedTheme?.id === theme.id
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
    width: 80%;
    min-width: calc(100% - 48px);
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
    margin-bottom: 20px;
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
  &__waterfall {
    margin-bottom: 80px;
    display: flex;
    gap: 24px;
    &__column {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 24px;
      &__template {
        position: relative;
        width: 100%;
        border: 1px solid setColor(gray-5);
        overflow: hidden;
        cursor: pointer;
        &__container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: setColor(gray-5);
          > img {
            width: 100%;
            display: block;
          }
        }
        &__theme {
          position: absolute;
          bottom: -20px;
          left: 0;
          width: 100%;
          height: 20px;
          background-color: rgba(238, 239, 244, 0.8);
          font-family: Mulish;
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          color: setColor(gray-2);
          text-align: left;
          padding: 0;
          padding-left: 8px;
          transition: 0.2s ease;
        }
        &:hover &__theme {
          bottom: 0;
        }
        &__multi {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
        }
      }
    }
  }
  &__to-top {
    position: fixed;
    right: 76px;
    bottom: 84px;
  }
  &__multi {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 982px;
    height: 560px;
    background: #FFFFFF;
    box-shadow: 0px 0px 12px rgba(151, 150, 150, 0.4);
    border-radius: 6px;
    z-index: 20;
    &-split {
      @extend .template-center__multi;
      display: flex;
    }
    &__header {
      position: relative;
      width: 100%;
      height: 42px;
      &__close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
    }
    &__content {
      margin-top: 28px;
      overflow-y: auto;
      width: 100%;
      height: calc(100% - 70px);
    }
    &__content-left {
      width: 560px;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 2px solid setColor(gray-5);
      box-sizing: border-box;
    }
    &__content-right {
      width: calc(100% - 560px);
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    &__gallery {
      display: grid;
      margin: auto;
      margin-bottom: 20px;
      width: 860px;
      grid-gap: 20px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    &__gallery-item {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 200px;
      height: 200px;
      background: white;
      border: 1px solid setColor(gray-5);
      box-sizing: border-box;
      cursor: pointer;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
    }
    &__template {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 456px;
      height: 456px;
      background: white;
      border: 1px solid setColor(gray-5);
      box-sizing: border-box;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
    }
    &__title {
      width: 312px;
      height: 20px;
      text-align: left;
      > span {
        font-family: Mulish;
        font-weight: 400;
        font-size: 14px;
      }
    }
    &__themes {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      width: 312px;
      height: 411px;
      border: 2px solid setColor(gray-5);
      border-radius: 3px;
      &__row {
        display: flex;
        align-items: center;
        height: 30px;
        color: setColor(gray-2);
        cursor: pointer;
        &.selected {
          color: setColor(blue-1);
          background-color: setColor(gray-7);
        }
        &:hover {
          background-color: setColor(gray-7);
        }
        > div {
          display: flex;
          align-items: center;
          height: 20px;
          text-align: left;
          > span {
            font-family: Mulish;
            font-weight: 400;
            font-size: 12px;
          }
        }
      }
      &__title {
        margin-left: 17px;
        width: 89px;
      }
      &__description {
        transform-origin: left;
        transform: scale(calc(5/6));
      }
    }
    &__button {
      margin-top: 18px;
      width: 240px;
      height: 36px;
      background-color: setColor(blue-1);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: pointer;
      > span {
        font-family: 'NotoSansTC';
        font-weight: 700;
        font-size: 12px;
        line-height: 18px;
        letter-spacing: 1.21em;
        text-indent: 1.21em;
        color: white;
      }
      &.disabled {
        background-color: setColor(gray-5);
        cursor: not-allowed;
        > span {
          color: setColor(gray-3);
        }
      }
    }
  }
}

.dim-background {
  position: fixed;
  @include size(100%, 100%);
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.4);
  transform-style: preserve-3d;
  z-index: 19;
}

.fade-scale {
  &-enter-active, &-leave-active  {
    transition: .3s ease;
  }

  &-enter, &-leave-to {
    transform: scale(0.8);
    opacity: 0;
  }
}

.fade-scale-center {
  &-enter-active, &-leave-active  {
    transition: .3s ease;
  }

  &-enter, &-leave-to {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
}
</style>
