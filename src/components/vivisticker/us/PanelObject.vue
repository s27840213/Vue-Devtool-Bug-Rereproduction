<template lang="pug">
div(class="panel-objects rwd-container")
  div(class="panel-objects__nav" :style="navStyles")
    search-bar(v-if="isShowSearchBar && !isInCategory && !isFavorites"
        class="panel-objects__searchbar"
        :placeholder="$t('NN0092', { target: $tc('NN0003', 1) })"
        clear
        :defaultKeyword="keywordLabel"
        vivisticker="dark"
        :color="{close: 'black-5', search: 'black-5'}"
        :isFavorite="keywordIsFavaorites"
        :style="{width: '100%'}"
        @search="handleSearch"
        @favorite="toggleFavoritesTag")
    template(v-else)
      div(v-if="!isFavorites" class="panel-objects__nav__icon")
        svg-icon(class="pointer"
          iconName="clock"
          iconColor="white"
          iconWidth="24px")
      tabs(v-if="!isInCategory"
          class="panel-objects__tabs"
          :tabs="[$t('NN0758'), 'GIFs', $t('NN0759')]"
          v-model="tabIndex"
          :style="{gridColumn: '2 / 3'}")
    template(v-if="!isInCategory && !isFavorites")
      div(v-if="!isShowSearchBar" class="panel-objects__nav__icon")
        svg-icon(class="pointer"
          iconName="search"
          iconColor="white"
          iconWidth="24px"
          @click="isShowSearchBar = true")
      div(v-else class="panel-objects__nav__btn")
        Nubtn(theme="secondary" size="sm" @click="handleCancel" :style="{height: '100%', backgroundColor: '#D3D3D3', borderRadius: '10px'}") {{ "Cancel" }}
  //- Favorites tabs
  div(v-if="isFavorites && !isInCategory" class="panel-objects__favorites-tabs")
    tabs(:tabs="[$t('NN0758'), 'GIFs']" theme="dark-rect"
        v-model="favoritesTabIndex")
    svg-icon(iconName="info-reverse" iconWidth="24px" iconColor="white"
            @click="doubleTapTips")
  keep-alive
    panel-object-static(v-if="isStatic || isFavoritesStatic"
      :showFav="isFavoritesStatic" ref="static")
  keep-alive
    panel-object-gifs(v-if="isGifs || isFavoritesGifs"
      :showFav="isFavoritesGifs" ref="gif")
</template>

<script lang="ts">
import SearchBar from '@/components/SearchBar.vue'
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import Nubtn from '../../global/Nubtn.vue'
import PanelObject from '../PanelObject.vue'

export default defineComponent({
  name: 'panel-object-us',
  extends: PanelObject,
  components: {
    SearchBar,
    Nubtn
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
        ...(this.isShowSearchBar && { display: 'flex', columnGap: '10px', margin: '18px 0' })
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
    handleCancel() {
      this.isShowSearchBar = false
      this.handleSearch('')
    },
    toggleFavoritesTag() {
      console.log(this.nextTagContent)

      if (this.isStatic) this.toggleFavoriteStatic({ tags: { keyword: this.keywordLabel, active: false } })
      else if (this.isGifs) this.toggleFavoriteGif({ tags: `${this.nextTagContent.keyword}:${this.nextTagContent.type}` })
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-objects {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto auto 1fr;
  &__nav {
    display: grid;
    grid-template-columns: 32px auto 32px;
    &__icon {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    &__btn {
      display: flex;
      justify-content: right;
      align-items: center;
    }
  }
  &__tabs {
    margin-top: 24px;
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
