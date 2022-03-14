<template lang="pug">
  div(class="brand-kit-tab")
    div(class="brand-kit-tab__header")
      div(v-for="tab in tabs" class="brand-kit-tab__tab-block pointer"
        :class="{selected: checkSelected(tab)}"
        @click="handleSelectTab(tab)")
        div(class="brand-kit-tab__tab-name")
          span(class="brand-kit-tab__tab-name-text") {{ $t(tabNames[tab]) }}
    div(v-if="notNullBrand" class="brand-kit-tab__content")
      component(:is="`brand-kit-tab-${selectedTab}`" @deleteItem="handleDeleteItem")
    div(v-else class="brand-kit-tab__content")
      img(:src="require('@/assets/img/png/brandkit/disconnect.png')")
</template>

<script lang="ts">
import Vue from 'vue'
import brandkitUtils from '@/utils/brandkitUtils'
import BrandKitTabLogo from '@/components/brandkit/tabs/BrandKitTabLogo.vue'
import BrandKitTabText from '@/components/brandkit/tabs/BrandKitTabText.vue'
import BrandKitTabColor from '@/components/brandkit/tabs/BrandKitTabColor.vue'
import { mapGetters, mapMutations } from 'vuex'
import { IDeletingItem } from '@/interfaces/brandkit'

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
      tabNames: brandkitUtils.getTabNames()
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      selectedTab: 'getSelectedTab'
    }),
    notNullBrand(): boolean {
      return !brandkitUtils.checkIsNullBrand(this.currentBrand)
    }
  },
  methods: {
    ...mapMutations('brandkit', {
      setSelectedTab: 'SET_selectedTab'
    }),
    checkSelected(tabKey: string) {
      return this.selectedTab === tabKey
    },
    handleSelectTab(tabKey: string) {
      this.setSelectedTab(tabKey)
    },
    handleDeleteItem(item: IDeletingItem) {
      this.$emit('deleteItem', item)
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
    &:hover { // :not(.selected)
      background-color: setColor(blue-4);
    }
    &:not(:hover).selected {
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
    &-text {
      @include text-H5;
      color: setColor(gray-3);
      transition: 0.3s ease;
    }
  }
  &__content {
    margin-top: 30px;
  }
}
</style>
