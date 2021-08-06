<template lang="pug">
  div(class="dropdowns dropdowns--page bg-gray-6")
    template(v-if="")
      div(class="dropdowns__item"
          @click="uploadMenu.action")
        svg-icon(
          class="pointer"
          :iconName="uploadMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{uploadMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{uploadMenu.shortcutText}}
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
    div(v-if="_detachedBackgroundImage(lastSelectedPageIndex).config.src !=='none'"
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
import { mapGetters, mapMutations } from 'vuex'
import layerUtils from '@/utils/layerUtils'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  data() {
    return {
      baseBgImgConfig: {
        type: 'image',
        src: 'none',
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
          console.log('update')
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      _detachedBackgroundImage: 'getBackgroundImage'
    })
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
      const detachedBackgroundImage = this._detachedBackgroundImage(this.lastSelectedPageIndex)
      layerUtils.addLayers(this.lastSelectedPageIndex, detachedBackgroundImage.config)
      this._setBackgroundImage({
        pageIndex: this.lastSelectedPageIndex,
        config: this.baseBgImgConfig
      })
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
