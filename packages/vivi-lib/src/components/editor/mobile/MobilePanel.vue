<template lang="pug">
div(class="mobile-panel"
    :class="{'panel-padding': !noPaddingTheme, 'not-rounded': noRoundTheme, 'at-bottom': bottomTheme}"
    :style="panelStyle"
    v-click-outside="vcoConfig()"
    ref="panel")
  div(v-if="!hideTopSection" class="mobile-panel__top-section"
    :class="{'self-padding': noPaddingTheme}")
    div(class="mobile-panel__drag-bar"
      :class="{'visible-hidden': hideDragBar}"
      @pointerdown.stop="dragPanelStart"
      @touchstart.stop="disableTouchEvent")
        div
    div(v-if="showLeftBtn || showRightBtn || panelTitle")
      div(class="mobile-panel__btn mobile-panel__left-btn"
          :class="[{'visible-hidden': !showLeftBtn, 'click-disabled': !showLeftBtn, 'insert': insertTheme}, $i18n.locale]")
        svg-icon(
          class="click-disabled"
          :iconName="leftBtnName"
          :iconColor="whiteTheme ? 'gray-2' : 'white'"
          :iconWidth="insertTheme ? '32px' : '20px'")
        div(class="mobile-panel__btn-click-zone"
          :class="{'insert-left': insertTheme}"
          @pointerdown.stop="leftButtonAction"
          @touchstart.stop="disableTouchEvent")
      div(class="mobile-panel__title")
        span(class="mobile-panel__title-text body-1 mr-10"
          :class="whiteTheme ? 'text-gray-2': 'text-white'") {{panelTitle}}
        div(v-if="currActivePanel === 'multiple-select'" class="mobile-panel__layer-num")
          span(class="label-sm text-white") {{selectedLayerNum}}
      div(class="mobile-panel__btn mobile-panel__right-btn"
          :class="[{'visible-hidden': !showRightBtn, 'click-disabled': !showRightBtn, 'insert': insertTheme}, $i18n.locale]")
        svg-icon(
          class="click-disabled"
          :iconName="rightBtnName"
          :iconColor="whiteTheme ? 'gray-2' : 'white'"
          :iconWidth="insertTheme ? '24px' : '20px'")
        div(class="mobile-panel__btn-click-zone"
          :class="{'insert-right': insertTheme}"
          @pointerdown.stop="rightButtonAction"
          @touchstart.stop="disableTouchEvent")
  div(class="mobile-panel__bottom-section")
    tabs(v-if="innerTabs.label" theme="light"
      :tabs="innerTabs.label" v-model="innerTabIndex")
    keep-alive(:include="keepAlivePanels")
      //- p-2 is used to prevent the edge being cutted by overflow: scroll or overflow-y: scroll
      component(v-if="dynamicBindIs && !isShowPagePreview && !hideDynamicComp"
        class="border-box"
        :class="{'p-2': $isPic}"
        :is="dynamicBindIs"
        :key="dynamicBindIs"
        :currPage="currPage"
        v-bind="dynamicBindProps"
        v-on="dynamicBindMethod"
        @close="closeMobilePanel")
  transition(name="panel-up")
    mobile-panel(v-if="!isSubPanel && currActiveSubPanel !== 'none'"
      :currActivePanel="currActiveSubPanel"
      :currColorEvent="currSubColorEvent"
      :isSubPanel="true"
      :currPage="currPage"
      @switchTab="switchTab"
      @close="closeMobilePanel")
</template>

<script lang="ts">
import Tabs from '@/components/Tabs.vue';
import mobilePanelMixin from '@/mixin/mobilePanel';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'mobile-panel',
  mixins: [mobilePanelMixin],
  components: {
    Tabs,
  },
})
</script>

<style lang="scss">
.mobile-panel {
  position: absolute;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: setZindex(mobile-panel);
  border-radius: 10px 10px 0 0;
  @include pic {
    box-shadow: 0px -2px 5px rgba(60, 60, 60, 0.1);
  }
  @include stk {
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.3);
  }
  @include cm {
    position: static;
    z-index: unset;
    transform: translateZ(-1px); // hide it behind footerTabs
  }
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  justify-items: center;

  &.not-rounded {
    border-radius: 0;
  }

  &.panel-padding {
    padding: 16px;
  }

  &.at-bottom {
    z-index: setZindex(mobile-panel-bottom);
  }

  &__top-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    &.self-padding {
      padding: 15px;
      padding-bottom: 0;
      box-sizing: border-box;
    }
    > div:nth-child(2) {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .tabs {
    margin-bottom: 14px;
  }

  &__btn {
    display: grid; // To fix div height != child height issue. https://stackoverflow.com/questions/5804256
    position: relative;
  }

  &__left-btn.insert {
    transform: translate(-2px, -6px);
    &.us{
      transform: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__right-btn.insert {
    transform: translate(-6px, -4px);
    &.us{
      transform: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__btn-click-zone {
    position: absolute;
    width: 28px;
    height: 28px;
    top: 0;
    left: 0;
    transform: translate(-4px, -4px);
    border-radius: 50%;
    touch-action: manipulation;
    &.insert-left {
      width: 32px;
      height: 32px;
      transform: none;
      border-radius: 5px;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
    &.insert-right {
      width: 32px;
      height: 32px;
      border-radius: 5px;
      &:active {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  &__bottom-section {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-auto-columns: minmax(0, 1fr);
    width: 100%;
    height: 100%;
    overflow-y: v-bind("insertTheme ? 'hidden' : 'scroll'");
    overflow-x: hidden;
    @include no-scrollbar;
    > *:last-child { // panel-* always take minmax(0, 1fr) grid layout.
      grid-row: 2 / 3;
    }
  }

  &__title {
    @include flexCenter();
    font-weight: bold;
  }

  &__layer-num {
    @include size(20px);
    @include flexCenter();
    @include setColors(blue-1, black-5) using ($color) {
      background-color: $color;
    }
    border-radius: 50%;
  }

  &__drag-bar {
    position: absolute;
    touch-action: manipulation;
    top: 2px;
    // 47 = 15 (MobilePanel margin)
    //    + 12 (half of gray-4 div width)
    //    + 20 (left/right btn)
    padding: 10px calc(50% - 47px);
    border-radius: 5px;
    > div {
      @include setColors(gray-4, black-4) using ($color) {
        background-color: $color;
      }
      height: 3px;
      width: 24px;
    }
  }
}
</style>
