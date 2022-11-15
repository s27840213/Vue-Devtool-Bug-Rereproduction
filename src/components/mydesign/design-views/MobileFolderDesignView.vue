<template lang="pug">
  div(class="mobile-folder-design-view")
    mobile-folder-gallery(:path="path"
                          :allFolders="allFolders"
                          :selectedNum="0")
    div(v-if="isFolderDesignDivisionNeeded" class="mobile-folder-design-view__hr")
    mobile-design-gallery(:allDesigns="allDesigns"
                          :selectedNum="selectedNum"
                          @loadMore="handleLoadMore")
    div(v-if="isEmpty && !isDesignsLoading && !isFoldersLoading" class="mobile-folder-design-view__empty")
      img(class="mobile-folder-design-view__empty__img" :src="require('@/assets/img/png/mydesign/empty-folder.png')")
      btn-new-design
    div(v-else class="scroll-space")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import MobileFolderGallery from '@/components/mydesign/MobileFolderGallery.vue'
import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'
import BtnNewDesign from '@/components/mydesign/BtnNewDesign.vue'

export default Vue.extend({
  components: {
    MobileFolderGallery,
    MobileDesignGallery,
    DiskWarning,
    BtnNewDesign
  },
  mounted() {
    designUtils.on('refresh', this.refreshItems)
    this.refreshItems()
  },
  destroyed() {
    designUtils.off('refresh')
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    },
    allFolders() {
      this.$emit('clearSelection')
    },
    currLocation() {
      this.refreshItems()
    }
  },
  computed: {
    ...mapGetters('design', {
      currLocation: 'getCurrLocation',
      selectedDesigns: 'getSelectedDesigns',
      isDesignsLoading: 'getIsDesignsLoading',
      isFoldersLoading: 'getIsFoldersLoading',
      allDesigns: 'getAllDesigns',
      allFolders: 'getAllFolders'
    }),
    path(): string[] {
      return designUtils.makePath(this.currLocation)
    },
    parents(): string[] {
      const path = this.path
      return path.slice(0, path.length - 1)
    },
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    },
    isEmpty(): boolean {
      return this.allFolders.length + this.allDesigns.length === 0
    },
    isFolderDesignDivisionNeeded(): boolean {
      return this.allFolders.length > 0 && this.allDesigns.length > 0
    }
  },
  methods: {
    ...mapActions('design', {
      fetchFolderFolders: 'fetchFolderFolders',
      fetchFolderDesigns: 'fetchFolderDesigns',
      fetchMoreFolderDesigns: 'fetchMoreFolderDesigns'
    }),
    handleLoadMore() {
      designUtils.fetchDesigns(async () => {
        await this.fetchMoreFolderDesigns({
          path: this.path.slice(1).join(',')
        })
      }, false)
    },
    refreshItems() {
      designUtils.fetchDesigns(async () => {
        await this.fetchFolderDesigns({
          path: this.path.slice(1).join(',')
        })
      })
      designUtils.fetchFolders(async () => {
        await this.fetchFolderFolders({
          path: this.path.slice(1).join(',')
        })
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.warning { margin-top: 16px }

.mobile-folder-design-view {
  &__hr {
    margin: 0 16px;
    margin-top: 16px;
    margin-bottom: 2px;
    background: setColor(gray-4);
    height: 1px;
  }
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    &__img {
      width: 186px;
      height: 165px;
    }
  }
}

.scroll-space {
  margin-bottom: 200px;
}
</style>
