<template lang="pug">
mobile-design-empty(v-if="isEmpty && !isDesignsLoading")
div(v-else class="mobile-all-design-view")
  mobile-design-gallery(:noHeader="true"
    :allDesigns="allDesigns"
    :selectedNum="selectedNum"
    @loadMore="handleLoadMore")
  div(class="scroll-space")
</template>

<script lang="ts">
import MobileDesignEmpty from '@/components/mydesign/MobileDesignEmpty.vue'
import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  components: {
    MobileDesignGallery,
    MobileDesignEmpty
  },
  mounted() {
    designUtils.fetchDesigns(this.fetchAllDesigns)
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      selectedDesigns: 'getSelectedDesigns',
      allDesigns: 'getAllDesigns',
      isDesignsLoading: 'getIsDesignsLoading'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isEmpty(): boolean {
      return this.allDesigns.length === 0
    }
  },
  methods: {
    ...mapActions('design', {
      fetchAllDesigns: 'fetchAllDesigns',
      fetchMoreAllDesigns: 'fetchMoreAllDesigns'
    }),
    handleLoadMore() {
      designUtils.fetchDesigns(this.fetchMoreAllDesigns, false)
    }
  }
})
</script>

<style lang="scss" scoped>
.warning { margin-top: 16px }

.mobile-all-design-view {
}

.scroll-space {
  margin-bottom: 200px;
}
</style>
