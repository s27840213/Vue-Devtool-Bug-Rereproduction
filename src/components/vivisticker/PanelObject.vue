<template lang="pug">
div(class="panel-objects rwd-container")
  tabs(v-if="!isInCategory"
      class="panel-objects__tabs"
      :tabs="[$t('NN0758'), 'GIFs', $t('NN0759')]"
      v-model="tabIndex")
  //- Favorites tabs
  div(v-if="isFavorites && !isInCategory" class="panel-objects__favorites-tabs")
    tabs(:tabs="[$t('NN0758'), 'GIFs']" theme="dark-rect"
        v-model="favoritesTabIndex")
    svg-icon(iconName="info-reverse" iconWidth="24px" iconColor="white"
            @click="doubleTapTips")
  keep-alive
    panel-object-static(v-if="isStatic || isFavoritesStatic"
      :showFav="isFavoritesStatic" :itemHeight="itemHeight" ref="static")
  keep-alive
    panel-object-gifs(v-if="isGifs || isFavoritesGifs"
      :showFav="isFavoritesGifs" :itemHeight="itemHeight" ref="gif")
</template>

<script lang="ts">
import Tabs from '@/components/Tabs.vue'
import PanelObjectGifs from '@/components/vivisticker/PanelObjectGifs.vue'
import PanelObjectStatic from '@/components/vivisticker/PanelObjectStatic.vue'
import i18n from '@/i18n'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import modalUtils from '@/utils/modalUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'
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
  mounted() {
    eventUtils.on(PanelEvent.scrollPanelObjectToTop, this.scrollToTop)
  },
  beforeUnmount() {
    eventUtils.off(PanelEvent.scrollPanelObjectToTop)
  },
  computed: {
    ...mapGetters({
      isTabInCategory: 'vivisticker/getIsInCategory'
    }),
    ...mapState({
      isTablet: 'isTablet'
    }),
    isInCategory(): boolean {
      return this.isTabInCategory('object')
    },
    isStatic(): boolean { return this.tabIndex === 0 },
    isGifs(): boolean { return this.tabIndex === 1 },
    isFavorites(): boolean { return this.tabIndex === 2 },
    isFavoritesStatic(): boolean { return this.tabIndex === 2 && this.favoritesTabIndex === 0 },
    isFavoritesGifs(): boolean { return this.tabIndex === 2 && this.favoritesTabIndex === 1 },
    itemHeight(): number {
      return this.isTablet ? 120 : 80
    }
  },
  methods: {
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
