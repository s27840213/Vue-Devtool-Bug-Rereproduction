<template lang="pug">
  div(class=" popup-layer bg-gray-6"
      @click.stop="closePopup")
    //- for page and layer
    template(v-for="option in [...updateOptions, ...layerOptions]")
      template(v-if="option.condition")
        div(class="popup-layer__item"
            @click="option.action")
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
    hr(v-if="inAdminMode && isLogin" class="popup-layer__hr")
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
    div(v-if="(currSelectedInfo.layers.length === 1) && (currSelectedInfo.types.has('image'))"
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
import FocusUtils from '@/utils/focusUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { IFrame, IImage, IShape } from '@/interfaces/layer'
import TextUtils from '@/utils/textUtils'
import uploadUtils from '@/utils/uploadUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import popupUtils from '@/utils/popupUtils'
import layerFactary from '@/utils/layerFactary'
import zindexUtils from '@/utils/zindexUtils'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import pageUtils from '@/utils/pageUtils'
import { Layer } from 'konva/types/Layer'
import GeneralValueSelectorVue from '../GeneralValueSelector.vue'
import frameUtils from '@/utils/frameUtils'
import { IPopupOptions } from '@/interfaces/popup'
import assetUtils from '@/utils/assetUtils'

export default Vue.extend({
  props: {
    updateOptions: Array as () => Array<IPopupOptions>
  },
  data() {
    return {
      typeMap: {
        text: '文字',
        shape: 'SVG'
      } as { [index: string]: string }
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapState('popup', ['popupComponent']),
    ...mapGetters({
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      isLogin: 'user/isLogin',
      token: 'user/getToken',
      _layerNum: 'getLayersNum',
      groupId: 'getGroupId'
    }),
    inAdminMode(): boolean {
      return this.role === 0 && this.adminMode === true
    },
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
      return this.getPage(this.lastSelectedPageIndex).designId !== ''
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
          condition: this.inAdminMode && this.isLogin && (this.isText || this.isShape || this.isTextGroup),
          shortcutText: '',
          action: () => {
            uploadUtils.uploadLayer(this.updateType)
          }
        },
        {
          icon: 'update',
          text: `更新 ${this.typeMap[this.updateType]}`,
          condition: this.hasLayerDesignId && this.inAdminMode && this.isLogin && (this.isText || this.isShape || this.isTextGroup),
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
      set_popupComponent: 'SET_popupComponent'
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
            if (TextUtils.getSelection()) {
              ShortcutUtils.textCopy()
            } else {
              ShortcutUtils.copy()
              FocusUtils.focusLastSelectedPage()
            }
          }
        },
        {
          icon: 'paste',
          text: this.$t('NN0230'),
          shortcutText: 'Cmd+V',
          action: () => {
            if (TextUtils.getSelection()) {
              ShortcutUtils.textPaste()
            } else {
              FocusUtils.focusLastSelectedPage()
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
            FocusUtils.focusLastSelectedPage()
          }
        }
      ]
    },
    orderMenu() {
      const icons = this.mappingIcons('order')
      return [
        {
          icon: icons[0],
          text: this.$t('NN0231'),
          shortcutText: '',
          // shortcutText: 'Cmd+Alt+]',
          action: this.mappingIconAction(icons[0])
        },
        {
          icon: icons[1],
          text: this.$t('NN0232'),
          shortcutText: '',
          // shortcutText: 'Cmd+]',
          action: this.mappingIconAction(icons[1])
        },
        {
          icon: icons[2],
          text: this.$t('NN0233'),
          shortcutText: '',
          // shortcutText: 'Cmd+[',
          action: this.mappingIconAction(icons[2])
        },
        {
          icon: icons[3],
          text: this.$t('NN0234'),
          // shortcutText: 'Cmd+Alt+]',
          shortcutText: '',
          action: this.mappingIconAction(icons[3])
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
        condition: this.inAdminMode && this.isLogin,
        shortcutText: '',
        action: () => {
          const currLayer = generalUtils.deepCopy(layerUtils.getCurrLayer) as IImage
          if (currLayer.type === 'image') {
            const { width, height, x, y, rotate } = currLayer.styles
            const { designId } = currLayer
            const layerIndex = layerUtils.layerIndex
            const pageIndex = layerUtils.pageIndex
            Object.assign(currLayer.styles, { x: 0, y: 0, zindex: 0, rotate: 0 })

            const newFrame = layerFactary.newFrame({
              designId,
              styles: {
                initWidth: width,
                initHeight: height,
                width,
                height,
                rotate,
                x,
                y
              },
              clips: [{
                ...currLayer,
                isFrameImg: true
              }]
            } as unknown as IFrame)
            layerUtils.deleteLayer(layerIndex)
            layerUtils.addLayersToPos(pageIndex, [newFrame], layerIndex)
            zindexUtils.reassignZindex(pageIndex)
            uploadUtils.updateTemplate()
          }
        }
      }
    },
    setBackgroundImage() {
      const image = this.currSelectedInfo.layers[0] as IImage
      imageUtils.getImageSize(imageUtils.getSrc(image), image.styles.imgWidth, image.styles.imgHeight).then(({ width: imgWidth, height: imgHeight }) => {
        image.styles.imgWidth = imgWidth
        image.styles.imgHeight = imgHeight
        image.styles.width = imgWidth
        image.styles.height = imgHeight
        image.styles.initWidth = imgWidth
        image.styles.initHeight = imgHeight
        image.styles.rotate = 0
        image.styles.imgX = 0
        image.styles.imgY = 0
        const pageIndex = this.currSelectedInfo.pageIndex
        this._setBackgroundImage({
          pageIndex: pageIndex,
          config: image
        })
        const { width, height, posX, posY } = imageUtils.adaptToSize(image.styles, this.getPage(pageIndex))
        pageUtils.updateBackgroundImageSize(pageIndex, width, height)
        pageUtils.updateBackgroundImagePos(pageIndex, posX, posY)
        pageUtils.updateBackgroundImageMode(pageIndex, true)
        ShortcutUtils.del()
      })
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
