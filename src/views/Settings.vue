<template lang="pug">
div(v-if="!isMobile" class="settings")
  nu-header(v-header-border="true")
  div(class="settings__content")
    sidebar(class="settings__sidebar" :style="sidebarStyle"
      @switch="switchView"
      :current="currentView")
    section(class="settings__view")
      settings-account(v-if="currentView === 'account'")
      settings-security(v-if="currentView === 'security'")
      settings-payment(v-if="currentView === 'payment'")
      settings-bill(v-if="currentView === 'billing'")
div(v-else class="settings-mobile" :style="settingsMobileStyle")
  div(v-if="currentView !== ''" class="settings-mobile__header")
    svg-icon(
      :iconName="'chevron-left'"
      :iconColor="'gray-2'"
      :iconWidth="'22px'"
      @click="goBack")
    div(class="caption_LG")
      span {{ headerTitle }}
  div(class="settings-mobile__content")
    template(v-if="currentView === ''")
      div(class="settings-mobile__row mb-10")
        div(class="text-H4")
          span {{$tc('NN0165', 1)}}
        div(v-if="isLogin")
          mobile-jump-btn(
              :iconName="'chevron-right'"
              @click="goToSubSettingView('account')")
            div(class="user-info")
              avatar(class="mr-10"
                :textSize="14"
                :avatarSize="56")
              div(class="user-info__text")
                div(class="caption-LG") {{ userName }}
                div(class="body-XS") {{ email }}
          hr
          mobile-jump-btn(
            :title="$t('NN0166')"
            :iconName="'chevron-right'"
            @click="goToSubSettingView('security')")
          template(v-if="!inReviewMode")
            template(v-if="isPro")
              hr
              mobile-jump-btn(
                :title="$t('NN0585')"
                :iconName="'chevron-right'"
                @click="goToSubSettingView('payment')")
              hr
              mobile-jump-btn(
                :title="$t('NN0614')"
                :iconName="'chevron-right'"
                @click="goToSubSettingView('billing')")
            template(v-else)
              hr
              div(class="body-MD my-5") {{ $t('NN0859') }}
              nubtn(size="mid-full" @click="buy") {{$t('NN0545')}}
        div(v-else)
          nubtn(v-if="!isLogin" size="mid-full"
                @click="goToPage('SignUp')") {{$tc('NN0169',2)}}
          nubtn(v-if="!isLogin" theme="text" size="mid-full"
                @click="goToPage('Login')") {{$tc('NN0168',2)}}
      div(class="settings-mobile__row my-10")
        div(class="text-H4")
          span {{$t('NN0670')}}
        url(:url="'https://blog.vivipic.com/tw/tutorial/'")
          mobile-jump-btn(
            :title="$t('NN0146')"
            :iconName="'chevron-right'")
        hr
        url(:url="'https://blog.vivipic.com/tw/faq/'")
          mobile-jump-btn(
            :title="$t('NN0147')"
            :iconName="'chevron-right'")
        hr
        url(:url="$t('NN0791')")
          mobile-jump-btn(
            :title="$t('NN0790', {type: $tc('NN0793', 1)})"
            :iconName="'chevron-right'")
      div(class="settings-mobile__row mt-10")
        div(class="text-H4")
          span {{$tc('NN0642',2)}}
        //- mobile-jump-btn(
        //-   :title="'Rate our APP(尚未翻譯)'"
        //-   :iconName="'chevron-right'")
        //- hr
        //- mobile-jump-btn(
        //-   :title="$tc('NN0642',1)"
        //-   :iconName="'chevron-right'")
        //- hr
        url(:url="$t('NN0858')")
          mobile-jump-btn(
            :title="$t('NN0160')"
            :iconName="'chevron-right'")
        hr
        url(:url="$t('NN0857')")
          mobile-jump-btn(
            :title="$t('NN0161')"
            :iconName="'chevron-right'")
        hr
        mobile-jump-btn(
          :title="$t('NN0167')"
          :iconName="'chevron-right'"
          @click="onLogoutClicked")
    settings-account(v-if="currentView === 'account'")
    settings-security(v-if="currentView === 'security'")
    settings-payment(v-if="currentView === 'payment'")
    settings-bill(v-if="currentView === 'billing'")
