<template lang="pug">
  div(class="mobile-trash-design-view")
    mobile-design-gallery(:allDesigns="allDesigns"
                          :selectedNum="selectedNum"
                          :limitFunctions="true"
                          @loadMore="handleLoadMore")
    div(class="scroll-space")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'

export default Vue.extend({
  components: {
    MobileDesignGallery,
    DiskWarning
  },
  mounted() {
    designUtils.fetchDesigns(this.fetchTrashDesigns)
    designUtils.fetchFolders(this.fetchTrashFolders)
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    },
    allFolders() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      selectedDesigns: 'getSelectedDesigns',
      selectedFolders: 'getSelectedFolders',
      allDesigns: 'getAllDesigns',
      allFolders: 'getAllFolders'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length + Object.keys(this.selectedFolders).length
    }
  },
  methods: {
    ...mapActions('design', {
      fetchTrashDesigns: 'fetchTrashDesigns',
      fetchTrashFolders: 'fetchTrashFolders',
      fetchMoreTrashDesigns: 'fetchMoreTrashDesigns'
    }),
    handleLoadMore() {
      designUtils.fetchDesigns(this.fetchMoreTrashDesigns, false)
    }
  }
})
</script>

<style lang="scss" scoped>
.warning { margin-top: 16px }

.mobile-trash-design-view {
}

.scroll-space {
  margin-bottom: 200px;
}
</style>
