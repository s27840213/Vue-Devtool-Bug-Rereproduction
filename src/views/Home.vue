<template lang="pug">
div(class="home")
  nu-header(:showCloseIcon="showTemplateList" @close="showTemplateList = false")
  div(class="home-content")
    div(v-if="inBrowserMode && !(isMobile && isLogin)" class="home-top")
      div(class="home-top-text")
        span(class="home-top-text__title" v-html="$t('NN0464')")
        span(class="home-top-text__description") {{$t('NN0465')}}
        animation(v-for="cb in colorBlock"
          :key="cb"
          :class="`home-top-text__colorBlock ${cb.replace('.json', '')}`"
          :path="'/lottie/' + cb")
      iframe(title="Vivipic" class="home-top__yt"
        :src="`https://www.youtube.com/embed/${ytId}?playsinline=1&autoplay=1&mute=${isMobile?0:1}&rel=0`"
        frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
      router-link(v-if="inBrowserMode" :to="`/editor?type=new-design-size&width=1080&height=1080`"
          class="home-top__button rounded btn-primary-sm btn-LG")
        span {{$t('NN0391')}}
    div(class="home-list")
      scroll-list(
        :gridMode="true"
        type="theme")
      hashtag-category-row(v-if="!inBrowserMode || (isMobile && isLogin)"
        class="home-list__hashtag"
        :type="'tag'"
        :title="''"
        :list="homeTags"
        :defaultSelection="[]"
        :shinkWidth="0"
        @select="handleSelectTags")
      template(v-if="selectedTags.length !== 0")
        template-waterfall(:waterfallTemplates="waterfallTemplates"
          :isTemplateReady="isTemplateReady"
          :useScrollablePreview="!isMobile"
          :useScrollSpace="isMobile"
          :themes="themes"
          @loadMore="handleLoadMore"
          @clickWaterfall="handleClickWaterfall")
      template(v-else)
        scroll-list(v-if="isLogin && inBrowserMode && !isMobile"
          type="mydesign")
        template(v-if="isLogin || !inBrowserMode")
          scroll-list(v-for="theme in themeList"
            type="template"
            :theme="`${theme}`"
            :key="theme"
            :shuffle="true")
    div(v-if="inBrowserMode && !(isMobile && isLogin)" class="home-block")
      ta-block(v-for="item in blocklist"
        :key="item.title"
        :content="item")
    nu-footer(v-if="inBrowserMode && !(isMobile && isLogin)" :isHome="true")
  transition(name="fade-slide")
    div(v-if="showTemplateList && isMobile" class="template-list")
      div(class="template-list__content")
        div(class="template-list__gallery")
          div(v-for="content in contentIds" class="template-list__gallery-item"
            :key="content.id"
            :style="`background-image: url(${getPrevUrl(content, 2)})`"
            @click="handleTemplateClick(content)")
</template>

<script lang="ts">
import Animation from '@/components/Animation.vue'
import NuHeader from '@/components/NuHeader.vue'
import { IContentTemplate, ITemplate } from '@/interfaces/template'
import { Itheme } from '@/interfaces/theme'
import generalUtils from '@/utils/generalUtils'
import blocklistData, { IHomeBlockData } from '@/utils/homeBlockData'
import modalUtils from '@/utils/modalUtils'
import paymentUtils from '@/utils/paymentUtils'
import picWVUtils from '@/utils/picWVUtils'
import templateCenterUtils from '@/utils/templateCenterUtils'
import { defineAsyncComponent, defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'Home',
  components: {
    NuHeader,
    Animation,
    ScrollList: defineAsyncComponent(() =>
      import('@/components/homepage/ScrollList.vue')
    ),
    TaBlock: defineAsyncComponent(() =>
      import('@/components/homepage/TaBlock.vue')
    ),
    NuFooter: defineAsyncComponent(() =>
      import('@/components/NuFooter.vue')
    ),
    HashtagCategoryRow: defineAsyncComponent(() =>
      import('@/components/templates/HashtagCategoryRow.vue')
    ),
    TemplateWaterfall: defineAsyncComponent(() =>
      import('@/components/templates/TemplateWaterfall.vue')
    ),
  },
  data() {
    return {
      // themeList: ['1,2', '3', '8', '6', '5', '7', '9'],
      colorBlock: [
        'vector_lightblue2.json',
        'vector_pink1.json',
        'oval_pink4.json',
        'oval_yellow1.json'
      ],
      waterfallTemplatesPC: [] as ITemplate[][],
      waterfallTemplatesTAB: [] as ITemplate[][],
      waterfallTemplatesMOBILE: [] as ITemplate[][],
      isMobileSize: false,
      isPCSize: false,
      isTemplateReady: false,
      selectedTags: [] as string[],
      contentIds: [] as IContentTemplate[],
      groupId: '',
      showTemplateList: false,
      matchedThemes: [] as Itheme[],
      selectedTheme: undefined as Itheme | undefined,
      modalTemplate: {} as ITemplate,
      contentBuffer: undefined as IContentTemplate | undefined,
      // contentIds: [] as IContentTemplate[],
      // groupId: '',
      // modalTemplate: {} as ITemplate,
    }
  },
  // setup() {
  //   useMeta({
  //     title: 'Home'
  //   })
  // },
  metaInfo() {
    return {
      title: `${this.$t('SE0001')}`,
      meta: [{
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
      }, {
        property: 'og:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'og:title'
      }, {
        property: 'og:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'og:image'
      }, {
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
      }, {
        property: 'twitter:title',
        content: `${this.$t('OG0001')}`,
        vmid: 'twitter:title'
      }, {
        property: 'twitter:image',
        content: `${this.$t('OG0003')}`,
        vmid: 'twitter:image'
      }, {
        property: 'twitter:description',
        content: `${this.$t('OG0002')}`,
        vmid: 'twitter:description'
      }, {
        property: 'og:url',
        content: `${this.$t('OG0005')}`,
        vmid: 'og:url'
      }]
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)

    this.handleResize()
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin',
      inBrowserMode: 'webView/getInBrowserMode',
      _themeList: 'getShuffledThemesIds',
      themes: 'getMainHiddenThemes',
      userInfo: picWVUtils.appendModuleName('getUserInfo')
    }),
    statusbarHeight (): string {
      return `${this.userInfo.statusBarHeight ?? 0}px`
    },
    ...mapState({
      isMobile: 'isMobile',
      _homeTags: 'homeTags'
    }),
    ...mapState('templates', {
      templates: 'searchResult'
    }),
    homeTags(): Array<{name: string}> {
      return this._homeTags.map((tag: string) => {
        return {
          name: tag
        }
      })
    },
    blocklist(): IHomeBlockData[] {
      const blocklist = blocklistData.data().filter((item) => {
        return !(this.$i18n.locale === 'us' && item.img.name === 'e-commerce.json')
      })
      // Set align as row, row-reverse alternately.
      for (let i = 1; i < blocklist.length; i++) {
        if (blocklist[i].align === 'alternately') {
          blocklist[i].align = blocklist[i - 1].align === 'row' ? 'row-reverse' : 'row'
        }
      }
      return blocklist
    },
    ytId() {
      return this.$i18n.locale === 'us' ? 'GRSlz37Njo0'
        : this.$i18n.locale === 'jp' ? 'FzPHWU0O1uI'
          : this.$i18n.locale === 'tw' ? 'BBVAwlBk_zA' : 'GRSlz37Njo0'
    },
    waterfallTemplates(): ITemplate[][] {
      if (this.isPCSize) {
        return this.waterfallTemplatesPC
      } else if (this.isMobileSize) {
        return this.waterfallTemplatesMOBILE
      } else {
        return this.waterfallTemplatesTAB
      }
    },
    themeList(): string[] {
      if (this._themeList && this.$i18n.locale === 'us') {
        return this._themeList.filter((theme: string) => theme !== '7')
      }
      return this._themeList
    },
    // onlyShowInMobileApp() {
    //   return this.$isTouchDevice() && !this.inBrowserMode
    // }
  },
  // created() {
  //   if (this.$i18n.locale === 'us') {
  //     this.themeList = _.without(this.themeList, '7')
  //   }
  // },
  methods: {
    ...mapActions('templates', {
      getTemplates: 'getThemeContent',
      getMoreTemplates: 'getMoreContent'
    }),
    handleLoadMore() {
      this.isTemplateReady = false
      this.getMoreTemplates().then(() => {
        this.waterfallTemplatesPC = templateCenterUtils.generateWaterfall(this.templates, 6)
        this.waterfallTemplatesTAB = templateCenterUtils.generateWaterfall(this.templates, 3)
        this.waterfallTemplatesMOBILE = templateCenterUtils.generateWaterfall(this.templates, 2, 2)
        this.isTemplateReady = true
      })
    },
    handleResize() {
      this.isMobileSize = generalUtils.getWidth() <= 540
      this.isPCSize = generalUtils.getWidth() >= 976
    },
    handleSelectTags(selectinfo: { title: string, selection: string[] }) {
      this.selectedTags = [...selectinfo.selection]
      this.composeKeyword()
    },
    // eslint-disable-next-line vue/no-unused-properties
    composeKeyword() {
      const res = ['group::0']
      const tags = [this.selectedTags.join(' ')]

      if (tags.length > 0) {
        res.push('tag::' + tags.join('&&'))
      }
      res.push('order_by::popular')
      this.waterfallTemplatesPC = []
      this.waterfallTemplatesTAB = []
      this.waterfallTemplatesMOBILE = []
      this.isTemplateReady = false
      this.getTemplates({ keyword: res.join(';;'), theme: '' }).then(() => {
        this.waterfallTemplatesPC = templateCenterUtils.generateWaterfall(this.templates, 6)
        this.waterfallTemplatesTAB = templateCenterUtils.generateWaterfall(this.templates, 3)
        this.waterfallTemplatesMOBILE = templateCenterUtils.generateWaterfall(this.templates, 2, 2)
        this.isTemplateReady = true
      })
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
        const matchedTheme = this.themes.find((theme: Itheme) => theme.id.toString() === template.theme_id)
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
        this.showTemplateList = true
      }
    },
    handleTemplateClick(content: IContentTemplate) {
      if (!paymentUtils.checkProGroupTemplate(this.modalTemplate, content)) return
      this.matchedThemes = this.themes.filter((theme: Itheme) => content.themes.includes(theme.id.toString()))
      const allSameSize = this.matchedThemes.reduce<[boolean, number | undefined, number | undefined]>((acc, theme) => {
        return [acc[0] && (acc[1] === undefined || ((acc[1] === theme.width) && (acc[2] === theme.height))), theme.width, theme.height]
      }, [true, undefined, undefined])[0]
      if (content.themes.length > 1 && !allSameSize) {
        if (this.isMobileSize) {
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
        this.contentBuffer = content
        this.selectedTheme = undefined
      } else {
        const matchedTheme = this.themes.find((theme: Itheme) => theme.id.toString() === content.themes[0])
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
    openTemplate(url: string) {
      picWVUtils.openOrGoto(url)
    },
    getPrevUrl(content?: IContentTemplate, scale?: number): string {
      if (!content) return ''
      return templateCenterUtils.getPrevUrl(content, scale)
    }
  }
})
</script>

