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
      div(class="nav__option")
        btn(@click.native="goToPage('Login')"
          :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === 'Login'}") 登入
      div(class="nav__option")
        btn(@click.native="goToPage('SignUp')"
          :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === 'SignUp'}") 註冊
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
  },
  data() {
    return {
      optionSelected: 0
    }
  },
  computed: {
    ...mapState('user', [
      'shortName', 'uname']),
    ...mapGetters('user', {
      account: 'getAccount'
    }),
    ...mapGetters({
      currPanel: 'getCurrSidebarPanelType',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      isShowPagePreview: 'page/getIsShowPagePreview'
    }),
    currentPage(): string {
      return this.$route.name || ''
    }
  },
  methods: {
    ...mapMutations({
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview'
    }),
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
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-menu {
  @include size(200px, 100%);
  background-color: setColor(gray-6);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  &__top {
    padding-top: 30%;
  }
  &__bottom {
    padding-top: 100%;
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
    width: calc(100% - 3px);
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    cursor: pointer;
  }
}
</style>
