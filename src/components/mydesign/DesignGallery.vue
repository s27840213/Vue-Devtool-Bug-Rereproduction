<template lang="pug">
  div(class="design-gallery")
    div(v-if="!noHeader" class="design-gallery__header")
      div(class="design-gallery__expand-icon-container"
          @click="toggleExpansion")
        svg-icon(:style="expansionIconStyles()"
                iconName="caret-down"
                iconWidth="10px"
                iconHeight="5px"
                iconColor="gray-2")
      div(class="design-gallery__title")
        span 設計
    div(v-if="isExpanded" class="design-gallery__designs")
      design-item(v-for="[path, design] in allDesigns"
                  :key="design.id"
                  :path="path"
                  :config="design"
                  :favorable="!limitFunctions"
                  :undraggable="limitFunctions"
                  :nameIneditable="limitFunctions"
                  :isInFavorites="checkFavorite(design.id)"
                  :isSelected="checkSelected(design.id)"
                  :isAnySelected="isAnySelected"
                  :isMultiSelected="isMultiSelected"
                  :menuItemNum="menuItemSlots.length"
                  @like="toggleFavorite(path, design)"
                  @select="selectDesign(path, design)"
                  @deselect="deselectDesign(path, design)")
        template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
          div(class="design-menu-item" @click="handleDesignMenuAction(menuItemSlot.icon, path, design)")
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
</template>

<script lang="ts">
import { IDesign, IPathedDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import DesignItem from '@/components/mydesign/DesignItem.vue'

export default Vue.extend({
  components: {
    DesignItem
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
      selectedDesigns: 'getSelectedDesigns'
    }),
    favoriteIds(): string[] {
      return this.favoriteDesigns.map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    },
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
      removeFromFavorite: 'UPDATE_removeFromFavorite'
    }),
    checkFavorite(id: string): boolean {
      return this.favoriteIds.includes(id)
    },
    checkSelected(id: string): boolean {
      return !!this.selectedDesigns[id]
    },
    expansionIconStyles() {
      return this.isExpanded ? {} : { transform: 'rotate(-90deg)' }
    },
    toggleExpansion() {
      this.isExpanded = !this.isExpanded
    },
    handleDesignMenuAction(icon: string, path: string[], design: IDesign) {
      if (this.useDelete && icon === 'trash') icon = 'delete'
      const extraEvent = designUtils.dispatchDesignMenuAction(icon, path, design)
      if (extraEvent) {
        this.$emit('menuAction', extraEvent)
      }
    },
    toggleFavorite(path: string[], design: IDesign) {
      const payload = {
        path,
        design
      }
      if (this.checkFavorite(design.id)) {
        this.removeFromFavorite(payload)
      } else {
        this.addToFavorite(payload)
      }
    },
    selectDesign(path: string[], design: IDesign) {
      this.addToSelection({ path, design })
    },
    deselectDesign(path: string[], design: IDesign) {
      this.removeFromSelection({ path, design })
    }
  }
})
</script>

<style lang="scss" scoped>
.design-gallery {
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
    justify-items: stretch;
    margin-bottom: 20px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    @media(min-width: 976px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media(min-width: 1260px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    @media(min-width: 1560px) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
}
</style>
