<template lang="pug">
div(class="bleed-settings")
  div(v-for="bleed in bleedsToShow" class='bleed-settings__item')
    div(class='bleed-settings__item__label')
      span(class="body-XS text-gray-2") {{bleed.label}}
    div(v-if="!$isTouchDevice()" class='bleed-settings__item__input')
      div(class='bleed-settings__item__input__icon pointer'
          @click="addBleed(bleed.key, bleedStep, isLocked)")
        svg-icon(iconName="chevron-up"
          iconWidth="14px"
          iconColor="gray-2")
      div(class='bleed-settings__item__input__icon pointer'
          @click="addBleed(bleed.key, -bleedStep, isLocked)")
        svg-icon(iconName="chevron-up"
          iconWidth="14px"
          iconColor="gray-2"
          :style="{transform: 'scaleY(-1)'}")
      div(class='bleed-settings__item__input__value body-XS' @click="handleBleedInputClick(bleed.key)")
        input(type="text" inputmode="decimal" min="0" :ref="'bleed-' + bleed.key"
              :value="bleed.value"
              @input="setBleed($event, bleed.key, isLocked)"
              @blur="handleBleedSubmit()"
              @keyup="handleBleedSubmit")
        span(class='text-gray-3') {{pageUnit}}
    div(v-else class='bleed-settings__item__input mobile')
      div(class='bleed-settings__item__input__icon pointer mobile'
          @touchstart="addBleed(bleed.key, -bleedStep, isLocked)")
          svg-icon(iconName="minus-small"
            iconWidth="14px"
            iconColor="gray-2"
            :style="{transform: 'scaleY(-1)'}")
      div(class='bleed-settings__item__input__value body-XS mobile' @click="handleBleedInputClick(bleed.key)")
        input(type="text" inputmode="decimal" min="0" :ref="'bleed-' + bleed.key"
              :value="bleed.value"
              @input="setBleed($event, bleed.key, isLocked)"
              @blur="handleBleedSubmit()"
              @keyup="handleBleedSubmit")
        span(class='text-gray-3') {{pageUnit}}
      div(class='bleed-settings__item__input__icon pointer mobile'
          @touchstart="addBleed(bleed.key, bleedStep, isLocked)")
        svg-icon(iconName="plus-small"
          iconWidth="14px"
          iconColor="gray-2")
  div(class="bleed-settings__lock-icon")
    div(class="bleed-settings__lock-icon__box"
        :style="isLocked ? {background: '#E7EFFF'} : {}")
      svg-icon(class="pointer"
              :iconName="isLocked ? 'lock' : 'unlock'"
              iconWidth="15px"
              iconColor="gray-2"
              @click="toggleLock()")
</template>

