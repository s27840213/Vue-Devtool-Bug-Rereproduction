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
                  :isInFavoriates="checkFavoriate(design.id)"
                  @like="toggleFavoriate(path, design)")
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
    }
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders',
      favoriateDesigns: 'getFavoriateDesigns'
    }),
    favoriateIds(): string[] {
      return this.favoriateDesigns.map((pathedDesign: IPathedDesign) => pathedDesign.design.id)
    },
    allDesigns() {
      const designs = designUtils.getAllDesigns(this.folders)
      designUtils.sortByName(designs)
      return designs.map((item) => [item.path, item.design])
    }
  },
  methods: {
    ...mapMutations('design', {
      addToFavoriate: 'UPDATE_addToFavoriate',
      removeFromFavoriate: 'UPDATE_removeFromFavoriate'
    }),
    checkFavoriate(id: string): boolean {
      return this.favoriateIds.includes(id)
    },
    toggleFavoriate(path: string[], design: IDesign) {
      const payload = {
        path,
        design
      }
      if (this.checkFavoriate(design.id)) {
        this.removeFromFavoriate(payload)
      } else {
        this.addToFavoriate(payload)
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
