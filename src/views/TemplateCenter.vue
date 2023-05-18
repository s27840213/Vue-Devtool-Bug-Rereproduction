<template lang="pug">
div(ref="body"
    class="template-center"
    @scroll.passive="handleScroll")
  nu-header(class="non-mobile-show" :noSearchbar="true" :noNavigation="snapToTop" v-header-border="'.template-center'")
    transition(name="slide")
      search-bar(v-if="snapToTop"
              :style="absoluteSearchbarStyles()"
              class="template-center__absolute-searchbar"
              :clear="true"
              :defaultKeyword="searchbarKeyword"
              :placeholder="`${$t('NN0092', {target: $tc('NN0001',1)})}`"
              @update="handleUpdate"
              @search="handleSearch")
  nu-header(class="non-tab-show" :noSearchbar="true" v-header-border="'.template-center'")
  div(class="template-center__search-container")
    div(class="template-center__search__title non-mobile-show")
      span(v-html="$t('NN0486')")
    div(class="template-center__search__title non-tab-show")
      span(v-html="$t('NN0487')")
    div(class="template-center__search__text non-mobile-show")
      span(v-html="$t('NN0488')")
    search-bar(ref="searchbar"
              class="template-center__search__searchbar non-mobile-show"
              :style="searchbarStyles()"
              :clear="true"
              :defaultKeyword="searchbarKeyword"
              :placeholder="`${$t('NN0092', {target: $tc('NN0001',1)})}`"
              @update="handleUpdate"
              @search="handleSearch")
    img(class="color-block vector-purple1" :src="require('@/assets/img/svg/color-block/vector_purple1.svg')")
    img(class="color-block oval-lightblue1 non-mobile-show" :src="require('@/assets/img/svg/color-block/oval_lightblue1.svg')")
    img(class="color-block oval-orange2 non-mobile-show" :src="require('@/assets/img/svg/color-block/oval_orange2.svg')")
  div(ref="mobileSearch" class="template-center__mobile-search__wrapper non-tab-show"
      :style="mobileSearchStyles()")
    div(class="template-center__mobile-search")
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
      transition(name="slide-up")
        img(v-if="!mobileSnapToTop" class="color-block oval-lightblue1" :src="require('@/assets/img/svg/color-block/oval_lightblue1.svg')")
      transition(name="slide-up")
        img(v-if="!mobileSnapToTop" class="color-block oval-orange2" :src="require('@/assets/img/svg/color-block/oval_orange2.svg')")
    div(class="template-center__filter non-tab-show"
        :style="{'max-height': isShowOptions ? `${82 * hashtags.length}px` : '0px', 'opacity': isShowOptions ? '1' : '0', 'pointer-events': isShowOptions ? 'initial' : 'none'}")
      hashtag-category-row(v-for="hashtag in hashtags"
        :key="hashtag.title"
        :list="hashtag"
        :defaultSelection="hashtagSelections[hashtag.title] ? hashtagSelections[hashtag.title].selection : []"
        @select="handleHashtagSelect")
  div(class="template-center__content")
    div(class="template-center__filter non-mobile-show")
      hashtag-category-row(v-for="hashtag in hashtags"
        :key="hashtag.title"
        :list="hashtag"
        :defaultSelection="hashtagSelections[hashtag.title] ? hashtagSelections[hashtag.title].selection : []"
        @select="handleHashtagSelect")
    div(class="template-center__hr non-mobile-show")
    div(class="template-center__sorter non-mobile-show")
      div(class="template-center__sorter__left")
        div(class="template-center__sorter__title") {{$t('NN0191')}}:
        div(v-for="sortingCriterium in sortingCriteria"
            :key="sortingCriterium.key"
            class="template-center__sorter__sort pointer"
            :class="{'selected': selectedSorting === sortingCriterium.key}"
            @click="handleSelectSorting(sortingCriterium.key)") {{ sortingCriterium.text }}
      div(class="template-center__sorter__right")
    template-no-result(v-if="hasNoResult"
                      :keyword="searchbarKeyword"
                      :allHashTagAll="allHashTagAll"
                      @updateHashTagsAll="handleSelectAll")
    template-waterfall(:waterfallTemplates="waterfallTemplates"
                      :isTemplateReady="isTemplateReady"
                      :useScrollablePreview="!isMobile"
                      :useScrollSpace="isMobile"
                      :themes="themes"
                      @loadMore="handleLoadMore"
                      @clickWaterfall="handleClickWaterfall")
  nu-footer(class="non-mobile-show")
  transition(name="fade-scale")
    div(v-if="snapToTop"
        class="template-center__to-top pointer non-mobile-show"
        @click="scrollToTop")
      svg-icon(iconName="to-top" iconWidth="40px" iconColor="white")
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
          div(v-for="content in contentIds" class="template-center__multi__gallery-item"
            :key="content.id"
            :style="`background-image: url(${getPrevUrl(content)})`"
            @click="handleTemplateClick(content)")
  transition(name="fade-slide")
    div(v-if="modal === 'mobile-pages'" class="template-center__mobile-multi")
      div(class="template-center__mobile-multi__content")
        div(class="template-center__mobile-multi__gallery")
          div(v-for="content in contentIds" class="template-center__mobile-multi__gallery-item"
            :key="content.id"
            :style="`background-image: url(${getPrevUrl(content, 2)})`"
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
              :key="theme.id"
              :class="checkSelected(theme) ? 'selected' : ''"
              @click="handleThemeSelect(theme)")
            div(class="template-center__multi__themes__title")
              span {{ theme.title }}
            div(class="template-center__multi__themes__description")
              span {{ `${theme.width}x${theme.height} ${theme.unit}` }}
        div(class="template-center__multi__button"
            :class="selectedTheme ? '' : 'disabled'"
            @click="handleThemeSubmit")
          span(:style="multiThemeButtonStyles()") {{$t('NN0229')}}
  div(v-if="modal !== '' && modal !== 'mobile-pages'" class="dim-background")
