<template lang="pug">
  div(class="mobile-all-design-view")
    mobile-design-gallery(:noHeader="true"
                          :allDesigns="allDesigns"
                          :selectedNum="selectedNum"
                          @loadMore="handleLoadMore")
    div(v-if="isEmpty && !isDesignsLoading" class="mobile-all-design-view__empty")
      img(class="mobile-all-design-view__empty__img" :src="require('@/assets/img/png/mydesign/empty-folder.png')")
      span {{'尚無設計檔案'}}
      btn-new-design(v-slot="slotProps")
        button(class="btn-primary-sm pointer" @click="slotProps.openPopup")
          span(class="header-sort") {{$tc('NN0072')}}
    //- div(class="scroll-space")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import MobileDesignGallery from '@/components/mydesign/MobileDesignGallery.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'
import BtnNewDesign from '@/components/mydesign/BtnNewDesign.vue'

export default Vue.extend({
  components: {
    MobileDesignGallery,
    DiskWarning,
    BtnNewDesign
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
    > span {
      padding: 12px 0px 32px 0px;
      height: 28px;
      font-size: 14px;
      font-weight: 600;
      line-height: 140%;
      color: setColor(gray-2)
    }
    .btn-primary-sm {
      padding: 11px 24px;
      font-weight: 600;
      line-height: 140%;
    }
  }
}

.scroll-space {
  margin-bottom: 200px;
}
</style>
