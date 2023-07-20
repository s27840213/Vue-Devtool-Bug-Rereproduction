<template lang="pug">
div(v-if="!$isTouchDevice()" class="overlay desktop" :class="theme")
  div(v-for="(cate, cateIndex) in data"
      :key="cate.id"
      class="overlay__category")
    component(v-if="cate.id"
        class="mx-10"
        :is="theme === 'light' ? 'CollapseTitle' : 'div'"
        :active="currCategory === cateIndex"
        @click="switchTab(cateIndex)") {{ cate.label }}
    collapse(class="overlay__collapse"
        :when="currCategory === cateIndex || !cate.id || theme !== 'light'")
      div(class="overlay__category-list")
        template(v-for="(item1d, i) in item2d(cate.items)" :key="`row${i}`")
          overlay-item(v-for="item in item1d"
            :key="item.id"
            :name="item.label"
            :baseImg="cate.baseImg"
            :mask="item.svg"
            :active="curr.id === item.id"
            :theme="theme"
            @click="applyOverlay(item)")
          div(v-if="item1d.map(it => it.id).includes(curr.id) && curr.id !== 'none'"
              class="overlay__options")
            mobile-slider(v-for="option in options" :key="option.key"
                :title="option.label"
                :value="getInputValue(option)"
                @update="(val: number)=>handleRangeInput(val, option)")
//- Mobile version
div(v-else class="overlay mobile" :class="theme")
  div(v-if="state === 'effects'" class="overlay__tabs")
    svg-icon(iconName="forbid" iconWidth="24px" iconColor="gray-3"
        @click="applyOverlay(data[0].items[0])")
    tabs(:theme="`${theme}-narrow`"
        :tabs="mobileTabs"
        v-model="currCategory")
  div(v-if="state === 'effects'" class="overlay__items")
    template(v-for="cate in mobileCategories")
      overlay-item(v-for="item in cate.items"
        :key="item.id"
        :name="item.label"
        :baseImg="cate.baseImg"
        :mask="item.svg"
        :active="curr.id === item.id"
        theme="mobile"
        @click="applyOverlay(item)")
  div(v-if="state === 'options'" class="overlay__options")
    span {{ currOverlayName }}
    mobile-slider(v-for="option in options" :key="option.key"
        :title="option.label"
        :value="getInputValue(option)"
        @update="(val: number)=>handleRangeInput(val, option)")
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import OverlayItem from '@/components/editor/overlay/OverlayItem.vue'
import CollapseTitle from '@/components/global/CollapseTitle.vue'
import Tabs from '@/components/Tabs.vue'
import overlayUtils, { IOverlayItem } from '@/utils/overlayUtils'
import { find } from 'lodash'
import { defineComponent, PropType } from 'vue'
import { Collapse } from 'vue-collapsed'

interface IOverlayOption {
  key: 'xOffset' | 'yOffset' | 'opacity'
  label: string
}

export default defineComponent({
  name: 'Overlay',
  components: {
    OverlayItem,
    Collapse,
    CollapseTitle,
    MobileSlider,
    Tabs,
  },
  props: {
    theme: {
      type: String as PropType<'dark' | 'light'>,
      default: 'dark',
    },
    panelHistory: {
      type: Array as PropType<string[]>,
      default: [] as string[]
    },
  },
  data() {
    return {
      data: overlayUtils.overlayCategories,
      options: [{
        key: 'xOffset',
        label: this.$t('NN0425')
      }, {
        key: 'yOffset',
        label: this.$t('NN0426')
      }, {
        key: 'opacity',
        label: this.$t('NN0066')
      }] as IOverlayOption[],
      currCategory: 0,
      curr: {
        id: 'none',
        xOffset: 50,
        yOffset: 50,
        opacity: 50,
      }
    }
  },
  computed: {
    state() {
      return this.panelHistory.length === 0 ? 'effects' : 'options'
    },
    mobileTabs() {
      return this.data.map(category => category.label || this.$t('NN0324'))
    },
    mobileCategories() {
      return this.data.filter((category, categoryIndex) => {
        if (this.currCategory === 0) return true // Filter: all
        return this.currCategory === categoryIndex
      })
    },
    currOverlayName() {
      return find(this.data.flatMap(cate => cate.items), ['id', this.curr.id])?.label || ''
    },
  },
  // mounted() {
  // },
  methods: {
    item2d(items: IOverlayItem[]) {
      const newArr = [] as IOverlayItem[][]
      const amountInRow = this.theme === 'dark' ? 3 : 4
      for (let i = 0; i < items.length; i += amountInRow) {
        newArr.push(items.slice(i, i + amountInRow))
      }
      return newArr
    },
    getInputValue(option: IOverlayOption) {
      return this.curr[option.key]
    },
    switchTab(categoryIndex: number) {
      this.currCategory = this.currCategory === categoryIndex ? 0 : categoryIndex
    },
    applyOverlay(item: IOverlayItem) {
      if (this.$isTouchDevice() && this.curr.id === item.id && item.id !== 'none') {
        this.$emit('pushHistory', this.currOverlayName)
      } else {
        Object.assign(this.curr, { id: item.id }, item.preset)
      }
    },
    handleRangeInput(val: number, option: IOverlayOption) {
      this.curr[option.key] = val
    },
  }
})
</script>

<style lang="scss" scoped>
.desktop.overlay {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 0 10px 0;
  box-sizing: border-box;
  height: 100%;
  text-align: left;
  .overlay__collapse {
    transition: all calc(var(--vc-auto-duration) * 1.5) ease-in-out;
  }
  // To prevent the border of OverlayItem to be clipped, put padding inside collapse.
  .overlay__category-list {
    display: grid;
    padding: 10px 10px 0 10px;
    row-gap: 10px;
  }
}

// Common CSS for both mobile and desktop.
.overlay__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// Handle RWD and theme for desktop.
.dark.desktop.overlay {
  @include hover-scrollbar(dark);
  @include body-MD;
  color: white;
  .overlay__category-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 30px;
  }
  .overlay__options {
    grid-column: 1 / 4;
    .mobile-slider {
      color: white;
    }
    &:deep(.mobile-slider__number) {
      color: setColor(gray-1);
      background-color: white;
    }
  }
}
.light.desktop.overlay {
  @include body-SM;
  color: setColor(gray-2);
  background-color: setColor(gray-6);
  .overlay__category-list {
    grid-template-columns: repeat(4, 44px);
    column-gap: calc((100% - 44px * 4) / 3);
  }
  .overlay__options {
    grid-column: 1 / 5;
    padding: 10px;
    background-color: white;
  }
}

// Mobile version
.mobile.overlay {
  @include body;
  font-size: 10px; // body-XXS without scale, only for Safari, will be 12px at Chrome.
  padding: 0;
  .overlay__tabs {
    display: grid;
    align-items: center;
    grid-template-columns: auto 1fr;
    padding: 8px 16px;
    gap: 16px;
    .tabs {
      @include no-scrollbar;
      overflow-x: auto;
    }
  }
  .overlay__items {
    @include no-scrollbar;
    display: grid;
    grid-auto-columns: 44px;
    grid-auto-flow: column;
    gap: 10px;
    padding: 10px 16px;
    overflow-x: auto;
    .overlay-item {
      height: 76px;
    }
  }
  .overlay__options {
    @include body-MD;
    padding: 0 16px 16px 16px;
  }
  &.light {
    .overlay__tabs, .overlay__items{
      background-color: setColor(gray-6);
    }
  }
}
</style>
