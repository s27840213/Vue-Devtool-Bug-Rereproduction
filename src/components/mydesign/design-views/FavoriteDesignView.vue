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
import designUtils, { DESIGN_MENU_EVENTS, IDesignMenuEvents } from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'
import DesignGallery from '@/components/mydesign/DesignGallery.vue'

export default defineComponent({
  emits: ['clearSelection', ...DESIGN_MENU_EVENTS()],
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
    handleDesignMenuAction(extraEvent: { event: IDesignMenuEvents, payload: any }) {
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
  @include hover-scrollbar();
  box-sizing: border-box;
  padding: 0 43px 0 55px; // padding-right: 55 - 12(scrollbar width)
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
