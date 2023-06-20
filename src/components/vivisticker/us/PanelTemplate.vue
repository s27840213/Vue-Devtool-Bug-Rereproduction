<template lang="pug">
div(class="panel-template rwd-container")
  div(v-show="!isInCategory && !isInGroupTemplate" class="panel-template__nav" :style="navStyles")
    template(v-if="isShowSearchBar")
      search-bar(class="panel-template__nav__searchbar" ref="searchbar"
          :placeholder="$t('NN0092', { target: $tc('NN0003', 1) })"
          clear
          :defaultKeyword="keywordLabel"
          vivisticker="dark"
          :color="{close: 'black-5', search: 'black-5'}"
          @search="handleSearch")
      div(class="panel-template__nav__btn-cancel body-SM" @click="handleCancel") {{ $t('NN0203') }}
    template(v-else)
      div(class="panel-template__nav__icon")
        svg-icon(class="pointer"
          iconName="clock"
          iconColor="white"
          iconWidth="24px"
          @click="handleRecent")
      tabs(class="panel-template__nav__tabs"
          :tabs="[$t('STK0005'), $t('STK0063')]"
          v-model="tabIndex"
          :style="{marginBottom: '0px'}")
      div(class="panel-template__nav__icon")
        svg-icon(class="pointer"
          iconName="search"
          iconColor="white"
          iconWidth="24px"
          @click="showSearchBar")
  keep-alive
    panel-template-content-us(v-if="isStory" initIgLayout="story" ref='story' @search="handleSearch")
  keep-alive
    panel-template-content-us(v-if="isPost" initIgLayout="post" ref='post' @search="handleSearch")
</template>

<script lang="ts">
import SearchBar from '@/components/SearchBar.vue'
import Tabs from '@/components/Tabs.vue'
import PanelTemplate from '@/components/vivisticker/PanelTemplate.vue'
import PanelTemplateContentUs from '@/components/vivisticker/us/PanelTemplateContent.vue'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'panel-template-us',
  extends: PanelTemplate,
  components: {
    Tabs,
    SearchBar,
    PanelTemplateContentUs
  },
  data() {
    return {
      isShowSearchBar: false
    }
  },
  deactivated() {
    if (!this.keyword) this.isShowSearchBar = false
  },
  computed: {
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory',
      isInGroupTemplate: 'vivisticker/getIsInGroupTemplate'
    }),
    igLayout () {
      return this.isStory ? 'story' : this.isPost ? 'post' : 'story'
    },
    keyword() {
      return this.$store.state.templates[this.igLayout].keyword
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    navStyles() {
      return {
        ...(this.isShowSearchBar && { gridTemplateColumns: '1fr auto', columnGap: '10px' }),
        ...(this.isInCategory && { gridTemplateColumns: 'auto' })
      }
    },
  },
  methods: {
    async getTagContent(params = {}) {
      await this.$store.dispatch(`templates/${this.igLayout}/getTagContent`, params)
    },
    resetSearch(params = {}) {
      this.$store.dispatch(`templates/${this.igLayout}/resetSearch`, params)
    },
    async handleSearch(keyword?: string) {
      this.resetSearch({ keepSearchResult: true })
      if (keyword) {
        await this.getTagContent({ keyword })
        this.isShowSearchBar = true
      }
    },
    handleCancel() {
      this.isShowSearchBar = false
      this.handleSearch('')
    },
    handleRecent() {
      vivistickerUtils.setShowAllRecently('template', true)
      vivistickerUtils.setIsInCategory('template', true)
    },
    showSearchBar() {
      if (!this.isInCategory) {
        this.isShowSearchBar = true
        this.$nextTick(() => {
          (this.$refs.searchbar as any).focus()
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-template {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  &__nav {
    height: 56px;
    display: grid;
    align-items: center;
    grid-template-columns: 32px auto 32px;
    &__tabs {
      grid-column: 2 / 3;
    }
    &__icon {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    &__searchbar {
      width: 100%;
    }
    &__btn-cancel {
      padding: 8px;
      color: setColor(gray-7)
    }
  }
}
</style>
