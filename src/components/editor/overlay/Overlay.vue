<template lang="pug">
div(v-if="theme !== 'mobile'" class="overlay" :class="theme")
  div(v-for="cate in fakeData"
      :key="cate.name"
      class="overlay__category")
    component(v-if="cate.name"
        class="overlay__category-name"
        :is="theme === 'light' ? 'CollapseTitle' : 'span'"
        :selected="currCategory === cate.name"
        @click="switchTab(cate.name)") {{ cate.name }}
    collapse(class="overlay__collapse"
        :when="currCategory === cate.name || !cate.name || theme !== 'light'")
      div(class="overlay__category-list")
        overlay-item(v-for="item in cate.items"
          :key="item.name"
          :name="item.name"
          :baseImg="cate.baseImg"
          :mask="item.svg"
          :active="currOverlay === item.name"
          :theme="theme"
          @click="applyOverlay(item)")
</template>

<script lang="ts">
import OverlayItem from '@/components/editor/overlay/OverlayItem.vue'
import CollapseTitle from '@/components/global/CollapseTitle.vue'
import { IAssetObject } from '@/interfaces/shape'
import { defineComponent, PropType } from 'vue'
import { Collapse } from 'vue-collapsed'

interface IOverlayItem {
  name: string
  svg: IAssetObject
}
interface IOverlayCategory {
  name: string
  baseImg: string
  items: IOverlayItem[]
}
type IOverlayList = IOverlayCategory[]

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
  },
  props: {
    theme: {
      type: String as PropType<'dark' | 'light' | 'mobile'>,
      default: 'dark',
    },
  },
  data() {
    return {
      fakeData: [{
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
      }] as IOverlayList,
      currOverlay: 'none',
      currCategory: '',
    }
  },
  // computed: {
  // },
  // mounted() {
  // },
  methods: {
    switchTab(categoryName: string) {
      this.currCategory = this.currCategory === categoryName ? '' : categoryName
    },
    applyOverlay(item: IOverlayItem) {
      this.currOverlay = item.name
    },
  }
})
</script>

<style lang="scss" scoped>
.overlay {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 0 10px 0;
  box-sizing: border-box;
  height: 100%;
  text-align: left;
  &__category-name {
    margin: 0 10px;
  }
  &__collapse {
    transition: all calc(var(--vc-auto-duration) * 1.5) ease-in-out;
  }
  // To prevent the border of OverlayItem to be clipped, put padding inside collapse.
  &__category-list {
    display: grid;
    padding: 10px 10px 0 10px;
    row-gap: 10px;
  }
}

// Handle RWD and theme
.dark.overlay {
  @include hover-scrollbar(dark);
  color: white;
  .overlay__category-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 30px;
  }
}
.light.overlay {
  color: setColor(gray-2);
  background-color: setColor(gray-6);
  .overlay__category-list {
    grid-template-columns: repeat(4, 44px);
    column-gap: calc((100% - 44px * 4) / 3);
  }
}
</style>
