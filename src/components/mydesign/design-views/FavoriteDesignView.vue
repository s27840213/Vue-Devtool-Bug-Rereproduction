<template lang="pug">
  div(class="favorite-design-view")
    div(class="favorite-design-view__folder-name")  {{$t('NN0188')}}
    div(class="horizontal-rule")
    design-gallery(:noHeader="true"
                  :menuItems="menuItems"
                  :allDesigns="allDesigns"
                  :selectedNum="selectedNum"
                  @menuAction="handleDesignMenuAction"
                  @loadMore="handleLoadMore")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'
import DesignGallery from '@/components/mydesign/DesignGallery.vue'

export default Vue.extend({
  components: {
    DesignGallery
  },
  mounted() {
    designUtils.fetchDesigns(this.fetchFavoriteDesigns)
  },
  data() {
    return {
      menuItems: designUtils.makeFavoriteMenuItems()
    }
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      selectedDesigns: 'getSelectedDesigns',
      allDesigns: 'getAllDesigns'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    }
  },
  methods: {
    ...mapActions('design', {
      fetchFavoriteDesigns: 'fetchFavoriteDesigns',
      fetchMoreFavoriteDesigns: 'fetchMoreFavoriteDesigns'
    }),
    handleDesignMenuAction(extraEvent: { event: string, payload: any }) {
      const { event, payload } = extraEvent
      this.$emit(event, payload)
    },
    handleLoadMore() {
      designUtils.fetchDesigns(this.fetchMoreFavoriteDesigns, false)
    }
  }
})
</script>

<style lang="scss" scoped>
.favorite-design-view {
  @include hide-scrollbar-white($padding-right: 65px);
  box-sizing: border-box;
  padding: 0 65px 0 55px;
  text-align: left;
  &__folder-name {
    margin-top: 94px;
    font-size: 24px;
    font-weight: 700;
    line-height: 40px;
    color: setColor(bu);
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  margin-top: 21px;
  margin-bottom: 58px;
}
</style>
