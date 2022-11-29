<template lang="pug">
  div(class="panel-objects")
    tabs(v-if="!isInCategory"
        class="panel-objects__tabs"
        :tabs="[$t('NN0758'), 'GIFs', $t('NN0759')]"
        :defaultTab="currActiveTabIndex"
        @switchTab="switchTab")
    //- Favorites tabs
    div(v-if="isFavorites && !isInCategory" class="panel-objects__favorites-tabs")
      tabs(:tabs="[$t('NN0758'), 'GIFs']" theme="dark-rect"
          :defaultTab="currActiveFavoritesIndex"
          @switchTab="switchFavorites")
      svg-icon(iconName="info-reverse" iconWidth="24px" iconColor="white"
              @click.native="doubleTapTips")
    keep-alive
      panel-object-static(v-if="isStatic || isFavoritesStatic" :showFav="isFavoritesStatic")
      panel-object-gifs(v-if="isGifs || isFavoritesGifs" :showFav="isFavoritesGifs")
</template>

<script lang="ts">
import Vue from 'vue'
import i18n from '@/i18n'
import { mapGetters } from 'vuex'
import Tabs from '@/components/Tabs.vue'
import PanelObjectStatic from '@/components/vivisticker/PanelObjectStatic.vue'
import PanelObjectGifs from '@/components/vivisticker/PanelObjectGifs.vue'
import modalUtils from '@/utils/modalUtils'

export default Vue.extend({
  components: {
    Tabs,
    PanelObjectStatic,
    PanelObjectGifs
  },
  data() {
    return {
      currActiveTabIndex: 0,
      currActiveFavoritesIndex: 0
    }
  },
  computed: {
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory'
    }),
    isInCategory(): boolean {
      return this.isTabInCategory('object')
    },
    isStatic(): boolean { return this.currActiveTabIndex === 0 },
    isGifs(): boolean { return this.currActiveTabIndex === 1 },
    isFavorites(): boolean { return this.currActiveTabIndex === 2 },
    isFavoritesStatic(): boolean { return this.currActiveTabIndex === 2 && this.currActiveFavoritesIndex === 0 },
    isFavoritesGifs(): boolean { return this.currActiveTabIndex === 2 && this.currActiveFavoritesIndex === 1 }
  },
  methods: {
    switchTab(tabIndex: number) {
      this.currActiveTabIndex = tabIndex
    },
    switchFavorites(tabIndex: number) {
      this.currActiveFavoritesIndex = tabIndex
    },
    doubleTapTips() {
      modalUtils.setModalInfo(
        i18n.tc('NN0763'),
        i18n.tc('NN0764'),
        { msg: i18n.tc('NN0563') }
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
  padding: 0 24px;
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
