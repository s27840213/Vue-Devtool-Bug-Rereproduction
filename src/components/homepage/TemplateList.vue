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
        design-item(v-for="design, idx in designList"
          class="py-20 scroll-list__design"
          :class="{'padding-start': idx === 0, 'padding-end': idx === designList.length - 1}"
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
            div(class="pt-10 scroll-list__item-title") {{$t('NN0354')}}
          div(class="scroll-list__hint") {{$t('NN0355')}}
      template(v-else)
        div(v-if="type === 'theme'"
          class="pointer scroll-list__plus")
          img(:src="require('@/assets/img/png/plus-origin.png')"
            @click="openPopup()")
          div(class="pt-10 scroll-list__item-title") {{$t('NN0023')}}
        div(v-for="item, idx in list"
          class="scroll-list__item pt-10"
          :style="previewStyle"
          :class="{'pb-90 item-theme': type === 'theme', 'padding-start': idx === 0, 'padding-end': idx === list.length - 1}")
          img(class="pointer scroll-list__item-image"
            :class="{'square': type === 'template'}"
            :src="fallbackSrc || (type === 'theme' ? item.url : `https://template.vivipic.com/template/${item.match_cover.id}/prev_2x?ver=${item.ver}`)"
            @click="type === 'theme' ? newDesign(item) : newDesignWithTemplate(item)"
            @error="handleNotFound")
          div(v-if="type === 'theme'"
            class="pt-10 scroll-list__item-title") {{item.title}}
          div(v-if="type === 'theme'"
            class="pt-2 scroll-list__item-subtitle") {{item.description}}
        div(v-if="list.length === 0")
            svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
</template>
<script lang="ts">
import Vue from 'vue'
import { Itheme } from '@/interfaces/theme'
import designUtils from '@/utils/designUtils'
import DesignItem from '@/components/homepage/DesignItem.vue'
import { mapActions, mapMutations } from 'vuex'

export default Vue.extend({
  components: {
    DesignItem
  },
  props: {
    type: String,
    theme: String,
    designList: Array,
    isLoading: Boolean
  },
  data() {
    return {
      prevIcon: false,
      nextIcon: true,
      fallbackSrc: '',
      list: [] as any[]
    }
  },
  computed: {
    items() {
      return this.$refs.items as HTMLElement
    },
    previewStyle(): any {
      const { width, height } = this.list[0].match_cover || {}
      const aspectRatio = width / height
      if (aspectRatio > 1) {
        return { width: `${160 * aspectRatio}px`, height: '160px' }
      } else {
        return { width: '160px', height: `${160 / aspectRatio}px` }
      }
    }
  },
  async mounted() {
    const keyword = 'group::0;;order_by::popular'
    const res = await this.getTagContent({ keyword, theme: this.theme })
    this.list = res.data.content[0].list
  },
  methods: {
    ...mapActions({
      getTagContent: 'homeTemplate/getTagContent',
      fetchAllDesigns: 'design/fetchAllDesigns'
    }),
    ...mapMutations({
      setGroupType: 'SET_groupType'
    }),
    // initIcon(times = 0) {
    //   const { scrollWidth, offsetWidth } = this.items
    //   if (scrollWidth === offsetWidth && times < 10) {
    //     setTimeout(() => {
    //       this.initIcon(times + 1)
    //     }, 500)
    //   }
    //   this.nextIcon = scrollWidth > offsetWidth
    // },
    handleNotFound(event: Event) {
      this.fallbackSrc = require('@/assets/img/svg/image-preview.svg') // prevent infinite refetching when network disconneted
    },
    newDesignWithTemplate(template: any) {
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
      this.$router.push({ name: 'Editor' }).then(() => {
        if (item.height !== 0) {
          designUtils.newDesign(item.width, item.height)
        } else {
          designUtils.newDesign(item.width, item.width)
          this.setGroupType(1)
        }
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
    grid-template-columns: auto;
    justify-content: start;
    align-items: center;
    grid-auto-flow: column;
    scroll-behavior: smooth;
    overflow-x: scroll;
    overflow-y: hidden;
    text-align: left;
    column-gap: 16px;
    @media (max-width: 768px) {
      column-gap: 10px;
    }
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
    width: 90px;
    text-align: center;
    @media screen and (max-width: 768px) {
      width: 56px;
    }
    > img {
      @include layout-mobile {
        width: 100%;
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
    &-title {
      font-size: 16px;
      line-height: 26px;
      font-weight: 400;
      padding-top: 10px;
      @media (max-width: 976px) {
        font-size: 14px;
      }
      @include layout-mobile {
        font-size: 12px;
        line-height: unset;
        transform: scale(0.9);
      }
    }
    &-subtitle {
      color: setColor(gray-2);
      font-size: 14px;
      line-height: 22px;
      font-weight: 400;
      @include layout-mobile {
        font-size: 12px;
        white-space: nowrap;
        transform: scale(0.85);
        padding: 0;
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
      &:hover {
        transition: all 0.2s ease-in-out;
        box-shadow: 5px 5px 10px 2px rgba(48, 55, 66, 0.15);
        transform: translate(0, -5px);
      }
    }
    &.item-theme {
      @include layout-mobile {
        width: 22vw;
        height: 30vw;
      }
    }
  }
  &__design {
    width: 160px;
    height: 160px;
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
