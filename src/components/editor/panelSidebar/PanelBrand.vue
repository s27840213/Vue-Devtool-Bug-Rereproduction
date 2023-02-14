<template lang="pug">
  div(class="panel-brand relative")
    div(v-if="isBrandsLoading" class="panel-brand__main")
      svg-icon(iconName="loading"
              iconWidth="20px"
              iconColor="white")
    div(v-else class="panel-brand__main")
      div(class="panel-brand__header relative")
        brand-selector(theme="editor")
        div(class="panel-brand__settings pointer"
          @click="handleOpenSettings")
          svg-icon(iconName="settings" iconColor="white" iconWidth="24px")
      div(class="panel-brand__tab")
        brand-kit-tab(theme="editor")
</template>

<script lang="ts">
import Vue from 'vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    BrandSelector,
    BrandKitTab
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      isBrandsLoading: 'getIsBrandsLoading'
    })
  },
  methods: {
    ...mapMutations('brandkit', {
      setSettingsOpen: 'SET_isSettingsOpen'
    }),
    handleOpenSettings() {
      this.setSettingsOpen(true)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-brand {
  margin-top: 12px;
  @include size(100%, calc(100% - 12px));
  &__header {
    width: 100%;
  }
  &__main {
    @include size(100%, 100%);
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  &__settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
  &__tab {
    @include size(100%, 100%);
  }
  &__settings-popup {
    position: absolute;
    left: calc(100% + 20px);
    top: 0;
    width: 900px;
    height: 800px;
    background-color: white;
  }
}
</style>
