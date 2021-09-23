<template lang="pug">
  div(class="dropdown dropdown__layer bg-gray-6"
      @click.stop="closeDropdown")
    template(v-if="getToekn!==''")
      div(class="dropdown__item"
          @click="pageUploadMenu.action")
        svg-icon(
          class="pointer"
          :iconName="pageUploadMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{pageUploadMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{pageUploadMenu.shortcutText}}
    template(v-if="hasDesignId && getToekn!==''")
      div(class="dropdown__item"
          @click="pageUpdateMenu.action")
        svg-icon(
          class="pointer"
          :iconName="pageUpdateMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{pageUpdateMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{pageUpdateMenu.shortcutText}}
    template(v-if="getToekn!=='' && isText")
      div(class="dropdown__item"
          @click="uploadMenu.action")
        svg-icon(
          class="pointer"
          :iconName="uploadMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{uploadMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{uploadMenu.shortcutText}}
    template(v-if="currSelectedInfo.layers[0] && currSelectedInfo.layers[0].designId !=='' && getToekn!=='' && isText")
      div(class="dropdown__item"
          @click="updateMenu.action")
        svg-icon(
          class="pointer"
          :iconName="updateMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{updateMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{updateMenu.shortcutText}}
    template(v-if="isImage")
      div(class="dropdown__item"
          @click="updateImageAsClipper.action")
        svg-icon(
          class="pointer"
          :iconName="updateImageAsClipper.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{updateImageAsClipper.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{uploadMenu.shortcutText}}
    hr(class="dropdown__hr")
    div(v-for="(data,index) in shortcutMenu()"
        :key="`dropdown__shortcut-${index}`"
        class="dropdown__item"
        @click="data.action")
      svg-icon(
        class="pointer"
        :iconName="data.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{data.text}}
      span(class="shortcut ml-10 body-2 text-gray-3") {{data.shortcutText}}
    div(v-if="(isGroup && currSelectedInfo.layers.length === 1) || (!isGroup && currSelectedInfo.layers.length > 1)"
        class="dropdown__item"
        @click="groupOption.action")
      svg-icon(
        class="pointer"
        :iconName="groupOption.icon"
        :iconWidth="'16px'"
        :iconColor="'gray-1'")
      span(class="ml-10 body-2") {{groupOption.text}}
      span(class="shortcut ml-10 body-2 text-gray-3") {{groupOption.shortcutText}}
    hr(class="dropdown__hr")
    div(v-if="layerNum > 1")
      div(v-for="(data,index) in orderMenu()"
          :key="`dropdown__order-${index}`"
          class="dropdown__item"
          @click="data.action")
        svg-icon(
          class="pointer"
          :iconName="data.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{data.text}}
        div(class="shortcut")
          span(class="ml-10 body-2 text-gray-3") {{data.shortcutText}}
    hr(class="dropdown__hr")
    div(v-if="(currSelectedInfo.layers.length === 1) && (currSelectedInfo.types.has('image'))"
        class="dropdown__item"
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
import { mapGetters, mapMutations } from 'vuex'
import { IImage } from '@/interfaces/layer'
import TextUtils from '@/utils/textUtils'
import uploadUtils from '@/utils/uploadUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import dropdownUtils from '@/utils/dropdownUtils'

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
      getToekn: 'user/getToken',
      _layerNum: 'getLayersNum'
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
      return this.getType.includes('text')
    },
    isImage(): boolean {
      return this.currSelectedInfo.layers.length === 1 && this.getType.includes('image')
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
          uploadUtils.uploadText()
        }
      }
    },
    updateMenu(): any {
      return {
        icon: 'copy',
        text: `Update ${this.getType[0]}`,
        shortcutText: '',
        action: () => {
          uploadUtils.updateText()
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
    updateImageAsClipper(): any {
      return {
        icon: 'copy',
        text: 'Update image as Clipped-Image',
        shortcutText: '',
        action: () => {
          layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { isClipper: true })
          uploadUtils.updateTemplate()
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
      this._setBackgroundImage({
        pageIndex: this.currSelectedInfo.pageIndex,
        config: (this.currSelectedInfo.layers[0] as IImage)
      })
      ShortcutUtils.del()
    },
    closeDropdown() {
      dropdownUtils.closeDropdown('layer')
    }
  }
})
</script>

<style lang="scss" scoped>
</style>
