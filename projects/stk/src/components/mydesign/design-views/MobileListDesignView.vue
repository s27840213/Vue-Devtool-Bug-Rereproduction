<template lang="pug">
div(class="mobile-list-design-view")
  mobile-folder-gallery(:path="[ROOT]"
                        :noHeader="true"
                        :allFolders="allFolders"
                        :selectedNum="0")
  div(class="scroll-space")
</template>

<script lang="ts">
import MobileFolderGallery from '@/components/mydesign/MobileFolderGallery.vue'
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default defineComponent({
  components: {
    MobileFolderGallery
  },
  data() {
    return {
      ROOT: designUtils.ROOT
    }
  },
  mounted() {
    designUtils.on('refresh', this.refreshItems)
    this.refreshItems()
  },
  unmounted() {
    designUtils.off('refresh')
  },
  watch: {
    allFolders() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      allFolders: 'getAllFolders'
    })
  },
  methods: {
    ...mapActions('design', {
      fetchFolderFolders: 'fetchFolderFolders'
    }),
    refreshItems() {
      designUtils.fetchFolders(async () => {
        await this.fetchFolderFolders({
          path: 'root'
        })
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.warning { margin-top: 16px }

.mobile-list-design-view {
}

.scroll-space {
  margin-bottom: 200px;
}
</style>
