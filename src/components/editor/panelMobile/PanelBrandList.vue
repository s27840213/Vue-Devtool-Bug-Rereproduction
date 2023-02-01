<template lang="pug">
div(class="panel-brand-list" :class="{'new-brand': lastHistory === 'new-brand'}")
  template(v-if="inInitialState")
    div(class="panel-brand-list__brands-wrapper")
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
      div(class="panel-brand-list__add-brand" @click.stop.prevent="addNewBrand")
        div(class="panel-brand-list__add-brand__icon")
          svg-icon(iconName="plus-origin" iconColor="gray-2" iconWidth="16px")
        span(class="panel-brand-list__add-brand__text") {{ $t('NN0396') }}
  template(v-if="lastHistory === 'new-brand'")
    div(class="panel-brand-list__name-editor")
      input(ref="name"
            class="panel-brand-list__input"
            :placeholder="$t('NN0713')"
            v-model="editableName"
            @change="handleNewBrand")
      div(v-if="editableName.length" class="panel-brand-list__icon" @click.stop="handleClearNewBrandName")
        svg-icon(iconName="close" iconColor="gray-3" iconWidth="24px")
    div(class="panel-brand-list__confirm"
        :class="{disabled: !editableName.length}"
        @click.stop="handleNewBrand") {{ $t('NN0396') }}
</template>

<script lang="ts">
import { IBrand } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import editorUtils from '@/utils/editorUtils'
import Vue, { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  data() {
    return {
      editableName: '',
      brandBuffer: undefined as undefined | IBrand,
      isDestroyed: false
    }
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    defaultOption: {
      type: Boolean,
      default: false
    },
    hasAddBrand: {
      type: Boolean,
      default: false
    }
  },
  emits: ['pushHistory', 'back'],
  unmounted() {
    this.isDestroyed = true
  },
  computed: {
    ...mapGetters('brandkit', {
      brands: 'getBrands',
      currentBrandId: 'getCurrentBrandId',
      isDefaultSelected: 'getIsDefaultSelected'
    }),
    historySize(): number {
      return this.panelHistory.length
    },
    inInitialState(): boolean {
      return this.historySize === 0
    },
    lastHistory(): string {
      return this.panelHistory[this.historySize - 1]
    }
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
    },
    addNewBrand() {
      this.editableName = ''
      this.$emit('pushHistory', 'new-brand')
    },
    handleNewBrand() {
      setTimeout(() => {
        if (!this.editableName.length || this.isDestroyed) return
        const brandName = this.editableName
        this.editableName = ''
        brandkitUtils.addNewBrand(brandName)
        this.$emit('back')
      }, 500)
    },
    handleClearNewBrandName() {
      this.editableName = ''
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-brand-list {
  padding: 6px 0 0 0;
  &__brands-wrapper {
    @include no-scrollbar;
    height: 184px;
    overflow-y: auto;
  }
  &__brands {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  &__brand-item {
    height: 40px;
    padding: 0 16px 0 24px;
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
    padding: 16px 0 16px 28px;
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
  &.new-brand {
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 16px;
  }
  &__name-editor {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6.5px 8px 6.5px 15px;
    height: 42px;
    border: 1px solid #D9DBE1;
    border-radius: 3px;
    box-sizing: border-box;
    margin-bottom: 16px;
  }
  &__input {
    padding: 0;
    font-weight: 500;
    font-size: 16px;
    line-height: 180%;
    color: setColor(gray-2);
    &::placeholder {
      color: setColor(gray-4);
    }
  }
  &__icon {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__confirm {
    display: flex;
    align-items: center;
    justify-content: center;
    background: setColor(blue-1);
    border-radius: 5px;
    height: 42px;
    font-weight: 500;
    font-size: 14px;
    line-height: 180%;
    color: white;
    margin-top: 8px;
    &.disabled {
      background: setColor(gray-5);
      color: setColor(gray-3);
    }
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 30px);
  margin-left: auto;
  margin-right: auto;
}
</style>
