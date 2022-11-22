<template lang="pug">
  div(v-if="allDesigns.length > 0 || isDesignsLoading" class="design-gallery")
    div(v-if="!noHeader && allDesigns.length > 0" class="design-gallery__header")
      div(class="design-gallery__expand-icon-container"
          @click="toggleExpansion")
        svg-icon(:style="expansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="design-gallery__title")
        span {{$tc('NN0252', 2)}}
    div(v-if="isExpanded" class="design-gallery__designs")
      design-item(v-for="(design, index) in allDesigns"
                  :key="design.asset_index"
                  :index="index"
                  :config="design"
                  :favorable="!limitFunctions"
                  :undraggable="limitFunctions"
                  :nameIneditable="limitFunctions"
                  :unenterable="limitFunctions"
                  :isSelected="checkSelected(design.asset_index.toString())"
                  :isAnySelected="isAnySelected"
                  :isMultiSelected="isMultiSelected"
                  :menuItemNum="menuItemSlots.length"
                  @like="toggleFavorite(design)"
                  @select="selectDesign(design)"
                  @deselect="deselectDesign(design)"
                  @metaSelect="metaSelectDesign(index)")
        template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
          div(class="design-menu-item" @click="handleDesignMenuAction(menuItemSlot.icon, design)")
            div(class="design-menu-item__icon")
              svg-icon(:iconName="menuItemSlot.icon"
                      iconWidth="10px"
                      iconColor="gray-2")
            div(class="design-menu-item__text")
              span {{ menuItemSlot.text }}
            div(v-if="menuItemSlot.extendable" class="design-menu-item__right")
              svg-icon(iconName="chevron-right"
                      iconWidth="10px"
                      iconColor="gray-2")
    div(v-if="isExpanded && isDesignsLoading" class="design-gallery__loading")
      svg-icon(iconName="loading"
                iconWidth="50px"
                iconColor="gray-3")
    observer-sentinel(v-if="!isDesignsLoading && designsPageIndex >= 0"
                      @callback="handleLoadMore")
</template>

<script lang="ts">
import { IDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import DesignItem from '@/components/mydesign/DesignItem.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'

export default defineComponent({
  components: {
    DesignItem,
    ObserverSentinel
  },
  data() {
    return {
      isExpanded: true
    }
  },
  props: {
    menuItems: Array,
    allDesigns: Array,
    selectedNum: Number,
    limitFunctions: Boolean,
    useDelete: Boolean,
    noHeader: Boolean
  },
  computed: {
    ...mapGetters('design', {
      favoriteDesigns: 'getFavoriteDesigns',
      selectedDesigns: 'getSelectedDesigns',
      isDesignsLoading: 'getIsDesignsLoading',
      designsPageIndex: 'getDesignsPageIndex'
    }),
    menuItemSlots(): {name: string, icon: string, text: string}[] {
      return (this.menuItems as {icon: string, text: string, extendable?: boolean}[]).map((menuItem, index) => ({ name: `i${index}`, ...menuItem }))
    },
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
    handleDesignMenuAction(icon: string, design: IDesign) {
      if (this.useDelete && icon === 'trash') icon = 'delete'
      designUtils.dispatchDesignMenuAction(icon, design, (extraEvent) => {
        if (extraEvent) {
          this.$emit('menuAction', extraEvent)
        }
      })
    },
    handleLoadMore() {
      this.$emit('loadMore')
    },
    toggleFavorite(design: IDesign) {
      if (design.favorite) {
        designUtils.removeFromFavorite(design)
      } else {
        designUtils.addToFavorite(design)
      }
    },
    selectDesign(design: IDesign) {
      this.addToSelection(design)
    },
    deselectDesign(design: IDesign) {
      this.removeFromSelection(design)
    },
    metaSelectDesign(index: number) {
      this.metaSelect({
        designs: this.allDesigns,
        index
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.design-gallery {
  padding-bottom: 20px;
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
    grid-gap: 25px;
    margin-bottom: 20px;
    grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
  }
  &__loading {
    display: flex;
    justify-content: center;
    width: 100%;
  }
}
</style>
