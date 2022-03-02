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
          class="feature-button brand-selector__brand-list__item pointer relative"
          :class="{'active': checkSelected(brand)}"
          @mouseenter="handleMouseEnter(brand)"
          @mouseleave="handleMouseLeave()"
          @click="handleSetCurrentBrand(brand)")
          span {{ getDisplayedBrandName(brand) }}
          div(class="brand-selector__brand-list__item-menu-icon pointer" @click.stop="handleBrandMenu(brand)")
            svg-icon(iconName="more_vertical" iconWidth="24px" iconColor="gray-2")
          div(v-if="checkBrandMenuShowing(brand)" class="brand-selector__brand-list__item-menu-bridge")
          div(v-if="checkBrandMenuShowing(brand)" class="brand-selector__brand-list__item-menu")
            div(class="brand-selector__brand-list__item-menu-row pointer"
              @click="handleCopyBrand(brand)")
              svg-icon(iconName="copy" iconWidth="24px" iconColor="gray-2")
              span {{ $t('NN0251') }}
            div(class="brand-selector__brand-list__item-menu-row pointer"
              @click="handleDeleteBrand(brand)")
              svg-icon(iconName="trash" iconWidth="24px" iconColor="gray-2")
              span {{ $t('NN0034') }}
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
      isBrandListOpen: false,
      currentHoverBrandId: '',
      currentBrandMenuId: ''
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
      return brandkitUtils.getDisplayedBrandName(this.currentBrand)
    }
  },
  watch: {
    currentHoverBrandId(newVal) {
      if (this.currentBrandMenuId !== '' && this.currentBrandMenuId !== newVal) {
        this.currentBrandMenuId = ''
      }
    },
    isBrandListOpen(newVal) {
      if (!newVal) {
        this.currentHoverBrandId = ''
        this.currentBrandMenuId = ''
      }
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
    handleBrandMenu(brand: IBrand) {
      this.currentBrandMenuId = brand.id
    },
    handleMouseEnter(brand: IBrand) {
      this.currentHoverBrandId = brand.id
    },
    handleMouseLeave() {
      this.currentHoverBrandId = ''
    },
    handleCopyBrand(brand: IBrand) {
      brandkitUtils.copyBrand(brand)
    },
    handleDeleteBrand(brand: IBrand) {
      this.$emit('deleteItem', {
        type: 'brand',
        content: brand
      })
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
    checkBrandMenuShowing(brand: IBrand): boolean {
      return this.currentBrandMenuId === brand.id
    },
    getDisplayedBrandName(brand: IBrand): string {
      return brandkitUtils.getDisplayedBrandName(brand)
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
        background: setColor(blue-4);
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
      background: setColor(blue-4);
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
    z-index: 2;
    &__item {
      text-align: left;
      padding: 10px;
      padding-right: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 0px; // to override .feature-button
      & > span {
        @include body-SM;
      }
      &:hover {
        & > .brand-selector__brand-list__item-menu-icon {
          display: block;
        }
      }
    }
    &__item-menu {
      width: 146px;
      display: flex;
      flex-direction: column;
      position: absolute;
      left: calc(100% + 4px);
      top: 0;
      padding: 8px 0px;
      gap: 8px;
      background: white;
      box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
      border-radius: 5px;
      &-icon {
        width: 24px;
        height: 24px;
        display: none;
        &:hover {
          & > .brand-selector__brand-list__item-menu {
            display: block;
          }
        }
      }
      &-bridge {
        position: absolute;
        left: 100%;
        top: 0;
        width: 4px;
        height: 100%;
      }
      &-row {
        padding: 3.5px 10px;
        display: flex;
        align-items: center;
        gap: 4px;
        &:hover {
          background: setColor(blue-4);
        }
        & > span {
          @include body-SM;
          color: setColor(gray-1);
        }
        // &:nth-child(1) {
        //   padding-top: 8px;
        // }
        // &:nth-last-child(1) {
        //   padding-bottom: 8px;
        // }
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
