<template lang="pug">
div(class="header-bar" :style="rootStyles" @pointerdown.stop)
  div(class="header-bar__left" :class="{ editor: isInEditor }")
    header-tab(:tablist="leftTabs")
  div(class="header-bar__center")
    link-or-text(:title="centerTitle" :url="centerUrl")
  div(class="header-bar__right")
    header-tab(:tablist="rightTabs")
    slot
</template>

<script lang="ts">
import LinkOrText from '@/components/LinkOrText.vue'
import HeaderTab, { TabConfig } from '@/components/editor/mobile/HeaderTab.vue'
import { PropType, defineComponent } from 'vue'

export default defineComponent({
  props: {
    rootStyles: {
      default: () => ({}),
      type: Object as PropType<Record<string, string>>
    },
    isInEditor: {
      default: true,
      type: Boolean
    },
    leftTabs: {
      default: () => [],
      type: Array as PropType<TabConfig[]>
    },
    centerTitle: {
      default: '',
      type: String
    },
    centerUrl: {
      default: '',
      type: String
    },
    rightTabs: {
      default: () => [],
      type: Array as PropType<TabConfig[]>
    },
  },
  components: {
    LinkOrText,
    HeaderTab,
  },
})
</script>

<style lang="scss" scoped>
.header-bar {
  height: 26px;
  position: relative;
  @include setColors(nav, black-1) using ($color) {
    background-color: $color;
  }
  display: flex;
  align-items: center;
  justify-content: space-between;
  @include pic {
    padding-left: 16px;
    padding-right: 16px;
  }
  @include app(stk, cm) {
    height: 44px;
    box-sizing: border-box;
    padding-left: 24px;
    padding-right: 24px;
  }
  z-index: setZindex("header");
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    &.editor {
      gap: 24px;
      @media screen and (max-width: 360px) {
        gap: 16px;
      }
    }
    & > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 600;
    font-size: 18px;
    line-height: 140%;
    color: white;
    white-space: nowrap;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    &-text {
      color: white;
      font-weight: 600;
      font-size: 14px;
      line-height: 140%;
    }
  }
}
</style>