</template>

<script lang="ts">
import Avatar from '@/components/Avatar.vue'
import MobileJumpBtn from '@/components/editor/mobile/MobileJumpBtn.vue'
import Url from '@/components/global/Url.vue'
import NuHeader from '@/components/NuHeader.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'
import SettingsBill from '@/components/settings/SettingsBill.vue'
import SettingsPayment from '@/components/settings/SettingsPayment.vue'
import SettingsSecurity from '@/components/settings/SettingsSecurity.vue'
import Sidebar from '@/components/settings/Sidebar.vue'
import router from '@/router'
import paymentUtils from '@/utils/paymentUtils'
import picWVUtils from '@/utils/picWVUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  name: 'Settings',
  props: {
    view: {
      type: String,
      required: true
    }
  },
  components: {
    Sidebar,
    NuHeader,
    SettingsAccount,
    SettingsSecurity,
    SettingsPayment,
    SettingsBill,
    MobileJumpBtn,
    Avatar,
    Url
  },
  data() {
    return {
      currentView: 'account'
    }
  },
  watch: {
    view() {
      if (this.currentView !== this.view) {
        this.currentView = this.view
      }
    }
  },
  computed: {
    ...mapState({
      isMobile: 'isMobile',
      _homeTags: 'homeTags'
    }),
    ...mapState('payment', {
      isPro: 'isPro',
      usage: 'usage'
    }),
    ...mapGetters({
      isLogin: 'user/isLogin',
      userName: 'user/getUname',
      email: 'user/getEmail',
      userInfo: picWVUtils.appendModuleName('getUserInfo')
    }),
    inReviewMode(): boolean {
      return picWVUtils.inReviewMode
    },
    sidebarStyle(): Record<string, string> {
      return this.currentView === 'menu' ? { width: '100%', display: 'grid' } : {}
    },
    settingsMobileStyle(): {[key: string]: string} {
      return {
        paddingTop: `${this.userInfo.statusBarHeight}px`
      }
    },
    headerTitle(): string {
      switch (this.currentView) {
        case 'account':
          return this.$t('NN0162', 2) as string
        case 'security':
          return this.$t('NN0166') as string
        case 'payment':
          return (this.$t('NN0585', 2) as string).toUpperCase()
        case 'billing' :
          return (this.$t('NN0614', 2) as string).toUpperCase()
        default:
          return this.$t('NN0165', 2) as string
      }
    }
  },
  created() {
    if (!this.view && !this.isMobile) {
      router.replace({ path: 'settings/account' })
    }
    this.currentView = this.view
  },
  methods: {
    switchView(view: string) {
      this.currentView = view
    },
    goToPage(pageName = '' as string) {
      if (pageName === 'Login' || pageName === 'SignUp') {
        this.$router.push({ name: pageName, query: { redirect: this.$route.path } })
      }
    },
    goToSubSettingView (view: string) {
      this.$router.push({ path: `settings/${view}` })
    },
    goBack() {
      this.$router.back()
    },
    onLogoutClicked() {
      localStorage.setItem('token', '')
      window.location.href = '/'
    },
    buy() {
      paymentUtils.openPayment('step1')
    }
  }
})
</script>

<style lang="scss" scoped>
.settings {
  @include size(100%, 100%);
  max-height: 100%;
  &__content {
    position: relative;
    height: calc(100% - #{$header-height});
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: auto 1fr;
  }
  &__view {
    position: relative;
    overflow-y: scroll;
  }
}

.settings-mobile {
  @include size(100%, 100%);
  position: relative;
  max-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: left;

  &__header {
    position: relative;
    width: 100%;
    padding: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid setColor(gray-4);
    > svg:nth-child(1) {
      position: absolute;
      left: 8px;
    }
  }

  &__content {
    padding: 28px 24px;
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow-y: scroll;
    box-sizing: border-box;
  }

  &__row {
    >div:nth-child(1) {
      margin-bottom: 12px;
    }
  }
}

.user-info {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;

  &__text {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}

hr {
  margin: 8px 0px;
  border: none;
  border-bottom: 1px solid setColor(gray-4)
}

@include layout-mobile {
  .settings__content { grid-template-columns: auto; }
  .settings__sidebar { display: none; }
}
</style>