<script lang="ts">
import { IBleed, IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import unitUtils, { PRECISION } from '@/utils/unitUtils'
import { floor, isEqual, round } from 'lodash'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    page: {
      type: Object as PropType<IPage>,
      required: true
    }
  },
  data() {
    return {
      isLocked: true,
      bleeds: pageUtils.getPageDefaultBleeds(),
      bleedsToShow: {
        top: {
          key: 'top',
          label: `${this.$t('NN0781')}`,
          value: ''
        },
        bottom: {
          key: 'bottom',
          label: `${this.$t('NN0782')}`,
          value: ''
        },
        left: {
          key: 'left',
          label: `${this.$t('NN0783')}`,
          value: ''
        },
        right: {
          key: 'right',
          label: `${this.$t('NN0784')}`,
          value: ''
        }
      } as {[index: string]: {key: string, label: string, value: string}}
    }
  },
  mounted: function () {
    Object.keys(this.currentPageBleeds).forEach(key => {
      this.bleeds[key] = this.currentPageBleeds[key]
      this.bleedsToShow[key].value = round(this.currentPageBleeds[key], this.precision).toString()
    })
  },
  watch: {
    currentPageBleeds: function (newVal, oldVal) {
      if (isEqual(newVal, oldVal)) return
      Object.keys(newVal).forEach(key => {
        if (parseFloat(this.bleedsToShow[key].value) === newVal[key]) return // prevent decimal point from remove for float without decimal numbers during input
        if (this.bleedsToShow[key].value === '' && newVal[key] === 0) return // prevent input from set to zero when delete last digit
        this.bleeds[key] = newVal[key]
        this.bleedsToShow[key].value = round(newVal[key], this.precision).toString()
      })
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      groupType: 'getGroupType',
      pagesLength: 'getPagesLength',
    }),
    currentPageBleeds(): IBleed {
      const { page } = this
      let bleeds = page?.physicalBleeds ?? page?.bleeds
      bleeds = {
        top: this.groupType === 1 ? this.getPage(0).physicalBleeds?.top ?? this.getPage(0).bleeds?.top ?? 0 : bleeds.top,
        bottom: this.groupType === 1 ? this.getPage(this.pagesLength - 1).physicalBleeds?.bottom ?? this.getPage(this.pagesLength - 1).bleeds?.bottom ?? 0 : bleeds.bottom,
        left: bleeds.left,
        right: bleeds.right
      }
      return bleeds
    },
    pageUnit(): string {
      return pageUtils.currFocusPage.unit
    },
    bleedStep(): number {
      switch (this.page.unit) {
        case 'px':
          return 1
        case 'cm':
          return 0.1
        case 'mm':
          return 1
        case 'in':
          return 0.04
        default:
          return 1
      }
    },
    precision(): number {
      return this.page.unit === 'px' ? 0 : PRECISION
    }
  },
  methods: {
    toggleLock() {
      this.isLocked = !this.isLocked
    },
    maxBleed(key: string) {
      const dpi = unitUtils.getConvertDpi(pageUtils.currFocusPageSize)
      const unit = this.page.unit
      return unit === 'px' ? pageUtils.MAX_BLEED.px : floor(unitUtils.convert(pageUtils.MAX_BLEED.mm, 'mm', unit, (key === 'left' || key === 'right') ? dpi.width : dpi.height), this.precision)
    },
    setBleed(evt: Event, key: string, all = false) {
      const value = (evt.target as HTMLInputElement).value.replace(/^0+(\d)/, '$1') // remove leading zeros
      const isValidNumber = this.page.unit === 'px' ? this.isInt(value) : this.isFloat(value)
      if (!isValidNumber) {
        this.$forceUpdate()
        return
      }

      // round and cap input value
      const numValue = parseFloat(value)
      const numBleed = Math.min(round(numValue, this.precision), this.maxBleed(key))
      const isFixed = numValue !== numBleed
      const strBleed = isFixed && !isNaN(numBleed) ? numBleed.toString() : value

      // update state
      this.bleeds[key] = numBleed
      this.bleedsToShow[key].value = strBleed
      if (all) {
        Object.keys(this.bleeds).forEach((key) => {
          this.bleeds[key] = numBleed
          this.bleedsToShow[key].value = strBleed
        })
      }
      this.$forceUpdate()
      this.applyBleeds(key, all)
    },
    addBleed(key: string, value: number, all = false) {
      const numBleed = Math.min(Math.max(round(this.bleeds[key] + value, this.precision), 0), this.maxBleed(key))
      const strBleed = this.bleeds[key].toString()
      if (all) {
        Object.keys(this.bleeds).forEach((key) => {
          this.bleeds[key] = numBleed
          this.bleedsToShow[key].value = strBleed
        })
      } else {
        this.bleeds[key] = numBleed
        this.bleedsToShow[key].value = strBleed
      }
      this.applyBleeds(key, all)
      stepsUtils.record()
    },
    applyBleeds(key: string, all: boolean) {
      // resize all bleeds of all pages if is email marketing design
      if (this.groupType === 1 && pageUtils.pageNum > 1) {
        if (!all && (key === 'top' || key === 'bottom')) {
          const pageIndex = key === 'top' ? 0 : this.pagesLength - 1
          pageUtils.setBleeds(pageIndex, {
            top: key === 'top' ? this.bleeds.top : 0,
            bottom: key === 'bottom' ? this.bleeds.bottom : 0,
            left: this.bleeds.left,
            right: this.bleeds.right
          })
        } else {
          for (let pageIndex = 0; pageIndex < this.pagesLength; pageIndex++) {
            pageUtils.setBleeds(pageIndex, {
              top: pageIndex === 0 ? this.bleeds.top : 0,
              bottom: pageIndex === this.pagesLength - 1 ? this.bleeds.bottom : 0,
              left: this.bleeds.left,
              right: this.bleeds.right
            })
          }
        }
      } else pageUtils.setBleeds(pageUtils.currFocusPageIndex, this.bleeds)
    },
    handleBleedSubmit(evt?: KeyboardEvent) {
      if (!evt || evt.key === 'Enter') {
        Object.keys(this.bleeds).forEach(key => {
          if (isNaN(this.bleeds[key])) this.bleeds[key] = 0
          this.bleedsToShow[key].value = this.bleeds[key].toString() // remove decimal point from float without decimal numbers
        })
        stepsUtils.record()
      }
    },
    handleBleedInputClick(key: string) {
      (this.$refs['bleed-' + key] as HTMLElement[])[0].focus()
    },
    isFloat(val: string) {
      if (val === '') return true
      const floatRegex = /^\d+(?:[.]\d*?)?$/
      if (!floatRegex.test(val)) { return false }

      const numVal = parseFloat(val)
      if (isNaN(numVal)) { return false }
      return true
    },
    isInt(val: string) {
      if (val === '') return true
      const intRegex = /^\d*$/
      if (!intRegex.test(val)) { return false }

      const intVal = parseInt(val, 10)
      return parseFloat(val) === intVal && !isNaN(intVal)
    }
  }
})
</script>

<style lang="scss" scoped>
.bleed-settings {
  display: grid;
  grid-template-columns: 1fr 1fr 24px;
  gap: 8px;
  &__item {
    &__label {
      height: 22px;
      display: flex;
      align-items: center;
    }
    &__input {
      border: 1px solid setColor(gray-4);
      border-radius: 4px;
      display: grid;
      grid-template-columns: 30px auto;
      overflow: hidden;
      &__icon {
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 1px solid setColor(gray-4);
        &:active {
          background: setColor(blue-4);
        }
        &.mobile {
          height: 100%;
          border: none;
        }
      }
      &__value {
        padding: 6px;
        grid-row: 1 / span 2;
        grid-column: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        &.mobile {
          grid-row: 1;
          grid-column: 2;
          border-left: 1px solid setColor(gray-4);
          border-right: 1px solid setColor(gray-4);
        }
      }
      &.mobile {
        grid-template-columns: 30px auto 30px;
      }
    }
  }
  &__lock-icon {
    grid-row: 1 / span 2;
    grid-column: 3;
    display: flex;
    align-items: center;
    padding-top: 22px;
    &__box {
      box-sizing: border-box;
      width: 24px;
      height: 24px;
      border: 1px solid setColor(gray-4);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
