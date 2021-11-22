<template lang="pug">
  div(class="popup-page bg-gray-6"
      @click.stop="closePopup")
    template(v-for="option in updateOptions")
      template(v-if="option.condition")
        div(class="popup-page__item"
            @click="option.action")
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
    hr(v-if="getBackgroundImage(lastSelectedPageIndex).config.src !=='none'" class="popup-page__hr")
    div(v-if="getBackgroundImage(lastSelectedPageIndex).config.src !=='none'"
        class="popup-page__item"
        @click="detachBackgroundImage")
      svg-icon(
        class="pointer"
        :iconName="'copy'"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") Detach Image from Background
</template>

<script lang="ts">
import Vue from 'vue'
import MappingUtils from '@/utils/mappingUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GeneralUtils from '@/utils/generalUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import uploadUtils from '@/utils/uploadUtils'
import clipTest from '@/assets/json/Img_clip.json'
import frameTest from '@/assets/json/fram_test.json'
import { IFrame, IImage, IShape } from '@/interfaces/layer'
import layerFactary from '@/utils/layerFactary'
import shapeUtils from '@/utils/shapeUtils'
import popupUtils from '@/utils/popupUtils'
import { IPopupOptions } from '@/interfaces/popup'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  data() {
    return {
      baseBgImgConfig: {
        type: 'image',
        srcObj: {
          type: '',
          userId: '',
          assetId: ''
        },
        clipPath: '',
        active: false,
        shown: false,
        imgControl: false,
        styles: {
          x: 0,
          y: 0,
          scale: 1,
          scaleX: 0,
          scaleY: 0,
          rotate: 0,
          width: 0,
          height: 0,
          initWidth: 0,
          initHeight: 0,
          imgX: 0,
          imgY: 0,
          imgWidth: 0,
          imgHeight: 0,
          zindex: -1,
          opacity: 100
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
      getBackgroundImage: 'getBackgroundImage',
      isLogin: 'user/isLogin',
      groupId: 'getGroupId'
    }),
    hasDesignId(): boolean {
      return this.getPage(this.lastSelectedPageIndex).designId !== ''
    },
    inAdminMode(): boolean {
      return this.role === 0 && this.adminMode === true
    },
    updateOptions(): Array<IPopupOptions> {
      return [
        {
          icon: 'copy',
          text: '上傳單頁模板',
          shortcutText: '',
          condition: this.inAdminMode && this.isLogin,
          action: () => {
            uploadUtils.uploadTemplate()
          }
        },
        {
          icon: 'copy',
          text: '更新單頁模板',
          shortcutText: '',
          condition: this.inAdminMode && this.hasDesignId && this.isLogin,
          action: () => {
            uploadUtils.updateTemplate()
          }
        },
        {
          icon: 'copy',
          text: '上傳群組模板',
          shortcutText: '',
          condition: this.inAdminMode && this.isLogin && pageUtils.getPages.length > 1,
          action: () => {
            uploadUtils.uploadGroupDesign(0)
          }
        },
        {
          icon: 'copy',
          text: '更新群組模板',
          shortcutText: '',
          condition: this.groupId && this.inAdminMode && this.isLogin,
          action: () => {
            uploadUtils.uploadGroupDesign(1)
          }
        },
        {
          icon: 'copy',
          text: '刪除群組模板',
          shortcutText: '',
          condition: this.groupId && this.inAdminMode && this.isLogin,
          action: () => {
            uploadUtils.uploadGroupDesign(1, true)
          }
        },
        {
          icon: 'copy',
          text: '測試用',
          shortcutText: '',
          condition: true,
          action: () => {
            GeneralUtils.test()
          }
        }
      ]
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
          text: 'Copy',
          shortcutText: 'Cmd+C',
          action: () => {
            ShortcutUtils.copy()
          }
        },
        {
          icon: 'copy',
          text: 'Paste',
          shortcutText: 'Cmd+V',
          action: () => {
            ShortcutUtils.paste()
          }
        },
        {
          icon: 'trash',
          text: 'Delete',
          shortcutText: 'DEL',
          action: () => {
            this.deleteBackgroundImage()
          }
        },
        {
          icon: 'copy',
          text: 'update Doc',
          shortcutText: '',
          action: () => {
            this.$store.commit('user/UPDATE_IMAGE_URLS', {
              assetId: 2783,
              urls: {
                prev: 'asset.vivipic.com/9XBAb9yoKlJbzLiWNUVM/asset/image/211117131047126ZIl5Yfgo/larg?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1637304573&Signature=VTt0r5LTJekzyiSw7xjU%2FN0XKak%3D',
                full: 'asset.vivipic.com/9XBAb9yoKlJbzLiWNUVM/asset/image/211117131047126ZIl5Yfgo/larg?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1637304573&Signature=VTt0r5LTJekzyiSw7xjU%2FN0XKak%3D',
                larg: 'asset.vivipic.com/9XBAb9yoKlJbzLiWNUVM/asset/image/211117131047126ZIl5Yfgo/larg?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1637304573&Signature=VTt0r5LTJekzyiSw7xjU%2FN0XKak%3D',
                original: 'asset.vivipic.com/9XBAb9yoKlJbzLiWNUVM/asset/image/211117131047126ZIl5Yfgo/larg?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1637304573&Signature=VTt0r5LTJekzyiSw7xjU%2FN0XKak%3D',
                midd: 'asset.vivipic.com/9XBAb9yoKlJbzLiWNUVM/asset/image/211117131047126ZIl5Yfgo/larg?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1637304573&Signature=VTt0r5LTJekzyiSw7xjU%2FN0XKak%3D',
                smal: 'asset.vivipic.com/9XBAb9yoKlJbzLiWNUVM/asset/image/211117131047126ZIl5Yfgo/larg?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1637304573&Signature=VTt0r5LTJekzyiSw7xjU%2FN0XKak%3D'
              }
            })
          }
        },
        {
          icon: 'copy',
          text: 'append test layer',
          shortcutText: '',
          action: () => {
            const config = {
              srcObj: {
                type: 'private',
                userId: '',
                assetId: 2783
              },
              styles: {
                x: 250,
                y: 250,
                width: 500,
                height: 400,
                initWidth: 500,
                initHeight: 400,
                imgWidth: 500,
                imgHeight: 400
              }
            }
            layerUtils.addLayers(0, [layerFactary.newImage(config)])
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
    deleteBackgroundImage() {
      this._setBackgroundImage({
        pageIndex: this.lastSelectedPageIndex,
        config: this.baseBgImgConfig
      })
    },
    detachBackgroundImage() {
      const detachedBackgroundImage = GeneralUtils.deepCopy(this.getBackgroundImage(this.lastSelectedPageIndex))
      if (detachedBackgroundImage.config.srcObj.assetId) {
        let { initWidth: width, initHeight: height } = detachedBackgroundImage.config.styles
        while (width > 1000 && height > 1000) {
          width /= 1.5
          height /= 1.5
        }
        Object.assign(detachedBackgroundImage.config.styles, {
          width,
          height,
          imgWidth: width,
          imgHeight: height
        })
        layerUtils.addLayers(this.lastSelectedPageIndex, [detachedBackgroundImage.config])
        this._setBackgroundImage({
          pageIndex: this.lastSelectedPageIndex,
          config: this.baseBgImgConfig
        })
      } else {
        this._setBackgroundColor({
          pageIndex: this.lastSelectedPageIndex,
          color: '#ffffff'
        })
      }
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
