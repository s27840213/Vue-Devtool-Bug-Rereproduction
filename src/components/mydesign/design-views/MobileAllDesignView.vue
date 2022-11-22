<template lang="pug">
div(class="mobile-all-design-view")
  mobile-design-gallery(:noHeader="true"
                        :allDesigns="allDesigns"
                        :selectedNum="selectedNum"
                        @loadMore="handleLoadMore")
  div(class="scroll-space")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapActions } from 'vuex'
import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'

export default defineComponent({
  components: {
    MobileDesignGallery,
    DiskWarning
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
      allDesigns: 'getAllDesigns'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
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
