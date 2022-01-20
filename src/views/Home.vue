<template lang="pug">
  div(class="home")
    nu-header
    div(class="home-content")
      template(v-if="isMobile")
        div(class="home-content__top")
          img(class="home-content__top-img"
            style="height: 150px;")
          div(class="home-content__top-title")
            i18n(path="NN0148" tag="span")
              template(#newline)
                br
          div(class="home-content__top-mobile-subtitle")
            div
              i18n(path="NN0235" tag="span")
                template(#newline)
                  br
            div(class="pt-30") *{{$t('NN0236')}}
      template(v-else)
        div(class="home-content__top")
          img(class="home-content__top-bg"
            :style="`height: ${isLogin ? '800px;' : '800px;'}`"
            :src="require('@/assets/img/svg/homepage/top-bg.svg')")
          div(class="test")
          div(class="home-content__top-region"
            :class="isLogin ? 'login' : ''")
            i18n(path="NN0148" tag="span"
              class="home-content__top-title")
              template(#newline)
                br
            div(v-if="!isLogin"
              class="home-content__top-subtitle")
              span {{$t('NN0237')}}
            div(v-if="isLogin"
              class="home-content__top-btns"
              :class="currLocale === 'us' ? 'us' : ''")
              div(class="rounded home-btn"
                @click="goToPage('TemplateCenter')") {{$t('NN0149')}}
              div(class="rounded home-btn"
                @click="goToPage('MyDesign')") {{$t('NN0080')}}
            template(v-else)
              div(class="home-content__top-btn"
                :type="'primary-lg'"
                @click="newDesign()") {{$t('NN0274')}}
              img(class="home-content__top-img"
                :src="require('@/assets/img/svg/homepage/header_img_us.png')")
      div(class="mt-100 home-content-title label-lg") {{$t('NN0154')}}
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
          scroll-list(:list="allDesigns" type='design'
            :isLoading="isDesignsLoading")
      div(class="home-content-title label-lg")
        div
          span(v-for="tag in tags"
            class="pointer mr-10"
            @click="newDesign(tag)") {{'#' + tag}}
        span(class="pointer body-1 more"
          @click="goToTemplateCenterSearch(tagString.replaceAll(',', ' '))") {{$t('NN0082')}}
      div(class="home-content__template")
        scroll-list(:list="tagTemplateList" type='template'
          :isLoading="tagTemplateList.length === 0")
      div(class="home-content-title label-lg")
        span {{$t('NN0278')}}
        span(class="pointer body-1"
          @click="goToTemplateCenterSortBy('popular')") {{$t('NN0082')}}
      div(class="home-content__template")
        scroll-list(:list="popularTemplateList" type='template'
          :isLoading="popularTemplateList.length === 0")
      div(class="home-content-title label-lg")
        span {{$t('NN0279')}}
        span(class="pointer body-1"
          @click="goToTemplateCenterSortBy('recent')") {{$t('NN0082')}}
      div(class="home-content__template")
        scroll-list(:list="latestTemplateList" type='template'
          :isLoading="latestTemplateList.length === 0")
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
import NuFooter from '@/components/NuFooter.vue'
import ScrollList from '@/components/homepage/ScrollList.vue'
import PopupSize from '@/components/popup/PopupSize.vue'
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'
import themeUtils from '@/utils/themeUtils'
import localeUtils from '@/utils/localeUtils'

export default Vue.extend({
  name: 'Home',
  components: {
    NuHeader,
    NuFooter,
    ScrollList,
    PopupSize
  },
  data() {
    return {
      themeList: [] as Itheme[],
      showSizePopup: false,
      tagString: '',
      tags: [] as string[],
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
    const squareTheme = [] as number[]
    this.themeList.forEach((theme: Itheme) => {
      if (theme.width / theme.height === 1) {
        squareTheme.push(theme.id)
      }
    })
    const theme = squareTheme.join(',')

    if (this.currLocale === 'tw') {
      this.tagString = '免運,新品,內容行銷,聖誕節'
    } else if (this.currLocale === 'us') {
      this.tagString = 'Free Shipping,New Arrivals,Content Marketing,Christmas Day'
    } else {
      this.tagString = '送料無料,新商品,コンテンツマーケティング,クリスマス'
    }
    let keyword = this.tagString.replace(/,/gi, ' ')
    this.tags = this.tagString.split(',')
    const tagTemplate = await this.getTagContent({ keyword, theme })
    this.tagTemplateList = tagTemplate.data.content[0].list

    keyword = 'group::0;;order_by::popular'
    const popularTemplate = await this.getTagContent({ keyword, theme })
    this.popularTemplateList = popularTemplate.data.content[0].list

    keyword = 'group::0;;order_by::time'
    const latestTemplate = await this.getTagContent({ keyword, theme })
    this.latestTemplateList = latestTemplate.data.content[0].list
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
    padding: 40px 10vw 20px 10vw;
    @include layout-mobile {
      font-size: 18px;
      padding: 25px 5vw 20px 5vw;
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
      // background-size: contain;
      // background-image: url("~@/assets/img/svg/homepage/top-bg.svg");
      @include layout-mobile {
        // background-image: url("~@/assets/img/svg/homepage/top-bg.svg");
      }
    }
    &-region {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: absolute;
      top: 100px;
      color: setColor(dark-blue);
      &.login {
        top: 40px;
      }
    }
    &-title {
      color: setColor(nav);
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
        max-width: 90%;
      }
    }
    &-mobile-subtitle {
      position: absolute;
      font-size: 12px;
      color: setColor(gray-2);
      top: 75px;
      transform: scale(0.9);
    }
    &-btns {
      position: absolute;
      top: 140px;
      display: flex;
      justify-content: space-evenly;
      width: 500px;
      &.us {
        top: 160px;
      }
    }
    &-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 240px;
      height: 56px;
      margin-top: 20px;
      @include button-LG;
      @media screen and (max-width: 1440px) {
        width: 200px;
      }
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
    padding: 0 10%;
    @include layout-mobile {
      padding: 0 5%;
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
}
.home-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 200px;
  height: 40px;
  font-size: 20px;
  font-weight: 700;
  color: setColor(white);
  background: setColor(blue-1);
  @media screen and (max-width: 990px) {
    width: 160px;
    height: 35px;
    font-size: 16px;
  }
}

.test{
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  border-color: white transparent;
  border-width: 0 0 20vh 100vw;
  border-style: solid;
}
</style>
