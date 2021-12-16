<template lang="pug">
  div(class="mobile-menu")
    div(class="nav mobile-menu__top")
        div(class="nav__option")
          btn(@click.native="goToPage('Home')"
            :type="'icon-mid-body'"
            :class="{'text-blue-1': currentPage === 'Home'}") {{$t('NN0144')}}
        div(class="nav__option")
          btn(@click.native="goToPage('TemplateCenter')"
              :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'TemplateCenter'}") {{$t('NN0145')}}
        div(class="nav__option")
          btn(@click.native="goToPage('Toturial')"
              :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'Toturial'}") {{$t('NN0146')}}
        div(class="nav__option")
          btn(@click.native="goToPage('Faq')"
              :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'Faq'}") {{$t('NN0147')}}
    div(class="nav mobile-menu__bottom")
      template(v-if="!isLogin")
        div(class="nav__option")
          btn(@click.native="goToPage('Login')"
            :type="'icon-mid-body'"
            :class="{'text-blue-1': currentPage === 'Login'}") {{$tc('NN0168', 1)}}
        div(class="nav__option")
          btn(@click.native="goToPage('SignUp')"
            :type="'icon-mid-body'"
            :class="{'text-blue-1': currentPage === 'SignUp'}") {{$tc('NN0169', 1)}}
      template(v-else)
        div(class="mobile-menu__bottom__profile")
          avatar(class="mr-10"
            :textSize="14"
            :avatarSize="35")
        div(class="nav__option"
          @click="goToPageByPath('/settings/account')")
          span {{$tc('NN0165', 1)}}
        div(class="nav__option"
          @click="goToPageByPath('/settings/security')")
          span {{$tc('NN0166', 1)}}
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
    currLocale(): string {
      return localeUtils.currLocale()
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
        if (this.currLocale === 'tw' || this.currLocale === 'us' || this.currLocale === 'jp') {
          window.location.href = 'https://www.facebook.com/vivipic' + this.currLocale
        }
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
    goToPageByPath(path: string) {
      if (this.$route.path !== path) {
        this.$router.push({ path: path })
        this.$emit('closeMenu')
      }
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
}
.nav {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  overflow: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
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
