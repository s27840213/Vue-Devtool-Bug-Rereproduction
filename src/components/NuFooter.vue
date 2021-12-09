<template lang="pug">
  div(class="nu-footer text-white")
    div(class="nu-footer__wrapper label-lg")
      svg-icon(:iconName="'logo'"
        :iconWidth="'100px'"
        style="height: 50px;")
      div(class="nu-footer__feature")
        div(class="nu-footer__feature-region")
          div(class="label-lg nu-footer__feature-title"
            @click="expandItems(0, !featureExpand[0])")
            div(class="line")
            span LEARN
            svg-icon(class="nu-footer__feature-icon"
              :iconName="featureExpand[0] ? 'minus-origin' : 'plus-origin'"
              :iconColor="'white'"
              :iconWidth="'15px'")
          div(class="nu-footer__feature-items body-1"
            :class="isMobile & featureExpand[0] ? 'expand' : ''")
            a(:href="blogPage") {{$t('NN0146')}}
            a(:href="blogPage") {{$t('NN0157')}}
        div(class="nu-footer__feature-region")
          div(class="label-lg nu-footer__feature-title"
            @click="expandItems(1, !featureExpand[1])")
            div(class="line")
            span DISCOVER
            svg-icon(class="nu-footer__feature-icon"
              :iconName="featureExpand[1] ? 'minus-origin' : 'plus-origin'"
              :iconColor="'white'"
              :iconWidth="'15px'")
          div(class="nu-footer__feature-items body-1"
            :class="isMobile & featureExpand[1] ? 'expand' : ''")
            a(:href="facebookPage") {{$t('NN0158')}}
            a(href="/templates") {{$t('NN0145')}}
        div(class="nu-footer__feature-region")
          div(class="label-lg nu-footer__feature-title"
            @click="expandItems(2, !featureExpand[2])")
            div(class="line")
            span CREATE
            svg-icon(class="nu-footer__feature-icon"
              :iconName="featureExpand[2] ? 'minus-origin' : 'plus-origin'"
              :iconColor="'white'"
              :iconWidth="'15px'")
          div(class="nu-footer__feature-items body-1"
            :class="isMobile & featureExpand[2] ? 'expand' : ''")
            div(v-for="theme in themeList"
              class="pointer"
              @click="newDesign(theme)") {{theme.title}}
        div(class="nu-footer__feature-region")
          div(class="label-lg nu-footer__feature-title"
            @click="expandItems(3, !featureExpand[3])")
            div(class="line")
            span LEGAL
            svg-icon(class="nu-footer__feature-icon"
              :iconName="featureExpand[3] ? 'minus-origin' : 'plus-origin'"
              :iconColor="'white'"
              :iconWidth="'15px'")
          div(class="nu-footer__feature-items body-1"
            :class="isMobile & featureExpand[3] ? 'expand' : ''")
            a(:href="servicePage") {{$t('NN0160')}}
            a(:href="privacyPage") {{$t('NN0161')}}
            a(:href="agreementPage") {{$t('NN0162')}}
    div(class="nu-footer__bottom")
      div(class="nu-footer__bottom-left")
        select(class="locale-select" v-model="inputLocale")
          option(v-for="locale in localeOptions" :value="locale.name") {{locale.name}}
      div(class="nu-footer__bottom-center")
        span COPYRIGHT Vivipic 2021
      div(class="nu-footer__bottom-right")
        a(:href="facebookPage")
          svg-icon(class="pointer"
            :iconName="'facebook-circle'"
            :iconWidth="'25px'")
        a(:href="igPage")
          svg-icon(class="pointer"
            :iconName="'instagram-circle'"
            :iconWidth="'25px'")
        a(:href="mailtoService")
          svg-icon(class="pointer"
            :iconName="'mail-circle'"
            :iconWidth="'25px'")
    div(class="nu-footer__bottom-mobile")
      div(class="nu-footer__bottom-mobile-icons")
        a(:href="facebookPage")
          svg-icon(class="pointer"
            :iconName="'facebook-circle'"
            :iconWidth="'25px'")
        a(:href="igPage")
          svg-icon(class="pointer ml-25"
            :iconName="'instagram-circle'"
            :iconWidth="'25px'")
        a(:href="mailtoService")
          svg-icon(class="pointer ml-25"
            :iconName="'mail-circle'"
            :iconWidth="'25px'")
      div(class="nu-footer__bottom-mobile-locale")
        select(class="locale-select" v-model="inputLocale")
          option(v-for="locale in localeOptions" :value="locale.name") {{locale.name}}
      div(class="nu-footer__bottom-mobile-copyright")
        span COPYRIGHT Vivipic 2021
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import { mapGetters } from 'vuex'
import { Itheme } from '@/interfaces/theme'
import themeUtils from '@/utils/themeUtils'
import designUtils from '@/utils/designUtils'
import localeUtils, { ILocale } from '@/utils/localeUtils'

