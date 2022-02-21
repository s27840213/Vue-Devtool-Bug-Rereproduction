<template lang="pug">
  div(class="brand-kit-tab")
    div(class="brand-kit-tab__header")
      div(v-for="tab in tabs" class="brand-kit-tab__tab-block pointer"
        :class="{selected: checkSelected(tab)}"
        @click="handleSelectTab(tab)")
        div(class="brand-kit-tab__tab-name")
          span(class="brand-kit-tab__tab-name-text") {{ $t(tabNames[tab]) }}
    div(class="brand-kit-tab__content")
      component(:is="`brand-kit-tab-${selectedTab}`")
</template>

<script lang="ts">
import Vue from 'vue'
import brandkitUtils from '@/utils/brandkitUtils'
import BrandKitTabLogo from '@/components/brandkit/tabs/BrandKitTabLogo.vue'
import BrandKitTabText from '@/components/brandkit/tabs/BrandKitTabText.vue'
import BrandKitTabColor from '@/components/brandkit/tabs/BrandKitTabColor.vue'

export default Vue.extend({
  components: {
    BrandKitTabLogo,
    BrandKitTabText,
    BrandKitTabColor
  },
  data() {
    const tabs = brandkitUtils.getTabKeys()
    return {
      tabs,
      tabNames: brandkitUtils.getTabNames(),
      selectedTab: tabs[0]
    }
  },
  methods: {
    checkSelected(tabKey: string) {
      return this.selectedTab === tabKey
    },
    handleSelectTab(tabKey: string) {
      this.selectedTab = tabKey
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab {
  &__header {
    display: flex;
    gap: 20px;
    height: 54px;
  }
  &__tab-block {
    border-radius: 4px;
    height: fit-content;
    &:not(.selected):hover {
      background-color: setColor(gray-6);
    }
    &.selected {
      .brand-kit-tab__tab-name {
        border-bottom: 6px solid setColor(bu);
        & > span {
          color: setColor(bu);
        }
      }
    }
  }
  &__tab-name {
    margin: 10px;
    margin-bottom: 0px;
    padding-bottom: 10px;
    transition: 0.3s ease;
    &-text {
      @include text-H5;
      color: setColor(gray-3);
      transition: 0.2s ease;
    }
  }
  &__content {
    margin-top: 30px;
  }
}
</style>
