<template lang="pug">
  div(class="home")
    nu-header(:showSearchPage="isShowMobileSearchPage"
      @isShowSearchPage="showMobileSearchPage")
    div(class="home-content")
      div(class="home-content__top")
        div(class="home-content__top-bg"
          :class="isLogin ? 'login_h' : 'unlogin_h'")
        div(v-if="!isLogin"
          class="home-content__top-white")
        div(class="home-content__top-region")
          i18n(path="NN0148" tag="span"
            class="home-content__top-title")
            template(#newline)
              br
          i18n(path="NN0390" tag="span"
            class="home-content__top-subtitle")
            template(#newline)
              br
          div(v-if="isLogin")
            search-bar(class="home-content__top-search"
              :placeholder="$t('NN0037')"
              @search="goToTemplateCenterSearch"
              @click.native="showMobileSearchPage(true)")
          template(v-else)
            div(class="home-content__top-btn"
              @click="newDesign()") {{$t('NN0274')}}
            img(class="home-content__top-img"
              :src="require('@/assets/img/svg/homepage/header_img_' + currLocale+ '.png')")
      div(class="home-content-title"
        :class="!isLogin ? 'top-padding' : ''") {{$t('NN0154')}}
      div(class="home-content__theme")
        scroll-list(:list="themeList" type='theme'
          @openPopup="openPopup()")
      div(v-if="!isLogin"
        class="home-content__plaque")
        div(class="home-content__plaque-title"
          :class="currLocale === 'us' ? 'us' : ''") {{$t('NN0276')}}
          div(class="home-content__plaque-bg")
        div(class="home-content__plaque-subtitle"
          class="px-20") {{$t('NN0277')}}
      div(v-if="isLogin")
        div(class="home-content-title")
          span {{$t('NN0080')}}
          span(class="pointer home-content__more-text"
          @click="goToPage('MyDesign')") {{$t('NN0082')}}
        div(class="home-content__mydesign")
          template-list(:designList="allDesigns" type='design'
            :isLoading="isDesignsLoading")
      template(v-for="list, idx in (isLogin ? templates1 : templates2)")
        div(class="home-content-title")
          span {{list.title}}
          span(class="pointer home-content__more-text"
            @click="goToTemplateCenterTheme(list.theme)") {{$t('NN0082')}}
        div(class="home-content__template")
          template-list(:theme="list.theme" type='template')
          div(v-if="!isLogin && idx === templates2.length - 1"
            class="home-content__more")
            div(class="home-content__more-btn"
              @click="goToTemplateCenterSortBy") {{$t('NN0371')}}
      template(v-if="!isLogin")
        div(class="home-content__feature home-content__feature-f1")
          div(class="home-content__feature-text text-f1")
            i18n(path="NN0372"
              class="home-content__feature-title" tag="span")
              template(#newline)
                br
            div(class="home-content__feature-subtitle") {{$t('NN0373')}}
            div(class="home-content__feature-btn"
              @click="goToPage('SignUp')") {{$t('NN0374')}}
          img(class="home-content__feature-f1-img"
            :src="require('@/assets/img/svg/homepage/Feature 1_' + currLocale+ '.svg')")
        div(class="home-content__feature home-content__feature-f2")
          img(class="home-content__feature-f2-img"
            :src="require('@/assets/img/svg/homepage/Feature 2_' + currLocale+ '.png')")
          div(class="home-content__feature-text text-f2")
            i18n(path="NN0375"
              class="home-content__feature-title" tag="span")
              template(#newline)
                br
            i18n(path="NN0376"
              class="home-content__feature-subtitle home-content__feature-f2-subtitle" tag="span")
              template(#newline)
                br
            div(class="home-content__feature-btn"
              @click="goToTemplateCenterSortBy") {{$t('NN0377')}}
        div(class="home-content__feature home-content__feature-f3")
          div(class="home-content__feature-text text-f3")
            i18n(path="NN0378"
              class="home-content__feature-title" tag="span"
              :class="currLocale === 'us' ? 'us' : ''")
              template(#newline)
                br
            i18n(path="NN0379"
              class="home-content__feature-subtitle" tag="span")
              template(#newline)
                br
            div(class="home-content__feature-textbtn"
              @click="newDesign()") {{$t('NN0391')}}
              svg-icon(class="pl-5"
                :iconName="'right-arrow'"
                :iconColor="'blue-1'"
                :iconWidth="'25px'")
          img(class="home-content__feature-f3-img"
            :src="require('@/assets/img/svg/homepage/Feature 3_' + currLocale+ '.svg')")
        div(class="home-content__bottom")
          div(class="home-content__bottom-brand")
            img(v-for="brand in brandList"
              class="home-content__bottom-brand-img"
              :src="require('@/assets/img/svg/homepage/' + brand + '.svg')")
          div(class="home-content__bottom-text")
            div(class="home-content__bottom-title"
              :class="currLocale === 'us' ? 'us' : ''") {{$t('NN0380')}}
            i18n(path="NN0381"
              class="home-content__bottom-subtitle" tag="span")
              template(#newline)
                br
            div(class="home-content__feature-btn"
              @click="newDesign()") {{$t('NN0274')}}
      div(v-else
        class="pb-40")
      nu-footer
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
import generalUtils from '@/utils/generalUtils'

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
      isShowMobileSearchPage: false,
      themeList: [] as Itheme[],
      showSizePopup: false,
      tagString: '',
      tags: [] as string[],
      templates1: [] as { title: string; theme: string; }[],
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
        name: 'description',
        content: `${this.$t('SE0002')}`,
        vmid: 'description'
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
    },
    brandList(): string[] {
      if (this.currLocale === 'tw') {
        return ['Instagram', 'Facebook', 'Youtube', 'Line', 'Google']
      } else if (this.currLocale === 'jp') {
        return ['Instagram', 'Facebook', 'Youtube', 'Line', 'Google']
      } else if (this.currLocale === 'us') {
        return ['Instagram', 'Facebook', 'Youtube', 'Amazon', 'Google']
      } else {
        return ['Instagram', 'Facebook', 'Youtube', 'Line', 'Google']
      }
    }
  },
  async mounted() {
    if (this.isLogin) {
      designUtils.fetchDesigns(this.fetchAllDesigns)
    }

    await themeUtils.checkThemeState().then(() => {
      this.themeList = themeUtils.themes.filter(theme => {
        return theme.mainHidden === 0
      })
    })

    const templates = [
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
    ] as { title: string; theme: string; }[]

    if (this.currLocale === 'us') {
      this.templates1 = templates.filter(value => {
        return value.theme !== '7'
      })
    } else {
      this.templates1 = templates
    }

    this.templates2 = this.templates1.filter((value, idx) => {
      return idx <= 4
    })

    generalUtils.fbq('track', 'ViewContent', {
      content_type: 'Home'
    })
  },
  methods: {
    ...mapActions({
      getTagContent: 'homeTemplate/getTagContent',
      fetchAllDesigns: 'design/fetchAllDesigns'
    }
    ),
    goToPage(pageName: string, queryString = '') {
      if (pageName === 'SignUp') {
        this.$router.push({ name: pageName, query: { redirect: this.$route.path } })
      } else if (queryString) {
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
    newDesign() {
      designUtils.newDesignWithLoginRedirect()
    },
    openPopup() {
      this.showSizePopup = true
    },
    closePopup() {
      this.showSizePopup = false
    },
    showMobileSearchPage(show: boolean) {
      if (this.isMobile) {
        this.isShowMobileSearchPage = show
      }
    }
  }
})
</script>

<style lang="scss" scoped>
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
    &.top-padding {
      margin-top: 240px;
      @media screen and (max-width: 1080px) {
        margin-top: 180px;
      }
      @media screen and (max-width: 700px) {
        margin-top: 150px;
      }
      @media screen and (max-width: 500px) {
        margin-top: 80px;
      }
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
      z-index: -2;
      object-fit: cover;
      background: linear-gradient(
        90deg,
        #cce9ff 0%,
        #f5fbff 37.1%,
        #f8fcff 69.6%,
        #eaf4ff 100%
      );
      &.login_h {
        height: 420px;
      }
      &.unlogin_h {
        height: 750px;
        @media screen and (max-width: 976px) {
          height: 650px;
        }
        @media screen and (max-width: 767px) {
          height: 500px;
        }
      }
    }
    &-white {
      position: absolute;
      top: 500px;
      right: 0;
      width: 0;
      height: 0;
      border-color: white transparent;
      border-width: 0 0 250px 100vw;
      border-style: solid;
      z-index: -1;
      @media screen and (max-width: 976px) {
        top: 450px;
        border-width: 0 0 200px 100vw;
      }
      @media screen and (max-width: 767px) {
        top: 400px;
        border-width: 0 0 100px 100vw;
      }
    }
    &-region {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      color: setColor(dark-blue);
      padding-top: 100px;
    }
    &-title {
      color: setColor(nav);
      white-space: nowrap;
      padding: 0 5%;
      @include text-H2;
      @media screen and (max-width: 1440px) {
        @include text-H3;
      }
      @media screen and (max-width: 767px) {
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
      max-width: 900px;
      padding-top: 52px;
    }
  }
  &__theme,
  &__mydesign,
  &__template {
    position: relative;
    padding: 0 150px;
    @media screen and (max-width: 1440px) {
      padding: 0 75px;
    }
    @media screen and (max-width: 768px) {
      padding: 0;
    }
  }
  &__plaque {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 0;
    &-bg {
      position: absolute;
      bottom: 0;
      width: 675px;
      height: 20px;
      background: setColor(blue-3);
      z-index: -1;
      @media screen and (max-width: 1440px) {
        width: 500px;
      }
      @media screen and (max-width: 768px) {
        width: 425px;
      }
      @media screen and (max-width: 540px) {
        width: 80%;
      }
    }
    &-title {
      position: relative;
      display: flex;
      justify-content: center;
      color: setColor(gray-1);
      @include text-H3;
      @media screen and (max-width: 1440px) {
        @include text-H4;
      }
      @media screen and (max-width: 768px) {
        @include text-H5;
        max-width: 90%;
        &.us {
          width: 300px;
        }
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
  &__more {
    position: absolute;
    display: flex;
    justify-content: center;
    bottom: -25px;
    width: calc(100% - 300px);
    height: 128px;
    background: linear-gradient(0deg, #ffffff 70%, rgba(245, 238, 231, 0) 100%);
    @media screen and (max-width: 1440px) {
      width: calc(100% - 150px);
    }
    @media screen and (max-width: 768px) {
      width: 100%;
    }
    &-btn {
      width: 280px;
      @include button-LG;
      margin-top: 50px;
      @media screen and (max-width: 768px) {
        width: 250px;
      }
    }
  }
  &__more-text {
    white-space: nowrap;
    @include body-MD;
    @media screen and (max-width: 768px) {
      @include body-SM;
    }
  }
  &__feature {
    display: flex;
    align-items: center;
    justify-content: center;
    &-text {
      display: flex;
      flex-direction: column;
      text-align: left;
      &.text-f1 {
        width: 450px;
        padding-left: 150px;
        @media screen and (max-width: 1440px) {
          padding-left: 5%;
        }
      }
      &.text-f2 {
        max-width: 500px;
      }
      &.text-f3 {
        max-width: 450px;
      }
      @media screen and (max-width: 768px) {
        padding: 40px 24px 0 24px;
      }
    }
    &-f1 {
      background: #f3f6fa;
      margin-top: 24px;
      padding: 0;
      @media screen and (max-width: 768px) {
        flex-direction: column-reverse;
        align-items: flex-start;
        padding: 20px 0 75px 0;
      }
      &-img {
        width: 65%;
        max-width: 892px;
        @media screen and (max-width: 1440px) {
          width: 50%;
        }
        @media screen and (max-width: 768px) {
          margin: 0 auto;
          width: 95%;
          max-width: unset;
        }
      }
    }
    &-f2 {
      display: flex;
      flex-direction: row;
      padding: 50px 24px;
      @media screen and (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        padding: 40px 0 0 0;
      }
      &-img {
        width: 45%;
        max-width: 580px;
        padding-right: 115px;
        @media screen and (max-width: 1440px) {
          padding-right: 24px;
        }
        @media screen and (max-width: 768px) {
          padding-right: 0;
          margin: 0 auto;
          width: 95%;
          max-width: unset;
        }
      }
      &-subtitle {
        @media screen and (min-width: 768px) {
          margin-bottom: 30px;
        }
      }
    }
    &-f3 {
      display: flex;
      flex-direction: row;
      padding: 50px 24px;
      @media screen and (max-width: 768px) {
        flex-direction: column-reverse;
        align-items: flex-start;
        padding: 50px 0;
      }
      &-img {
        width: 45%;
        max-width: 660px;
        padding-left: 150px;
        @media screen and (max-width: 1440px) {
          padding-left: 5%;
        }
        @media screen and (max-width: 768px) {
          padding-left: 0;
          margin: 0 auto;
          width: 95%;
          max-width: unset;
        }
      }
      &-subtitle {
        @media screen and (min-width: 768px) {
          margin-bottom: 30px;
        }
      }
    }
    &-title {
      @include text-H2;
      @media screen and (max-width: 1440px) {
        @include text-H3;
      }
      @media screen and (max-width: 540px) {
        @include text-H5;
        &.us {
          width: 300px;
        }
      }
    }
    &-subtitle {
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
    &-textbtn {
      cursor: pointer;
      display: flex;
      flex-direction: row;
      align-items: center;
      color: setColor(blue-1);
      @include text-H5;
      padding-top: 32px;
      @media screen and (max-width: 768px) {
        padding-top: 20px;
      }
    }
  }
  &__bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #f3f6fa;
    padding: 50px 24px 65px 24px;
    @media screen and (max-width: 768px) {
      padding-bottom: 50px;
    }
    &-brand {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      justify-content: center;
      padding-bottom: 30px;
      @media screen and (max-width: 768px) {
        padding-bottom: 45px;
      }
      > img {
        padding: 15px 60px;
        @media screen and (max-width: 1200px) {
          padding-left: 40px;
          padding-right: 40px;
        }
        @media screen and (max-width: 768px) {
          padding-top: 20px;
          padding-bottom: 20px;
        }
        @media screen and (max-width: 450px) {
          padding-left: 20px;
          padding-right: 20px;
        }
        @media screen and (max-width: 430px) {
          padding-left: 15px;
          padding-right: 15px;
        }
      }
    }
    &-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    &-title {
      @include text-H2;
      @media screen and (max-width: 540px) {
        @include text-H5;
        &.us {
          width: 300px;
        }
      }
    }
    &-subtitle {
      color: setColor(gray-2);
      max-width: 900px;
      padding-top: 30px;
      padding-bottom: 10px;
      @include body-LG;
      @media screen and (max-width: 768px) {
        @include body-SM;
      }
    }
  }
}
</style>
