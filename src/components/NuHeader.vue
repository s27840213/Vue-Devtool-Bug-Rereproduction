<template lang="pug">
  div(class="nu-header")
    div(class="nu-header__container")
      div
        router-link(to="/"
          class="nu-header__container-link"
          style="height: 50px;")
          svg-icon(class="pointer"
            :iconName="'logo'"
            :iconWidth="'100px'"
            style="height: 50px;")
      transition(name="fade" mode="out-in")
        div(v-if="!noNavigation" class="body-2 full-height" key="navigation")
          template(v-for="item in navItems")
            div(v-if="!item.hidden" class="nu-header__container-link"
                :class="{'text-blue-1': currentPage === item.name}")
              url(:url="item.url") {{item.label}}
              svg-icon(v-if="item.content" iconName="chevron-down"
                      iconColor="gray-1" iconWidth="16px")
              div(v-if="item.content" class="nu-header__container-link-more")
                div(v-for="it in item.content" class="nu-header__container-link-more-col")
                  url(:url="it.url") {{it.label}}
                  url(v-for="i in it.content" :url="i.url") {{i.label}}
        div(v-else class="body-2" key="no-navigation")
      div(class="body-2")
        search-bar(v-if="!noSearchbar"
          class="nu-header__search"
          :placeholder="$t('NN0037')"
          @search="handleSearch")
        div(v-if="!isLogin"
          class="nu-header__btn-login py-5 px-30 text-bold pointer text-blue-1"
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
        svg-icon(:iconName="'menu'"
          :iconWidth="'25px'"
          :iconColor="'gray-1'"
          @click.native="openMenu")
    slot
    transition(name="slide-x-right")
      div(v-if="isShowMenu"
          class="nu-header__menu popup-window")
        //- todo check if @search need
        mobile-menu(@closeMenu="() => { isShowMenu = false }"
          v-click-outside="() => { isShowMenu = false }"
          @search="handleSearch")
</template>

<script lang="ts">
import Vue from 'vue'
import store from '@/store'
import vClickOutside from 'v-click-outside'
import SearchBar from '@/components/SearchBar.vue'
import PopupAccount from '@/components/popup/PopupAccount.vue'
import Avatar from '@/components/Avatar.vue'
import MobileMenu from '@/components/homepage/MobileMenu.vue'
import Url from '@/components/global/Url.vue'
import constantData from '@/utils/constantData'

export default Vue.extend({
  components: {
    SearchBar,
    PopupAccount,
    MobileMenu,
    Avatar,
    Url
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    noSearchbar: Boolean,
    noNavigation: Boolean
  },
  data() {
    return {
      // navItems: constantData.headerItems(), // todelete
      isAccountPopup: false,
      isShowMenu: false
    }
  },
  computed: {
    navItems(): any {
      return constantData.headerItems()
    },
    currentPage(): string {
      return this.$route.name || ''
    },
    isLogin(): boolean {
      return store.getters['user/isLogin']
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
      if (this.currentPage === 'TemplateCenter') {
        this.$emit('search', keyword)
      }
      this.goToPage('TemplateCenter', keyword)
    },
    openMenu() {
      this.isShowMenu = true
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
    &-login:hover {
      color: setColor(blue-hover);
    }
    &:hover {
      background-color: setColor(blue-hover);
    }
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
    background-color: setColor(gray-6);;
    border-radius: 4px;
    @media screen and (max-width: 1300px) {
      width: 120px;
    }
    @media screen and (max-width: 1000px) {
      width: 60px;
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
    left: -24px;
  }
}

.nu-header__container-link {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 5px;
  a {
    color: unset;
    text-decoration: unset;
  }
  &:hover > a, &:hover > span, &:hover > svg, a:hover {
    color: setColor(blue-hover)
  }
  &:hover > &-more {
    visibility: visible;
  }
}

.nu-header__container-link-more {
  visibility: hidden;
  display: grid;
  grid-auto-flow: column;
  position: absolute;
  top: 100%;
  left: 0; right: 0;
  width: 750px;
  padding: 35px 30px 30px 30px; // ask all 30px
  margin: 0 auto;
  background-color: setColor(white);
  box-shadow: 0px 10px 25px 0px rgba(0, 0, 0, 0.1);
  &-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    > span:first-child, > a:first-child {
      @include caption-LG;
      &::before {
        content: '';
        width: 6px; height: 6px;
        margin: 0px 10px 0px 0px;
        display: inline-block;
        vertical-align: middle;
        background-color: setColor(blue-1);
      }
    }
    > span + a, > a + a {
      @include body-SM;
      color: setColor(gray-2);;
      margin: 10px 0 0 16px;
    }
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
.slide-x-right {
  &-enter-active, &-leave-active {
    transition: 0.5s;
  }
  &-enter, &-leave-to {
    opacity: 0;
  }
}
.navbar-shadow {
  border-bottom: 1px solid #EEEFF4;
}
</style>
