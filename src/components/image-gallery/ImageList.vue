<template lang="pug">
recycle-scroller(class="image-list" :items="images2d" :itemSize="115")
  template(v-slot="{ item }: {item:{id: string, item: IImageListItem[]}}")
    div(class="image-list__row")
      template(v-for="img in item.item" :key="img.id")
        div(v-if="img.type === 'add'"
          class="image-list__item add pointer relative"
          @click="$emit('addImage')")
          span(class="primary") {{ $t('NN0411') }}
          span(class="secondary" v-html="$t('NN0412')")
          svg-icon(class="hover"
                  iconName="plus-origin"
                  iconWidth="16px"
                  iconColor="gray-2")
        div(v-else-if="img.type === 'loading'"
            class="image-list-loading no-trans")
          svg-icon(iconName="loading"
                  iconWidth="50px"
                  iconColor="gray-3")
        observer-sentinel(v-else-if="img.type === 'sentinel'"
                          class="no-trans"
                          :target="$route.name === 'Editor' ? '.popup-brand-settings__window' : undefined"
                          @callback="$emit('loadMore')")
        div(v-else :class="{hovered: img.menuopen}"
          class="image-list__item relative")
          svg-icon(v-if="img.uploading" iconName="loading" iconWidth="24px" iconColor="gray-3")
          img(v-else :src="img.src" class="image-list__item__img"
              :width="img.width" @click="$emit('clickImage', img)")
          div(v-if="showMore && !img.uploading" class="image-list__item__more pointer"
            @click="$emit('handleOpenMenu', img)")
            div(class="image-list__item__more-container relative")
              svg-icon(iconName="more_vertical"
                      iconWidth="24px"
                      iconColor="gray-2")
              div(v-if="img.menuopen"
                class="image-list__item__menu"
                v-click-outside="() => $emit('handleCloseMenu', img)")
                div(class="image-list__item__menu__name")
                  span {{ img.label }}
                div(class="image-list__item__menu__hr")
                div(class="image-list__item__menu__row pointer"
                  @click="$emit('handleDownload', img)")
                  svg-icon(iconName="download"
                          iconWidth="24px"
                          iconColor="gray-2")
                  span {{ $t('NN0010') }}
                div(class="image-list__item__menu__row pointer"
                  @click="$emit('handleDeleteLogo', img)")
                  svg-icon(iconName="trash"
                          iconWidth="24px"
                          iconColor="gray-2")
                  span {{ $t('NN0034') }}
</template>

<script lang="ts">
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import i18n from '@/i18n'
import vClickOutside from 'click-outside-vue3'
import { defineComponent, PropType } from 'vue'

export interface IImageListItem {
  type: '' | 'add' | 'loading' | 'sentinel'
  key: string
  label: string
  src: string
  width: number
  uploading: boolean
  menuopen: boolean
}
export const spItem = (type: 'add' | 'loading' | 'sentinel') => ({
  type,
  key: type,
  label: '',
  src: '',
  width: type === 'add' ? {
    tw: 158,
    us: 203.66,
    jp: 277.64
  }[i18n.global.locale as 'tw'|'us'|'jp'] : 0,
  uploading: false,
  menuopen: false,
})

export default defineComponent({
  emits: [
    'addImage',
    'clickImage',
    'handleDownload',
    'handleDeleteLogo',
    'handleOpenMenu',
    'handleCloseMenu',
    'loadMore',
  ],
  components: {
    ObserverSentinel
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    images: {
      type: Array as PropType<IImageListItem[]>,
      required: true,
    },
    showMore: {
      type: Boolean,
    },
  },
  data() {
    return {
      images2d: [] as {id: string, item: IImageListItem[]}[]
    }
  },
  mounted() {
    this.updateImg()
  },
  watch: {
    images() {
      this.updateImg()
    }
  },
  methods: {
    updateImg() {
      if (!this.$el) {
        this.images2d = []
        return
      }

      const width = (this.$el as HTMLElement).clientWidth
      const array2d = [] as {id: string, item: IImageListItem[]}[]
      let accWidth = 10000000

      this.images.forEach(image => {
        // 2 = border width, 15 = gap width
        const imgWidth = image.type === '' ? Math.floor(image.width) + 2 : image.width
        if (accWidth + imgWidth + 15 > width) {
          array2d.push({ id: `row${array2d.length}`, item: [] })
          accWidth = imgWidth
        } else {
          accWidth += imgWidth + 15
        }
        array2d[array2d.length - 1].item.push(image)
      })
      this.images2d = array2d
    }
  },
})
</script>

<style lang="scss" scoped>
.image-list-loading {
  display: flex;
  justify-content: center;
}
.image-list {
  @include hover-scrollbar;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  &__row {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }
  &__item {
    height: 100px;
    min-width: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid setColor(gray-4);
    box-sizing: border-box;
    border-radius: 4px;
    &.add {
      // width: 100px;
      display: flex;
      flex-direction: column;
      padding: 25px 30px;
      border: 1px dashed setColor(gray-4);
      & > .hover {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: none;
        z-index: 1;
      }
      &:hover {
        background-color: setColor(blue-4);
        border: 1px solid setColor(blue-4);
        & > span.primary,
        & > span.secondary {
          color: setColor(blue-4);
        }
        & > .hover {
          display: block;
        }
      }
      & > span.primary {
        @include body-SM;
        color: setColor(gray-2);
      }
      & > span.secondary {
        @include body-XS;
        color: setColor(gray-3);
      }
    }
    &__img {
      height: 100%;
      // width: auto;
    }
    &:not(.add):hover,
    &.hovered {
      background-color: rgba(setColor(gray-4), 0.5);
      border: 1px solid setColor(gray-4);
      & > img {
        opacity: 0.5;
      }
      & > div {
        display: flex;
      }
    }
    &__more {
      position: absolute;
      top: 4px;
      right: 5px;
      display: none;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 2px;
      &-container {
        width: 24px;
        height: 24px;
      }
    }
    &__menu {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 8px 0px;
      top: calc(100% + 10px);
      left: 0;
      width: 216px;
      position: absolute;
      background: white;
      box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
      border-radius: 5px;
      z-index: 1;
      cursor: initial;
      &__name {
        height: 25px;
        padding: 0px 8px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        & > span {
          @include caption-LG;
          text-align: left;
          display: block;
        }
      }
      &__hr {
        margin: auto;
        height: 1px;
        width: calc(100% - 16px);
        background-color: setColor(gray-4);
      }
      &__row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 0px 4px 10px;
        &:hover {
          background-color: setColor(blue-4);
        }
        & > span {
          @include body-SM;
          line-height: 25px;
          height: 25px;
          display: block;
          color: setColor(gray-1);
        }
      }
    }
  }
}
</style>
