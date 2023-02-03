<template lang="pug">
div(class="brand-selector relative"
  :class="`${theme}-theme`")
  div(v-if="defaultOption && isDefaultSelected"
    class="brand-selector__brand-name"
    :class="`${theme}-theme`")
    span {{ $t('NN0089') }}
  div(v-else
    class="brand-selector__brand-name"
    :class="[`${theme}-theme`, {hover: !$isTouchDevice}]")
    input(v-if="isNameEditing"
      ref="brandName"
      v-model="editableName"
      v-click-outside="handleNameEditEnd"
      @change="handleNameEditEnd"
      @keyup="checkNameEnter")
    span(v-else
      :title="brandName"
      @click="handleNameClick") {{ brandName }}
  div(class="brand-selector__dropdown pointer"
    :class="[`${theme}-theme`, {mobile: $isTouchDevice}]"
    @click="handleOpenMenu")
    svg-icon(:class="`${theme}-theme`"
      :style="dropdownStyles()"
      iconName="chevron-down"
      iconWidth="24px")
  transition(name="fade-slide")
    div(v-if="isBrandListOpen"
      v-click-outside="() => { isBrandListOpen = false }"
      class="brand-selector__brand-list")
      div(v-for="brand in brands"
        class="feature-button brand-selector__brand-list__item pointer relative"
        :class="{'active': checkSelected(brand), 'disabled': checkTemp(brand)}"
        @mouseenter="handleMouseEnter(brand)"
        @mouseleave="handleMouseLeave()"
        @click="handleSetCurrentBrand(brand)")
        span(:title="getDisplayedBrandName(brand)") {{ getDisplayedBrandName(brand) }}
        template(v-if="theme === 'brandkit'")
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
      template(v-if="defaultOption")
        div(class="horizontal-rule")
        div(class="feature-button brand-selector__brand-list__item pointer"
          :class="{'active': isDefaultSelected}"
          @click="handleSelectDefault")
          span {{ $t('NN0089') }}
</template>

<script lang="ts">
import { IBrand } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import editorUtils from '@/utils/editorUtils'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  props: {
    theme: {
      type: String,
      default: 'brandkit'
    },
    defaultOption: {
      type: Boolean,
      default: false
    }
  },
  emits: ['deleteItem'],
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
      currentBrand: 'getCurrentBrand',
      isDefaultSelected: 'getIsDefaultSelected'
    }),
    brandName(): string {
      return brandkitUtils.getDisplayedBrandName(this.currentBrand)
    },
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
      setCurrentBrand: 'SET_currentBrand',
      setIsDefaultSelected: 'SET_isDefaultSelected'
    }),
    dropdownStyles() {
      return this.isBrandListOpen ? {
        transform: 'rotate(-180deg)'
      } : {}
    },
    handleNameClick() {
      if (this.$isTouchDevice) return
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
      if (this.defaultOption) {
        this.setIsDefaultSelected(false)
      }
    },
    handleSelectDefault() {
      this.isBrandListOpen = false
      this.setIsDefaultSelected(true)
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
    handleOpenMenu() {
      if (this.$isTouchDevice) {
        editorUtils.setCurrActiveSubPanel('brand-list')
      } else {
        this.isBrandListOpen = true
      }
    },
    checkNameEnter(e: KeyboardEvent) {
      if (e.key === 'Enter' && this.editableName === this.brandName) {
        this.handleNameEditEnd()
      }
      // this.checkNameLength()
    },
    checkSelected(brand: IBrand): boolean {
      return this.currentBrand.id === brand.id && (!this.defaultOption || !this.isDefaultSelected)
    },
    checkTemp(brand: IBrand): boolean {
      return brand.id.startsWith('new_')
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
  display: flex;
  gap: 12px;
  align-items: center;
  &.brandkit-theme {
    margin-left: 12px;
  }
  &.editor-theme {
    margin-left: 2px;
  }
  &.mobile-editor-theme {
    margin-left: 1px;
    gap: 10px;
  }
  &.panel-theme {
    margin-left: 1px;
  }
  &.mobile-panel-theme {
    margin-left: 0px;
    gap: 16px;
  }
  &__brand-name {
    @include text-H4;
    line-height: unset;
    height: 39px;
    &.hover > span:hover {
      background: setColor(blue-4);
    }
    &.brandkit-theme {
      max-width: 260px;
      color: setColor(bu);
    }
    &.editor-theme {
      max-width: calc(100% - 80px);
      color: white;
      & > input {
        background-color: transparent;
      }
      &.hover > span:hover {
        color: setColor(gray-3);
      }
    }
    &.mobile-editor-theme {
      font-weight: 600;
      font-size: 18px;
      line-height: 140%;
      height: 24px;
      max-width: calc(50vw);
      color: white;
      & > span {
        padding: 0px;
      }
    }
    &.panel-theme {
      @include text-H6;
      max-width: calc(100% - 110px);
      color: white;
      height: 24px;
      & > input {
        padding: 0px;
        background-color: transparent;
      }
      & > span {
        padding: 0px;
      }
      &.hover > span {
        &:hover {
          color: setColor(gray-3);
        }
      }
    }
    &.mobile-panel-theme {
      font-weight: 600;
      font-size: 18px;
      line-height: 140%;
      height: 24px;
      max-width: calc(100% - 140px);
      color: setColor(gray-2);
      & > span {
        padding: 0px;
        cursor: initial;
      }
    }
    & > span {
      display: block;
      padding: 2px;
      cursor: text;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    & > span {
      display: block;
      cursor: text;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    & > input {
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
    &:not(.mobile):hover {
      background: setColor(blue-4);
    }
    &.editor-theme > svg,
    &.mobile-editor-theme > svg,
    &.panel-theme > svg {
      color: white;
    }
    &.mobile-panel-theme > svg {
      color: setColor(gray-2);
    }
    &.brandkit-theme > svg {
      color: setColor(bu);
    }
    &.editor-theme:not(.mobile):hover > svg,
    &.panel-theme:not(.mobile):hover > svg {
      color: setColor(gray-3);
    }
    & > svg {
      transition: transform 0.2s ease;
    }
  }
  &__brand-list {
    width: 180px;
    background-color: white;
    position: absolute;
    top: calc(100% + 12px);
    left: 0;
    border: 1px solid #d9dbe1;
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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: setColor(gray-1);
      }
      &:not(.disabled):hover {
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

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 20px);
  margin-left: auto;
  margin-right: auto;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: 0.1s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(0, -5px);
}
</style>
