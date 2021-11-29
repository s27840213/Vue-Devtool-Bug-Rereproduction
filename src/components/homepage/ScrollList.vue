<template lang="pug">
  div(class="scroll-list")
    div(v-if="prevIcon"
      class="scroll-list-move scroll-list-move-left"
      @click="handlePrev")
      div
        svg-icon(iconName="chevron-left"
          iconWidth="40px"
          iconColor="gray-3")
    div(v-if="nextIcon"
      class="scroll-list-move scroll-list-move-right"
      @click="handleNext")
      div
        svg-icon(iconName="chevron-right"
          iconWidth="40px"
          iconColor="gray-3")
    div(class="px-10 scroll-list__items"
      :class="{'items-theme': type === 'theme'}"
      @scroll="handleScroll" ref="items")
      template(v-if="type === 'design'")
        design-item(v-for="design in list"
          class="py-20 scroll-list__item"
          :key="design.id"
          :config="design")
        div(v-if="isLoading")
            svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
        template(v-if="!isLoading && list.length === 0")
          div(class="pt-20 pointer scroll-list__plus")
            img(:src="require('@/assets/img/png/plus-origin.png')"
              @click="newDesignSquare()")
            div(class="pt-10 scroll-list__item-title") 點我製作
          div(class="scroll-list__hint") 來設計自己第一款模板吧！肯定很有趣！
      template(v-else)
        div(v-if="type === 'theme'"
          class="pointer scroll-list__plus")
          img(:src="require('@/assets/img/png/plus-origin.png')"
            @click="openPopup()")
          div(class="pt-10 scroll-list__item-title") 自訂尺寸
        div(v-for="item, idx in list" class="scroll-list__item py-10"
          :class="{'pb-70 item-theme': type === 'theme'}")
          img(class="pointer scroll-list__item-image"
            :class="{'square': type === 'template'}"
            :src="fallbackSrc || (type === 'theme' ? item.url : `https://template.vivipic.com/template/${item.id}/prev_2x?ver=${item.ver}`)"
            @click="type === 'theme' ? newDesign(item) : goToPage('Editor')"
            @error="handleNotFound")
          div(v-if="type === 'theme'"
            class="pt-10 scroll-list__item-title") {{item.title}}
          div(v-if="type === 'theme'"
            class="pt-2 scroll-list__item-subtitle") {{item.description}}
</template>
<script lang="ts">
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'
import DesignItem from '@/components/homepage/DesignItem.vue'
import Vue from 'vue'

export default Vue.extend({
  components: {
    DesignItem
  },
  props: {
    list: Array,
    type: String,
    isLoading: Boolean
  },
  data() {
    return {
      prevIcon: false,
      nextIcon: false,
      fallbackSrc: ''
    }
  },
  computed: {
    items() {
      return this.$refs.items as HTMLElement
    }
  },
  updated() {
    const { scrollWidth, offsetWidth } = this.items
    this.nextIcon = scrollWidth > offsetWidth
  },
  methods: {
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    goToPage(pageName: string) {
      this.$router.push({ name: pageName })
    },
    newDesign(item: Itheme) {
      this.$router.push({ name: 'Editor' }).then(() => {
        designUtils.newDesign(item.width, item.height)
      })
    },
    newDesignSquare() {
      this.$router.push({ name: 'Editor' }).then(() => {
        designUtils.newDesign(1080, 1080)
      })
    },
    handleNext() {
      const { scrollLeft, offsetWidth } = this.items
      this.items.scrollLeft = scrollLeft + (offsetWidth / 2)
    },
    handlePrev() {
      const { scrollLeft, offsetWidth } = this.items
      this.items.scrollLeft = scrollLeft - (offsetWidth / 2)
    },
    handleScroll(event: Event) {
      const { scrollLeft } = event.target as HTMLElement
      this.handleIconDisplay(scrollLeft)
    },
    handleIconDisplay(left = 0) {
      const { scrollWidth, offsetWidth } = this.items
      this.prevIcon = left > 0
      this.nextIcon = left < (scrollWidth - offsetWidth)
    },
    openPopup() {
      this.$emit('openPopup')
    }
  }
})
</script>
<style lang="scss" scoped>
.scroll-list {
  $this: &;
  position: relative;
  &__items {
    display: grid;
    column-gap: 30px;
    grid-template-columns: auto;
    justify-content: start;
    align-items: center;
    grid-auto-flow: column;
    scroll-behavior: smooth;
    overflow-x: scroll;
    overflow-y: hidden;
    text-align: left;
    &.items-theme {
      @include layout-mobile {
        column-gap: 0px;
      }
    }
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &__plus {
    width: 100px;
    text-align: center;
    @media (min-width: 976px) {
      width: 140px;
    }
    @media (min-width: 1260px) {
      width: 170px;
    }
    @media (min-width: 1560px) {
      width: 200px;
    }
    > img {
      @include layout-mobile {
        width: 60%;
      }
      &:hover {
        transition: all 0.2s ease-in-out;
        box-shadow: 5px 5px 10px 0 rgba(48, 55, 66, 0.15);
        transform: translate(0, -10px);
      }
    }
  }
  &__hint {
    font-size: 16px;
    color: setColor(gray-2);
    @include layout-mobile {
      font-size: 12px;
    }
  }
  &__item {
    width: 100px;
    height: 100px;
    text-align: center;
    @include layout-mobile {
      width: 35vw;
      height: 35vw;
    }
    @media (min-width: 976px) {
      width: 140px;
      height: 140px;
    }
    @media (min-width: 1260px) {
      width: 170px;
      height: 170px;
    }
    @media (min-width: 1560px) {
      width: 200px;
      height: 200px;
    }
    &-title {
      font-size: 16px;
      line-height: 26px;
      font-weight: 400;
      padding-top: 10px;
      @media (max-width: 976px) {
        font-size: 14px;
      }
      @include layout-mobile {
        font-size: 14px;
      }
    }
    &-subtitle {
      color: setColor(gray-2);
      font-size: 14px;
      line-height: 22px;
      font-weight: 400;
      @include layout-mobile {
        font-size: 12px;
      }
    }
    &-image {
      height: 100%;
      &:hover {
        transition: all 0.2s ease-in-out;
        transform: translate(0, -5px);
      }
    }
    .square {
      width: 100%;
      object-fit: contain;
      box-shadow: 0 2px 4px rgb(0 0 0 / 10%), 0 0 4px rgb(0 0 0 / 10%);
      &:hover {
        transition: all 0.2s ease-in-out;
        box-shadow: 5px 5px 10px 2px rgba(48, 55, 66, 0.15);
        transform: translate(0, -5px);
      }
    }
    &.item-theme {
      @include layout-mobile {
        height: 45vw;
      }
    }
  }
  &-icon {
    display: flex;
    background: #ffffff;
    border-radius: 50%;
    position: relative;
    box-shadow: 0px 3px 10px rgba(78, 171, 230, 0.3);
  }
  &-move {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    z-index: 1;
    cursor: pointer;
    &-left {
      left: -75px;
      @include layout-mobile {
        left: -5%;
        width: 50px;
        background: linear-gradient(90deg, #FFFFFF 60%, rgba(255, 255, 255, 0) 100%);
      }
    }
    &-right {
      right: -75px;
      @include layout-mobile {
        justify-content: end;
        right: -5%;
        width: 50px;
        background: linear-gradient(270deg, #FFFFFF 60%, rgba(255, 255, 255, 0) 100%);
      }
    }
  }
}
</style>