</template>

<script lang="ts">
import NuFooter from '@/components/NuFooter.vue'
import NuHeader from '@/components/NuHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import HashtagCategoryRow from '@/components/templates/HashtagCategoryRow.vue'
import TemplateNoResult from '@/components/templates/TemplateNoResult.vue'
import TemplateWaterfall from '@/components/templates/TemplateWaterfall.vue'
import { IContentTemplate, ITemplate } from '@/interfaces/template'
import { Itheme } from '@/interfaces/theme'
import hashtag from '@/store/module/hashtag'
import generalUtils from '@/utils/generalUtils'
import modalUtils from '@/utils/modalUtils'
import paymentUtils from '@/utils/paymentUtils'
import picWVUtils from '@/utils/picWVUtils'
import templateCenterUtils from '@/utils/templateCenterUtils'
import themeUtils from '@/utils/themeUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'

const HEADER_HEIGHT = 72

export default defineComponent({
  emits: [],
  name: 'TemplateCenter',
  components: {
    NuHeader,
    SearchBar,
    NuFooter,
    HashtagCategoryRow,
    TemplateWaterfall,
    TemplateNoResult
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
      mobileSnapToTop: false,
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
      contentIds: [] as IContentTemplate[],
      groupId: '',
      modalTemplate: {} as ITemplate,
      contentBuffer: undefined as IContentTemplate | undefined,
      modal: '',
      isShowOptions: false,
      isMobile: false,
      isPC: false
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
          selection: selection.slice(0, 1) // limit querystring selection as single selection
        }
      }
      this.composeKeyword()
    })
    themeUtils.checkThemeState().then(() => {
      this.themes = themeUtils.themes
    })

    generalUtils.fbq('track', 'ViewContent', {
      content_type: 'TemplateCenter'
    })

    window.addEventListener('resize', this.handleResize)

    this.handleResize()
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
  },
  beforeCreate() {
    this.$store.registerModule('hashtag', hashtag)
  },
  beforeUnmount() {
    this.$store.unregisterModule('hashtag')
  },
  computed: {
    ...mapState('hashtag', {
      hashtags: 'categories'
    }),
    ...mapState('templates', {
      templates: 'searchResult'
    }),
    ...mapGetters('templates', {
      hasNextPage: 'hasNextPage'
    }),
    waterfallTemplates(): ITemplate[][] {
      if (this.isPC) {
        return this.waterfallTemplatesPC
      } else if (this.isMobile) {
        return this.waterfallTemplatesMOBILE
      } else {
        return this.waterfallTemplatesTAB
      }
    },
    hasNoResult(): boolean {
      return this.isTemplateReady && this.templates.list.length === 0
    },
    allHashTagAll(): boolean {
      return !Object.values(this.hashtagSelections).some((hashtagSelection) => hashtagSelection.selection.length !== 0)
    }
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
      return { top: `${Math.max(this.searchbarTop, 15)}px` }
    },
    searchbarStyles() {
      return this.snapToTop ? { opacity: 0, pointerEvents: 'none' } : {}
    },
    mobileSearchStyles() {
      return this.mobileSnapToTop ? { zIndex: 10 } : {}
    },
    multiThemeButtonStyles() {
      return this.$i18n.locale === 'tw' ? {
        letterSpacing: '1.21em',
        textIndent: '1.21em'
      } : {}
    },
    handleScroll() {
      const searchbar = (this.$refs.searchbar as {$el: HTMLElement}).$el as HTMLElement
      this.snapToTop = searchbar.getBoundingClientRect().top <= HEADER_HEIGHT
      this.searchbarTop = searchbar.getBoundingClientRect().top
      const mobileSearch = this.$refs.mobileSearch as HTMLElement | undefined
      this.mobileSnapToTop = (mobileSearch?.getBoundingClientRect()?.top ?? 1000) <= HEADER_HEIGHT
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
    handleSelectAll() {
      for (const hashtagSelection of Object.values(this.hashtagSelections)) {
        hashtagSelection.selection = []
      }
      this.composeKeyword()
    },
    handleClickWaterfall(template: ITemplate) {
      if (template.group_type === 1) {
        if (this.$isTouchDevice()) {
          modalUtils.setModalInfo(
            `${this.$t('NN0808')}`,
            [],
            {
              msg: `${this.$t('NN0358')}`,
              class: 'btn-blue-mid',
              action: () => { return false }
            }
          )
          return
        }
        if (!paymentUtils.checkProTemplate(template)) return
        const route = this.$router.resolve({
          name: 'Editor',
          query: {
            type: 'product-page-template',
            design_id: template.group_id,
            themeId: template.content_ids[0].themes.join(',')
          }
        })
        this.openTemplate(route.href)
        generalUtils.fbq('track', 'AddToWishlist', {
          content_ids: [template.group_id]
        })
        return
      }
      if (template.content_ids.length === 1) {
        if (!paymentUtils.checkProTemplate(template)) return
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
            themeId: template.content_ids[0].themes.join(','),
            width: format.width,
            height: format.height
          }
        })
        this.openTemplate(route.href)
        generalUtils.fbq('track', 'AddToWishlist', {
          content_ids: [template.id]
        })
      } else {
        this.groupId = template.group_id ?? ''
        this.contentIds = template.content_ids
        this.modalTemplate = template
        if (this.isMobile) {
          this.modal = 'mobile-pages'
        } else {
          this.modal = 'pages'
        }
      }
    },
    scrollToTop() {
      (this.$refs.body as HTMLElement).scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    composeKeyword() {
      const query = {} as {[key: string]: string}
      const res = ['group::0']
      const tags = []
      let themes: string[] = []
      if (this.searchbarKeyword !== '') {
        tags.push(this.searchbarKeyword)
        query.q = this.searchbarKeyword
      }
      let queryTags = [] as string[]
      for (const hashtagSelection of Object.values(this.hashtagSelections)) {
        if (hashtagSelection.type === 'tag' && hashtagSelection.selection.length > 0) {
          tags.push(hashtagSelection.selection.join(' '))
          queryTags = queryTags.concat(hashtagSelection.selection)
        }
        if (hashtagSelection.type === 'theme') {
          themes = themes.concat(hashtagSelection.selection)
        }
      }
      if (queryTags.length > 0) {
        query.tags = queryTags.join(',')
      }
      if (themes.length > 0) {
        query.themes = themes.join(',')
      }
      query.sort = this.selectedSorting
      this.$router.replace({ query })
      if (tags.length > 0) {
        res.push('tag::' + tags.join('&&'))
      }
      res.push('order_by::' + this.selectedSorting)
      this.waterfallTemplatesPC = []
      this.waterfallTemplatesTAB = []
      this.waterfallTemplatesMOBILE = []
      this.isTemplateReady = false
      this.getTemplates({ keyword: res.join(';;'), theme: themes.join(',') }).then(() => {
        this.waterfallTemplatesPC = templateCenterUtils.generateWaterfall(this.templates, 6)
        this.waterfallTemplatesTAB = templateCenterUtils.generateWaterfall(this.templates, 3)
        this.waterfallTemplatesMOBILE = templateCenterUtils.generateWaterfall(this.templates, 2, 2)
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
        this.waterfallTemplatesMOBILE = templateCenterUtils.generateWaterfall(this.templates, 2, 2)
        this.isTemplateReady = true
      })
    },
    handleTemplateClick(content: IContentTemplate) {
      if (!paymentUtils.checkProGroupTemplate(this.modalTemplate, content)) return
      this.matchedThemes = this.themes.filter((theme) => content.themes.includes(theme.id.toString()))
      const allSameSize = this.matchedThemes.reduce<[boolean, number | undefined, number | undefined]>((acc, theme) => {
        return [acc[0] && (acc[1] === undefined || ((acc[1] === theme.width) && (acc[2] === theme.height))), theme.width, theme.height]
      }, [true, undefined, undefined])[0]
      if (content.themes.length > 1 && !allSameSize) {
        if (this.isMobile) {
          const route = this.$router.resolve({
            name: 'Editor',
            query: {
              type: 'new-design-template',
              design_id: content.id,
              width: this.matchedThemes[0].width.toString(),
              height: this.matchedThemes[0].height.toString(),
              group_id: this.groupId
            }
          })
          this.openTemplate(route.href)
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
            height: format.height,
            group_id: this.groupId
          }
        })
        this.openTemplate(route.href)
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
          height: this.selectedTheme.height.toString(),
          group_id: this.groupId
        }
      })
      this.openTemplate(route.href)
      generalUtils.fbq('track', 'AddToWishlist', {
        content_ids: [this.contentBuffer.id]
      })
    },
    handleResize() {
      this.isMobile = generalUtils.getWidth() <= 540
      this.isPC = generalUtils.getWidth() >= 976
    },
    getPrevUrl(content?: IContentTemplate, scale?: number): string {
      if (!content) return ''
      return templateCenterUtils.getPrevUrl(content, scale)
    },
    checkSelected(theme: Itheme): boolean {
      return this.selectedTheme?.id === theme.id
    },
    openTemplate(url: string) {
      picWVUtils.openOrGoto(url)
    }
  }
})
</script>

