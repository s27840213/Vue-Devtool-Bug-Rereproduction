<template lang="pug">
  div(class="all-design-view")
    disk-warning(class="warning" size="small")
    div(class="all-design-view__toolbar")
      div(class="all-design-view__folder-name") {{$t('NN0187')}}
      btn-new-design
    div(class="horizontal-rule")
    design-gallery(:noHeader="true"
                  :menuItems="menuItems"
                  :allDesigns="allDesigns"
                  :selectedNum="selectedNum"
                  @menuAction="handleDesignMenuAction"
                  @loadMore="handleLoadMore")
</template>

<script lang="ts">
import designUtils from '@/utils/designUtils'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import DesignGallery from '@/components/mydesign/DesignGallery.vue'
import DiskWarning from '@/components/payment/DiskWarning.vue'
import BtnNewDesign from '@/components/new-design/BtnNewDesign.vue'

export default Vue.extend({
  components: {
    DesignGallery,
    DiskWarning,
    BtnNewDesign
  },
  mounted() {
    designUtils.fetchDesigns(this.fetchAllDesigns)
  },
  data() {
    return {
      menuItems: designUtils.makeNormalMenuItems(),
      isShowPopup: false
    }
  },
  watch: {
    allDesigns() {
      this.$emit('clearSelection')
    }
  },
  computed: {
    ...mapGetters('design', {
      selectedDesigns: 'getSelectedDesigns',
      allDesigns: 'getAllDesigns'
    }),
    selectedNum(): number {
      return Object.keys(this.selectedDesigns).length
    }
  },
  methods: {
    ...mapActions('design', {
      fetchAllDesigns: 'fetchAllDesigns',
      fetchMoreAllDesigns: 'fetchMoreAllDesigns'
    }),
    handleDesignMenuAction(extraEvent: { event: string, payload: any }) {
      const { event, payload } = extraEvent
      this.$emit(event, payload)
    },
    handleLoadMore() {
      designUtils.fetchDesigns(this.fetchMoreAllDesigns, false)
    }
  }
})
</script>

<style lang="scss" scoped>
.warning { margin-top: 16px }

.all-design-view {
  @include hover-scrollbar();
  box-sizing: border-box;
  padding: 0 43px 0 55px; // padding-right: 55 - 12(scrollbar width)
  text-align: left;
  &__toolbar{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 94px;
  }
  &__folder-name {
    font-size: 24px;
    font-weight: 700;
    line-height: 40px;
    color: setColor(bu);
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  margin-top: 21px;
  margin-bottom: 58px;
}
</style>
