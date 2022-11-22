<template lang="pug">
div(class="settings")
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
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import router from '@/router'
import Sidebar from '@/components/settings/Sidebar.vue'
import NuHeader from '@/components/NuHeader.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'
import SettingsSecurity from '@/components/settings/SettingsSecurity.vue'
import SettingsPayment from '@/components/settings/SettingsPayment.vue'
import SettingsBill from '@/components/settings/SettingsBill.vue'

export default defineComponent({
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
    SettingsBill
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
    sidebarStyle(): Record<string, string> {
      return this.currentView === 'menu' ? { width: '100%', display: 'grid' } : {}
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

@include layout-mobile {
  .settings__content { grid-template-columns: auto; }
  .settings__sidebar { display: none; }
}
</style>
