<template lang="pug">
  div(class="nu-header")
    div(class="body-2")
      svg-icon(:iconName="'logo'"
        :iconWidth="'100px'" style="height: 50px;")
    div(class="body-2")
      div
        btn(@click.native="goToPage('/home')"
          style="padding: 5px;" :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === '/home'}") 建立設計
      div
        btn(@click.native="goToPage('/template')"
          style="padding: 5px;" :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === '/template'}") 模板中心
      div
        btn(@click.native="goToPage('/toturial')"
          style="padding: 5px;" :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === '/toturial'}") 使用教學
      div
        btn(@click.native="goToPage('/pricing')"
          style="padding: 5px;" :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === '/pricing'}") 價格方案
      div
        btn(@click.native="goToPage('/faq')"
          style="padding: 5px;" :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === '/faq'}") 常見問題
      div(v-if="isLogin")
        btn(@click.native="goToPage('/mydesign')"
          style="padding: 5px;" :type="'icon-mid-body'"
          :class="{'text-blue-1': currentPage === '/mydesign'}") 我的設計
    div(class="body-2")
      div(style="width: 180px;")
        search-bar(
        placeholder="搜 尋")
      div(v-if="!isLogin")
        btn(@click.native="goToPage('/login')"
        :type="'icon-mid text-blue-1'"
        class="rounded" style="padding: 5px 30px;") 登 入
      div(v-if="!isLogin")
        btn(@click.native="goToPage('/signup')"
        :type="'primary-mid'"
        class="rounded" style="padding: 5px 30px;") 註 冊
      svg-icon(v-if="isLogin"
        :iconName="`notify`"
        :iconWidth="'20px'")
      div(v-if="isLogin" class="profile text-white text-body-2")
        span {{shortName}}
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import ShortcutUtils from '@/utils/shortcutUtils'
import StepsUtils from '@/utils/stepsUtils'
import { mapState } from 'vuex'
import store from '@/store'

export default Vue.extend({
  components: {
    SearchBar
  },
  data() {
    return {
      ShortcutUtils,
      StepsUtils
    }
  },
  computed: {
    ...mapState('user', [
      'role', 'shortName']),
    currentPage(): string {
      return window.location.pathname
    },
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    isAdmin(): boolean {
      return this.role === 0
    }
  },
  methods: {
    goToPage(pageName = '' as string) {
      console.log(pageName)
      console.log(this.currentPage)
      if (pageName === this.currentPage) {
        this.$router.go(0)
      } else if (pageName === '/login' || pageName === '/signup') {
        this.$router.push({ path: pageName, query: { redirect: this.$route.path } })
      } else {
        this.$router.push({ path: pageName })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  background-color: #eaf1f6;
  border: 1px solid #e2e5e6;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: setZindex("nu-header");
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
</style>
