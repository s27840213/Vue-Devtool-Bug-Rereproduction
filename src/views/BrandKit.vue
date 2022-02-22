<template lang="pug">
  div(class="brand-kit scrollbar-gray")
    nu-header
    div(v-if="isBrandsLoading" class="brand-kit__main")
      svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
    div(v-else class="brand-kit__main")
      div(class="brand-kit__header")
        div(class="brand-kit__selector")
          brand-selector
        //- div(class="brand-kit__add pointer" @click="addNewBrand")
        //-   svg-icon(iconName="plus-origin"
        //-           iconWidth="16px"
        //-           iconColor="gray-1")
        //-   span(class="brand-kit__add__text") {{ $t('NN0396') }}
        brand-kit-add-btn(:text="`${$t('NN0396')}`"
                          @click.native="addNewBrand")
      div(class="brand-kit__tab")
        brand-kit-tab
    nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'
import BrandSelector from '@/components/brandkit/BrandSelector.vue'
import BrandKitTab from '@/components/brandkit/BrandKitTab.vue'
import BrandKitAddBtn from '@/components/brandkit/BrandKitAddBtn.vue'
import brandkitUtils from '@/utils/brandkitUtils'
import { mapActions, mapGetters } from 'vuex'

export default Vue.extend({
  name: 'BrandKit',
  components: {
    NuHeader,
    NuFooter,
    BrandSelector,
    BrandKitTab,
    BrandKitAddBtn
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
    }),
    addNewBrand() {
      brandkitUtils.addNewBrand()
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-kit {
  @include size(100%, 100%);
  overflow-y: auto;
  &__main {
    min-height: calc(100vh - #{$header-height});
    padding-top: 100px;
    padding-left: 148px;
    padding-right: 148px;
  }
  &__header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  // &__add {
  //   border: 1px solid setColor(gray-3);
  //   box-sizing: border-box;
  //   border-radius: 4px;
  //   display: flex;
  //   align-items: center;
  //   height: 43px;
  //   padding: 20px;
  //   gap: 12px;
  //   &:hover {
  //     background-color: setColor(gray-5);
  //   }
  //   &__text {
  //     @include body-MD;
  //     line-height: 16px;
  //   }
  // }
  &__tab {
    margin: 28px 0px;
  }
}
</style>
