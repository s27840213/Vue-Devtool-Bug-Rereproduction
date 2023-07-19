<template lang="pug">
div(v-if="!$isTouchDevice()" class="overlay desktop" :class="theme")
  div(v-for="(cate, cateIndex) in data"
      :key="cate.name"
      class="overlay__category")
    component(v-if="cate.name"
        class="mx-10"
        :is="theme === 'light' ? 'CollapseTitle' : 'div'"
        :active="currCategory === cateIndex"
        @click="switchTab(cateIndex)") {{ cate.name }}
    collapse(class="overlay__collapse"
        :when="currCategory === cateIndex || !cate.name || theme !== 'light'")
      div(class="overlay__category-list")
        template(v-for="(item1d, i) in item2d(cate.items)" :key="`row${i}`")
          overlay-item(v-for="item in item1d"
            :key="item.name"
            :name="item.name"
            :baseImg="cate.baseImg"
            :mask="item.svg"
            :active="curr.name === item.name"
            :theme="theme"
            @click="applyOverlay(item)")
          div(v-if="item1d.map(it => it.name).includes(curr.name) && curr.name !== 'none'"
              class="overlay__options")
            mobile-slider(v-for="option in options" :key="option.key"
                :title="option.label"
                :value="getInputValue(option)"
                @update="(val: number)=>handleRangeInput(val, option)")
//- Mobile version
div(v-else class="overlay mobile" :class="theme")
  div(v-if="state === 'effects'" class="overlay__tabs")
    svg-icon(iconName="forbid" iconWidth="24px" iconColor="gray-2"
        @click="applyOverlay({ name: 'none', svg: null })")
    tabs(:theme="`${theme}-narrow`"
        :tabs="mobileTabs"
        v-model="currCategory")
  div(v-if="state === 'effects'" class="overlay__items")
    template(v-for="cate in mobileCategories")
      overlay-item(v-for="item in cate.items"
        :key="item.name"
        :name="item.name"
        :baseImg="cate.baseImg"
        :mask="item.svg"
        :active="curr.name === item.name"
        theme="mobile"
        @click="applyOverlay(item)")
  div(v-if="state === 'options'" class="overlay__options")
    span {{ curr.name }}
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
import { IAssetObject } from '@/interfaces/shape'
import { defineComponent, PropType } from 'vue'
import { Collapse } from 'vue-collapsed'

interface IOverlayItem {
  name: string
  svg: IAssetObject | null
}
interface IOverlayCategory {
  name: string
  baseImg: string
  items: IOverlayItem[]
}
type IOverlayList = IOverlayCategory[]

interface IOverlayOption {
  key: 'xOffset' | 'yOffset' | 'opacity'
  label: string
}

const whiteImg = `data:image/svg+xml;utf8,
  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" fill="white">
    <rect width="9" height="16"/>
  </svg>`

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
      data: [{
        name: '',
        baseImg: whiteImg,
        items: [{
          name: 'none',
          svg: null,
        }]
      }, {
        name: '復古底片',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: [{
          name: '底片1',
          svg: { id: 'mwJUpmOi7D3druWIAGL9', type: 5, ver: 1, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '底片2',
          svg: { id: 'KpEbOYf5s7PFyN9b1tXN', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '底片3',
          svg: { id: 'qiGcvTjzPFiznWBLtyVE', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '底片4',
          svg: { id: 'FnlRKgX834MkV1DMkqEV', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '底片5',
          svg: { id: 'FnlRKgX834MkV1DMkqEV', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }]
      }, {
        name: '雜訊',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: [{
          name: '雜訊1',
          svg: { id: '0LeSOE5ADC2Kt85qphhF', type: 5, ver: 1, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '雜訊2',
          svg: { id: '9LyIK80EFL7Qhf5ywyDC', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '雜訊3',
          svg: { id: 'ZICD0CJQHD45USM6h9IJ', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }]
      }, {
        name: '光芒愛心',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: [{
          name: '光芒愛心1',
          svg: { id: 'ppTVQbn90hGm18n16nDC', type: 5, ver: 1, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '光芒愛心2',
          svg: { id: 'yfVm4hFfBqWweDxKJmRw', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }, {
          name: '光芒愛心3',
          svg: { id: 'mPpIed3TS4Q3tqFJdMEY', type: 5, ver: 2, plan: 0, tags: ['復古底片效果', 'instawirhfan_復古底片效果', 'instawithfan_復古底片效果', 'film', 'films'], fit: 0 },
        }]
      }, {
        name: '填充用',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: []
      }, {
        name: '填充用',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: []
      }, {
        name: '填充用',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: []
      }, {
        name: '填充用',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: []
      }, {
        name: '填充用',
        baseImg: 'https://images.unsplash.com/photo-1604311795833-25e1d5c128c6?auto=format&fit=crop&w=627&q=80',
        items: []
      }] as IOverlayList,
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
        name: 'none',
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
      return this.data.map(category => category.name || 'All')
    },
    mobileCategories() {
      return this.data.filter((category, categoryIndex) => {
        if (this.currCategory === 0) return true
        return this.currCategory === categoryIndex
      })
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
      if (this.$isTouchDevice() && this.curr.name === item.name && item.name !== 'none') {
        this.$emit('pushHistory', this.curr.name)
      } else {
        this.curr.name = item.name
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
