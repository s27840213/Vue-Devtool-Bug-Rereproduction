<template lang="pug">
div(class="panel-page-management")
  div(class="panel-page-management__actions")
    div(v-for="button in buttons" :key="button.key" class="panel-page-management__actions__item" @click="button.action")
      svg-icon(:iconName="button.iconName" iconWidth="24px" iconColor="white")
      div(class="panel-page-management__actions__item__text text-white")
        span {{ button.title }}
  div(class="btn-close" @click="close")
    svg-icon(iconName="close" iconWidth="24px" iconColor="black-1")
    div(class="btn-close__text body-XS text-black-1")
      span Close
</template>

<script lang="ts">
import editorUtils from '@/utils/editorUtils'
import { defineComponent } from 'vue'

interface IButton {
  key: string,
  title: string
  iconName: string
  action: () => void
}

export default defineComponent({
  data() {
    return {
    }
  },
  props: {
  },
  computed: {
    buttons(): IButton[] {
      return [
        {
          key: 'add-page',
          title: 'Add page',
          iconName: 'add-page',
          action: this.addPage
        },
        {
          key: 'duplicate',
          title: 'Duplicate',
          iconName: 'duplicate',
          action: this.duplicatePage
        },
        {
          key: 'preview',
          title: 'Preview',
          iconName: 'grid',
          action: this.preview
        },
        {
          key: 'delete',
          title: 'Delete',
          iconName: 'delete',
          action: this.deletePage
        }
      ]
    }
  },
  methods: {
    addPage() {
      console.log('addPage')
    },
    duplicatePage() {
      console.log('duplicatePage')
    },
    deletePage() {
      console.log('deletePage')
    },
    preview() {
      console.log('preview')
    },
    close() {
      // TODO: close mobile panel
      editorUtils.setCurrActivePanel('none')
      editorUtils.setShowMobilePanel(false)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-page-management {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 16px;
  padding-bottom: 14px;
  &__actions {
    display: grid;
    grid-auto-flow: column;
    column-gap: 20px;
    justify-content: center;
    margin-top: 16px;
    &__item {
      @include size(56px, 56px);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      border-radius: 5px;
      padding: 6px 0px;
      align-items: center;
      overflow: hidden;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
      &__text {
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        >span {
          font-weight: 400;
          font-size: 12px;
          line-height: 20px;
          transform: scale(0.83); // scale text to 10px
          white-space: nowrap;
        }
      }
    }
  }
}
.btn-close {
  width: min-content;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 8px;
  gap: 4px;
  background: #FFFFFF;
  border-radius: 100px;
}
</style>
