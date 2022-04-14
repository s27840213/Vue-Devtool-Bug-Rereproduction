<template lang="pug">
  div(class="panel-brand")
    div(v-if="isBrandsLoading" class="panel-brand__main")
        svg-icon(iconName="loading"
                iconWidth="20px"
                iconColor="white")
    div(v-else class="panel-brand__main")
      div(class="panel-brand__header relative")
        brand-selector(theme="editor")
        div(class="panel-brand__settings pointer")
          svg-icon(iconName="settings" iconColor="gray-2" iconWidth="24px")
      div(class="panel-brand__tab")
        brand-kit-tab(theme="editor")
</template>

<script lang="ts">
import Vue from 'vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import { mapActions, mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'

export default Vue.extend({
  components: {
    BrandSelector,
    BrandKitTab
  },
  mounted() {
    brandkitUtils.fetchBrands(this.fetchBrands)
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      isBrandsLoading: 'getIsBrandsLoading'
    })
  },
  methods: {
    ...mapActions('brandkit', {
      fetchBrands: 'fetchBrands'
    })
  }
})
</script>

<style lang="scss" scoped>
.panel-brand {
  margin-top: 12px;
  @include size(100%, 100%);
  &__header {
    width: 100%;
  }
  &__settings {
    position: absolute;
    width: 24px;
    height: 24px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
  &__tab {
    margin-top: 15px;
  }
}
</style>
