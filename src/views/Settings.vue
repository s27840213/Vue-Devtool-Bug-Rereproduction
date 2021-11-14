<template lang="pug">
  div(class="settings")
    nu-header
    div(class="settings__content")
      sidebar(@switch="switchView")
      section(class="settings__view")
        settings-account(v-if="currentViewIndex === 0")
</template>

<script lang="ts">
import Vue from 'vue'
import Sidebar from '@/components/settings/Sidebar.vue'
import NuHeader from '@/components/NuHeader.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'

export default Vue.extend({
  name: 'Settings',
  components: {
    Sidebar,
    NuHeader,
    SettingsAccount
  },
  data() {
    return {
      currentViewIndex: 0,
      inputName: '',
      email: '',
      isSubscribed: true
    }
  },
  computed: {
  },
  methods: {
    switchView(index: number) {
      this.currentViewIndex = index
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
  }
  &__view {
    position: relative;
  }
}
</style>
