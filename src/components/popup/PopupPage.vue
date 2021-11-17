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
import lineTest from '@/assets/json/line.json'
import basicShapeTest from '@/assets/json/basic_shape.json'
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
          text: 'Append test line',
          shortcutText: 'Used for test',
          action: () => {
            const newLineTest: IShape = GeneralUtils.deepCopy(lineTest)
            newLineTest.className = shapeUtils.classGenerator()
            layerUtils.addLayers(this.lastSelectedPageIndex, [newLineTest])
          }
        },
        {
          icon: 'copy',
          text: 'Append test ellipse',
          shortcutText: 'Used for test',
          action: () => {
            const newbasicShapeTest: IShape = GeneralUtils.deepCopy(basicShapeTest)
            newbasicShapeTest.className = shapeUtils.classGenerator()
            newbasicShapeTest.shapeType = 'e'
            newbasicShapeTest.svg = shapeUtils.genBasicShapeSvgTemplate('e')
            newbasicShapeTest.size = [newbasicShapeTest.size?.[0] ?? 0, 0]
            layerUtils.addLayers(this.lastSelectedPageIndex, [newbasicShapeTest])
          }
        },
        {
          icon: 'copy',
          text: 'Append test rectangle',
          shortcutText: 'Used for test',
          action: () => {
            const newbasicShapeTest: IShape = GeneralUtils.deepCopy(basicShapeTest)
            newbasicShapeTest.className = shapeUtils.classGenerator()
            newbasicShapeTest.shapeType = 'r'
            newbasicShapeTest.svg = shapeUtils.genBasicShapeSvgTemplate('r')
            newbasicShapeTest.size = [newbasicShapeTest.size?.[0] ?? 0, 20]
            layerUtils.addLayers(this.lastSelectedPageIndex, [newbasicShapeTest])
          }
        },
        {
          icon: 'copy',
          text: 'Append test triangle',
          shortcutText: 'Used for test',
          action: () => {
            const newbasicShapeTest: IShape = GeneralUtils.deepCopy(basicShapeTest)
            newbasicShapeTest.className = shapeUtils.classGenerator()
            newbasicShapeTest.shapeType = 't'
            newbasicShapeTest.svg = shapeUtils.genBasicShapeSvgTemplate('t')
            newbasicShapeTest.size = [newbasicShapeTest.size?.[0] ?? 0, 20]
            const height = newbasicShapeTest.vSize?.[1] ?? 0
            const width = height * 2 / Math.sqrt(3)
            newbasicShapeTest.vSize = [width, height]
            newbasicShapeTest.styles.width = width
            newbasicShapeTest.styles.initWidth = width
            layerUtils.addLayers(this.lastSelectedPageIndex, [newbasicShapeTest])
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
