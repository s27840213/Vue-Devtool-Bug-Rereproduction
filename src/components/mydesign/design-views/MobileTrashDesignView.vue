<template lang="pug">
  div(class="mobile-trash-design-view")
    mobile-folder-gallery(:path="[]"
                          :allFolders="allFolders"
                          :selectedNum="selectedNum")
    div(v-if="isFolderDesignDivisionNeeded" class="mobile-trash-design-view__hr")
    mobile-design-gallery(:allDesigns="allDesigns"
                          :selectedNum="selectedNum"
                          :limitFunctions="true"
                          @loadMore="handleLoadMore")
    div(class="scroll-space")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapActions } from 'vuex'
import MobileFolderGallery from '@/components/mydesign/MobileFolderGallery.vue'
import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'

export default defineComponent({
  components: {
    MobileFolderGallery,
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
    },
    isFolderDesignDivisionNeeded(): boolean {
      return this.allFolders.length > 0 && this.allDesigns.length > 0
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
  &__hr {
    margin: 0 16px;
    margin-top: 16px;
    margin-bottom: 2px;
    background: setColor(gray-4);
    height: 1px;
  }
}

.scroll-space {
  margin-bottom: 200px;
}
</style>
