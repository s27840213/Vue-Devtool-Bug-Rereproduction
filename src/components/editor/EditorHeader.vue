<template lang="pug">
  div(class="editor-header")
    div
      div(class="subtitle-2 text-gray-2 pointer" @click="setPages()") New Design
      div(class="subtitle-2 text-gray-2" @click="setModalOpen(true)") File
      div(class="subtitle-2 text-gray-2") Resize
      svg-icon(:class="{'pointer': !isInFirstStep}"
        :iconName="'undo'"
        :iconWidth="'20px'"
        :iconColor="!isInFirstStep ? 'gray-2' : 'gray-4'"
        @click.native="ShortcutUtils.undo()")
      svg-icon(:class="{'pointer': !isInLastStep}"
        :iconName="'redo'"
        :iconWidth="'20px'"
        :iconColor="!isInLastStep ? 'gray-2' : 'gray-4'"
        @click.native="ShortcutUtils.redo()")
    div
      svg-icon(:iconName="'share-alt'"
        :iconWidth="'20px'"
        :iconColor="'gray-2'")
      btn(:hasIcon="true"
        :iconName="'download'"
        :iconWidth="'15px'"
        :type="'primary-mid'"
        @click.native="importJsonFile()") Import JSON
      btn(:hasIcon="true"
        :iconName="'download'"
        :iconWidth="'15px'"
        :type="'primary-mid'"
        @click.native="exportJsonFile()") Export JSON
      btn(:hasIcon="true"
        :iconName="'download'"
        :iconWidth="'15px'"
        :type="'primary-mid'") Download
      img(:src="require('@/assets/img/svg/avatar.svg')")
</template>

<script lang="ts">
import Vue from 'vue'
import FileUtils from '@/utils/fileUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import StepsUtils from '@/utils/stepsUtils'
import ModalUtils from '@/utils/modalUtils'
import { mapMutations } from 'vuex'

export default Vue.extend({
  data() {
    return {
      ShortcutUtils,
      StepsUtils
    }
  },
  computed: {
    isInFirstStep(): boolean {
      return (StepsUtils.currStep === 0) && (StepsUtils.steps.length > 1)
    },
    isInLastStep(): boolean {
      return (StepsUtils.currStep === (StepsUtils.steps.length - 1)) && (StepsUtils.steps.length > 1)
    }
  },
  methods: {
    ...mapMutations({
      _setPages: 'SET_pages',
      _setModalInfo: 'modal/SET_MODAL_INFO',
      _setModalOpen: 'modal/SET_MODAL_OPEN'
    }),
    exportJsonFile() {
      FileUtils.export()
    },
    importJsonFile() {
      FileUtils.import()
    },
    setPages() {
      this._setPages([{
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        backgroundImage: {
          src: 'none',
          config: {
            type: 'image',
            src: 'none',
            clipPath: '',
            active: false,
            shown: false,
            locked: false,
            moved: false,
            imgControl: false,
            isClipper: false,
            dragging: false,
            designId: '',
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
          posX: -1,
          posY: -1
        },
        name: 'Default Page',
        layers: [
        ],
        documentColor: [],
        designId: ''
      }])
    },
    setModalOpen(open: boolean) {
      ModalUtils.setModalInfo('測試', ['1', '2', '3'], {
        msg: '確認',
        action: () => {
          console.log('確認')
        }
      }, {
        msg: '消取',
        action: () => {
          console.log('消取')
        }
      })
      this._setModalOpen(open)
    }
  }
})
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 88px;
  background-color: #eaf1f6;
  border: 1px solid #e2e5e6;
  box-sizing: border-box;
  > div {
    &:nth-child(1) {
      display: grid;
      grid-template-columns: repeat(6, auto);
      grid-template-rows: 1fr;
      column-gap: 30px;
      justify-items: center;
      align-items: center;
      margin-left: 60px;
    }
    &:nth-child(2) {
      display: grid;
      grid-template-columns: repeat(5, auto);
      grid-template-rows: 1fr;
      column-gap: 15px;
      justify-items: center;
      align-items: center;
      margin-right: 40px;
    }
  }
}
</style>
