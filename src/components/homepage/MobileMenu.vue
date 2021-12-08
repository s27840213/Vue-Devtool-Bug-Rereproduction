<template lang="pug">
  div(class="mobile-menu")
    div(class="nav mobile-menu__top")
        div(class="nav__option")
          btn(@click.native="goToPage('Home')"
            :type="'icon-mid-body'"
            :class="{'text-blue-1': currentPage === 'Home'}") 建立設計
        div(class="nav__option")
          btn(@click.native="goToPage('TemplateCenter')"
              :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'TemplateCenter'}") 模板中心
        div(class="nav__option")
          btn(@click.native="goToPage('Toturial')"
              :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'Toturial'}") 使用教學
        div(class="nav__option")
          btn(@click.native="goToPage('Faq')"
              :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === 'Faq'}") 常見問題
    div(class="nav mobile-menu__bottom")
      template(v-if="!isLogin")
        div(class="nav__option")
          btn(@click.native="goToPage('Login')"
            :type="'icon-mid-body'"
            :class="{'text-blue-1': currentPage === 'Login'}") 登入
        div(class="nav__option")
          btn(@click.native="goToPage('SignUp')"
            :type="'icon-mid-body'"
            :class="{'text-blue-1': currentPage === 'SignUp'}") 註冊
      template(v-else)
        div(class="mobile-menu__bottom__profile")
          avatar(class="mr-10"
            :textSize="14"
            :avatarSize="35")
        div(class="nav__option"
          @click="goToPageByPath('/settings/account')")
          span 帳號設定
        div(class="nav__option"
          @click="goToPageByPath('/settings/security')")
          span 登入與安全性
        div(class="nav__option"
          @click="onLogoutClicked()")
          span 登出
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters } from 'vuex'
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
