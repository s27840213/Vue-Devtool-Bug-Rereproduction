<template lang="pug">
  div(class="dropdowns dropdowns--layer bg-gray-6")
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
    template(v-if="currSelectedInfo.layers[0] && currSelectedInfo.layers[0].designId !==''")
      div(class="dropdowns__item"
          @click="updateMenu.action")
        svg-icon(
          class="pointer"
          :iconName="updateMenu.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{updateMenu.text}}
        span(class="shortcut ml-10 body-2 text-gray-3") {{updateMenu.shortcutText}}
    hr(class="dropdowns__hr")
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
    div(v-if="layerNum > 1")
      div(v-for="(data,index) in orderMenu()"
          :key="`dropdowns__order-${index}`"
          class="dropdowns__item"
          @click="data.action")
        svg-icon(
          class="pointer"
          :iconName="data.icon"
          :iconWidth="'16px'"
          :iconColor="'gray-1'")
        span(class="ml-10 body-2") {{data.text}}
        div(class="shortcut")
          span(class="ml-10 body-2 text-gray-3") {{data.shortcutText}}
    hr(class="dropdowns__hr")
    div(v-if="(currSelectedInfo.layers.length === 1) && (currSelectedInfo.types.has('image'))"
        class="dropdowns__item"
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
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      _layerNum: 'getLayersNum'
    }),
    layerNum(): number {
      return this.currSelectedInfo.pageIndex === -1 ? 0 : this._layerNum(this.currSelectedInfo.pageIndex)
    },
    getType(): Array<string> {
      console.log(this.currSelectedInfo.types)
      return [...this.currSelectedInfo.types]
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
            ShortcutUtils.copy()
            FocusUtils.focusLastSelectedPage()
          }
        },
        {
          icon: 'copy',
          text: 'Paste',
          shortcutText: 'Cmd+V',
          action: () => {
            ShortcutUtils.paste()
            FocusUtils.focusLastSelectedPage()
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
