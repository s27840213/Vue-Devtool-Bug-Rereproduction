<template lang="pug">
div(class="popup-page bg-gray-6"
    @click.stop="closePopup")
  template(v-for="option in updateOptions")
    template(v-if="option.condition")
      div(class="popup-page__item"
          :class="{disabled: isFontLoading}"
          @click="!isFontLoading && option.action()")
        svg-icon(
          class="pointer"
          :iconName="option.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{option.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{option.shortcutText}}
  div(v-for="(data,index) in shortcutMenu()"
      :key="`popup-page__shortcut-${index}`"
      class="popup-page__item"
      @click="data.action")
    svg-icon(
      class="pointer"
      :iconName="data.icon"
      :iconWidth="'16px'"
      :iconColor="'gray-1'")
    span(class="ml-10 body-2") {{data.text}}
    span(class="shortcut ml-10 body-2 text-gray-3") {{data.shortcutText}}
  hr(v-if="getBackgroundImage(currFocusPageIndex).config.src !=='none'" class="popup-page__hr")
  div(v-if="getBackgroundImage(currFocusPageIndex).config.src !=='none'"
      class="popup-page__item"
      @click="detachBackgroundImage")
    svg-icon(
      class="pointer"
      :iconName="'copy'"
      :iconWidth="'16px'"
      :iconColor="'gray-1'")
    span(class="ml-10 body-2") {{$t('NN0275')}}
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import { IPopupOptions } from '@/interfaces/popup'
import assetUtils from '@/utils/assetUtils'
import GeneralUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'
import MappingUtils from '@/utils/mappingUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    updateOptions: Array as () => Array<IPopupOptions>
  },
  data() {
    return {
      baseBgImgConfig: layerFactary.newImage({
        srcObj: {
          type: '',
          userId: '',
          assetId: ''
        },
        styles: {
          width: 0,
          height: 0,
          zindex: -1,
          opacity: 100
        }
      })
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      getBackgroundImage: 'getBackgroundImage',
      isLogin: 'user/isLogin',
      groupId: 'getGroupId',
      isFontLoading: 'text/getIsFontLoading'
    }),
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    }
  },
  methods: {
    ...mapMutations({
      _setBackgroundImage: 'SET_backgroundImage',
      _setBackgroundColor: 'SET_backgroundColor'
    }),
    mappingIcons(type: string): string[] {
      return MappingUtils.mappingIconSet(type)
    },
    mappingIconAction(icon: string) {
      return MappingUtils.mappingIconAction(icon)
    },
    shortcutMenu() {
      return [
        {
          icon: 'copy',
          text: this.$t('NN0032'),
          shortcutText: 'Cmd+C',
          action: () => {
            ShortcutUtils.copy()
          }
        },
        {
          icon: 'paste',
          text: this.$t('NN0230'),
          shortcutText: 'Cmd+V',
          action: () => {
            ShortcutUtils.paste()
          }
        },
        {
          icon: 'trash',
          text: this.$t('NN0034'),
          shortcutText: 'DEL',
          action: () => {
            this.deleteBackgroundImage()
          }
        }
        // {
        //   icon: 'copy',
        //   text: 'update test',
        //   shortcutText: '',
        //   action: () => {
        //     const page = GeneralUtils.deepCopy(layerUtils.getPage(layerUtils.pageIndex))
        //     page.width = parseInt(page.width)
        //     page.height = parseInt(page.height)
        //     page.layers
        //       .forEach((l: ILayer) => {
        //         uploadUtils.layerInfoFilter(l)
        //       })
        //     store.commit('ADD_page', page)
        //   }
        // }
      ]
    },
    deleteBackgroundImage() {
      this._setBackgroundImage({
        pageIndex: pageUtils.currFocusPageIndex,
        config: this.baseBgImgConfig
      })
    },
    detachBackgroundImage() {
      const detachedBackgroundImage = GeneralUtils.deepCopy(this.getBackgroundImage(pageUtils.currFocusPageIndex))
      if (detachedBackgroundImage.config.srcObj.assetId) {
        /** get a tiny photo in order to get the aspectRatio of the image */
        const src = imageUtils.getSrc(detachedBackgroundImage.config, imageUtils.getSrcSize(detachedBackgroundImage.config.srcObj, 50))
        const img = new Image()
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight
          assetUtils.addImage(src, ratio, {
            pageIndex: layerUtils.pageIndex,
            ...detachedBackgroundImage.config.srcObj,
            styles: detachedBackgroundImage.config.styles
          })
          this._setBackgroundImage({
            pageIndex: pageUtils.currFocusPageIndex,
            config: this.baseBgImgConfig
          })
        }
        img.src = src
      }
      // this._setBackgroundColor({
      //   pageIndex: pageUtils.currFocusPageIndex,
      //   color: '#ffffff'
      // })
    },
    closePopup() {
      popupUtils.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-page {
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.375rem 0.625rem;
  z-index: setZindex("dropdowns");
  border: 1px solid setColor(gray-4);
  box-shadow: 0px 0px 7px setColor(gray-1, 0.25);
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    &.disabled {
      color: setColor(gray-3);
      cursor: not-allowed;
    }
    &:hover {
      background-color: setColor(blue-3, 0.5);
    }
    &:active {
      background-color: setColor(blue-3);
    }
    > span {
      font-size: 0.75rem;
    }
  }

  &__hr {
    margin: 0.375rem 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }
}
</style>
