<template lang="pug">
div(class="nu-header" :style="rootStyles")
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
        template(v-for="l1 in navItems" :key="l1.name")
          div(v-if="!l1.hidden" class="nu-header__container-link"
              :class="{'text-blue-1': currentPage === l1.name}")
            url(:url="l1.url") {{l1.label}}
            svg-icon(v-if="l1.content" iconName="chevron-down"
                    iconColor="gray-1" iconWidth="16px")
            div(v-if="l1.singleLayer" class="nu-header__container-link__single-layer")
              url(v-for="l2 in l1.content" :key="l2.label" :url="l2.url") {{l2.label}}
            div(v-else-if="l1.content" class="nu-header__container-link__more")
              div(v-for="l2 in l1.content" :key="l2.label" class="nu-header__container-link__more-col")
                url(:url="l2.url") {{l2.label}}
                url(v-for="l3 in l2.content" :key="l3.label" :url="l3.url" :newTab="l3.newTab") {{l3.label}}
      div(v-else class="body-2" key="no-navigation")
    div(class="body-2")
      search-bar(v-if="!noSearchbar"
        class="nu-header__search"
        :placeholder="$t('NN0037')"
        :color="{ search: 'gray-1', close: 'gray-1' }"
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
          @click="isAccountPopup = true")
        popup-account(v-if="isAccountPopup"
          class="nu-header__account"
          @close="() => (isAccountPopup = false)")
  div(class="nu-header__container-mobile")
    div(class="flex-center")
      svg-icon(class="pointer"
        :iconName="'logo'"
        :iconWidth="'143px'"
        style="height: 45px;"
        @click="goToPage('Home')")
    div(style="height: 25px")
      template(v-if="!noSearchbar")
        svg-icon(v-if="!isShowSearchPage"
          :iconName="'search'"
          :iconColor="'gray-3'"
          :iconWidth="'25px'"
          @click="() => { isShowSearchPage = true }")
        svg-icon(v-else
          :iconName="'close'"
          :iconColor="'gray-3'"
          :iconWidth="'25px'"
          @click="closeSearchPage")
      svg-icon(v-if="!isShowSearchPage"
        :iconName="'menu'"
        :iconWidth="'25px'"
        :iconColor="'gray-1'"
        @click="openMenu")
  slot
  transition(name="slide-x-right")
    div(v-if="isShowMenu"
        class="nu-header__menu popup-window")
      mobile-menu(@closeMenu="() => { isShowMenu = false }"
        v-click-outside="() => { isShowMenu = false }")
  div(v-if="isShowSearchPage"
    class="nu-header__search-mobile")
    search-bar(class="search"
      :placeholder="$t('NN0092', {target: $t('NN0145')})"
      @search="handleSearch")
    //- div(class="pt-20 nu-header__search-mobile__title") {{$t('NN0227')}}:
    //- div(class="pt-10 nu-header__search-mobile__options")
    //-   span(v-for="key in keys"
    //-     @click="handleSearch(key)") {{key}}
</template>

<script lang="ts">
import Avatar from '@/components/Avatar.vue'
import Url from '@/components/global/Url.vue'
import MobileMenu from '@/components/homepage/MobileMenu.vue'
import PopupAccount from '@/components/popup/PopupAccount.vue'
import SearchBar from '@/components/SearchBar.vue'
import store from '@/store'
import constantData, { IHeaderL1 } from '@/utils/constantData'
import webViewUtils from '@/utils/picWVUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
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
    noSearchbar: {
      type: Boolean
    },
    noNavigation: {
      type: Boolean
    }
  },
  emits: ['search'],
  data() {
    return {
      isAccountPopup: false,
      isShowMenu: false,
      isShowSearchPage: false
    }
  },
  computed: {
    ...mapGetters({
      userInfo: webViewUtils.appendModuleName('getUserInfo')
    }),
    navItems(): IHeaderL1[] {
      return constantData.headerItems()
    },
    currentPage(): string {
      return String(this.$router.currentRoute.value.name) || ''
    },
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    rootStyles(): {[key: string]: string} {
      return {
        paddingTop: `${this.userInfo.statusBarHeight}px`
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
        this.$router.push({ name: 'Home' })
      }
      // ----------------------
    },
    handleSearch(keyword: string) {
      if (!keyword) return
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
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-header {
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
    height: $header-height;
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
    box-sizing: border-box;
    padding: 16px 24px;
    width: 100%;
    height: $header-height;
    svg + svg {
      margin-left: 20px;
    }
    @media screen and (min-width: 769px) {
      display: none;
    }
  }
  &__search {
    width: 180px;
    height: 28px;
    background-color: setColor(gray-6);
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
  cursor: pointer;
  a {
    color: unset;
    text-decoration: unset;
  }
  &:hover > a,
  &:hover > span,
  &:hover > svg,
  a:hover {
    color: setColor(blue-hover);
  }
  &:hover > &__more, &:hover > &__single-layer {
    visibility: visible;
  }
}

.nu-header__container-link__single-layer {
  visibility: hidden;
  display: grid;
  grid-auto-flow: row;
  gap: 30px;
  position: absolute;
  top: 100%;
  transform: translateX(-15px);
  width: 200px;
  padding: 30px 15px;
  background-color: setColor(white);
  box-shadow: 0px 10px 25px 0px rgba(0, 0, 0, 0.1);
  cursor: default;
  text-align: left;
}

.nu-header__container-link__more {
  visibility: hidden;
  display: grid;
  grid-auto-flow: column;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  width: 750px;
  padding: 30px;
  margin: 0 auto;
  background-color: setColor(white);
  box-shadow: 0px 10px 25px 0px rgba(0, 0, 0, 0.1);
  cursor: default;
  &-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    > span:first-child,
    > a:first-child {
      @include caption-LG;
      &::before {
        content: "";
        width: 6px;
        height: 6px;
        margin: 0px 10px 0px 0px;
        display: inline-block;
        vertical-align: middle;
        background-color: setColor(blue-1);
      }
    }
    > span + a,
    > a + a {
      @include body-SM;
      color: setColor(gray-2);
      margin: 10px 0 0 16px;
    }
  }
}

.nu-header__search-mobile {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: calc(100vh - #{$header-height});
  background-color: white;
  padding: 20px;
  .search {
    border: 1px solid setColor(gray-4);
    background-color: white;
  }
  // &__title {
  //   font-weight: normal;
  //   font-size: 14px;
  //   text-align: left;
  //   color: setColor(gray-2);
  // }
  // &__options {
  //   display: flex;
  //   flex-wrap: wrap;
  //   justify-content: flex-start;
  //   color: setColor(gray-2);
  //   > span {
  //     font-size: 14px;
  //     background-color: white;
  //     border: 1px solid #e0e0e0;
  //     box-sizing: border-box;
  //     border-radius: 100px;
  //     padding: 5px 10px;
  //     margin: 6px 5px;
  //   }
  // }
}

.fade {
  &-enter-active,
  &-leave-active {
    transition: 0.1s;
  }
  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
.slide-x-right {
  &-enter-active,
  &-leave-active {
    transition: 0.5s;
  }
  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
.navbar-shadow {
  border-bottom: 1px solid #eeeff4;
}
</style>
