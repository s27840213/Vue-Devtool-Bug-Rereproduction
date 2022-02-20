<template lang="pug">
  div(class="brand-selector relative")
    div(class="brand-selector__brand-name")
      input(v-if="isNameEditing"
        ref="brandName"
        v-model="editableName"
        v-click-outside="handleNameEditEnd"
        @change="handleNameEditEnd"
        @keyup="checkNameEnter")
      span(v-else
        @click="handleNameClick") {{ brandName }}
    div(class="brand-selector__dropdown pointer"
      @click="isBrandListOpen = true")
      svg-icon(iconName="chevron-down"
        :style="dropdownStyles()"
        iconWidth="24px" iconColor="bu")
    transition(name="fade-slide")
      div(v-if="isBrandListOpen"
        v-click-outside="() => { isBrandListOpen = false }"
        class="brand-selector__brand-list")
        div(v-for="brand in brands"
          class="brand-selector__brand-list__item pointer"
          :class="{'selected': checkSelected(brand)}"
          @click="handleSetCurrentBrand(brand)")
          span {{ getDisplayedBrandName(brand) }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import vClickOutside from 'v-click-outside'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
      isNameEditing: false,
      editableName: '',
      isBrandListOpen: false
    }
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  computed: {
    ...mapGetters('brandkit', {
      brands: 'getBrands',
      currentBrand: 'getCurrentBrand'
    }),
    brandName(): string {
      return this.getDisplayedBrandName(this.currentBrand)
    }
  },
  methods: {
    ...mapMutations('brandkit', {
      setCurrentBrand: 'SET_currentBrand'
    }),
    dropdownStyles() {
      return this.isBrandListOpen ? {
        transform: 'rotate(-180deg)'
      } : {}
    },
    handleNameClick() {
      this.editableName = this.brandName
      this.isNameEditing = true
      this.$nextTick(() => {
        const brandNameInput = this.$refs.brandName as HTMLInputElement
        brandNameInput.focus()
      })
    },
    handleNameEditEnd() {
      this.isNameEditing = false
      if (this.editableName === '' || this.editableName === this.brandName) return
      // this.checkNameLength()
      brandkitUtils.setBrandName(this.currentBrand, this.editableName)
    },
    handleSetCurrentBrand(brand: IBrand) {
      this.isBrandListOpen = false
      this.setCurrentBrand(brand)
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableName === this.brandName) {
        this.handleNameEditEnd()
      }
      // this.checkNameLength()
    },
    checkSelected(brand: IBrand): boolean {
      return this.currentBrand.id === brand.id
    },
    getDisplayedBrandName(brand: IBrand): string {
      return brand.name === '' ? `${this.$t('NN0397')}` : brand.name
    }
  }
})
</script>

<style lang="scss" scoped>
.brand-selector {
  margin-left: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  &__brand-name {
    @include text-H4;
    line-height: unset;
    color: setColor(bu);
    height: 39px;
    & > span {
      display: block;
      padding: 2px;
      cursor: text;
      border-radius: 4px;
      &:hover {
        background: setColor(gray-5);
      }
    }
    & > input {
      padding: 2px;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
      letter-spacing: inherit;
      color: inherit;
      font-family: inherit;
    }
  }
  &__dropdown {
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    &:hover {
      background: setColor(gray-5);
    }
    & > svg {
      transition: 0.2s ease;
    }
  }
  &__brand-list {
    width: 180px;
    background-color: white;
    position: absolute;
    top: calc(100% + 12px);
    left: 0;
    border: 1px solid #D9DBE1;
    box-sizing: border-box;
    box-shadow: 0px 3px 15px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    &__item {
      text-align: left;
      padding: 10px;
      & > span {
        @include body-SM;
      }
      &.selected {
        background: setColor(blue-3);
      }
      &:not(.selected):hover {
        background: setColor(gray-5);
      }
    }
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: 0.1s;
}

.fade-slide-enter,
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(0, -5px);
}
</style>
