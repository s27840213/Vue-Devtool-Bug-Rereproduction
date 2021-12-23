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
          img(class="home-content__top-img"
            :style="`height: ${isLogin ? '250px;' : '350px;'}`")
          div(class="home-content__top-title"
            :class="isLogin ? 'login' : ''")
            i18n(path="NN0148" tag="span")
              template(#newline)
                br
          div(v-if="!isLogin"
            class="home-content__top-subtitle")
            span {{$t('NN0237')}}
            br
            span {{$t('NN0238')}}
          div(v-if="isLogin"
            class="home-content__top-btns"
            :class="currLocale === 'us' ? 'us' : ''")
            div(class="rounded home-btn"
              @click="goToPage('TemplateCenter')") {{$t('NN0149')}}
            div(class="rounded home-btn"
              @click="goToPage('MyDesign')") {{$t('NN0080')}}
          div(v-else
            class="home-content__top-btn rounded home-btn"
            :type="'primary-lg'"
            @click="newDesign()") {{$t('NN0274')}}
      div(class="home-content-title label-lg") {{$t('NN0154')}}
      div(class="home-content__theme")
        scroll-list(:list="themeList" type='theme'
          @openPopup="openPopup()")
      div(v-if="!isLogin && !isMobile"
        class="home-content__plaque")
        img(:src="require('@/assets/img/jpg/homepage/home-plaque.jpg')")
        div(class="home-content__plaque-title") {{$t('NN0276')}}
        div(class="home-content__plaque-subtitle"
          class="px-20")
          span(v-if="isMobile") {{$t('NN0237')}}
          span(v-else) {{$t('NN0277')}}
      div(v-if="!isLogin"
        class="home-content__feature"
        :class="isMobile ? 'mt-10' : ''")
        div(style="width: 100%;")
          div(class="home-content__feature-items")
            btn(v-for="item, idx in featureList" :type="'icon-mid'"
              class="home-content__feature-item"
              :class="{'selected': featureSelected === idx}"
              @click.native="featureItemClicked(idx)")
              svg-icon(:iconName="featureSelected === idx ? `${item.name}-s` : `${item.name}`"
                :iconWidth="isMobile ? '20px' : '40px'")
              div(class="home-content__feature-item-title pt-10 body-2") {{item.title}}
        div(class="home-content__feature-content")
          div(class="home-content__feature-img")
            img(:src="require(`@/assets/img/jpg/homepage/feature${featureSelected+1}.jpg`)")
          div(class="home-content__feature-text")
            div(v-if="isMobile"
              class="pb-20 home-content__feature-content-title") {{featureList[featureSelected].title}}
            div(class="pb-20") {{featureContent}}
            btn(:type="'primary-mid'" class="rounded"
              @click.native="newDesign()") {{$t('NN0274')}}
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
      featureList: [
        {
          name: '1',
          title: i18n.t('NN0326'),
          content: ''
        },
        {
          name: '2',
          title: i18n.t('NN0327'),
          content: i18n.t('NN0328')
        },
        {
          name: '3',
          title: i18n.t('NN0329'),
          content: i18n.t('NN0330')
        },
        {
          name: '4',
          title: i18n.t('NN0331'),
          content: i18n.t('NN0332')
        },
        {
          name: '5',
          title: i18n.t('NN0333'),
          content: i18n.t('NN0334')
        }
      ],
      showSizePopup: false,
      featureSelected: 0,
      tagString: '',
      tags: [] as string[],
      tagTemplateList: [],
      popularTemplateList: [],
      latestTemplateList: [],
      isTimerStop: false,
      AutoPlayTimer: 0 as number,
      CoolDownTimer: 0 as number
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
    featureContent(): string {
      return this.featureList[this.featureSelected].content as string
    },
    currLocale(): string {
      return localeUtils.currLocale()
    }
  },
  async mounted() {
    if (!this.isLogin) {
      this.AutoPlayTimer = setInterval(() => {
        if (!this.isTimerStop) {
          if (this.featureSelected === this.featureList.length - 1) {
            this.featureSelected = 0
          } else {
            this.featureSelected++
          }
        }
      }, 4000)
    }

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

    keyword = 'locale::tw;;order_by::popular'
    const popularTemplate = await this.getTagContent({ keyword, theme })
    this.popularTemplateList = popularTemplate.data.content[0].list

    keyword = 'locale::tw;;order_by::time'
    const latestTemplate = await this.getTagContent({ keyword, theme })
    this.latestTemplateList = latestTemplate.data.content[0].list
  },
  destroyed() {
    if (this.AutoPlayTimer) {
      window.clearInterval(this.AutoPlayTimer)
    }
    if (this.CoolDownTimer) {
      window.clearInterval(this.CoolDownTimer)
    }
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
    featureItemClicked(idx: number) {
      this.isTimerStop = true
      this.featureSelected = idx
      window.clearInterval(this.CoolDownTimer) // use the latest cool down time
      this.CoolDownTimer = setTimeout(() => {
        this.isTimerStop = false
      }, 10000)
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
    @include layout-mobile {
      width: 100%;
      height: 150px;
    }
    &-img {
      width: 100%;
      background-size: cover;
      background-image: url("~@/assets/img/jpg/homepage/home-top.jpg");
      @include layout-mobile {
        background-image: url("~@/assets/img/jpg/homepage/home-top-mobile.jpg");
      }
    }
    &-title {
      display: flex;
      align-items: center;
      height: 100px;
      position: absolute;
      top: 55px;
      color: setColor(dark-blue);
      font-size: 40px;
      font-weight: 700;
      line-height: 1.3;
      &.login {
        top: 40px;
      }
      @media screen and (max-width: 990px) {
        font-size: 32px;
      }
      @include layout-mobile {
        align-items: flex-start;
        top: 30px;
        font-size: 16px;
      }
    }
    &-subtitle {
      position: absolute;
      top: 160px;
      font-size: 20px;
      line-height: 2;
      @media screen and (max-width: 990px) {
        font-size: 16px;
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
      position: absolute;
      top: 260px;
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
  &__feature {
    padding: 0 10%;
  }
  &__plaque {
    display: flex;
    justify-content: center;
    position: relative;
    padding: 50px 0;
    > img {
      width: 100%;
      height: 150px;
    }
    &-title {
      position: absolute;
      top: 95px;
      font-size: 20px;
      font-weight: 700;
      line-height: 1.3;
      color: setColor(white);
    }
    &-subtitle {
      position: absolute;
      top: 135px;
      font-size: 16px;
      color: setColor(white);
    }
  }
  &__feature {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    &-items {
      display: flex;
      justify-content: center;
      scroll-behavior: smooth;
      overflow-x: scroll;
      overflow-y: hidden;
      text-align: left;
      padding-bottom: 50px;
      @include layout-mobile {
        justify-content: space-between;
        padding-bottom: 30px;
      }
      &::-webkit-scrollbar {
        display: none;
      }
    }
    &-item {
      cursor: pointer;
      width: 180px;
      height: 125px;
      border: 1px solid #f4f4f5;
      border-radius: 8px;
      padding: 10px !important;
      margin-right: 50px;
      @include layout-mobile {
        width: 12vw;
        height: unset;
        margin-right: 0;
      }
      &:hover {
        background: setColor("gray-5");
      }
      &-title {
        font-size: 14px;
        padding-top: 10px;
        @include layout-mobile {
          display: none;
        }
      }
    }
    &-content {
      display: flex;
      flex-direction: row;
      justify-content: center;
      width: 100%;
      @include layout-mobile {
        flex-direction: column;
      }
      &-title {
        color: setColor(dark-blue-2);
        text-align: center;
        font-weight: 600;
        font-size: 18px;
        line-height: 28px;
      }
    }
    &-img {
      width: 500px;
      @include layout-mobile {
        width: 100%;
      }
      > img {
        width: 100%;
        filter: drop-shadow(0px 3px 15px rgba(0, 0, 0, 0.25));
        border-radius: 8px;
      }
    }
    &-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 30%;
      text-align: left;
      font-size: 18px;
      line-height: 40px;
      font-weight: 400;
      color: setColor(gray-2);
      padding-left: 5vw;
      @media screen and (max-width: 1260px) {
        width: 45%;
      }
      @media screen and (max-width: 990px) {
        width: 60%;
      }
      @include layout-mobile {
        width: unset;
        text-align: center;
        font-size: 14px;
        line-height: 20px;
        padding: 20px 10px;
      }
      > button {
        width: 200px;
        height: 45px;
        font-size: 20px;
        padding: 5px 10px;
        @include layout-mobile {
          width: 50%;
          padding: 0;
          margin: 0 25%;
        }
      }
    }
    .selected {
      background: #09467e;
      color: white;
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
</style>