<style lang="scss" scoped>
.template-center {
  @include size(100%, 100%);
  @include hover-scrollbar();
  min-height: 100%;
  @media screen and (max-width: 540px) {
    overflow-x: hidden;
    position: relative;
    @include no-scrollbar;
    padding-right: 0;
  }
  &__absolute-searchbar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: min(60vw, 512px);
    height: 42px;
    border-radius: 3px;
    z-index: setZindex("nu-header") + 1;
    background: white;
    box-sizing: border-box;
    border: 1px solid setColor(gray-4);
  }
  &__search-container {
    width: 100%;
    height: 376px;
    position: relative;
    @media screen and (max-width: 540px) {
      height: fit-content;
    }
  }
  &__search {
    &__title {
      position: absolute;
      bottom: 210px;
      left: 50%;
      transform: translateX(-50%);
      width: fit-content;
      max-width: 90%;
      display: flex;
      align-items: center;
      justify-content: center;
      @media screen and (max-width: 540px) {
        position: static;
        transform: none;
        margin: auto;
        margin-top: 24px;
        margin-bottom: 38px;
        > span {
          text-align: left;
        }
      }
      > span {
        @include text-H2;
        display: block;
        color: setColor(nav);
      }
    }
    &__text {
      position: absolute;
      top: 184px;
      left: 50%;
      transform: translateX(-50%);
      width: fit-content;
      max-width: 90%;
      > span {
        @include body-LG;
        color: setColor(gray-2);
      }
    }
    &__searchbar {
      position: absolute;
      top: 248px;
      left: 50%;
      transform: translateX(-50%);
      width: min(60vw, 512px);
      height: 42px;
      border-radius: 3px;
      background: white;
      box-sizing: border-box;
      border: 1px solid setColor(gray-4);
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    }
  }
  &__content {
    margin: auto;
    width: 80%;
    min-width: calc(100% - 48px);
    @media screen and (max-width: 540px) {
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
    @media screen and (max-width: 540px) {
      margin-top: unset;
      margin-left: 5px;
      transition: 0.2s ease;
      width: calc(100% - 40px);
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
  &__mobile-search {
    position: relative;
    min-width: calc(100% - 40px);
    width: calc(100% - 40px);
    height: 44px;
    margin-top: 16px;
    margin-bottom: 16px;
    display: flex;
    &__wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      width: 100%;
      background-color: white;
      position: -webkit-sticky;
      position: sticky;
      top: $header-height;
    }
    &__searchbar {
      height: 44px;
      width: unset;
      background-color: white;
      border: 1px solid setColor(gray-4);
      border-radius: 5px;
      box-sizing: border-box;
      flex-grow: 1;
      margin-right: 10px;
    }
    &__options {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid setColor(gray-4);
      border-radius: 5px;
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
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(196, 196, 196, 0.8);
  }
  &__multi {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(982px, calc(100vw - 30px));
    height: 560px;
    background: #ffffff;
    box-shadow: 0px 0px 12px rgba(151, 150, 150, 0.4);
    border-radius: 6px;
    z-index: setZindex("popup");
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
      width: 57%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border-right: 2px solid setColor(gray-5);
      box-sizing: border-box;
    }
    &__content-right {
      width: 47%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    &__gallery {
      display: grid;
      margin: auto;
      margin-bottom: 20px;
      width: min(860px, calc(100% - 40px));
      grid-gap: 20px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      @media screen and (max-width: 767px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    &__gallery-item {
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 200px;
      width: 100%;
      padding-top: calc(100% - 2px);
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
      width: 67%;
      padding-top: calc(67% - 2px);
      background: white;
      border: 1px solid setColor(gray-5);
      box-sizing: border-box;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
    }
    &__title {
      width: 74%;
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
      width: 74%;
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
      width: 57%;
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
    z-index: setZindex("popup");
    &__close {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      top: calc(#{$header-height} / 2);
      right: 55px;
      width: 25px;
      height: 25px;
      z-index: setZindex("popup");
      transform: translate(0%, -50%);
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
      padding-top: calc(100% - 2px);
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

.text-blue-1 {
  color: setColor(blue-1);
}

.color-block {
  position: absolute;
  z-index: -1;
}

.vector-purple1 {
  top: 79px;
  right: max(calc((100vw - 948px) / 2), 24px);
  width: 83.78px;
  height: 87px;
  transform: rotate(162.55deg);
  @media screen and (max-width: 768px) {
    top: 60px;
  }
  @media screen and (max-width: 540px) {
    top: 2px;
    right: -12px;
  }
}

.oval-lightblue1 {
  top: 221px;
  left: max(calc((100vw - 948px) / 2 + 130px), 50px);
  width: 112px;
  height: 112px;
  @media screen and (max-width: 540px) {
    top: -26px;
    left: -31px;
    width: 101px;
    height: 101px;
  }
}

.oval-orange2 {
  top: 298px;
  left: max(calc((100vw - 948px) / 2), 32px);
  width: 44px;
  height: 44px;
  @media screen and (max-width: 540px) {
    top: 50px;
    left: -37px;
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

.non-mobile-show {
  @media screen and (max-width: 540px) {
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
  z-index: setZindex("popup") - 1;
}

.fade-scale {
  &-enter-active,
  &-leave-active {
    transition: 0.3s ease;
  }

  &-enter-from,
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

  &-enter-from,
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

  &-enter-from,
  &-leave-to {
    left: 100%;
  }
}

.slide-up {
  &-enter-active,
  &-leave-active {
    transition: 0.3s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(-100px);
  }
}
</style>