<style lang="scss" scoped>
.home {
  height: 100%;
}
.home-content {
  position: relative;
  @include hover-scrollbar();
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - #{$header-height});
}
.home-top {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  position: relative;
  &-text {
    display: flex;
    flex-direction: column;
    text-align: center;
    &__title {
      color: setColor(gray-1);
    }
    &__description {
      color: setColor(gray-2);
    }
    &__colorBlock {
      position: absolute;
      z-index: -1;
    }
  }
  &__button {
    @include body-MD;
    margin-top: 25px;
    width: 216px;
    height: 44px;
    box-shadow: 0px 9px 13px 0px #7190cc40;
    text-decoration: none;
    color: setColor(white);
  }
  .vector_lightblue2 {
    width: 85px;
    height: 87px;
  }
  .vector_pink1 {
    width: 139px;
    height: 118px;
  }
  .oval_pink4 {
    width: 70px;
    height: 70px;
  }
  .oval_yellow1 {
    width: 45px;
    height: 46px;
  }
}
.home-list {
  width: 80%;
  position: relative;
  padding-bottom: calc(44 * 1px);
  &__hashtag {
    z-index: 10;
    position: sticky;
    top: -1px;
    left: 0;
    padding: 12px 0px;
    margin: 0px;
    background-color: white;
  }
}