export default Vue.extend({
  data() {
    return {
      inputLocale: '',
      localeOptions: [] as Array<ILocale>,
      blogPage: '',
      servicePage: '',
      privacyPage: '',
      agreementPage: '',
      facebookPage: '',
      igPage: '',
      mailtoService: '',
      featureExpand: [false, false, false, false] as boolean[]
    }
  },
  created() {
    this.localeOptions = localeUtils.SUPPORTED_LOCALES
    this.inputLocale = this.getLocaleText(this.currLocale) as string
    this.switchUrl(this.currLocale)
  },
  watch: {
    inputLocale() {
      if (this.getLocaleValue(this.inputLocale) !== this.$i18n.locale) {
        if (this.isLogin) {
          store.dispatch('user/updateUser', {
            token: this.token,
            locale: this.getLocaleValue(this.inputLocale)
          })
        }
        this.$i18n.locale = this.getLocaleValue(this.inputLocale) as string
        this.$router.go(0)
      }
    }
  },
  computed: {
    ...mapGetters('user', {
      token: 'getToken',
      isLogin: 'isLogin'
    }),
    isMobile(): boolean {
      return document.body.clientWidth / document.body.clientHeight < 1
    },
    themeList(): Itheme[] {
      return themeUtils.themes
    },
    currLocale(): string {
      return this.$i18n.locale
    }
  },
  methods: {
    goToPage(page: string) {
      window.location.href = page
    },
    newDesign(item: Itheme) {
      this.$router.push({ name: 'Editor' }).then(() => {
        designUtils.newDesign(item.width, item.height)
      })
    },
    expandItems(index: number, expand: boolean) {
      Vue.set(this.featureExpand, index, expand)
    },
    getLocaleText(value: string) {
      return this.localeOptions.find(x => x.code === value)?.name
    },
    getLocaleValue(text: string) {
      return this.localeOptions.find(x => x.name === text)?.code
    },
    switchUrl(locale: string) {
      switch (locale) {
        case 'us':
          this.blogPage = 'https://blog.vivipic.com/'
          this.servicePage = 'https://blog.vivipic.com/tw/tw-service-policy/'
          this.privacyPage = 'https://blog.vivipic.com/tw/tw-privacy-policy/'
          this.agreementPage = 'https://blog.vivipic.com/tw/tw-agreement/'
          this.facebookPage = 'https://www.facebook.com/vivipicus'
          this.igPage = 'https://www.instagram.com/vivipicus'
          this.mailtoService = 'mailto:tw@vivipic.com'
          break
        case 'tw':
        case 'jp':
          this.blogPage = 'https://blog.vivipic.com/' + locale
          this.servicePage = 'https://blog.vivipic.com/tw/tw-service-policy/'
          this.privacyPage = 'https://blog.vivipic.com/tw/tw-privacy-policy/'
          this.agreementPage = 'https://blog.vivipic.com/tw/tw-agreement/'
          this.facebookPage = 'https://www.facebook.com/vivipic' + locale
          this.igPage = 'https://www.instagram.com/vivipic' + locale
          this.mailtoService = 'mailto:' + locale + '@vivipic.com'
          break
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-footer {
  width: 100%;
  background: #555;
  &__wrapper {
    display: grid;
    grid-template-columns: 30% 70%;
    justify-content: center;
    padding: 100px 5vw 0 12vw;
    @include layout-mobile {
      display: flex;
      flex-direction: column;
      padding: 20px 30px;
    }
  }
  &__feature {
    display: grid;
    text-align: left;
    grid-template-columns: repeat(4, auto);
    @include layout-mobile {
      display: flex;
      flex-direction: column;
    }
    &-region {
      display: flex;
      flex-direction: column;
      @include layout-mobile {
        border-bottom: 1px solid #666b82;
        padding-top: 20px;
        padding-bottom: 10px;
      }
    }
    &-title {
      position: relative;
      display: flex;
      align-items: center;
      font-size: 16px;
      padding-left: 15px;
      @include layout-mobile {
        font-size: 14px;
      }
      .line {
        width: 100%;
        height: 70%;
        position: absolute;
        left: 0;
        border-left: 5px solid setColor(blue-1);
        @include layout-mobile {
          height: 40%;
          border-left: 3px solid setColor(blue-1);
        }
      }
    }
    &-icon {
      display: none;
      @include layout-mobile {
        display: block;
        position: absolute;
        right: 0;
      }
    }
    &-items {
      display: grid;
      grid-auto-flow: row;
      grid-template-rows: auto 1fr;
      row-gap: 10px;
      padding-left: 15px;
      padding-top: 30px;
      @include layout-mobile {
        display: none;
        row-gap: 0;
        padding-top: 5px;
        padding-bottom: 10px;
      }
      &.expand {
        display: flex;
        flex-direction: column;
      }
      > a,
      div {
        color: white;
        text-decoration: none;
        text-align: left;
        font-weight: 700;
        @include layout-mobile {
          color: setColor(gray-3);
          font-weight: 400;
          padding-top: 5px;
        }
      }
    }
  }
  &__bottom {
    display: grid;
    grid-template-columns: 30% 45% 25%;
    padding-top: 80px;
    padding-bottom: 30px;
    @include layout-mobile {
      display: none;
    }
    &-left {
      display: flex;
      justify-content: center;
    }
    &-center {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 14px;
      color: white;
    }
    &-right {
      display: grid;
      grid-auto-flow: column;
      justify-content: center;
      column-gap: 30px;
    }
  }
  &__bottom-mobile {
    display: none;
    @include layout-mobile {
      display: flex;
      flex-direction: column;
      &-icons {
        display: flex;
        align-items: center;
        padding-left: 30px;
      }
      &-locale {
        padding-top: 40px;
      }
      &-copyright {
        font-size: 12px;
        white-space: nowrap;
        transform: scale(0.8);
        padding-top: 20px;
        padding-bottom: 20px;
      }
    }
  }
}
.locale-select {
  width: 40%;
  height: 30px;
  font-size: 14px;
  color: #fff;
  border-radius: 7px;
  border: 1px #fff solid;
  background: #555;
  padding-left: 8px;
  padding-right: 5px;
}
</style>
