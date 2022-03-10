<template lang="pug">
  div(class="scroll-list")
    div(v-if="prevIcon"
      class="scroll-list-move scroll-list-move-left"
      @click="handlePrev")
      div(class="scroll-list-move__icon")
        svg-icon(iconName="chevron-left"
          iconWidth="25px"
          iconColor="gray-3")
    div(v-if="nextIcon"
      class="scroll-list-move scroll-list-move-right"
      @click="handleNext")
      div(class="scroll-list-move__icon")
        svg-icon(iconName="chevron-left"
          iconWidth="25px"
          iconColor="gray-3")
    div(class="scroll-list__items"
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
            div(class="scroll-list__item-title") {{$t('NN0354')}}
          div(class="scroll-list__hint") {{$t('NN0355')}}
      template(v-else)
        div(v-if="type === 'theme'"
          class="pointer scroll-list__plus padding-start")
          img(:src="require('@/assets/img/png/plus-origin.png')"
            @click="openPopup()")
          div(class="scroll-list__plus-title") {{$t('NN0023')}}
        div(v-for="item, idx in list" class="scroll-list__item"
          :class="{'padding-end': idx === list.length - 1}")
          img(class="pointer scroll-list__item-image"
            :class="{'square': type === 'template'}"
            :src="fallbackSrc || (type === 'theme' ? item.url : `https://template.vivipic.com/template/${item.id}/prev_2x?ver=${item.ver}`)"
            @click="type === 'theme' ? newDesign(item) : newDesignWithTemplate(item)"
            @error="handleNotFound")
          div(v-if="type === 'theme'"
            class="pt-10 scroll-list__item-title") {{item.title}}
          div(v-if="type === 'theme'"
            class="pt-2 scroll-list__item-subtitle") {{item.description}}
        div(v-if="isLoading || list.length === 0")
            svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
</template>
<script lang="ts">
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'
import gtmUtils from '@/utils/gtmUtils'
import DesignItem from '@/components/homepage/DesignItem.vue'
import Vue from 'vue'
import { mapMutations } from 'vuex'

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
  mounted() {
    this.initIcon(1)
  },
  methods: {
    ...mapMutations({
      setGroupType: 'SET_groupType'
    }),
    initIcon(times = 0) {
      const { scrollWidth, offsetWidth } = this.items
      if (scrollWidth === offsetWidth && times < 10) {
        setTimeout(() => {
          this.initIcon(times + 1)
        }, 500)
      }
      this.nextIcon = scrollWidth > offsetWidth
    },
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    newDesignWithTemplate(template: any) {
      console.log(template)
      const query = {
        type: 'new-design-template',
        design_id: template.match_cover.id,
        width: template.match_cover.width,
        height: template.match_cover.height
      }
      if (template.group_type === 1) {
        // 判斷電商詳情頁模板
        query.type = 'product-page-template'
        query.design_id = template.group_id
      }
      const route = this.$router.resolve({
        name: 'Editor',
        query
      })

      window.open(route.href, '_blank')

      // // trigger newDesign method to reset the template themes. [Giambi 12/03]
      // this.$router.push({ name: pageName }).then(() => {
      //   designUtils.newDesign()
      // })
    },
    newDesign(item: Itheme) {
      designUtils.newDesignWithLoginRedirect(item.width, item.height, item.id)
    },
    newDesignSquare() {
      designUtils.newDesignWithLoginRedirect()
    },
    handleNext() {
      const { scrollLeft, offsetWidth } = this.items
      this.items.scrollLeft = scrollLeft + (offsetWidth / 2)
      this.handleIconDisplay(scrollLeft)
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
    column-gap: 40px;
    grid-template-columns: auto;
    justify-content: start;
    grid-auto-flow: column;
    scroll-behavior: smooth;
    overflow-x: scroll;
    overflow-y: hidden;
    padding-top: 10px;
    padding-bottom: 10px;
    @media screen and (max-width: 768px) {
      column-gap: 20px;
    }
    @media screen and (min-width: 1600px) {
      justify-content: center;
    }
    @include no-scrollbar;
  }
  &__plus {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90px;
    white-space: nowrap;
    margin: auto;
    @media screen and (max-width: 768px) {
      width: 56px;
    }
    > img {
      width: 100%;
      &:hover {
        transition: all 0.2s ease-in-out;
        box-shadow: 5px 5px 10px 0 rgba(48, 55, 66, 0.15);
        transform: translate(0, -10px);
      }
    }
    &-title {
      padding-top: 10px;
      @include body-SM;
      @media screen and (max-width: 768px) {
        @include body-XS;
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
    width: 120px;
    text-align: center;
    @media screen and (max-width: 768px) {
      width: 100px;
    }
    @media screen and (max-width: 540px) {
      width: 90px;
    }
    &-title {
      color: setColor(gray-1);
      padding-top: 5px;
      @include body-XS;
    }
    &-subtitle {
      color: setColor(gray-2);
      @include body-XXS;
    }
    &-image {
      width: 100%;
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
    bottom: -2px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 50px;
    z-index: 1;
    cursor: pointer;
    background: #ffffff;
    &__icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 36px;
      height: 36px;
    }
    &-left {
      left: -2px;
      @include layout-mobile {
        display: none;
      }
    }
    &-right {
      right: -2px;
      transform: matrix(-1, 0, 0, 1, 0, 0);
      @include layout-mobile {
        display: none;
      }
    }
  }
}
.padding-start {
  @media screen and (max-width: 768px) {
    padding-left: 24px;
  }
}
.padding-end {
  @media screen and (max-width: 768px) {
    padding-right: 24px;
  }
}
</style>
