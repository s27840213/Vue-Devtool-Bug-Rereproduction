<template lang="pug">
div(class="component-log"
    @pointerdown="moveStart"
    :style="logStyles")
  div(class="component-log__header")
    span Component Updated Log
    div(class="component-log__size-options")
      span(class="component-log__size-option mr-15"
        :class="{'component-log__size-option--active': allOpened}"
        @click="toggleAllOpend()") All Open
      span(class="component-log__size-option mr-5"
        :class="{'component-log__size-option--active': !isLargeSize}"
        @click="toggleSize(false)") S
      span(class="component-log__size-option"
        :class="{'component-log__size-option--active': isLargeSize}"
        @click="toggleSize(true)") L
      svg-icon(iconName="chevron-down"
        iconColor="gray-1"
        iconWidth="16px"
        :style="{transform: showContent ? '' : 'rotate(180deg)'}"
        @click.native="toggleContent(!showContent)")
  div(v-show="showContent && logs.length > 0" class="component-log__content" ref="content")
    component-log-item(
      v-for="(log,index) in logs"
      :key="index"
      :log="log"
      :allOpened="allOpened")
    //- div(v-for="(log,index) in logs"
    //-     :key="index"
    //-     class="component-log__item")
    //-   div(class="flex items-center")
    //-     svg-icon(iconName="plus-square" iconColor="gray-3" iconWidth="16px" @click.native="toggleContent(!showContent)")
    //-     span(class="component-log__component-name text-bold") {{log.component}}
    //-     span(class="component-log__time text-bold ml-5") {{`${parseFloat(log.time.toFixed(3))}  ms`}}
    //-   div(class="component-log__parent")
    //-     span(class="text-white") from: {{log.parent}}
</template>

<script lang="ts">
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import mouseUtils from '@/utils/mouseUtils'
import { debounce } from 'lodash'
import Vue from 'vue'
import ComponentLogItem from '@/components/componentLog/ComponentLogItem.vue'

export default Vue.extend({
  name: 'ComponentLog',
  components: {
    ComponentLogItem
  },
  props: {
    logs: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      initPos: {
        x: 0,
        y: 0
      },
      currPos: {
        x: 0,
        y: 0
      },
      deltaX: 0,
      deltaY: 0,
      absPos: { x: 0, y: 0 },
      showContent: true,
      isLargeSize: false,
      allOpened: false
    }
  },
  watch: {
    logs: debounce(function (this: any) {
      (this.$refs.content as HTMLElement).scrollTop = (this.$refs.content as HTMLElement).scrollHeight
    }, 500)
  },
  computed: {
    logStyles(): { [index: string]: string } {
      return {
        transform: `translate(${this.currPos.x}px,${this.currPos.y}px)`,
        maxHeight: `${this.isLargeSize ? 800 : 400}px`
      }
    }
  },
  methods: {
    moveStart(e: PointerEvent) {
      Object.assign(this.absPos, mouseUtils.getMouseAbsPoint(e))
      eventUtils.addPointerEvent('pointerup', this.moveEnd)
      eventUtils.addPointerEvent('pointermove', this.moving)
      this.initPos.x = this.currPos.x
      this.initPos.y = this.currPos.y
    },
    moving(e: PointerEvent) {
      const newAbsPos = mouseUtils.getMouseAbsPoint(e)
      this.deltaX = newAbsPos.x - this.absPos.x
      this.deltaY = newAbsPos.y - this.absPos.y

      this.currPos.x = this.initPos.x + this.deltaX
      this.currPos.y = this.initPos.y + this.deltaY
    },
    moveEnd(e: PointerEvent) {
      eventUtils.removePointerEvent('pointerup', this.moveEnd)
      eventUtils.removePointerEvent('pointermove', this.moving)
    },
    toggleContent() {
      this.showContent = !this.showContent
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    toggleSize(bool: boolean) {
      this.isLargeSize = bool
    },
    toggleAllOpend() {
      this.allOpened = !this.allOpened
    }
  }
})
</script>

<style lang="scss" scoped>
.component-log {
  position: absolute;
  bottom: 50px;
  right: 50px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 500px;
  z-index: 10000;
  background-color: setColor(gray-5);

  box-sizing: border-box;
  border-radius: 15px;
  background-color: rgba(white, 0.7);
  box-shadow: 20px 20px 50px rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.4);
  border-left: 1px solid rgba(255, 255, 255, 0.6);
  padding: 12px;
  backdrop-filter: blur(5px);

  &__header {
    display: flex;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
  }
  &__content {
    margin-top: 4px;
    width: 100%;
    overflow-y: scroll;
    @include push-scrollbar10;
    border-top: 1px solid gray;
  }

  &__parent {
    background-color: setColor(blue-1, 0.9);
    border-radius: 40px;
    font-size: 10px;
    padding: 2px 4px;
  }

  &__time {
    background-color: setColor(red-2);
    box-sizing: border-box;
    padding: 2px 8px;
    font-size: 10px;
    border-radius: 50px;
    color: white;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    text-align: left;
    padding: 4px 4px;
    border: 1px solid black;
    border-radius: 5px;
    margin: 2px 0px;
    box-sizing: border-box;
    font-size: 14px;
  }

  &__size-options {
    display: flex;
    align-items: center;
  }

  &__size-option {
    font-size: 10px;
    padding: 4px 16px;
    box-sizing: border-box;
    border: 1px solid setColor(gray-2);
    border-radius: 20px;

    &--active {
      border-color: setColor(blue-1);
      color: setColor(white);
      background-color: setColor(blue-1);
    }
  }
}
</style>
