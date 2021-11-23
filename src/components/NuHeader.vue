<template lang="pug">
  div(class="nu-header")
    div(class="nu-header__container")
      div(class="body-2")
        svg-icon(class="pointer"
          :iconName="'logo'"
          :iconWidth="'100px'"
          style="height: 50px;"
          @click.native="goToPage('/')")
      transition(name="fade" mode="out-in")
        div(v-if="!noNavigation" class="body-2" key="navigation")
          div
            btn(@click.native="goToPage('/')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === '/'}") 建立設計
          div
            btn(@click.native="goToPage('/templates')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === '/templates'}") 模板中心
          div
            btn(@click.native="goToPage('/toturial')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === '/toturial'}") 使用教學
          div
            btn(@click.native="goToPage('/faq')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === '/faq'}") 常見問題
          div(v-if="isLogin")
            btn(@click.native="goToPage('/mydesign')"
              style="padding: 5px;" :type="'icon-mid-body'"
              :class="{'text-blue-1': currentPage === '/mydesign'}") 我的設計
        div(v-else class="body-2" key="no-navigation")
          div
          div
          div
          div
          div
      div(class="body-2")
        div(style="width: 180px;")
          search-bar(v-if="!noSearchbar"
          style="height: 28px; background-color: white; border-radius: 4px;"
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
        div(v-if="isLogin"
          class="profile pointer text-white text-body-2"
          @click="isAccountPopup = true")
          span {{shortName}}
        popup-account(v-if="isAccountPopup"
          class="nu-header__account"
          @close="() => (isAccountPopup = false)")
    slot
</template>

<script lang="ts">
import Vue from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import PopupAccount from '@/components/popup/PopupAccount.vue'
import StepsUtils from '@/utils/stepsUtils'
import { mapState } from 'vuex'
import store from '@/store'

export default Vue.extend({
  components: {
    SearchBar,
    PopupAccount
  },
  props: {
    noSearchbar: Boolean,
    noNavigation: Boolean
  },
  data() {
    return {
      StepsUtils,
      isAccountPopup: false
    }
  },
  computed: {
    ...mapState('user', [
      'role', 'shortName']),
    currentPage(): string {
      return '/' + window.location.pathname.split('/')[1]
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
      if (pageName === this.currentPage) {
        // this.$router.go(0)
      } else if (pageName === '/login' || pageName === '/signup') {
        this.$router.push({ path: pageName, query: { redirect: this.$route.path } })
        // Temporary setting ----
      } else if (pageName === '/toturial' || pageName === '/faq') {
        window.location.href = 'https://www.facebook.com/vivipictw'
      } else if (pageName === '/' || pageName === '/pricing' || pageName === '/mydesign' || pageName === '/templates') {
        this.$router.push({ path: pageName })
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

  &__account {
    position: absolute;
    top: 100%;
    margin-top: 5px;
    right: 20px;
    width: 250px;
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
