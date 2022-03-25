<template lang="pug">
  div(class="list")
    div(class="list-title text-H5")
      span Design for...
    div(class="list-content")
      div(v-if="prevIcon"
        class="list-content__lefticon"
        @click="scroll(false)")
        svg-icon(iconName="chevron-left"
          iconWidth="25px"
          iconColor="gray-3")
      div(v-if="nextIcon"
        class="list-content__righticon"
        @click="scroll(true)")
        svg-icon(iconName="chevron-right"
          iconWidth="25px"
          iconColor="gray-3")
      div(class="list-content-items"
        @scroll="updateIcon"
        ref="items")
        div(v-if="type === 'theme'"
          v-for="item in contentData"
          class="list-content-items__item")
            router-link(:to="`/editor?type=new-design-size&themeId=${item.id}&width=${item.width}&height=${item.height}`")
              img(:src="item.url"
                @error="imgOnerror")
            span(class="body-SM text-gray-1") {{item.title}}
            span(class="body-XS text-gray-3") {{item.width}} x {{item.height}}
</template>

<script lang="ts">
import Vue from 'vue'
// import i18n from '@/i18n'
import themeUtils from '@/utils/themeUtils'
import _ from 'lodash'

export default Vue.extend({
  name: 'ScrollList',
  components: {
  },
  props: {
    type: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      initialed: false,
      prevIcon: false,
      nextIcon: false,
      fallbackSrc: require('@/assets/img/svg/image-preview.svg')
    }
  },
  computed: {
    contentData() {
      return _.filter(themeUtils.themes, ['mainHidden', 0])
    }
  },
  created() {
    if (this.type === 'theme') {
      themeUtils.checkThemeState()
    }
  },
  async mounted() {
    //
  },
  updated() {
    if (this.initialed) {
      return
    }
    this.updateIcon()
    this.initialed = true
  },
  methods: {
    imgOnerror(e: Event) { // what type
      (e.target as HTMLImageElement).src = this.fallbackSrc
    },
    updateIcon() {
      const items = this.$refs.items as HTMLElement
      this.prevIcon = items.scrollLeft > 0
      this.nextIcon = items.scrollLeft < (items.scrollWidth - items.offsetWidth)
    },
    scroll(next: boolean) {
      const items = this.$refs.items as HTMLElement
      items.scrollLeft += items.offsetWidth / 2 * (next ? 1 : -1)
    }
  }
})
</script>

<style lang="scss" scoped>
.list {
  &-content {
    display: flex;
    position: relative;
    align-items: center;
    &__lefticon, &__righticon {
      position: absolute;
    }
    &__lefticon {
      left: -20px;
    }
    &__righticon {
      right: -20px;
    }
    &-items {
      display: flex;
      max-width: 80vw; // ask kitty
      overflow: auto;
      @include no-scrollbar;
      &__item {
        display: flex;
        flex-direction: column;
        text-align: center;
        padding: 12px;
        a {
          width: 140px;
          height: 120px;
          img {
            width: 100px;
            height: 100px;
            &:hover {
              transition: all 0.2s ease-in-out;
              transform: translate(0, -5px);
            }
          }
        }
      }
    }
  }
}
</style>