.template-list {
  position: fixed;
  top: calc(#{$header-height} + v-bind(statusbarHeight) - 2px);
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
    top: calc((#{($header-height)}  + v-bind(statusbarHeight)) / 2);
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
    height: calc(100vh - #{($header-height)} + v-bind(statusbarHeight));
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
@media screen and (max-width: 768px) {
  .home-content {
    padding: 0 5%;
    // Always show scrollbar in mobile
    overflow-y: overlay;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      visibility: visible;
      border: none;
    }
    @include firefoxOnly {
      scrollbar-color: setColor(gray-3) transparent;
    }
  }
  .home-list, .home-block {
    width: 100%;
  }
  .home-top {
    min-height: 400px;
    width: 327px;
    margin-top: 20px;
    &-text {
      &__title {
        @include text-H3;
      }
      &__description {
        @include body-MD;
      }
    }
    &__yt {
      width: 320px;
      height: 180px;
    }
    .vector_lightblue2 {
      top: 42px;
      left: 14px;
    }
    .vector_pink1 {
      top: -12px;
      left: 299px;
    }
    .oval_pink4,
    .oval_yellow1 {
      display: none;
    }
    &__button {
      position: fixed;
      width: calc(90% - 40px);
      bottom: 30px;
      z-index: 1;
    }
  }
}
@media screen and (max-width: 1440px) and (min-width: 768.02px) {
  .home-top {
    min-height: 724px;
    width: 768px;
    margin-top: 80px;
    &-text {
      width: 560px; // todo ? 500 560
      &__title {
        @include text-H2;
      }
      &__description {
        @include body-LG;
      }
    }
    &__yt {
      width: 720px;
      height: 405px;
    }
    .vector_lightblue2 {
      top: 9px;
      left: 67px;
    }
    .vector_pink1 {
      top: -8px;
      left: 581px;
    }
    .oval_pink4,
    .oval_yellow1 {
      display: none;
    }
  }
}
@media screen and (min-width: 1440.02px) {
  .home-top {
    min-height: 724.15px;
    width: 1241px;
    margin-top: 80px;
    &-text {
      &__title {
        @include text-H1;
      }
      &__description {
        @include body-LG;
      }
    }
    &__yt {
      width: 800px;
      height: 449.9px;
    }
    .vector_lightblue2 {
      top: 50px;
      left: 146px;
    }
    .vector_pink1 {
      top: 11px;
      left: 964px;
    }
    .oval_pink4 {
      top: 327px;
      left: 17px;
    }
    .oval_yellow1 {
      top: 259px;
      left: 1158px;
    }
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
</style>
