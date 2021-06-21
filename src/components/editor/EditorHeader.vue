<template lang="pug">
  div(class="editor-header")
    div
      div(class="subtitle-2 text-gray-2") New Design
      div(class="subtitle-2 text-gray-2") File
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
    exportJsonFile() {
      FileUtils.export()
    },
    importJsonFile() {
      FileUtils.import()
    }
  }
})
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  background-color: #e9ecf3;
  border: 1px solid #e2e5e6;
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
