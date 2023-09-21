<template lang="pug">
i18n-t(v-if="showUploadArea" class="upload-area" keypath="NN0873" tag="div")
  template(#upload)
    nubtn(theme="text" @click="$emit('addImage')") {{$t('NN0014')}}
recycle-scroller(class="image-list" :items="images2d" :itemSize="140" ref="recycle")
  template(v-slot="{ item }: {item:{id: string, item: IImageListItem[]}}")
    div(class="image-list__row")
      template(v-for="img in item.item" :key="img.id")
        div(v-if="img.type === 'placeholder'" class="image-list__placeholder")
        div(v-else :class="{hovered: img.menuopen}"
          class="image-list__item relative")
          svg-icon(v-if="img.uploading" iconName="loading" iconWidth="24px" iconColor="gray-3")
          img(v-else :src="img.src" class="image-list__item__img"
              @click="$emit('clickImage', img)")
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
                  @click="$emit('handleDelete', img)")
                  svg-icon(iconName="trash"
                          iconWidth="24px"
                          iconColor="gray-2")
                  span {{ $t('NN0034') }}
  template(#after)
    div(v-if="loading" class="flex-center")
      svg-icon(iconName="loading"
              iconWidth="50px"
              iconColor="gray-3")
    observer-sentinel(v-else-if="sentinel"
              :target="$route.name === 'Editor' ? '.popup-brand-settings__window' : undefined"
              @callback="$emit('loadMore')")
</template>

<script lang="ts">
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import vClickOutside from 'click-outside-vue3'
import { defineComponent, PropType } from 'vue'

export interface IImageListItem {
  type: '' | 'placeholder'
  key: string
  label: string
  src: string
  uploading: boolean
  menuopen: boolean
}
const spItem = (type: 'placeholder') => ({
  type,
  key: type,
  label: '',
  src: '',
  uploading: false,
  menuopen: false,
})

export default defineComponent({
  emits: [
    'addImage',
    'clickImage',
    'handleDownload',
    'handleDelete',
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
    showUploadArea: {
      type: Boolean
    },
    loading: {
      type: Boolean
    },
    sentinel: {
      type: Boolean
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
      const container = (this.$refs.recycle as {$el: HTMLElement}).$el
      if (!container) {
        this.images2d = []
        return
      }

      const width = container.clientWidth
      const imgInRow = Math.floor((width - 120) / 140) + 1
      const array2d = [] as {id: string, item: IImageListItem[]}[]

      this.images.forEach(image => {
        if (array2d.length === 0 || array2d[array2d.length - 1].item.length >= imgInRow) {
          array2d.push({ id: `row${array2d.length}`, item: [] })
        }
        array2d[array2d.length - 1].item.push(image)
      })
      while (array2d.length && array2d[array2d.length - 1].item.length < imgInRow) {
        array2d[array2d.length - 1].item.push(spItem('placeholder'))
      }
      this.images2d = array2d
    }
  },
})
</script>

<style lang="scss" scoped>
.upload-area {
  @include body-XS;
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  color: setColor(gray-3);
  margin-bottom: 20px;
  .nubtn.text.sm {
    padding: 0;
    height: fit-content;
  }
}
.image-list {
  @include hover-scrollbar;
  @include push-scrollbar10;
  display: flex;
  flex-direction: column;
  height: 100%;
  &__row {
    display: flex;
    justify-content: space-between;
  }
  &__placeholder, &__item {
    height: 120px;
    width: 120px;
  }
  &__item {
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 10px;
    border: 1px solid setColor(gray-5);
    &__img {
      max-height: 100px;
      max-width: 100px;
    }
    &:hover,
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
      width: 216px;
      position: absolute;
      background: white;
      box-shadow: 0px 4px 4px rgba(151, 150, 150, 0.25);
      border-radius: 5px;
      z-index: 1;
      cursor: initial;
      top: -4px;
      left: calc(100% + 10px);
      .image-list__item:nth-last-child(-n+2) & { // Last 2 menu show at the left side.
        left: initial;
        right: calc(100% + 10px);
      }
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
  .observer-sentinel {
    // Without this, some resolution display will not trigger loadmore
    margin-bottom: 1px;
  }
}
</style>
