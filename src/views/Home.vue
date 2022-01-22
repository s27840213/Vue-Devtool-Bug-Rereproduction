<template lang="pug">
  div(class="home")
    nu-header
    div(class="home-content")
      div(class="home-content__top")
        img(class="home-content__top-bg"
          :style="`height: ${isLogin ? '420px;' : '700px;'}`"
          :src="require('@/assets/img/svg/homepage/top-bg.svg')")
        div(v-if="!isLogin"
          class="home-content__top-white")
        div(class="home-content__top-region")
          i18n(path="NN0148" tag="span"
            class="home-content__top-title")
            template(#newline)
              br
          div(class="home-content__top-subtitle")
            span {{$t('NN0237')}}
          div(v-if="isLogin")
            search-bar(class="home-content__top-search"
              :placeholder="$t('NN0037')"
              @search="handleSearch")
          template(v-else)
            div(class="home-content__top-btn"
              @click="newDesign()") {{$t('NN0274')}}
            img(class="home-content__top-img"
              :src="require('@/assets/img/svg/homepage/header_img_us.png')")
      div(class="home-content-title label-lg"
        :class="!isLogin ? 'mt-100' : ''") {{$t('NN0154')}}
      div(class="home-content__theme")
        scroll-list(:list="themeList" type='theme'
          @openPopup="openPopup()")
      div(v-if="!isLogin"
        class="home-content__plaque")
        div(class="home-content__plaque-title") {{$t('NN0276')}}
        div(class="home-content__plaque-subtitle"
          class="px-20") {{$t('NN0277')}}
        div(class="home-content__plaque-bg")
      div(v-if="isLogin")
        div(class="home-content-title label-lg")
          span {{$t('NN0080')}}
          span(class="pointer body-1 more"
          @click="goToPage('MyDesign')") {{$t('NN0082')}}
        div(class="home-content__mydesign")
          template-list(:designList="allDesigns" type='design'
            :isLoading="isDesignsLoading")
      template(v-for="list in (isLogin ? templates : templates2)")
        div(class="home-content-title label-lg")
          span {{list.title}}
          span(class="pointer body-1"
            @click="goToTemplateCenterTheme(list.theme)") {{$t('NN0082')}}
        div(class="home-content__template")
          template-list(:theme="list.theme" type='template')
      template(v-if="!isLogin")
        div(class="home-content__feature-bg bg-f1")
          div(class="home-content__feature-f1")
            i18n(path="NN0372"
             class="home-content__feature-title" tag="span")
                template(#newline)
                  br
            div(class="home-content__feature-subtitle") {{$t('NN0373')}}
            div(class="home-content__feature-btn"
              @click="newDesign()") {{$t('NN0374')}}
          img(class="home-content__feature-img"
            :src="require('@/assets/img/svg/homepage/Feature 1_us.svg')")
      nu-footer(class="mt-50")
      div(v-if="showSizePopup"
        class="home__size")
        popup-size(@close="closePopup()")
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapActions, mapGetters } from 'vuex'
import NuHeader from '@/components/NuHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import NuFooter from '@/components/NuFooter.vue'
import ScrollList from '@/components/homepage/ScrollList.vue'
import TemplateList from '@/components/homepage/TemplateList.vue'
import PopupSize from '@/components/popup/PopupSize.vue'
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'
import themeUtils from '@/utils/themeUtils'
import localeUtils from '@/utils/localeUtils'
import { ITemplate } from '@/interfaces/template'

export default Vue.extend({
  name: 'Home',
  components: {
    NuHeader,
    SearchBar,
    NuFooter,
    ScrollList,
    TemplateList,
    PopupSize
  },
  data() {
    return {
      themeList: [] as Itheme[],
      showSizePopup: false,
      tagString: '',
      tags: [] as string[],
      templates1: [] as ITemplate[],
      templates: [
        {
          title: i18n.t('NN0368'),
          theme: '1,2'
        },
        {
          title: i18n.t('NN0026'),
          theme: '3'
        },
        {
          title: i18n.t('NN0151', { media: 'Facebook' }),
          theme: '8'
        },
        {
          title: i18n.t('NN0028'),
          theme: '6'
        },
        {
          title: i18n.t('NN0027'),
          theme: '5'
        },
        {
          title: i18n.t('NN0369'),
          theme: '7'
        },
        {
          title: i18n.t('NN0370'),
          theme: '9'
        }
      ] as { title: string; theme: string; }[],
      templates2: [] as { title: string; theme: string; }[],
      tagTemplateList: [],
      popularTemplateList: [],
      latestTemplateList: []
    }
  },
  metaInfo() {
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
        property: 'og:url',
        content: `${this.$t('OG0005')}`,
        vmid: 'og:url'
      }
    ]
    const title = `${this.$t('SE0001')}`
    // const htmlAttrs = {
    //   lang: `${this.$t('SE0003')}`
    // }
    return {
      title,
      meta
      // htmlAttrs
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin',
      allDesigns: 'design/getAllDesigns',
      isDesignsLoading: 'design/getIsDesignsLoading'
    }),
    isMobile(): boolean {
      return document.body.clientWidth / document.body.clientHeight < 1
    },
    currLocale(): string {
      return localeUtils.currLocale()
    }
  },
  async mounted() {
    if (this.isLogin) {
      designUtils.fetchDesigns(this.fetchAllDesigns)
    }

    await themeUtils.checkThemeState().then(() => {
      this.themeList = themeUtils.themes
    })

    this.templates2 = this.templates.filter((value, idx) => {
      return idx <= 4
    })
  },
  methods: {
    ...mapActions({
      getTagContent: 'homeTemplate/getTagContent',
      fetchAllDesigns: 'design/fetchAllDesigns'
    }
    ),
    goToPage(pageName: string, queryString = '') {
      if (queryString) {
        this.$router.push({ name: pageName, query: { search: queryString } })
      } else {
        this.$router.push({ name: pageName })
      }
    },
    goToTemplateCenterSearch(search = '') {
      this.$router.push({ name: 'TemplateCenter', query: { q: search } })
    },
    goToTemplateCenterSortBy(sortBy = '') {
      this.$router.push({ name: 'TemplateCenter', query: { sort: sortBy } })
    },
    goToTemplateCenterTheme(themes = '') {
      this.$router.push({ name: 'TemplateCenter', query: { themes: themes } })
    },
    newDesign(search = '') {
      if (search) {
        this.$router.push({ name: 'Editor', query: { search: search } }).then(() => {
          designUtils.newDesign()
        })
      } else {
        this.$router.push({ name: 'Editor' }).then(() => {
          designUtils.newDesign()
        })
      }
    },
    openPopup() {
      this.showSizePopup = true
    },
    closePopup() {
      this.showSizePopup = false
    },
    handleSearch(keyword: string) {
      this.goToPage('TemplateCenter', keyword)
    }
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/scss/homepageStyle.scss";

.home {
  position: relative;
  width: 100%;
  height: 100%;
  &__size {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000000a1;
    z-index: 999999;
  }
}
.home-content {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: scroll;
  height: calc(100% - 50px);
  &-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    @include text-H5;
    padding: 38px 150px 6px 150px;
    @media screen and (max-width: 1440px) {
      padding: 38px 75px 6px 75px;
    }
    @media screen and (max-width: 768px) {
      @include text-H6;
      padding: 38px 3% 6px 3%;
    }
    .more {
      white-space: nowrap;
    }
  }
  &__top {
    position: relative;
    display: flex;
    justify-content: center;
    &-bg {
      width: 100%;
      object-fit: cover;
    }
    &-white {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 0;
      height: 0;
      border-color: white transparent;
      border-width: 0 0 35vh 100vw;
      border-style: solid;
    }
    &-region {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: absolute;
      top: 100px;
      color: setColor(dark-blue);
    }
    &-title {
      color: setColor(nav);
      padding: 0 5%;
      @include text-H2;
      @media screen and (max-width: 1440px) {
        @include text-H3;
      }
      @media screen and (max-width: 768px) {
        @include text-H5;
      }
    }
    &-subtitle {
      color: setColor(gray-2);
      padding-top: 20px;
      @include body-LG;
      @media screen and (max-width: 768px) {
        @include body-SM;
        max-width: 75%;
      }
    }
    &-mobile-subtitle {
      position: absolute;
      font-size: 12px;
      color: setColor(gray-2);
      top: 75px;
      transform: scale(0.9);
    }
    &-btn {
      width: 240px;
      margin-top: 20px;
      @include button-LG;
      @media screen and (max-width: 1440px) {
        width: 200px;
      }
    }
    &-search {
      display: flex;
      justify-content: center;
      width: 75vw;
      max-width: 380px;
      height: 40px;
      background-color: white;
      border-radius: 3px;
      border: 1px solid setColor(gray-4);
      box-sizing: border-box;
      margin: 20px auto;
    }
    &-img {
      width: 80%;
      max-width: 1000px;
      padding-top: 52px;
    }
  }
  &__theme,
  &__mydesign,
  &__template {
    padding: 0 150px;
    @media screen and (max-width: 1440px) {
      padding: 0 75px;
    }
    @media screen and (max-width: 768px) {
      padding: 0 3%;
    }
  }
  &__plaque {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding: 50px 0;
    &-bg {
      position: absolute;
      top: 75px;
      width: 675px;
      height: 20px;
      background: setColor(blue-3);
      z-index: -1;
      @media screen and (max-width: 1440px) {
        width: 500px;
        top: 65px;
      }
      @media screen and (max-width: 768px) {
        width: 425px;
        top: 62px;
      }
      @media screen and (max-width: 540px) {
        width: 50%;
        top: 90px;
      }
    }
    &-title {
      color: setColor(gray-1);
      @include text-H3;
      @media screen and (max-width: 1440px) {
        @include text-H4;
      }
      @media screen and (max-width: 768px) {
        @include text-H5;
        max-width: 90%;
      }
    }
    &-subtitle {
      color: setColor(gray-2);
      padding-top: 10px;
      @include body-MD;
      @media screen and (max-width: 768px) {
        @include body-SM;
      }
    }
  }
  &__feature {
    &-bg {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F3F6FA;
      margin-top: 24px;
      padding: 0 5%;
      &.bg-f1 {
        @media screen and (max-width: 768px) {
          flex-direction: column-reverse;
          align-items: flex-start;
          padding: 0;
        }
      }
    }
    &-f1 {
      display: flex;
      flex-direction: column;
      padding: 150px 0;
      @media screen and (max-width: 768px) {
        padding: 50px 24px 75px 24px;
      }
    }
    &-title {
      text-align: left;
      @include text-H2;
      width: 400px;
      @media screen and (max-width: 540px) {
        @include text-H5;
        width: unset;
      }
    }
    &-subtitle {
      text-align: left;
      color: setColor(gray-2);
      padding-top: 20px;
      @include body-LG;
      @media screen and (max-width: 768px) {
        @include body-SM;
      }
    }
    &-btn {
      width: 200px;
      margin-top: 20px;
      @include button-LG;
    }
    &-img {
      width: 50%;
      max-width: 640px;
      @media screen and (max-width: 768px) {
        margin:0 auto;
        width: 95%;
        max-width: unset;
      }
    }
  }
}
</style>
