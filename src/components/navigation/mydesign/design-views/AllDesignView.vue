<template lang="pug">
  div(class="all-design-view")
    div(class="all-design-view__folder-name") 我所有設計
    div(class="horizontal-rule")
    div(class="all-design-view__designs")
      design-item(v-for="[path, design] in allDesigns"
                  :key="design.id"
                  :path="path"
                  :config="design"
                  :favorable="true"
                  :isInFavorites="checkFavorite(design.id)"
                  :menuItemNum="menuItemSlots.length"
                  @like="toggleFavorite(path, design)")
        template(v-for="menuItemSlot in menuItemSlots" v-slot:[menuItemSlot.name])
          div(class="design-menu-item" @click="handleDesignMenuAction(menuItemSlot.icon, path, design, checkFavorite(design.id))")
            div(class="design-menu-item__icon")
              svg-icon(:iconName="menuItemSlot.icon"
                      iconWidth="10px"
                      iconColor="gray-2")
            div(class="design-menu-item__text")
              span {{ menuItemSlot.text }}
</template>

<script lang="ts">
import { IDesign, IPathedDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import DesignItem from '@/components/navigation/mydesign/DesignItem.vue'

export default Vue.extend({
  components: {
    DesignItem
  },
  data() {
    return {
      menuItems: designUtils.makeNormalMenuItems()
    }
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders',
      favoriteDesigns: 'getFavoriteDesigns'
    }),
    favoriteIds(): string[] {
      return this.favoriteDesigns.map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    },
    allDesigns() {
      const designs = designUtils.getAllDesigns(this.folders)
      designUtils.sortByName(designs)
      return designs.map((item) => [item.path, item.design])
    },
    menuItemSlots(): {name: string, icon: string, text: string}[] {
      return this.menuItems.map((menuItem, index) => ({ name: `i${index}`, ...menuItem }))
    }
  },
  methods: {
    ...mapMutations('design', {
      addToFavorite: 'UPDATE_addToFavorite',
      removeFromFavorite: 'UPDATE_removeFromFavorite'
    }),
    checkFavorite(id: string): boolean {
      return this.favoriteIds.includes(id)
    },
    handleDesignMenuAction(icon: string, path: string[], design: IDesign, isInFavorites: boolean) {
      designUtils.dispatchDesignMenuAction(icon, path, design, isInFavorites)
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
    }
  }
})
</script>

<style lang="scss" scoped>
.all-design-view {
  text-align: left;
  font-family: NotoSansTC;
  overflow-y: auto;
  > div {
    margin-left: 55px;
    margin-right: 65px;
  }
  &__folder-name {
    margin-top: 94px;
    font-size: 24px;
    font-weight: 700;
    line-height: 40px;
    letter-spacing: 0.205em;
    color: setColor(bu);
  }
  &__designs {
    display: grid;
    grid-gap: 25px;
    justify-items: stretch;
    width: calc(100% - 120px);
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

.header-icon{
  cursor: pointer;
  &:hover {
    color: setColor(blue-1);
    background-color: setColor(gray-6);
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 120px);
  margin-top: 21px;
  margin-bottom: 58px;
}
</style>
