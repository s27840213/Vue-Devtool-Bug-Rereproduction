<template lang="pug">
  div(class=" popup-layer bg-gray-6"
      @click.stop="closePopup")
    //- for page and layer
    template(v-for="option in [...updateOptions, ...layerOptions]")
      template(v-if="option.condition")
        div(class="popup-layer__item"
            :class="{disabled: isFontLoading}"
            @click="!isFontLoading && option.action($event)")
          svg-icon(
            class="pointer"
            :iconName="option.icon"
            :iconWidth="'16px'"
            :iconColor="'gray-1'")
          span(class="ml-10 body-2") {{option.text}}
          span(class="shortcut ml-10 body-2 text-gray-3") {{option.shortcutText}}
    //- for other purpose
    template(v-if="isImage")
      div(class="popup-layer__item"
          @click="updateImageAsFrame().action()")
        svg-icon(
          class="pointer"
          :iconName="updateImageAsFrame().icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{updateImageAsFrame().text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{''}}
    template(v-if="isFrame")
      div(class="popup-layer__item"
          @click="detachImage().action()")
        svg-icon(
          class="pointer"
          :iconName="detachImage().icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{detachImage().text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{''}}
    hr(v-if="showAdminTool && isLogin" class="popup-layer__hr")
    div(v-for="(data,index) in shortcutMenu()"
        :key="`popup-layer__shortcut-${index}`"
        class="popup-layer__item"
        @click="data.action")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{data.text}}
      span(class="shortcut ml-10 body-2 text-gray-3") {{data.shortcutText}}
    div(v-if="(isGroup && currSelectedInfo.layers.length === 1) || (!isGroup && currSelectedInfo.layers.length > 1)"
        class="popup-layer__item"
        @click="groupOption.action")
      svg-icon(
        class="pointer"
        :iconName="groupOption.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{groupOption.text}}
      span(class="shortcut ml-10 body-2 text-gray-3") {{groupOption.shortcutText}}
    hr(v-if="layerNum > 1" class="popup-layer__hr")
    div(v-if="layerNum > 1")
      div(v-for="(data,index) in orderMenu()"
          :key="`popup-layer__order-${index}`"
          class="popup-layer__item"
          @click="data.action")
        svg-icon(
          class="pointer"
          :iconName="data.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{data.text}}
        div(class="shortcut")
          span(class="ml-10 body-2 text-gray-3") {{data.shortcutText}}
    hr(v-if="(currSelectedInfo.layers.length === 1) && (currSelectedInfo.types.has('image'))" class="popup-layer__hr")
    div(v-if="(currSelectedInfo.layers.length === 1) && (currSelectedInfo.types.has('image')) && currSelectedInfo.layers[0].previewSrc === undefined"
        class="popup-layer__item"
        @click="setBackgroundImage")
      svg-icon(
        class="pointer"
        :iconName="'copy'"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{$t('NN0097')}}
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { IImage } from '@/interfaces/layer'
import uploadUtils from '@/utils/uploadUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import popupUtils from '@/utils/popupUtils'
import imageUtils from '@/utils/imageUtils'
import pageUtils from '@/utils/pageUtils'
import frameUtils from '@/utils/frameUtils'
import { IPopupOptions } from '@/interfaces/popup'
import tiptapUtils from '@/utils/tiptapUtils'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  props: {
    updateOptions: Array as () => Array<IPopupOptions>
  },
  data() {
    return {
      typeMap: {
        text: '文字',
        shape: 'SVG'
      } as { [index: string]: string },
      orderSets: [
        {
          icon: 'layers-front',
          text: this.$t('NN0231')
        },
        {
          icon: 'layers-forward',
          text: this.$t('NN0232')
        },
        {
          icon: 'layers-backward',
          text: this.$t('NN0233')
        },
        {
          icon: 'layers-back',
          text: this.$t('NN0234')
        }]
    }
  },
  computed: {
    ...mapState('popup', ['popupComponent']),
    ...mapGetters({
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      isLogin: 'user/isLogin',
      token: 'user/getToken',
      showAdminTool: 'user/showAdminTool',
      _layerNum: 'getLayersNum',
      groupId: 'getGroupId',
      isFontLoading: 'text/getIsFontLoading'
    }),
    isGroup(): boolean {
      return this.currSelectedInfo.types.has('group') && this.currSelectedInfo.layers.length === 1
    },
    hasMultipleSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 1
    },
    layerNum(): number {
      return this.currSelectedInfo.pageIndex === -1 ? 0 : this._layerNum(this.currSelectedInfo.pageIndex)
    },
    getType(): Array<string> {
      return [...this.currSelectedInfo.types]
    },
    isText(): boolean {
      return this.getType.includes('text') && this.currSelectedInfo.layers.length === 1
    },
    isShape(): boolean {
      return this.getType.includes('shape') && this.currSelectedInfo.layers.length === 1
    },
    isImage(): boolean {
      return this.currSelectedInfo.layers.length === 1 && this.getType.includes('image')
    },
    isFrame(): boolean {
      return this.currSelectedInfo.layers.length === 1 && this.getType.includes('frame')
    },
    hasPageDesignId(): boolean {
      return this.getPage(pageUtils.currFocusPageIndex).designId !== ''
    },
    hasLayerDesignId(): boolean {
      return this.currSelectedInfo.layers[0] ? this.currSelectedInfo.layers[0].designId !== '' : false
    },
    // the group which contain at least one text, but it can contain other type of layer
    isTextGroup(): boolean {
      if (this.isGroup) {
        const typeSet = layerUtils.getGroupLayerTypes()
        return typeSet.has('text')
      } else {
        return false
      }
    },
    updateType(): string {
      return this.isTextGroup || this.isText ? 'text' : this.getType[0]
    },
    layerOptions(): Array<IPopupOptions> {
      return [
        {
          icon: 'copy',
          text: `上傳 ${this.typeMap[this.updateType]}`,
          condition: this.showAdminTool && this.isLogin && (this.isText || this.isShape || this.isTextGroup),
          shortcutText: '',
          action: () => {
            uploadUtils.uploadLayer(this.updateType)
          }
        },
        {
          icon: 'copy',
          text: `上傳 ${this.typeMap[this.updateType]} + ID`,
          condition: this.showAdminTool && this.isLogin && (this.isText || this.isShape || this.isTextGroup),
          shortcutText: '',
          action: (event?: MouseEvent) => {
            setTimeout(() => {
              this.$nextTick(() => {
                popupUtils.openPopup('submit', { event })
              })
            }, 0)
          }
        },
        {
          icon: 'copy',
          text: '上傳 元素群組',
          condition: this.showAdminTool && this.isLogin && (this.isGroup || this.isImage),
          shortcutText: '',
          action: () => {
            uploadUtils.uploadLayer('shape')
          }
        },
        {
          icon: 'copy',
          text: '上傳 元素群組 + ID',
          condition: this.showAdminTool && this.isLogin && (this.isGroup || this.isImage),
          shortcutText: '',
          action: (event?: MouseEvent) => {
            setTimeout(() => {
              this.$nextTick(() => {
                popupUtils.openPopup('submit', { event }, { type: 'shape' })
              })
            }, 0)
          }
        },
        {
          icon: 'update',
          text: `更新 ${this.typeMap[this.updateType]}`,
          condition: this.hasLayerDesignId && this.showAdminTool && this.isLogin && (this.isText || this.isShape || this.isTextGroup),
          shortcutText: '',
          action: () => {
            uploadUtils.updateLayer(this.updateType)
          }
        }
      ]
    },
    groupOption(): any {
      return {
        icon: this.isGroup ? 'ungroup' : 'group',
        text: this.isGroup ? this.$t('NN0212') : this.$t('NN0029'),
        shortcutText: this.isGroup ? 'Cmd+Shift+G' : 'Cmd+G',
        action: () => {
          this.isGroup ? groupUtils.ungroup() : groupUtils.group()
        }
      }
    }
  },
  methods: {
    ...mapMutations({
      _setBackgroundImage: 'SET_backgroundImage',
      set_popupComponent: 'SET_popupComponent',
      _setBgImgSrc: 'SET_backgroundImageSrc'
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
            if (tiptapUtils.isCurrLayerContenteditable()) {
              ShortcutUtils.textCopy()
            } else {
              ShortcutUtils.copy()
            }
          }
        },
        {
          icon: 'paste',
          text: this.$t('NN0230'),
          shortcutText: 'Cmd+V',
          action: () => {
            if (tiptapUtils.isCurrLayerContenteditable()) {
              ShortcutUtils.textPaste()
            } else {
              ShortcutUtils.paste()
            }
          }
        },
        {
          icon: 'trash',
          text: this.$t('NN0034'),
          shortcutText: 'DEL',
          action: () => {
            ShortcutUtils.del()
          }
        }
      ]
    },
    orderMenu() {
      return [
        {
          icon: this.orderSets[0].icon,
          text: this.orderSets[0].text,
          shortcutText: '',
          // shortcutText: 'Cmd+Alt+]',
          action: this.mappingIconAction(this.orderSets[0].icon)
        },
        {
          icon: this.orderSets[1].icon,
          text: this.orderSets[1].text,
          shortcutText: '',
          // shortcutText: 'Cmd+]',
          action: this.mappingIconAction(this.orderSets[1].icon)
        },
        {
          icon: this.orderSets[2].icon,
          text: this.orderSets[2].text,
          shortcutText: '',
          // shortcutText: 'Cmd+[',
          action: this.mappingIconAction(this.orderSets[2].icon)
        },
        {
          icon: this.orderSets[3].icon,
          text: this.orderSets[3].text,
          // shortcutText: 'Cmd+Alt+]',
          shortcutText: '',
          action: this.mappingIconAction(this.orderSets[3].icon)
        }
      ]
    },
    detachImage(): any {
      return {
        icon: 'copy',
        text: this.$t('NN0098'),
        shortcutText: '',
        action: () => {
          frameUtils.detachImage(this.popupComponent.properties.layerIndex ?? -1)
        }
      }
    },
    updateImageAsFrame(): any {
      return {
        icon: 'copy',
        text: this.$t('NN0096'),
        condition: this.showAdminTool && this.isLogin,
        shortcutText: '',
        action: frameUtils.updateImgToFrame
      }
    },
    setBackgroundImage() {
      const pageIndex = this.currSelectedInfo.pageIndex
      const image = this.currSelectedInfo.layers[0] as IImage
      const src = imageUtils.getSrc(image)
      this._setBgImgSrc({
        pageIndex: pageIndex,
        srcObj: image.srcObj,
        previewSrc: image.previewSrc,
        panelPreviewSrc: image.panelPreviewSrc
      })
      const _image = generalUtils.deepCopy(image)
      _image.styles.width = _image.styles.imgWidth
      _image.styles.height = _image.styles.imgHeight
      _image.styles.initWidth = _image.styles.imgWidth
      _image.styles.initHeight = _image.styles.imgHeight
      _image.styles.rotate = 0
      _image.styles.imgX = 0
      _image.styles.imgY = 0
      const { width, height, posX, posY } = imageUtils.adaptToSize(_image.styles, this.getPage(pageIndex))
      const { adjust, horizontalFlip, verticalFlip } = _image.styles
      pageUtils.updateBackgroundImageStyles(pageIndex, {
        width,
        height,
        adjust,
        horizontalFlip,
        verticalFlip,
        imgWidth: width,
        imgHeight: height,
        scale: 1
      })
      pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
      pageUtils.updateBackgroundImageMode(pageIndex, true)
      ShortcutUtils.del()

      // imageUtils.getImageSize(src, image.styles.imgWidth, image.styles.imgHeight).then(({ width: imgWidth, height: imgHeight }) => {
      //   image.styles.imgWidth = imgWidth
      //   image.styles.imgHeight = imgHeight
      //   image.styles.width = imgWidth
      //   image.styles.height = imgHeight
      //   image.styles.initWidth = imgWidth
      //   image.styles.initHeight = imgHeight
      //   image.styles.rotate = 0
      //   image.styles.imgX = 0
      //   image.styles.imgY = 0
      //   // this._setBgImgSrc({
      //   //   pageIndex: pageIndex,
      //   //   srcObj: image.srcObj,
      //   //   previewSrc: image.previewSrc,
      //   //   panelPreviewSrc: image.panelPreviewSrc
      //   // })
      //   const { width, height, posX, posY } = imageUtils.adaptToSize(image.styles, this.getPage(pageIndex))
      //   const { adjust, horizontalFlip, verticalFlip } = image.styles
      //   pageUtils.updateBackgroundImageStyles(pageIndex, {
      //     width,
      //     height,
      //     adjust,
      //     horizontalFlip,
      //     verticalFlip,
      //     imgWidth: width,
      //     imgHeight: height,
      //     scale: 1
      //   })
      //   pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
      //   pageUtils.updateBackgroundImageMode(pageIndex, true)
      //   ShortcutUtils.del()
      // })
    },
    closePopup() {
      popupUtils.closePopup()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-layer {
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
