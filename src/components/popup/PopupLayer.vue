<template lang="pug">
  div(class=" popup-layer bg-gray-6"
      @click.stop="closePopup")
    template(v-if="inAdminMode && isLogin")
      div(class="popup-layer__item"
          @click="pageUploadMenu.action")
        svg-icon(
          class="pointer"
          :iconName="pageUploadMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{pageUploadMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{pageUploadMenu.shortcutText}}
    template(v-if="hasDesignId && getToekn!==''")
      div(class="popup-layer__item"
          @click="pageUpdateMenu.action")
        svg-icon(
          class="pointer"
          :iconName="pageUpdateMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{pageUpdateMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{pageUpdateMenu.shortcutText}}
    template(v-if="inAdminMode && isLogin && (isText || isShape)")
      div(class="popup-layer__item"
          @click="uploadMenu.action")
        svg-icon(
          class="pointer"
          :iconName="uploadMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{uploadMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{uploadMenu.shortcutText}}
    template(v-if="currSelectedInfo.layers[0] && currSelectedInfo.layers[0].designId !=='' && inAdminMode && isLogin && (isText || isShape)")
      div(class="popup-layer__item"
          @click="updateMenu.action")
        svg-icon(
          class="pointer"
          :iconName="updateMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{updateMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{updateMenu.shortcutText}}
    template(v-if="isImage")
      div(class="popup-layer__item"
          @click="updateImageAsFrame.action")
        svg-icon(
          class="pointer"
          :iconName="updateImageAsFrame.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{updateImageAsFrame.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{uploadMenu.shortcutText}}
    template(v-if="isFrame")
      div(class="popup-layer__item"
          @click="detachImage.action")
        svg-icon(
          class="pointer"
          :iconName="detachImage.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{detachImage.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{uploadMenu.shortcutText}}
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
      span(class="ml-10 body-2") Set Image as Background
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

export default Vue.extend({
  data() {
    return {
      pageUploadMenu: {
        icon: 'copy',
        text: 'Upload single-page template',
        shortcutText: '',
        action: () => {
          uploadUtils.uploadTemplate()
        }
      },
      pageUpdateMenu: {
        icon: 'copy',
        text: 'Modify single-page template',
        shortcutText: '',
        action: () => {
          uploadUtils.updateTemplate()
        }
      }
    }
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapGetters({
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      isLogin: 'user/isLogin',
      _layerNum: 'getLayersNum'
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
      return this.getType.includes('text')
    },
    isShape(): boolean {
      return this.getType.includes('shape')
    },
    isImage(): boolean {
      return this.currSelectedInfo.layers.length === 1 && this.getType.includes('image')
    },
    isFrame(): boolean {
      return this.currSelectedInfo.layers.length === 1 && this.getType.includes('frame')
    },
    hasDesignId(): boolean {
      return this.getPage(this.lastSelectedPageIndex).designId !== ''
    },
    uploadMenu(): any {
      return {
        icon: 'copy',
        text: `Upload ${this.getType[0]}`,
        shortcutText: '',
        action: () => {
          uploadUtils.uploadLayer(this.getType[0])
        }
      }
    },
    updateMenu(): any {
      return {
        icon: 'copy',
        text: `Modify ${this.getType[0]}`,
        shortcutText: '',
        action: () => {
          uploadUtils.updateLayer(this.getType[0])
        }
      }
    },
    groupOption(): any {
      return {
        icon: 'copy',
        text: this.isGroup ? 'Ungroup' : 'Group',
        shortcutText: this.isGroup ? 'Cmd+Shift+G' : 'Cmd+G',
        action: () => {
          this.isGroup ? groupUtils.ungroup() : groupUtils.group()
        }
      }
    },
    detachImage(): any {
      const currLayer = layerUtils.getCurrLayer as IFrame
      let idx = currLayer.clips.findIndex(img => img.active && img.srcObj.type !== 'frame')
      if (idx === -1) {
        idx = currLayer.clips.length === 1 && currLayer.clips[0].srcObj.type !== 'frame' ? 0 : -1
      }

      return {
        icon: 'copy',
        text: 'Detach Image',
        shortcutText: '',
        action: () => {
          if (idx !== -1) {
            const clips = generalUtils.deepCopy(currLayer.clips)
            const srcObj = {
              ...clips[idx].srcObj
            }
            clips[idx].srcObj = {
              type: 'frame',
              userId: '',
              assetId: ''
            }
            const { width, height } = clips[idx].styles
            layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { clips })
            layerUtils.addLayers(layerUtils.pageIndex, [layerFactary.newImage({
              srcObj,
              styles: {
                x: currLayer.styles.x + (clips[idx].styles.x + width / 4) * currLayer.styles.scale,
                y: currLayer.styles.y + (clips[idx].styles.y + height / 4) * currLayer.styles.scale,
                width,
                height
              }
            })])
          }
        }
      }
    },
    updateImageAsFrame(): any {
      return {
        icon: 'copy',
        text: 'Update image as Frame',
        shortcutText: '',
        action: () => {
          const currLayer = generalUtils.deepCopy(layerUtils.getCurrLayer) as IImage
          if (currLayer.type === 'image') {
            const { width, height, x, y } = currLayer.styles
            const { designId } = currLayer
            const layerIndex = layerUtils.layerIndex
            const pageIndex = layerUtils.pageIndex
            Object.assign(currLayer.styles, { x: 0, y: 0, zindex: 0 })

            const newFrame = layerFactary.newFrame({
              designId,
              styles: {
                initWidth: width,
                initHeight: height,
                width,
                height,
                x,
                y
              },
              clips: [{
                ...currLayer,
                clipPath: `M0,0h${width}v${height}h${-width}z`,
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
    }
  },
  methods: {
    ...mapMutations({
      _setBackgroundImage: 'SET_backgroundImage'
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
          text: 'Copy',
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
          icon: 'copy',
          text: 'Paste',
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
          text: 'Delete',
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
          text: 'Bring to Front',
          shortcutText: 'Cmd+Alt+]',
          action: this.mappingIconAction(icons[0])
        },
        {
          icon: icons[1],
          text: 'Bring Forward',
          shortcutText: 'Cmd+]',
          action: this.mappingIconAction(icons[1])
        },
        {
          icon: icons[2],
          text: 'Bring Backward',
          shortcutText: 'Cmd+[',
          action: this.mappingIconAction(icons[2])
        },
        {
          icon: icons[3],
          text: 'Bring to Back',
          shortcutText: 'Cmd+Alt+]',
          action: this.mappingIconAction(icons[3])
        }
      ]
    },
    setBackgroundImage() {
      const image = this.currSelectedInfo.layers[0] as IImage
      image.styles.width = image.styles.imgWidth
      image.styles.height = image.styles.imgHeight
      image.styles.initWidth = image.styles.imgWidth
      image.styles.initHeight = image.styles.imgHeight
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
