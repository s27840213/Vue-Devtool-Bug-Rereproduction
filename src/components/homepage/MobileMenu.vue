<template lang="pug">
  div(class="mobile-menu")
    div(class="nav mobile-menu__top")
        div(class="nav__option")
          div(:class="{'text-blue-1': currentPage === 'Home'}")
            router-link(to="/"
              class="mobile-menu__link") {{$t('NN0144')}}
        div(class="nav__option")
          div(:class="{'text-blue-1': currentPage === 'TemplateCenter'}")
            router-link(to="/templates"
              class="mobile-menu__link") {{$t('NN0145')}}
        div(class="nav__option")
          a(:href="tutorialPage"
            class="mobile-menu__link") {{$t('NN0146')}}
        div(class="nav__option")
          a(:href="faqPage"
            class="mobile-menu__link") {{$t('NN0147')}}
    div(class="nav mobile-menu__bottom")
      template(v-if="!isLogin")
        div(class="nav__option")
          router-link(:to="{ path: '/login', query: { redirect: currPath }}"
            class="mobile-menu__link") {{$tc('NN0168', 1)}}
        div(class="nav__option")
          router-link(:to="{ path: '/signup', query: { redirect: currPath }}"
            class="mobile-menu__link") {{$tc('NN0169', 1)}}
      template(v-else)
        div(class="mobile-menu__bottom__profile")
          avatar(class="mr-10"
            :textSize="14"
            :avatarSize="35")
        div(class="nav__option")
          router-link(to="/settings/account"
            class="mobile-menu__link") {{$tc('NN0165', 1)}}
        div(class="nav__option")
          router-link(to="/settings/security"
            class="mobile-menu__link") {{$tc('NN0166', 1)}}
        div(class="nav__option"
          @click="onLogoutClicked()")
          span {{$tc('NN0167', 1)}}
</template>
<script lang="ts">
import Vue from 'vue'
import localeUtils from '@/utils/localeUtils'
import { mapGetters } from 'vuex'
import Avatar from '@/components/Avatar.vue'

export default Vue.extend({
  components: {
    Avatar
  },
  data() {
    return {
      optionSelected: 0
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin'
    }),
    currentPage(): string {
      return this.$route.name || ''
    },
    currPath(): string {
      return this.$route.path || '/'
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
    onLogoutClicked() {
      localStorage.setItem('token', '')
      window.location.href = '/'
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-menu {
  @include size(200px, 100%);
  position: relative;
  left: calc(100% - 200px + 24px);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  background-color: setColor(gray-6);
  &__top {
    padding-top: 10vh;
  }
  &__bottom {
    position: absolute;
    top: 68%;
    &__profile {
      display: flex;
      align-items: center;
      padding-left: 10px;
      padding-right: 10px;
      padding-bottom: 10px;
      .profile-img {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        font-weight: 700;
        background: #61aac2;
        border-radius: 50%;
      }
    }
  }
  &__link {
    color: unset;
    text-decoration: unset;
  }
}
.nav {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow: scroll;
  @include no-scrollbar;
  &__option {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    margin: 7px 0 7px 15px;
    > button {
      padding: 0;
    }
  }
}
</style>
