<template lang="pug">
  div(class="settings")
    nu-header(v-header-border="true")
    div(class="settings__top")
      svg-icon(iconName="left-arrow" iconWidth="24px" iconColor="gray-1" @click.native="back()")
      span {{viewLabel}}
      svg-icon(iconWidth="24px" iconColor="gray-1" @click.native="openMobileMenu()")
    div(class="settings__content")
      sidebar(class="settings__sidebar" :style="sidebarStyle"
        @switch="switchView"
        :current="currentView")
      section(class="settings__view")
        settings-account(v-if="currentView === 'account'")
        settings-security(v-if="currentView === 'security'")
        settings-payment(v-if="currentView === 'payment'")
        settings-bill(v-if="currentView === 'billing'")
    transition(name="slide-x-right")
      div(v-if="showMobileMenu"
          class="settings-mobileMenu popup-window")
        mobile-menu(v-if="showMobileMenu" @closeMenu="closeMobileMenu()"
                    v-click-outside="closeMobileMenu")
</template>

<script lang="ts">
import Vue from 'vue'
import router from '@/router'
import vClickOutside from 'v-click-outside'
import Sidebar from '@/components/settings/Sidebar.vue'
import NuHeader from '@/components/NuHeader.vue'
import MobileMenu from '@/components/homepage/MobileMenu.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'
import SettingsSecurity from '@/components/settings/SettingsSecurity.vue'
import SettingsPayment from '@/components/settings/SettingsPayment.vue'
import SettingsBill from '@/components/settings/SettingsBill.vue'
import paymentData from '@/utils/paymentData'
import _ from 'lodash'

export default Vue.extend({
  name: 'Settings',
  props: {
    view: String
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  components: {
    Sidebar,
    NuHeader,
    MobileMenu,
    SettingsAccount,
    SettingsSecurity,
    SettingsPayment,
    SettingsBill
  },
  data() {
    return {
      currentView: 'account',
      showMobileMenu: false
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
    sidebarStyle(): Record<string, string> {
      return this.currentView === 'menu' ? { width: '100%', display: 'grid' } : {}
    },
    viewLabel(): string {
      return _.find(paymentData.viewList(true), ['name', this.view]).label
    }
  },
  created() {
    if (!this.view) {
      router.replace({ path: 'settings/account' })
    }
    this.currentView = this.view
  },
  methods: {
    switchView(view: string) {
      this.currentView = view
    },
    back() {
      if (window.history.length > 2) this.$router.back()
      else this.$router.push('/')
    },
    openMobileMenu() { this.showMobileMenu = true },
    closeMobileMenu() { this.showMobileMenu = false }
  }
})
</script>

<style lang="scss" scoped>
.settings {
  @include size(100%, 100%);
  max-height: 100%;
  &__top { display: none; }
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

.settings-mobileMenu {
  justify-content: flex-start;
  left: -24px;
  &.slide-x-right {
    &-enter-active, &-leave-active {
      transition: 0.5s;
    }
    &-enter, &-leave-to {
      opacity: 0;
    }
  }
}

@include layout-mobile {
  .nu-header { display: none; }
  .settings__top {
    @include text-H6;
    display: grid;
    grid-template-columns: 72px 1fr 72px;
    justify-items: center;
    align-items: center;
    height: 64px;
    box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1);
    svg { padding: 20px }
  }
  .settings__content { grid-template-columns: auto; }
  .settings__sidebar { display: none; }
}
</style>
