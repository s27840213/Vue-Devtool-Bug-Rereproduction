<template lang="pug">
div(class="panel-objects rwd-container")
  Tabs(v-if="!isInCategory"
      class="panel-objects__tabs"
      :tabs="tabs"
      v-model="tabIndex")
  //- Favorites tabs
  div(v-if="!isInEditor && isFavorites && !isInCategory"
      class="panel-objects__favorites-tabs")
    Tabs(:tabs="[$t('NN0758'), 'GIFs']" theme="dark-rect"
        v-model="favoritesTabIndex")
    svg-icon(iconName="info-reverse" iconWidth="24px" iconColor="white"
            @click="doubleTapTips")
  keep-alive
    panel-object-static(v-if="isStatic || isFavoritesStatic"
      class="panel-objects__content"
      :showFav="isFavoritesStatic" ref="static")
  keep-alive
    panel-object-gifs(v-if="isGifs || isFavoritesGifs"
      class="panel-objects__content"
      :showFav="isFavoritesGifs" ref="gif")
</template>

<script lang="ts">
import Tabs from '@/components/Tabs.vue'
import PanelObjectGifs from '@/components/vivisticker/PanelObjectGifs.vue'
import PanelObjectStatic from '@/components/vivisticker/PanelObjectStatic.vue'
import i18n from '@/i18n'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import modalUtils from '@/utils/modalUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { CCategoryList } from '../category/CategoryList.vue'

export default defineComponent({
  name: 'panel-object',
  components: {
    Tabs,
    PanelObjectStatic,
    PanelObjectGifs
  },
  data() {
    return {
      tabIndex: 0,
      favoritesTabIndex: 0
    }
  },
  created() {
    // load states of favorites tab from store
    if (this.currActiveObjectFavTab) {
      this.tabIndex = this.isInEditor ? 1 : 2
      this.favoritesTabIndex = this.isInEditor ? 0 : this.currActiveObjectFavTab === 'gifs' ? 1 : 0
    }
  },
  mounted() {
    eventUtils.on(PanelEvent.scrollPanelObjectToTop, this.scrollToTop)
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.scrollPanelObjectToTop)
  },
  watch: {
    currActiveFavTab(newVal) {
      this.setCurrActiveObjectFavTab(newVal)
    }
  },
  computed: {
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory',
      isInEditor: 'vivisticker/getIsInEditor',
      currActiveObjectFavTab: 'vivisticker/getCurrActiveObjectFavTab',
    }),
    tabs() {
      return this.isInEditor ? [this.$t('NN0758'), this.$t('NN0759')] : [this.$t('NN0758'), 'GIFs', this.$t('NN0759')]
    },
    isInCategory(): boolean {
      return this.isTabInCategory('object')
    },
    isStatic(): boolean { return this.tabIndex === 0 },
    isGifs(): boolean { return this.isInEditor ? false : this.tabIndex === 1 },
    isFavorites(): boolean { return this.isInEditor ? this.tabIndex === 1 : this.tabIndex === 2 },
    isFavoritesStatic(): boolean { return this.isFavorites && this.favoritesTabIndex === 0 },
    isFavoritesGifs(): boolean { return this.isInEditor ? false : this.isFavorites && this.favoritesTabIndex === 1 },
    currActiveFavTab(): string {
      return this.isFavoritesStatic ? 'static' : this.isFavoritesGifs ? 'gifs' : ''
    }
  },
  methods: {
    ...mapMutations({
      setCurrActiveObjectFavTab: 'vivisticker/SET_currActiveObjectFavTab'
    }),
    scrollToTop() {
      if (this.isStatic || this.isFavoritesStatic) {
        // @ts-expect-error: Call vue child component method
        (this.$refs.static as CCategoryList[]).scrollToTop()
      } else {
        // @ts-expect-error: Call vue child component method
        (this.$refs.gif as CCategoryList).scrollToTop()
      }
    },
    doubleTapTips() {
      modalUtils.setModalInfo(
        i18n.global.tc('NN0763'),
        i18n.global.tc('NN0764'),
        { msg: i18n.global.tc('NN0563') }
      )
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-objects {
  @include size(100%, 100%);
  display: grid;
  grid-template-rows: auto auto 1fr;
  overflow: hidden;
  &__tabs {
    margin-top: v-bind("isInEditor ? '0' : '24px'");
    margin-bottom: 24px;
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
  &__content {
    grid-row: 3 / 4; // Always take 1fr grid row.
  }
}
</style>
