<template lang="pug">
div(class="panel-objects")
  div(v-show="!isInCategory" class="panel-objects__nav" :style="navStyles")
    template(v-if="isShowSearchBar && !isFavorites")
      search-bar(class="panel-objects__nav__searchbar"
          :placeholder="$t('NN0092', { target: $tc('NN0003', 1) })"
          clear
          :defaultKeyword="keywordLabel"
          vivisticker="dark"
          :color="{close: 'black-5', search: 'black-5'}"
          :isFavorite="keywordIsFavaorites"
          @search="handleSearch"
          @favorite="toggleFavoritesTag")
      Nubtn(theme="secondary" size="sm" @click="handleCancel" :style="{height: 'fit-content', backgroundColor: '#D3D3D3', borderRadius: '10px', padding: '8px 8px'}") {{ "Cancel" }}
    template(v-else)
      div(v-show="!isFavorites" class="panel-objects__nav__icon")
        svg-icon(class="pointer"
          iconName="clock"
          iconColor="white"
          iconWidth="24px"
          @click="handleRecent")
      tabs(class="panel-objects__nav__tabs"
          :tabs="[$t('NN0758'), 'GIFs', $t('NN0759')]"
          v-model="tabIndex"
          :style="{marginBottom: '0px'}")
      div(v-show="!isFavorites" class="panel-objects__nav__icon")
        svg-icon(class="pointer"
          iconName="search"
          iconColor="white"
          iconWidth="24px"
          @click="showSearchBar")
  //- Favorites tabs
  div(v-if="isFavorites && !isInCategory" class="panel-objects__favorites-tabs")
    tabs(:tabs="[$t('NN0758'), 'GIFs']" theme="dark-rect"
        v-model="favoritesTabIndex")
    svg-icon(iconName="info-reverse" iconWidth="24px" iconColor="white"
            @click="doubleTapTips")
  keep-alive
    panel-object-static-us(v-if="isStatic || isFavoritesStatic"
      :showFav="isFavoritesStatic" ref="static" @search="showSearchBar")
  keep-alive
    panel-object-gifs-us(v-if="isGifs || isFavoritesGifs"
      :showFav="isFavoritesGifs" ref="gif" @search="showSearchBar")
</template>

<script lang="ts">
import SearchBar from '@/components/SearchBar.vue'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import Nubtn from '../../global/Nubtn.vue'
import PanelObject from '../PanelObject.vue'
import PanelObjectGifsUs from './PanelObjectGifs.vue'
import PanelObjectStaticUs from './PanelObjectStatic.vue'

export default defineComponent({
  name: 'panel-object-us',
  extends: PanelObject,
  components: {
    SearchBar,
    Nubtn,
    PanelObjectStaticUs,
    PanelObjectGifsUs
  },
  data() {
    return {
      isShowSearchBar: false
    }
  },
  computed: {
    ...mapState('objects', {
      keywordStatic: 'keyword'
    }),
    ...mapState('giphy', {
      nextTagContent: 'nextTagContent'
    }),
    ...mapGetters({
      checkTagFavoriteStatic: 'objects/checkTagFavorite',
      checkTagFavoriteGif: 'giphy/checkTagFavorite',
      keywordGif: 'giphy/keyword',
    }),
    keyword(): string {
      if (this.isStatic) return this.keywordStatic
      if (this.isGifs) return this.keywordGif
      return this.keywordStatic
    },
    resetSearch() {
      if (this.isStatic) return this.resetSearchStatic
      if (this.isGifs) return this.resetSearchGif
      return this.resetSearchStatic
    },
    navStyles() {
      return {
        ...(this.isShowSearchBar && { gridTemplateColumns: '1fr auto', columnGap: '10px' }),
        ...(this.isInCategory && { gridTemplateColumns: 'auto' })
      }
    },
    keywordLabel(): string {
      return this.keyword ? this.keyword.replace('tag::', '') : this.keyword
    },
    keywordIsFavaorites(): boolean|undefined {
      if (this.isStatic && this.keywordLabel !== '') return this.checkTagFavoriteStatic(this.keywordLabel)
      if (this.isGifs) return this.checkTagFavoriteGif(this.keyword)
      return undefined
    },
  },
  methods: {
    ...mapActions('objects', {
      searchTagStatic: 'getTagContent',
      resetSearchStatic: 'resetSearch',
      // favorites actions
      toggleFavoriteStatic: 'toggleFavorite',
    }),
    ...mapActions('giphy', {
      searchTagGif: 'searchTag',
      resetSearchGif: 'resetTagContent',
      // favorites actions
      toggleFavoriteGif: 'toggleFavorite',
    }),
    searchTag(keyword: string) {
      if (this.isStatic) this.searchTagStatic({ keyword })
      if (this.isGifs) this.searchTagGif(keyword)
    },
    handleSearch(keyword: string) {
      this.resetSearch({ keepSearchResult: true })
      if (keyword) {
        this.searchTag(keyword)
      }
    },
    handleRecent() {
      vivistickerUtils.setShowAllRecently('object', true)
      vivistickerUtils.setIsInCategory('object', true)
    },
    handleCancel() {
      this.isShowSearchBar = false
      this.handleSearch('')
    },
    toggleFavoritesTag() {
      if (this.isStatic) this.toggleFavoriteStatic({ tags: { keyword: this.keywordLabel, active: false } })
      else if (this.isGifs) this.toggleFavoriteGif({ tags: `${this.nextTagContent.keyword}:${this.nextTagContent.type}` })
    },
    showSearchBar() {
      if (!this.isInCategory) this.isShowSearchBar = true
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-objects {
  @include size(100%, 100%);
  @include rwd-container(16px, 16px, 16px);
  display: grid;
  grid-template-rows: auto auto 1fr;
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
  }
  &__favorites-tabs {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 14px;
    > svg {
      margin-left: 10px;
      padding: 6px;
    }
  }
}
</style>
