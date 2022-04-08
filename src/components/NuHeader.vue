<template lang="pug">
  div(class="nu-header" :class="{'navbar-shadow': !isTop}")
    div(class="nu-header__container")
      div
        router-link(to="/"
          class="nu-header__container__link"
          style="height: 50px;")
          svg-icon(class="pointer"
            :iconName="'logo'"
            :iconWidth="'100px'"
            style="height: 50px;")
      transition(name="fade" mode="out-in")
        div(v-if="!noNavigation" class="body-2" key="navigation")
          div(class="p-5 pointer"
            :class="{'text-blue-1': currentPage === 'Home'}")
            router-link(to="/"
              class="nu-header__container__link") {{$t('NN0144')}}
          div(class="p-5 pointer"
            :class="{'text-blue-1': currentPage === 'TemplateCenter'}")
            router-link(to="/templates"
              class="nu-header__container__link") {{$t('NN0145')}}
          div(class="p-5 pointer"
            :class="{'text-blue-1': currentPage === 'Toturial'}")
            a(:href="tutorialPage"
              class="nu-header__container__link") {{$t('NN0146')}}
          div(class="p-5 pointer"
            :class="{'text-blue-1': currentPage === 'Faq'}")
            a(:href="faqPage"
              class="nu-header__container__link") {{$t('NN0147')}}
          div(v-if="isLogin"
            class="p-5 pointer"
            :class="{'text-blue-1': currentPage === 'MyDesign'}")
            router-link(to="/mydesign"
              class="nu-header__container__link") {{$t('NN0080')}}
          //- div(v-if="isLogin && isAdmin"
            class="p-5 pointer"
            :class="{'text-blue-1': currentPage === 'BrandKit'}")
            router-link(to="/brandkit"
              class="nu-header__container__link") {{$t('NN0007')}}
        div(v-else class="body-2" key="no-navigation")
          div
          div
          div
          div
          div
          div
      div(class="body-2")
        //- div(v-if="!isLogin")
        //-   search-bar(v-if="!noSearchbar"
        //-     class="nu-header__search"
        //-     :placeholder="$t('NN0037')"
        //-     @search="handleSearch")
        div(v-if="!isLogin"
          class="py-5 px-30 text-bold pointer text-blue-1"
          style="white-space: nowrap;"
          @click="goToPage('Login')") {{$tc('NN0168',2)}}
        div(v-if="!isLogin"
          class="nu-header__btn text-bold"
          @click="goToPage('SignUp')") {{$tc('NN0169',2)}}
        //- svg-icon(v-if="isLogin"
        //-   :iconName="`notify`"
        //-   :iconWidth="'20px'")
        div(v-if="isLogin")
          avatar(class="pointer"
            :textSize="14"
            :avatarSize="35"
            @click.native="isAccountPopup = true")
          popup-account(v-if="isAccountPopup"
            class="nu-header__account"
            @close="() => (isAccountPopup = false)")
    div(class="nu-header__container-mobile")
      div(class="flex-center pl-15")
        svg-icon(class="pointer"
          :iconName="'logo'"
          :iconWidth="'90px'"
          style="height: 45px;"
          @click.native="goToPage('Home')")
      div(class="pr-15")
        svg-icon(v-if="!isShowSearchPage"
          :iconName="'menu'"
          :iconWidth="'25px'"
          :iconColor="'gray-1'"
          @click.native="openMenu")
      //- div(v-if="noSearchbar")
      //- div(v-else class="pr-15 relative")
      //-   svg-icon(v-if="!isShowSearchPage"
      //-     :iconName="'search'"
      //-     :iconColor="'gray-3'"
      //-     :iconWidth="'25px'"
      //-     @click.native="() => { isShowSearchPage = true }")
      //-   svg-icon(v-else
      //-     :iconName="'close'"
      //-     :iconColor="'gray-3'"
      //-     :iconWidth="'25px'"
      //-     @click.native="closeSearchPage")
    slot
    div(v-if="isShowMenu"
        class="nu-header__menu popup-window")
        mobile-menu(@closeMenu="() => { isShowMenu = false }"
          v-click-outside="() => { isShowMenu = false }")
    div(v-if="isShowSearchPage"
      class="nu-header__search-mobile")
      search-bar(class="search"
        :placeholder="$t('NN0037')"
        @search="handleSearch")
      div(class="pt-20 nu-header__search-mobile__title") {{$t('NN0227')}}:
      div(class="pt-10 nu-header__search-mobile__options")
        span(v-for="key in keys"
          @click="handleSearch(key)") {{key}}
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import { mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import SearchBar from '@/components/SearchBar.vue'
import PopupAccount from '@/components/popup/PopupAccount.vue'
import Avatar from '@/components/Avatar.vue'
import MobileMenu from '@/components/homepage/MobileMenu.vue'
import StepsUtils from '@/utils/stepsUtils'
import localeUtils from '@/utils/localeUtils'

export default Vue.extend({
  components: {
    SearchBar,
    PopupAccount,
    MobileMenu,
    Avatar
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    noSearchbar: Boolean,
    noNavigation: Boolean,
    showSearchPage: Boolean,
    isTop: Boolean
  },
  data() {
    return {
      StepsUtils,
      keys: [] as string[],
      isAccountPopup: false,
      isShowSearchPage: false,
      isShowMenu: false
    }
  },
  mounted() {
    if (this.currLocale === 'tw') {
      this.keys = ['免運', '新品', '內容行銷', '聖誕節']
    } else if (this.currLocale === 'us') {
      this.keys = ['Free Shipping', 'New Arrivals', 'Content Marketing', 'Christmas Day']
    } else {
      this.keys = ['送料無料', '新商品', 'コンテンツマーケティング', 'クリスマス']
    }
  },
  watch: {
    showSearchPage() {
      this.isShowSearchPage = this.showSearchPage
    }
  },
  computed: {
    ...mapState('user', [
      'role', 'shortName']),
    currentPage(): string {
      return this.$route.name || ''
    },
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    isAdmin(): boolean {
      return this.role === 0
    },
    isMobile(): boolean {
      return document.body.clientWidth / document.body.clientHeight < 1
    },
    currLocale(): string {
      return localeUtils.currLocale()
    },
    tutorialPage(): string {
      if (this.currLocale === 'tw') {
        return 'https://blog.vivipic.com/tw/tutorial/'
      } else if (this.currLocale === 'us') {
        return 'https://blog.vivipic.com/us-tutorial/'
      } else {
        return 'https://www.facebook.com/vivipic' + this.currLocale
      }
    },
    faqPage(): string {
      if (this.currLocale === 'tw') {
        return 'https://blog.vivipic.com/tw/faq/'
      } else if (this.currLocale === 'us') {
        return 'https://blog.vivipic.com/us-faq/'
      } else {
        return 'https://www.facebook.com/vivipic' + this.currLocale
      }
    }
  },
  methods: {
    goToPage(pageName = '' as string, queryString = '') {
      if (pageName === this.currentPage) {
        // this.$router.go(0)
      } else if (pageName === 'Login' || pageName === 'SignUp') {
        this.$router.push({ name: pageName, query: { redirect: this.$route.path } })
      } else if (['Home', 'Pricing', 'MyDesign', 'BrandKit'].includes(pageName)) {
        this.$router.push({ name: pageName })
      } else if (pageName === 'TemplateCenter') {
        if (queryString.length > 0) {
          this.$router.push({ name: pageName, query: { q: queryString } })
        } else {
          this.$router.push({ name: pageName })
        }
      } else {
        // this.$router.push({ path: pageName })
        this.$router.push({ name: 'Home' })
      }
      // ----------------------
    },
    handleSearch(keyword: string) {
      this.isShowSearchPage = false
      if (this.currentPage === 'TemplateCenter') {
        this.$emit('search', keyword)
      }
      this.goToPage('TemplateCenter', keyword)
    },
    openMenu() {
      this.isShowMenu = true
    },
    closeSearchPage() {
      this.isShowSearchPage = false
      this.$emit('isShowSearchPage', false)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-header {
  height: $header-height;
  background-size: cover;
  // background: linear-gradient(90deg, #CCE9FF 0%, #F5FBFF 37.1%, #F8FCFF 69.6%, #EAF4FF 100%);
  background: white;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: setZindex("nu-header");
  &__btn {
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    color: setColor(white);
    background: setColor(blue-1);
    border-radius: 4px;
    padding: 5px 30px;
  }
  &__container {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    @media screen and (max-width: 768px) {
      display: none;
    }
    > div {
      &:nth-child(1) {
        display: grid;
        grid-template-columns: repeat(1, auto);
        grid-template-rows: 1fr;
        column-gap: 20px;
        justify-items: center;
        align-items: center;
        margin-left: 8vw;
      }
      &:nth-child(2) {
        display: grid;
        grid-template-columns: repeat(7, auto);
        grid-template-rows: 1fr;
        column-gap: 1.5vw;
        justify-items: center;
        align-items: center;
      }
      &:nth-child(3) {
        display: grid;
        grid-template-columns: repeat(4, auto);
        grid-template-rows: 1fr;
        column-gap: 1.25vw;
        justify-items: center;
        align-items: center;
        margin-right: 2vw;
      }
    }
    &__link {
      color: unset;
      text-decoration: unset;
    }
  }
  &__profile {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 35px;
    height: 35px;
    font-size: 16px;
    font-weight: 700;
    background: #61aac2;
    border-radius: 50%;
  }
  &__container-mobile {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    @media screen and (min-width: 769px) {
      display: none;
    }
    :nth-child(2) {
      width: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  &__search {
    width: 180px;
    height: 28px;
    background-color: white;
    border-radius: 4px;
    @media screen and (max-width: 1300px) {
      width: 120px;
    }
    @media screen and (max-width: 1000px) {
      width: 60px;
    }
  }
  &__search-mobile {
    position: absolute;
    top: 48px;
    left: -2px;
    width: 100%;
    height: calc(100vh - 48px);
    background-color: white;
    padding: 20px;
    .search {
      width: calc(100% - 40px);
      border: 1px solid setColor(gray-4);
      box-sizing: border-box;
      background-color: white;
      border-radius: 3px;
    }
    &__title {
      font-weight: normal;
      font-size: 14px;
      text-align: left;
      color: setColor(gray-2);
    }
    &__options {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      color: setColor(gray-2);
      > span {
        font-size: 14px;
        background-color: white;
        border: 1px solid #e0e0e0;
        box-sizing: border-box;
        border-radius: 100px;
        padding: 5px 10px;
        margin: 6px 5px;
      }
    }
  }
  &__account {
    position: absolute;
    top: 100%;
    margin-top: 5px;
    right: 20px;
    width: 250px;
  }
  &__menu {
    justify-content: flex-start;
  }
}
.fade {
  &-enter-active,
  &-leave-active {
    transition: 0.1s;
  }
  &-enter,
  &-leave-to {
    opacity: 0;
  }
}
.navbar-shadow {
  border-bottom: 1px solid #EEEFF4;
}
</style>
