<template lang="pug">
  div(class="panel-brand-list")
    div(class="panel-brand-list__brands")
      div(v-for="brand in brands"
          class="panel-brand-list__brand-item"
          :class="{selected: checkSelected(brand)}"
          @click="handleSetCurrentBrand(brand)")
        span(class="panel-brand-list__brand-title") {{ getDisplayedBrandName(brand) }}
        div(class="panel-brand-list__brand-more")
          svg-icon(iconName="more_vertical" iconColor="gray-2" iconWidth="24px")
      template(v-if="defaultOption")
        div(class="horizontal-rule")
        div(class="panel-brand-list__brand-item"
          :class="{selected: isDefaultSelected}"
          @click="handleSelectDefault")
          span(class="panel-brand-list__brand-title") {{ $t('NN0089') }}
    template(v-if="hasAddBrand")
      div(class="horizontal-rule")
      div(class="panel-brand-list__add-brand")
        div(class="panel-brand-list__add-brand__icon")
          svg-icon(iconName="plus-origin" iconColor="gray-2" iconWidth="16px")
        span(class="panel-brand-list__add-brand__text") {{ $t('NN0396') }}
</template>

<script lang="ts">
import { IBrand } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import editorUtils from '@/utils/editorUtils'
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default Vue.extend({
  props: {
    defaultOption: {
      type: Boolean,
      default: false
    },
    hasAddBrand: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      brands: 'getBrands',
      currentBrandId: 'getCurrentBrandId',
      isDefaultSelected: 'getIsDefaultSelected'
    })
  },
  methods: {
    ...mapMutations('brandkit', {
      setCurrentBrand: 'SET_currentBrand',
      setIsDefaultSelected: 'SET_isDefaultSelected'
    }),
    handleSetCurrentBrand(brand: IBrand) {
      this.setCurrentBrand(brand)
      if (this.defaultOption) {
        this.setIsDefaultSelected(false)
      }
      editorUtils.setCurrActiveSubPanel('none')
    },
    handleSelectDefault() {
      this.setIsDefaultSelected(true)
      editorUtils.setCurrActiveSubPanel('none')
    },
    checkSelected(brand: IBrand) {
      return (!this.defaultOption || !this.isDefaultSelected) && brand.id === this.currentBrandId
    },
    getDisplayedBrandName(brand: IBrand): string {
      return brandkitUtils.getDisplayedBrandName(brand)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-brand-list {
  padding: 6px 0 0 0;
  &__brands {
    display: flex;
    flex-direction: column;
    gap: 8px;
    @include no-scrollbar;
    height: 184px;
    overflow-y: auto;
  }
  &__brand-item {
    height: 40px;
    padding: 0 1px 0 9px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    &.selected {
      background: setColor(blue-4);
      & > span {
        font-weight: 600;
      }
    }
  }
  &__brand-title {
    font-weight: 400;
    font-size: 14px;
    line-height: 180%;
    color: setColor(gray-2);
  }
  &__brand-more {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__add-brand {
    display: flex;
    align-items: center;
    padding: 16px 0 1px 13px;
    gap: 20px;
    &__icon {
      @include size(16px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__text {
      font-weight: 400;
      font-size: 14px;
      line-height: 180%;
    }
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
</style>
