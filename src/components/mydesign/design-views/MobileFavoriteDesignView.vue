<template lang="pug">
  div(class="mobile-favorite-design-view")
    //- mobile-design-gallery(:noHeader="true"
                          :menuItems="menuItems"
                          :allDesigns="allDesigns"
                          :selectedNum="selectedNum"
                          @menuAction="handleDesignMenuAction"
                          @loadMore="handleLoadMore")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
// import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'

export default Vue.extend({
  components: {
    // MobileDesignGallery,
    DiskWarning
  },
  mounted() {
    designUtils.fetchDesigns(this.fetchAllDesigns)
  },
  data() {
    return {
      menuItems: designUtils.makeNormalMenuItems()
    }
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders',
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
    handleDesignMenuAction(extraEvent: { event: string, payload: any }) {
      const { event, payload } = extraEvent
      this.$emit(event, payload)
    },
    handleLoadMore() {
      designUtils.fetchDesigns(this.fetchMoreAllDesigns, false)
    }
  }
})
</script>

<style lang="scss" scoped>
.warning { margin-top: 16px }

.mobile-favorite-design-view {
}
</style>
