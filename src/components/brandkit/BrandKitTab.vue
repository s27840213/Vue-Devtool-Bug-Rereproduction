<template lang="pug">
div(class="brand-kit-tab" :class="`${theme}-theme`")
  div(class="brand-kit-tab__header"
    :class="`${theme}-theme`")
    div(v-for="tab in tabs"
      :key="tab"
      class="brand-kit-tab__tab-block pointer"
      :class="[{selected: checkSelected(tab)}, `${theme}-theme`]"
      @click="handleSelectTab(tab)")
      div(class="brand-kit-tab__tab-name"
        :class="`${theme}-theme`")
        span(class="brand-kit-tab__tab-name-text"
          :class="`${theme}-theme`") {{ $t(tabNames[tab]) }}
  div(v-if="notNullBrand && isThemeMobile && settingmode"
      class="brand-kit-tab__action"
      :style="marginStyles()"
      @click.stop.prevent="tabActions[selectedTab].action") {{ tabActions[selectedTab].text }}
  div(v-if="notNullBrand" class="brand-kit-tab__content" :class="`${theme}-theme`")
    component(:is="`brand-kit-tab-${selectedTab}${isThemeEditorLike ? '-sidebar' : ''}${isThemeMobile ? '-mobile' : ''}`"
              :maxheight="maxheight"
              :settingmode="settingmode"
              @deleteItem="handleDeleteItem")
  div(v-else class="brand-kit-tab__content brand-kit-tab__disconnect" :style="minHeightStyles()")
    div
      img(class="brand-kit-tab__disconnect-image"
        :class="`${theme}-theme`"
        :src="require('@/assets/img/png/brandkit/disconnect.png')")
    span(class="brand-kit-tab__disconnect-title" :class="`${theme}-theme`") {{$t('NN0456')}}
    span(class="brand-kit-tab__disconnect-description1" :class="`${theme}-theme`") {{$t('NN0457')}}
    span(class="brand-kit-tab__disconnect-description2" :class="`${theme}-theme`") {{$t('NN0458')}}
</template>

