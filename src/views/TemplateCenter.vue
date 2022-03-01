<template lang="pug">
  div(ref="body"
      class="template-center scrollbar-gray"
      @scroll="handleScroll")
    nu-header(class="pc-show" :noSearchbar="true" :noNavigation="snapToTop")
      transition(name="slide")
        search-bar(v-if="snapToTop"
                :style="absoluteSearchbarStyles()"
                class="template-center__absolute-searchbar"
                :clear="true"
                :defaultKeyword="searchbarKeyword"
                :placeholder="`${$t('NN0092', {target: $tc('NN0001',1)})}`"
                @update="handleUpdate"
                @search="handleSearch")
    nu-header(class="mobile-show" :noSearchbar="true")
    div(class="template-center__search-container pc-show")
      div(class="template-center__search")
        div(class="template-center__search__title"
            :style="searchTitleStyles()")
          span {{$t('NN0185')}}
        div(class="template-center__search__text")
          i18n(path="NN0186" tag="span")
            template(#newline)
              br
        search-bar(ref="searchbar"
                  class="template-center__search__searchbar"
                  :style="searchbarStyles()"
                  :clear="true"
                  :defaultKeyword="searchbarKeyword"
                  :placeholder="`${$t('NN0092', {target: $tc('NN0001',1)})}`"
                  @update="handleUpdate"
                  @search="handleSearch")
    div(class="template-center__content")
      div(class="template-center__mobile-search mobile-show")
        search-bar(class="template-center__mobile-search__searchbar"
                  :clear="true"
                  :defaultKeyword="searchbarKeyword"
                  :placeholder="`${$t('NN0092', {target: $tc('NN0001',1)})}`"
                  @update="handleUpdate"
                  @search="handleSearch")
        div(class="template-center__mobile-search__options"
            :class="{'active': isShowOptions}"
            @click="isShowOptions = !isShowOptions")
          svg-icon(iconName="advanced"
                  iconWidth="22px"
                  iconHeight="18.36px"
                  iconColor="white")
      div(class="template-center__filter pc-show")
        hashtag-category-row(v-for="hashtag in hashtags"
                            :list="hashtag"
                            :defaultSelection="hashtagSelections[hashtag.title] ? hashtagSelections[hashtag.title].selection : []"
                            @select="handleHashtagSelect")
      div(class="template-center__filter mobile-show"
          :style="{'max-height': isShowOptions ? `${82 * hashtags.length}px` : '0px', 'opacity': isShowOptions ? '1' : '0'}")
        hashtag-category-row(v-for="hashtag in hashtags"
                            :list="hashtag"
                            :defaultSelection="hashtagSelections[hashtag.title] ? hashtagSelections[hashtag.title].selection : []"
                            @select="handleHashtagSelect")
      div(class="template-center__hr pc-show")
      div(class="template-center__sorter pc-show")
        div(class="template-center__sorter__left")
          div(class="template-center__sorter__title") {{$t('NN0191')}}:
          div(v-for="sortingCriterium in sortingCriteria"
              class="template-center__sorter__sort pointer"
              :class="{'selected': selectedSorting === sortingCriterium.key}"
              @click="handleSelectSorting(sortingCriterium.key)") {{ sortingCriterium.text }}
        div(class="template-center__sorter__right")
          //- div(class="template-center__sorter__color-title") Color
          //- div(class="template-center__sorter__color-down")
          //-   svg-icon(iconName="chevron-down"
          //-           iconWidth="24px"
          //-           iconColor="gray-2")
      div(class="template-center__waterfall-wrapper pc-lg-show")
        div(class="template-center__waterfall")
          div(v-for="waterfallTemplate in waterfallTemplatesPC"
              class="template-center__waterfall__column")
            div(v-for="template in waterfallTemplate"
                class="template-center__waterfall__column__template"
                :style="templateStyles(template.aspect_ratio)"
                @click="handleClickWaterfall(template)"
                @mouseenter="handleMouseEnter(template.group_id)"
                @mouseleave="handleMouseLeave(template.group_id)")
              scrollable-template-preview(v-if="checkMouseEntered(template.group_id, template.group_type)"
                                          :contentIds="template.content_ids")
              img(v-else class="template-center__waterfall__column__template__img" :src="template.url")
              div(v-if="template.group_type !== 1" class="template-center__waterfall__column__template__theme") {{ getThemeTitle(template.theme_id) }}
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
      div(class="template-center__waterfall-wrapper tab-show")
        div(class="template-center__waterfall")
          div(v-for="waterfallTemplate in waterfallTemplatesTAB"
              class="template-center__waterfall__column")
            div(v-for="template in waterfallTemplate"
                class="template-center__waterfall__column__template"
                :style="templateStyles(template.aspect_ratio)"
                @click="handleClickWaterfall(template)"
                @mouseenter="handleMouseEnter(template.group_id)"
                @mouseleave="handleMouseLeave(template.group_id)")
              scrollable-template-preview(v-if="checkMouseEntered(template.group_id, template.group_type)"
                                          :contentIds="template.content_ids")
              img(v-else class="template-center__waterfall__column__template__img" :src="template.url")
              div(v-if="template.group_type !== 1" class="template-center__waterfall__column__template__theme") {{ getThemeTitle(template.theme_id) }}
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
      div(class="template-center__waterfall-wrapper non-tab-show")
        div(class="template-center__waterfall")
          div(v-for="waterfallTemplate in waterfallTemplatesMOBILE"
              class="template-center__waterfall__column")
            div(v-for="template in waterfallTemplate"
                class="template-center__waterfall__column__template"
                :style="templateStyles(template.aspect_ratio)"
                @click="handleClickWaterfall(template)"
                @mouseenter="handleMouseEnter(template.group_id)"
                @mouseleave="handleMouseLeave(template.group_id)")
              scrollable-template-preview(v-if="checkMouseEntered(template.group_id, template.group_type)"
                                          :contentIds="template.content_ids")
              img(v-else class="template-center__waterfall__column__template__img" :src="template.url")
              div(v-if="template.group_type !== 1" class="template-center__waterfall__column__template__theme") {{ getThemeTitle(template.theme_id) }}
              div(v-if="template.content_ids.length > 1" class="template-center__waterfall__column__template__multi")
                svg-icon(iconName="multiple-file"
                        iconWidth="24px"
                        iconColor="gray-7")
        div(v-if="!isTemplateReady" class="template-center__loading")
          svg-icon(iconName="loading"
                  iconWidth="24px"
                  iconColor="gray-2")
        observer-sentinel(v-if="isTemplateReady && hasNextPage"
                          :target="'.template-center__content'"
                          @callback="handleLoadMore")
        div(class="template-center__scroll-space")
    nu-footer(class="pc-show")
    transition(name="fade-scale")
      div(v-if="snapToTop" class="template-center__to-top pointer pc-show" @click="scrollToTop")
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
    transition(name="fade-slide")
      div(v-if="modal === 'mobile-pages'" class="template-center__mobile-multi")
        div(class="template-center__mobile-multi__content")
          div(class="template-center__mobile-multi__gallery")
            div(v-for="content in content_ids" class="template-center__mobile-multi__gallery-item"
                :style="`background-image: url(${getPrevUrl(content)})`"
                @click="handleTemplateClick(content)")
            div(class="template-center__scroll-space")
    div(v-if="modal === 'mobile-pages'", class="template-center__mobile-multi__close"
        @click="() => { modal = '' }")
      svg-icon(iconName="close"
              iconWidth="25px"
              iconColor="gray-3")
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
            span {{$t('NN0228')}}：
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
            span(:style="multiThemeButtonStyles()") {{$t('NN0229')}}
    div(v-if="modal !== '' && modal !== 'mobile-pages'" class="dim-background")
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
import ScrollableTemplatePreview from '@/components/templates/ScrollableTemplatePreview.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import { IContentTemplate, ITemplate } from '@/interfaces/template'
import { Itheme } from '@/interfaces/theme'
import templateCenterUtils from '@/utils/templateCenterUtils'
import themeUtils from '@/utils/themeUtils'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  name: 'TemplateCenter',
  components: {
    NuHeader,
    SearchBar,
    NuFooter,
    HashtagCategoryRow,
    ScrollableTemplatePreview,
    ObserverSentinel
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    const sortingCriteria = [
      {
        key: 'popular',
        text: this.$t('NN0256')
      },
      {
        key: 'recent',
        text: this.$t('NN0257')
      }
    ]
    return {
      snapToTop: false,
      searchbarTop: 0,
      searchbarKeyword: '',
      hashtagSelections: {} as { [key: string]: { type: string, selection: string[] } },
      sortingCriteria,
      selectedSorting: sortingCriteria[0].key,
      waterfallTemplatesPC: [] as ITemplate[][],
      waterfallTemplatesTAB: [] as ITemplate[][],
      waterfallTemplatesMOBILE: [] as ITemplate[][],
      isTemplateReady: false,
      themes: [] as Itheme[],
      matchedThemes: [] as Itheme[],
      selectedTheme: undefined as Itheme | undefined,
      content_ids: [] as IContentTemplate[],
      contentBuffer: undefined as IContentTemplate | undefined,
      modal: '',
      isShowOptions: false,
      mouseInTemplate: ''
    }
  },
  metaInfo(): any {
    const meta = [
      {
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
      },
      {
        property: 'og:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'og:title'
      },
      {
        property: 'og:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'og:image'
      },
      {
        property: 'og:description',
        content: `${this.$t('OG0002')}`,
        vmid: 'og:description'
      },
      {
        property: 'twitter:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'twitter:title'
      },
      {
        property: 'twitter:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'twitter:image'
      },
      {
        property: 'twitter:description',
        content: `${this.$t('OG0002')}`,
        vmid: 'twitter:description'
      },
      {
        property: 'og:url',
        content: `${this.$t('OG0006')}`,
        vmid: 'og:url'
      }
    ]
    const title = `${this.$t('SE0001')}`
    return {
      title,
      meta
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
    if (sortingCriterium && [...this.sortingCriteria.map(s => s.key)].includes(sortingCriterium)) {
      this.selectedSorting = sortingCriterium
    }
    this.getHashtags().then(() => {
      this.hashtagSelections = {}
      for (const hashtag of this.hashtags) {
        let selection: string[] = []
        if (hashtag.type === 'theme') {
          selection = hashtag.list
            .filter((tag: { id: number }) => themeIds.includes(tag.id))
            .map((tag: { id: number }) => tag.id.toString())
        } else {
          selection = hashtag.list
            .filter((tag: { name: string }) => tagStrs.includes(tag.name))
            .map((tag: { name: string }) => tag.name)
        }
        this.hashtagSelections[hashtag.title] = {
          type: hashtag.type,
          selection
        }
      }
      this.composeKeyword()
    })
    themeUtils.checkThemeState().then(() => {
      this.themes = themeUtils.themes.filter(theme => {
        return theme.mainHidden === 0
      })
    })

    generalUtils.fbq('track', 'ViewContent', {
      content_type: 'TemplateCenter'
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
    isMobile(): boolean {
      return window.matchMedia('screen and (max-width: 767px)').matches
    },
    absoluteSearchbarStyles() {
      return { top: `${Math.max(this.searchbarTop, 11)}px` }
    },
    searchbarStyles() {
      return this.snapToTop ? { opacity: 0, pointerEvents: 'none' } : {}
    },
    searchTitleStyles() {
      if (this.$i18n.locale === 'tw') {
        return {
          letterSpacing: '0.255em',
          textIndent: '0.255em'
        }
      } else {
        return {}
      }
    },
    templateStyles(aspectRatio: number) {
      return { aspectRatio: `${aspectRatio}` }
    },
    multiThemeButtonStyles() {
      return this.$i18n.locale === 'tw' ? {
        letterSpacing: '1.21em',
        textIndent: '1.21em'
      } : {}
    },
    handleScroll() {
      const searchbar = (this.$refs.searchbar as any).$el as HTMLElement
      this.snapToTop = searchbar.getBoundingClientRect().top <= 64
      this.searchbarTop = searchbar.getBoundingClientRect().top
    },
    handleUpdate(keyword: string) {
      this.searchbarKeyword = keyword
    },
    handleSearch(keyword: string) {
      this.searchbarKeyword = keyword
      this.composeKeyword()
    },
    handleHashtagSelect(selectinfo: { title: string, selection: string[] }) {
      this.hashtagSelections[selectinfo.title].selection = selectinfo.selection
      this.composeKeyword()
    },
    handleSelectSorting(sortingCriterium: string) {
      this.selectedSorting = sortingCriterium
      this.composeKeyword()
    },
    handleClickWaterfall(template: ITemplate) {
      if (template.group_type === 1) {
        const route = this.$router.resolve({
          name: 'Editor',
          query: {
            type: 'product-page-template',
            design_id: template.group_id
          }
        })
        window.open(route.href, '_blank')
        generalUtils.fbq('track', 'AddToWishlist', {
          content_ids: [template.group_id]
        })
        return
      }
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
        generalUtils.fbq('track', 'AddToWishlist', {
          content_ids: [template.id]
        })
      } else {
        this.content_ids = template.content_ids
        if (this.isMobile()) {
          this.modal = 'mobile-pages'
        } else {
          this.modal = 'pages'
        }
      }
    },
    handleMouseEnter(id: string) {
      this.mouseInTemplate = id
    },
    handleMouseLeave(id: string) {
      if (this.mouseInTemplate === id) {
        this.mouseInTemplate = ''
      }
    },
    scrollToTop() {
      (this.$refs.body as HTMLElement).scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    composeKeyword() {
      const res = ['group::0']
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
      this.waterfallTemplatesPC = []
      this.waterfallTemplatesMOBILE = []
      this.isTemplateReady = false
      this.getTemplates({ keyword: res.join(';;'), theme: themes.join(',') }).then(() => {
        this.waterfallTemplatesPC = templateCenterUtils.generateWaterfall(this.templates, 6)
        this.waterfallTemplatesTAB = templateCenterUtils.generateWaterfall(this.templates, 3)
        this.waterfallTemplatesMOBILE = templateCenterUtils.generateWaterfall(this.templates, 2)
        this.isTemplateReady = true
      })
      generalUtils.fbq('track', 'Search', {
        search_string: this.searchbarKeyword
      })
    },
    handleLoadMore() {
      this.isTemplateReady = false
      this.getMoreTemplates().then(() => {
        this.waterfallTemplatesPC = templateCenterUtils.generateWaterfall(this.templates, 6)
        this.waterfallTemplatesTAB = templateCenterUtils.generateWaterfall(this.templates, 3)
        this.waterfallTemplatesMOBILE = templateCenterUtils.generateWaterfall(this.templates, 2)
        this.isTemplateReady = true
      })
    },
    handleTemplateClick(content: IContentTemplate) {
      if (content.themes.length > 1) {
        this.matchedThemes = this.themes.filter((theme) => content.themes.includes(theme.id.toString()))
        if (this.isMobile()) {
          const route = this.$router.resolve({
            name: 'Editor',
            query: {
              type: 'new-design-template',
              design_id: content.id,
              width: this.matchedThemes[0].width.toString(),
              height: this.matchedThemes[0].height.toString()
            }
          })
          window.open(route.href, '_blank')
          generalUtils.fbq('track', 'AddToWishlist', {
            content_ids: [content.id]
          })
          return
        }
        this.modal = 'template'
        this.contentBuffer = content
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
        generalUtils.fbq('track', 'AddToWishlist', {
          content_ids: [content.id]
        })
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
      generalUtils.fbq('track', 'AddToWishlist', {
        content_ids: [this.contentBuffer.id]
      })
    },
    getPrevUrl(content: IContentTemplate): string {
      return templateCenterUtils.getPrevUrl(content)
    },
    getThemeTitle(themeId: string): string {
      const theme = this.themes.find((theme) => theme.id.toString() === themeId)
      return theme ? theme.title : `${this.$t('NN0258')}`
    },
    checkSelected(theme: Itheme): boolean {
      return this.selectedTheme?.id === theme.id
    },
    checkMouseEntered(id: string, groupType: number): boolean {
      return this.mouseInTemplate === id && groupType === 1
    }
  }
})
</script>

<style lang="scss">
html,
body {
  overflow: hidden;
}
</style>

<style lang="scss" scoped>
.template-center {
  @include size(100%, 100%);
  min-height: 100%;
  overflow-y: auto;
  @media screen and (max-width: 767px) {
    overflow: unset;
    height: unset;
  }
  &__absolute-searchbar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 440px;
    height: 42px;
    border-radius: 3px;
    z-index: 1000;
    background: white;
    box-sizing: border-box;
    border: 1px solid setColor(gray-4);
  }
  &__search-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 376px;
    background-size: cover;
    background-position: center center;
    background: radial-gradient(
        21.05% 59% at 37.08% 73.01%,
        rgba(255, 195, 139, 0.2) 47.4%,
        rgba(255, 242, 230, 0.142) 100%
      ),
      radial-gradient(
        32.87% 62.53% at 60.31% 77.79%,
        rgba(255, 177, 173, 0.2) 56.25%,
        rgba(202, 159, 153, 0) 92.71%
      ),
      linear-gradient(
        90deg,
        #cce9ff 0%,
        #f5fbff 37.1%,
        #f8fcff 69.6%,
        #eaf4ff 100%
      );
  }
  &__search {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
    max-width: 90%;
    gap: 20px;
    &__title {
      display: flex;
      align-items: center;
      justify-content: center;
      > span {
        @include text-H2;
        display: block;
        color: setColor(nav);
      }
    }
    &__text {
      > span {
        @include body-LG;
        color: setColor(gray-2);
      }
    }
    &__searchbar {
      width: 440px;
      height: 42px;
      border-radius: 3px;
      background: white;
      box-sizing: border-box;
      border: 1px solid setColor(gray-4);
    }
  }
  &__content {
    margin: auto;
    width: 80%;
    min-width: calc(100% - 48px);
    @media screen and (max-width: 767px) {
      min-height: 100%;
      min-width: calc(100% - 30px);
      width: calc(100% - 30px);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
  }
  &__filter {
    margin-top: 36px;
    @media screen and (max-width: 767px) {
      margin-top: unset;
      margin-left: 5px;
      transition: 0.2s ease;
    }
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
    &__left,
    &__right {
      display: flex;
      align-items: center;
      height: 100%;
    }
    &__title {
      width: 108px;
      font-weight: 400;
      font-size: 16px;
      line-height: 36px;
      text-align: center;
      color: black;
    }
    &__sort {
      width: 113px;
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
      font-weight: 600;
      font-size: 14px;
      line-height: 24px;
      text-align: right;
      color: #373f41;
    }
    &__color-down {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  &__waterfall-wrapper {
    padding-bottom: 80px;
    @media screen and (max-width: 767px) {
      height: 100vh;
      overflow-y: auto;
      &::-webkit-scrollbar {
        display: none;
      }
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }
  }
  &__waterfall {
    display: flex;
    gap: 24px;
    @media screen and (max-width: 767px) {
      gap: 15px;
      padding: 2px;
    }
    &__column {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 24px;
      @media screen and (max-width: 767px) {
        gap: 15px;
      }
      &__template {
        position: relative;
        width: 100%;
        border: 1px solid setColor(gray-5);
        overflow: hidden;
        cursor: pointer;
        &__img {
          width: 100%;
          height: 100%;
        }
        &__theme {
          position: absolute;
          bottom: -20px;
          left: 0;
          width: 100%;
          height: 20px;
          background-color: rgba(238, 239, 244, 0.8);
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
  &__mobile-search {
    margin-top: 20px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 20px;
    width: calc(100% - 10px);
    height: 44px;
    display: flex;
    gap: 10px;
    &__searchbar {
      height: 44px;
      width: unset;
      background-color: white;
      border: 1px solid setColor(gray-4);
      border-radius: 3px;
      box-sizing: border-box;
      flex-grow: 1;
    }
    &__options {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid setColor(gray-4);
      border-radius: 3px;
      box-sizing: border-box;
      flex-grow: 0;
      flex-basis: 44px;
      transition: background-color 0.2s;
      &.active {
        background-color: setColor(gray-4);
        > svg {
          color: setColor(gray-4);
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
    background: #ffffff;
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
          text-align: right;
          > span {
            font-weight: 400;
            font-size: 12px;
          }
        }
      }
      &__title {
        margin-left: 17px;
      }
      &__description {
        transform-origin: right;
        transform: scale(calc(5 / 6));
        flex-grow: 1;
        justify-content: flex-end;
        padding-right: 15px;
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
        font-weight: 700;
        font-size: 12px;
        line-height: 18px;
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
  &__mobile-multi {
    position: fixed;
    top: $header-height;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #ffffff;
    z-index: 20;
    &__close {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      top: 12.5px;
      right: 15px;
      width: 25px;
      height: 25px;
      z-index: 20;
      cursor: pointer;
    }
    &__content {
      overflow-y: auto;
      width: 100%;
      height: calc(100vh - #{$header-height});
    }
    &__gallery {
      display: grid;
      margin: 20px;
      grid-gap: 20px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    &__gallery-item {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      aspect-ratio: 1;
      background: white;
      border: 1px solid setColor(gray-5);
      box-sizing: border-box;
      cursor: pointer;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
    }
  }
  &__scroll-space {
    height: 10vh;
    width: 100%;
  }
}

.pc-show {
  @media screen and (max-width: 767px) {
    display: none;
  }
}

.mobile-show {
  @media screen and (min-width: 768px) {
    display: none;
  }
}

.pc-lg-show {
  @media screen and (max-width: 975px) {
    display: none;
  }
}

.tab-show {
  @media screen and (min-width: 976px) {
    display: none;
  }

  @media screen and (max-width: 540px) {
    display: none;
  }
}

.non-tab-show {
  @media screen and (min-width: 541px) {
    display: none;
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
  &-enter-active,
  &-leave-active {
    transition: 0.3s ease;
  }

  &-enter,
  &-leave-to {
    transform: scale(0.8);
    opacity: 0;
  }
}

.fade-scale-center {
  &-enter-active,
  &-leave-active {
    transition: 0.3s ease;
  }

  &-enter,
  &-leave-to {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
}

.fade-slide {
  &-enter-active,
  &-leave-active {
    transition: 0.3s ease;
  }

  &-enter,
  &-leave-to {
    left: 100%;
  }
}
</style>
