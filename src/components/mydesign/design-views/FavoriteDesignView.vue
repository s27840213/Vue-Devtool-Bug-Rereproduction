<template lang="pug">
  div(class="favorite-design-view")
    div(class="favorite-design-view__folder-name") 我的最愛
    div(class="horizontal-rule")
    design-gallery(v-if="allDesigns.length > 0"
                  :noHeader="true"
                  :menuItems="menuItems"
                  :allDesigns="allDesigns"
                  :selectedNum="selectedNum"
                  @menuAction="handleDesignMenuAction")
</template>

<script lang="ts">
import { IPathedDesign } from '@/interfaces/design'
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import DesignGallery from '@/components/mydesign/DesignGallery.vue'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  components: {
    DesignGallery
  },
  data() {
    return {
      menuItems: designUtils.makeFavoriteMenuItems()
    }
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      favoriteDesigns: 'getFavoriteDesigns',
      selectedDesigns: 'getSelectedDesigns'
    }),
    allDesigns() {
      let designs = generalUtils.deepCopy(this.favoriteDesigns) as IPathedDesign[]
      designs = designUtils.removeDeleted(designs)
      designUtils.sortDesignsBy(designs, 'time', true)
      return designs.map((item) => [item.path, item.design])
    },
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    }
  },
  methods: {
    handleDesignMenuAction(extraEvent: {event: string, payload: any}) {
      const { event, payload } = extraEvent
      this.$emit(event, payload)
    }
  }
})
</script>

<style lang="scss" scoped>
.favorite-design-view {
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
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 120px);
  margin-top: 21px;
  margin-bottom: 58px;
}
</style>