<script lang="ts">
import BrandKitTabColorMobile from '@/components/brandkit/mobile-tabs/BrandKitTabColor.vue'
import BrandKitTabColorSidebarMobile from '@/components/brandkit/mobile-tabs/BrandKitTabColorSidebar.vue'
import BrandKitTabLogoMobile from '@/components/brandkit/mobile-tabs/BrandKitTabLogo.vue'
import BrandKitTabLogoSidebarMobile from '@/components/brandkit/mobile-tabs/BrandKitTabLogoSidebar.vue'
import BrandKitTabTextMobile from '@/components/brandkit/mobile-tabs/BrandKitTabText.vue'
import BrandKitTabTextSidebarMobile from '@/components/brandkit/mobile-tabs/BrandKitTabTextSidebar.vue'
import BrandKitTabColor from '@/components/brandkit/tabs/BrandKitTabColor.vue'
import BrandKitTabColorSidebar from '@/components/brandkit/tabs/BrandKitTabColorSidebar.vue'
import BrandKitTabLogo from '@/components/brandkit/tabs/BrandKitTabLogo.vue'
import BrandKitTabLogoSidebar from '@/components/brandkit/tabs/BrandKitTabLogoSidebar.vue'
import BrandKitTabText from '@/components/brandkit/tabs/BrandKitTabText.vue'
import BrandKitTabTextSidebar from '@/components/brandkit/tabs/BrandKitTabTextSidebar.vue'
import { IDeletingItem } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  props: {
    theme: {
      type: String as PropType<'editor' | 'mobile-editor' | 'brandkit'>,
      default: 'brandkit'
    },
    maxheight: {
      default: window.innerHeight * 0.9,
      type: Number
    },
    settingmode: {
      default: false,
      type: Boolean
    }
  },
  emits: ['deleteItem'],
  components: {
    BrandKitTabLogo,
    BrandKitTabText,
    BrandKitTabColor,
    BrandKitTabLogoSidebar,
    BrandKitTabTextSidebar,
    BrandKitTabColorSidebar,
    BrandKitTabLogoMobile,
    BrandKitTabTextMobile,
    BrandKitTabColorMobile,
    BrandKitTabLogoSidebarMobile,
    BrandKitTabTextSidebarMobile,
    BrandKitTabColorSidebarMobile
  },
  data() {
    const tabs = brandkitUtils.getTabKeys()
    return {
      tabs,
      tabNames: brandkitUtils.getTabNames(this.theme),
      tabActions: {
        logo: {
          text: this.$t('NN0014'),
          action: () => { console.log('logo') },
          margin: 24
        },
        color: {
          text: this.$t('NN0404'),
          action: () => { console.log('color') },
          margin: 16
        },
        text: {
          text: this.$t('NN0712'),
          action: () => { console.log('text') },
          margin: 16
        }
      } as {[key: string]: { text: string, action: () => void, margin: number }}
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand',
      selectedTab: 'getSelectedTab'
    }),
    notNullBrand(): boolean {
      return !brandkitUtils.checkIsNullBrand(this.currentBrand)
    },
    isThemeEditorLike(): boolean {
      return this.theme.includes('editor')
    },
    isThemeMobile(): boolean {
      return this.theme.includes('mobile')
    }
  },
  methods: {
    ...mapMutations('brandkit', {
      setSelectedTab: 'SET_selectedTab'
    }),
    marginStyles() {
      return { marginBottom: `${this.tabActions[this.selectedTab as 'logo' | 'color' | 'text'].margin}px` }
    },
    minHeightStyles() {
      return this.theme === 'mobile-editor' ? { minHeight: `${this.maxheight}px` } : {}
    },
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
  @include size(100%, 100%);
  $tab-header: 54px;
  $content-margin: 20px;

  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  > div:last-child { // Tab content always take 1fr
    grid-row: 3 / 4;
  }
  // &.editor-theme {
  //   height: 100%;
  // }
  // &.mobile-editor-theme {
  //   @include size(100%, 100%);
  //   display: grid;
  //   grid-template-rows: auto minmax(0, 1fr);
  //   grid-template-columns: 1fr;
  // }
  &__header {
    display: flex;
    gap: 20px;
    height: $tab-header;
    &.editor-theme {
      justify-content: center;
    }
    &.mobile-editor-theme {
      height: 40px;
      margin-bottom: 24px;
      justify-content: space-evenly;
    }
  }
  &__tab-block {
    border-radius: 4px;
    height: fit-content;
    &:not(.mobile-editor-theme):hover {
      background-color: setColor(blue-4);
    }
    &.mobile-editor-theme {
      width: 80px;
    }
    &.brandkit-theme:not(:hover).selected {
      .brand-kit-tab__tab-name {
        border-bottom: 6px solid setColor(blue-1);
        & > span {
          color: setColor(blue-1);
        }
      }
    }
    &.editor-theme:not(:hover).selected {
      .brand-kit-tab__tab-name {
        color: white;
        border-bottom: 6px solid setColor(blue-1);
      }
    }
    &.mobile-editor-theme.selected {
      .brand-kit-tab__tab-name {
        color: white;
        border-bottom: 2px solid white;
      }
    }
  }
  &__tab-name {
    margin: 10px;
    margin-bottom: 0px;
    padding-bottom: 10px;
    color: setColor(gray-3);
    &.mobile-editor-theme {
      margin: 0;
      margin-top: 7px;
      padding: 7px;
      padding-top: 0px;
    }
    &-text {
      @include text-H5;
      transition: 0.3s ease;
      &.mobile-editor-theme {
        @include text-H6;
        transition: none;
      }
    }
  }
  &__action {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    @include text-H6;
    color: white;
    background: setColor(blue-1);
    border-radius: 5px;
  }
  &__content {
    margin-top: $content-margin;
    .brand-kit-tab-logo {
      max-height: calc(100vh - $header-height - $tab-header - $content-margin);
    }
    &.editor-theme {
      // height: calc(100% - 138px);
    }
    &.mobile-editor-theme {
      margin-top: 0;
      overflow-y: auto;
      @include no-scrollbar;
    }
  }
  &__disconnect {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    &-image {
      &.editor-theme {
        transform: scale(0.7);
      }
      &.mobile-editor-theme {
        width: 50%;
        height: auto;
      }
    }
    &-title {
      &.brandkit-theme {
        margin-top: 69px;
        @include text-H1;
        color: setColor(blue-1);
      }
      &.editor-theme {
        margin-top: 69px;
        @include text-H2;
        color: setColor(blue-1);
      }
      &.mobile-editor-theme {
        margin-top: 10px;
        @include text-H3;
        color: setColor(blue-1);
      }
    }
    &-description1 {
      &.brandkit-theme {
        margin-top: 13px;
        @include body-XL;
        color: setColor(gray-1);
      }
      &.editor-theme {
        margin-top: 23px;
        @include body-XL;
        color: setColor(gray-4);
      }
      &.mobile-editor-theme {
        margin-top: 8px;
        @include body-MD;
        color: setColor(gray-4);
      }
    }
    &-description2 {
      &.brandkit-theme {
        margin-top: 14px;
        @include text-H5;
        color: setColor(gray-2);
      }
      &.editor-theme {
        margin-top: 24px;
        @include text-H5;
        color: setColor(gray-5);
      }
      &.mobile-editor-theme {
        margin-top: 8px;
        @include text-H6;
        color: setColor(gray-5);
      }
    }
  }
}
</style>
