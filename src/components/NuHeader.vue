<template lang="pug">
  div(class="nu-header")
    div(v-if="!isMobile"
      class="nu-header__container")
      div(class="body-2")
        svg-icon(class="pointer"
          :iconName="'logo'"
          :iconWidth="'100px'"
          style="height: 50px;"
          @click.native="goToPage('Home')")
      transition(name="fade" mode="out-in")
        div(v-if="!noNavigation" class="body-2" key="navigation")
          div
            btn(@click.native="goToPage('Home')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'Home'}") 建立設計
          div
            btn(@click.native="goToPage('TemplateCenter')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'TemplateCenter'}") 模板中心
          div
            btn(@click.native="goToPage('Toturial')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'Toturial'}") 使用教學
          div
            btn(@click.native="goToPage('Faq')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'Faq'}") 常見問題
          div(v-if="isLogin")
            btn(@click.native="goToPage('MyDesign')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'MyDesign'}") 我的設計
        div(v-else class="body-2" key="no-navigation")
          div
          div
          div
          div
          div
      div(class="body-2")
        div(style="width: 180px;")
          search-bar(v-if="!noSearchbar"
            class="nu-header__search"
            placeholder="搜 尋"
            @search="handleSearch")
        div(v-if="!isLogin")
          btn(@click.native="goToPage('Login')"
          :type="'icon-mid text-blue-1'"
          class="rounded" style="padding: 5px 30px;") 登 入
        div(v-if="!isLogin")
          btn(@click.native="goToPage('SignUp')"
          :type="'primary-mid'"
          class="rounded" style="padding: 5px 30px;") 註 冊
        svg-icon(v-if="isLogin"
          :iconName="`notify`"
          :iconWidth="'20px'")
        avatar(v-if="isLogin" :textSize="14" :avatarSize="35" @click.native="isAccountPopup = true")
        popup-account(v-if="isAccountPopup"
          class="nu-header__account"
          @close="() => (isAccountPopup = false)")
    div(v-else
      class="nu-header__container-mobile")
      div(class="pl-15")
        svg-icon(v-if="!isShowSearchBar"
          :iconName="'menu'"
          :iconWidth="'25px'"
          :iconColor="'gray-3'"
          @click.native="openMenu")
      div(class="flex-center")
        svg-icon(class="pointer"
          :iconName="'logo'"
          :iconWidth="'90px'"
          style="height: 45px;"
          @click.native="goToPage('Home')")
      div(v-if="noSearchbar")
      div(v-else class="pr-15 relative")
        svg-icon(v-if="!isShowSearchBar"
          :iconName="'search'"
          :iconColor="'gray-3'"
          :iconWidth="'25px'"
          @click.native="() => { isShowSearchBar = true }")
        svg-icon(v-else
          :iconName="'close'"
          :iconColor="'gray-3'"
          :iconWidth="'25px'"
          @click.native="() => { isShowSearchBar = false }")
    slot
    div(v-if="isShowMenu"
        class="nu-header__menu")
        mobile-menu(@closeMenu="() => { isShowMenu = false }"
          v-click-outside="() => { isShowMenu = false }")
    div(v-if="isShowSearchBar"
      class="nu-header__search-mobile")
      search-bar(class="search"
        placeholder="搜 尋"
        @search="handleSearch")
      div(class="pt-20 nu-header__search-mobile__title") 熱門搜尋：
      div(class="pt-10 nu-header__search-mobile__options")
        span(v-for="key in keys"
          @click="handleSearch(key)") {{key}}
</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import SearchBar from '@/components/SearchBar.vue'
import PopupAccount from '@/components/popup/PopupAccount.vue'
import Avatar from '@/components/Avatar.vue'
import MobileMenu from '@/components/homepage/MobileMenu.vue'
import StepsUtils from '@/utils/stepsUtils'
import { mapGetters, mapState } from 'vuex'
import store from '@/store'
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
    noNavigation: Boolean
  },
  data() {
    return {
      StepsUtils,
      keys: ['聖誕節', '雙十ㄧ', '電商商品圖', '公告'],
      isAccountPopup: false,
      isShowSearchBar: false,
      isShowMenu: false
    }
  },
  computed: {
    ...mapState('user', [
      'role']),
    ...mapGetters('user', [
      'getAvatar'
    ]),
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
    }
  },
  methods: {
    goToPage(pageName = '' as string, queryString = '') {
      if (pageName === this.currentPage) {
        // this.$router.go(0)
      } else if (pageName === 'Login' || pageName === 'SignUp') {
        this.$router.push({ name: pageName, query: { redirect: this.$route.path } })
        // Temporary setting ----
      } else if (pageName === 'Toturial' || pageName === 'Faq') {
        window.location.href = 'https://www.facebook.com/vivipictw'
      } else if (pageName === 'Home' || pageName === 'Pricing' || pageName === 'MyDesign') {
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
      this.isShowSearchBar = false
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
  height: 50px;
  background-color: #eaf1f6;
  border: 1px solid #e2e5e6;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: setZindex("nu-header");
  &__container {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
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
    :nth-child(1),
    :nth-child(3) {
      width: 25px;
    }
  }
  &__search {
    height: 28px;
    background-color: white;
    border-radius: 4px;
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
      justify-content: start;
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
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    background-color: #000000a1;
    z-index: 999999;
  }
}
.profile {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 35px;
  height: 35px;
  font-weight: 700;
  background: #61aac2;
  border-radius: 50%;
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
</style>
