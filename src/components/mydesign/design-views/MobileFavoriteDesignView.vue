<template lang="pug">
div(class="mobile-favorite-design-view")
  mobile-design-gallery(:noNewDesign="true"
    :noHeader="true"
    :allDesigns="allDesigns"
    :selectedNum="selectedNum"
    @loadMore="handleLoadMore")
  div(class="scroll-space")
</template>

<script lang="ts">
import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  components: {
    MobileDesignGallery
  },
  mounted() {
    designUtils.fetchDesigns(this.fetchFavoriteDesigns)
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
    handleLoadMore() {
      designUtils.fetchDesigns(this.fetchMoreFavoriteDesigns, false)
    }
  }
})
</script>

<style lang="scss" scoped>
.warning { margin-top: 16px }

.mobile-favorite-design-view {
}

.scroll-space {
  margin-bottom: 200px;
}
</style>
