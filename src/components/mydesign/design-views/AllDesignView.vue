<template lang="pug">
  div(class="all-design-view")
    div(class="all-design-view__folder-name") 我所有設計
    div(class="horizontal-rule")
    design-gallery(:noHeader="true"
                  :menuItems="menuItems"
                  :allDesigns="allDesigns"
                  :selectedNum="selectedNum"
                  @menuAction="handleDesignMenuAction")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import DesignGallery from '@/components/mydesign/DesignGallery.vue'

export default Vue.extend({
  components: {
    DesignGallery
  },
  mounted() {
    designUtils.fetchDesigns(this.fetchAllDesigns)
  },
  data() {
    return {
      menuItems: designUtils.makeNormalMenuItems()
    }
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      folders: 'getFolders',
      selectedDesigns: 'getSelectedDesigns',
      allDesigns: 'getAllDesigns'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    }
  },
  methods: {
    ...mapActions('design', {
      fetchAllDesigns: 'fetchAllDesigns'
    }),
    handleDesignMenuAction(extraEvent: {event: string, payload: any}) {
      const { event, payload } = extraEvent
      this.$emit(event, payload)
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
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 120px);
  margin-top: 21px;
  margin-bottom: 58px;
}
</style>
