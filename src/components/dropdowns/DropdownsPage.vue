<template lang="pug">
  div(class="dropdowns dropdowns--page bg-gray-6")
    template(v-if="getToekn!==''")
      div(class="dropdowns__item"
          @click="uploadMenu.action")
        svg-icon(
          class="pointer"
          :iconName="uploadMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{uploadMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{uploadMenu.shortcutText}}
    template(v-if="hasDesignId && getToekn!==''")
      div(class="dropdowns__item"
          @click="updateMenu.action")
        svg-icon(
          class="pointer"
          :iconName="updateMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{updateMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{updateMenu.shortcutText}}
    div(v-for="(data,index) in shortcutMenu()"
        :key="`dropdowns__shortcut-${index}`"
        class="dropdowns__item"
        @click="data.action")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{data.text}}
      span(class="shortcut ml-10 body-2 text-gray-3") {{data.shortcutText}}
    hr(class="dropdowns__hr")
    div(v-if="getBackgroundImage(lastSelectedPageIndex).config.src !=='none'"
        class="dropdowns__item"
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
import ImageUtils from '@/utils/imageUtils'
import { mapGetters, mapMutations } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import uploadUtils from '@/utils/uploadUtils'
import clipTest from '@/assets/json/Img_clip.json'
import frameTest from '@/assets/json/fram_test.json'
import lineTest from '@/assets/json/line.json'
import { IFrame, IImage, IShape } from '@/interfaces/layer'
import layerFactary from '@/utils/layerFactary'

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
      },
      uploadMenu: {
        icon: 'copy',
        text: 'Upload single-page template',
        shortcutText: '',
        action: () => {
          console.log('Upload template')
          uploadUtils.uploadTemplate()
        }
      },
      updateMenu: {
        icon: 'copy',
        text: 'Update single-page template',
        shortcutText: '',
        action: () => {
          uploadUtils.updateTemplate()
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      getBackgroundImage: 'getBackgroundImage',
      getToekn: 'user/getToken'
    }),
    hasDesignId(): boolean {
      return this.getPage(this.lastSelectedPageIndex).designId !== ''
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
          text: 'Append test clipper',
          shortcutText: 'Used for test',
          action: () => {
            layerUtils.addLayers(this.lastSelectedPageIndex, GeneralUtils.deepCopy(clipTest) as IImage)
          }
        },
        {
          icon: 'copy',
          text: 'Append test frame',
          shortcutText: 'Used for test',
          action: () => {
            console.log(layerFactary.newFrame(GeneralUtils.deepCopy(frameTest)))
            layerUtils.addLayers(this.lastSelectedPageIndex, layerFactary.newFrame(GeneralUtils.deepCopy(frameTest)) as IFrame)
          }
        },
        {
          icon: 'copy',
          text: 'Append test line',
          shortcutText: 'Used for test',
          action: () => {
            layerUtils.addLayers(this.lastSelectedPageIndex, GeneralUtils.deepCopy(lineTest) as IShape)
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
        layerUtils.addLayers(this.lastSelectedPageIndex, detachedBackgroundImage.config)
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
    }
  }
})
</script>

<style lang="scss" scoped>
.dropdowns {
  width: initial;
  height: initial;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 0;
  top: 0;
  z-index: setZindex("dropdowns");
  justify-content: center;
  border: 1px solid setColor(gray-4);
  &:focus {
    outline: none;
  }
  &__item {
    display: flex;
    align-items: center;
    padding: 5px;
    padding: 5px 10px;
    cursor: pointer;
    &:active {
      background-color: setColor(blue-3);
    }
  }
  &__hr {
    margin: 0px;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }
}

.shortcut {
}
</style>
