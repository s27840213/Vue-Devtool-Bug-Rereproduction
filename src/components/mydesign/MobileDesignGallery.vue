<template lang="pug">
  div(v-if="allDesigns.length > 0 || isDesignsLoading" class="mobile-design-gallery")
    //- div(v-if="!noHeader && allDesigns.length > 0" class="mobile-design-gallery__header")
      div(class="mobile-design-gallery__expand-icon-container"
          @click="toggleExpansion")
        svg-icon(:style="expansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="mobile-design-gallery__title")
        span {{$tc('NN0252', 2)}}
    div(v-if="isExpanded" class="mobile-design-gallery__designs")
      mobile-design-item(v-for="(design, index) in allDesigns"
                  :key="design.asset_index"
                  :index="index"
                  :config="design"
                  :unenterable="limitFunctions"
                  :isSelected="checkSelected(design.asset_index.toString())"
                  :isAnySelected="isAnySelected"
                  :isMultiSelected="isMultiSelected"
                  @select="selectDesign(design)"
                  @deselect="deselectDesign(design)")
    div(v-if="isExpanded && isDesignsLoading" class="mobile-design-gallery__loading")
      svg-icon(iconName="loading"
                iconWidth="32px"
                iconColor="gray-3")
    observer-sentinel(v-if="!isDesignsLoading && designsPageIndex >= 0"
                      @callback="handleLoadMore")
</template>

<script lang="ts">
import { IDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MobileDesignItem from '@/components/mydesign/MobileDesignItem.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'

export default Vue.extend({
  components: {
    MobileDesignItem,
    ObserverSentinel
  },
  data() {
    return {
      isExpanded: true
    }
  },
  props: {
    allDesigns: Array,
    selectedNum: Number,
    limitFunctions: Boolean,
    noHeader: Boolean
  },
  computed: {
    ...mapGetters('design', {
      favoriteDesigns: 'getFavoriteDesigns',
      selectedDesigns: 'getSelectedDesigns',
      isDesignsLoading: 'getIsDesignsLoading',
      designsPageIndex: 'getDesignsPageIndex'
    }),
    isAnySelected(): boolean {
      return this.selectedNum > 0
    },
    isMultiSelected(): boolean {
      return this.selectedNum > 1
    }
  },
  methods: {
    ...mapMutations('design', {
      addToSelection: 'UPDATE_addToSelection',
      removeFromSelection: 'UPDATE_removeFromSelection',
      addToFavorite: 'UPDATE_addToFavorite',
      removeFromFavorite: 'UPDATE_removeFromFavorite',
      metaSelect: 'UPDATE_metaSelect'
    }),
    checkSelected(assetIndex: string): boolean {
      return !!this.selectedDesigns[assetIndex]
    },
    expansionIconStyles() {
      return this.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    toggleExpansion() {
      this.isExpanded = !this.isExpanded
    },
    handleLoadMore() {
      this.$emit('loadMore')
    },
    selectDesign(design: IDesign) {
      this.addToSelection(design)
    },
    deselectDesign(design: IDesign) {
      this.removeFromSelection(design)
    }
  }
})
</script>

<style lang="scss" scoped>
.mobile-design-gallery {
  margin-top: 24px;
  &__header {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 20px;
  }
  &__expand-icon-container {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    > svg {
      transition: 0.1s linear;
    }
  }
  &__title {
    display: flex;
    align-items: center;
    height: 40px;
    > span {
      line-height: 40px;
      font-size: 24px;
      font-weight: 700;
      color: setColor(gray-2);
      letter-spacing: 0.205em;
    }
  }
  &__designs {
    display: grid;
    grid-gap: 16px;
    padding: 0 16px;
    grid-template-columns: repeat(2, 1fr);
  }
  &__loading {
    display: flex;
    justify-content: center;
    width: 100%;
  }
}
</style>
