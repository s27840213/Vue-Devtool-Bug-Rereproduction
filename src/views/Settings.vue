<template lang="pug">
  div(class="settings")
    nu-header
    div(class="settings__content")
      sidebar(class="settings__sidebar"
        @switch="switchView"
        :current="currentView")
      section(class="settings__view")
        settings-account(v-if="currentView === 'account'")
        settings-security(v-if="currentView === 'security'")
</template>

<script lang="ts">
import Vue from 'vue'
import router from '@/router'
import Sidebar from '@/components/settings/Sidebar.vue'
import NuHeader from '@/components/NuHeader.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'
import SettingsSecurity from '@/components/settings/SettingsSecurity.vue'

export default Vue.extend({
  name: 'Settings',
  props: {
    view: String
  },
  components: {
    Sidebar,
    NuHeader,
    SettingsAccount,
    SettingsSecurity
  },
  data() {
    return {
      currentView: 'account',
      inputName: '',
      email: '',
      isSubscribed: true
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
    height: calc(100% - 50px);
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: auto 1fr;
    @include layout-mobile {
      grid-template-columns: auto;
    }
  }
  &__sidebar {
    @include layout-mobile {
      display: none;
    }
  }
  &__view {
    position: relative;
    overflow-y: scroll;
  }
}
</style>
