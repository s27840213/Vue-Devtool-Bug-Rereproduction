<template lang="pug">
div(class="component-log-item"
    @click="toggleItem")
  div(class="component-log-item__main-info")
    div(class="flex items-center")
      //- svg-icon(iconName="plus-square" iconColor="gray-3" iconWidth="16px" @click="toggleContent(!showContent)")
      span(class="component-log-item__component-name text-bold") {{log.component}}
      span(class="component-log-item__time text-bold ml-5") {{`${parseFloat(log.time.toFixed(3))}  ms`}}
    div(class="component-log-item__parent")
      span(class="text-white") from: {{log.parent}}
  div(v-if="allOpened || showDetail" class="component-log-item__detail-info flex flex-column pl-15")
    template(v-for="(value, index) in Object.entries(log.propsData)")
      div(v-if="value[1] !== undefined"
          class="ml-10")
        span(class="text-bold text-gray-3") {{`${value[0]}: `}}
        span(class="text-gray-3") {{value[1]}}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: [],
  name: 'ComponentLogItem',
  props: {
    log: {
      type: Object,
      required: true
    },
    allOpened: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showDetail: false
    }
  },
  methods: {
    toggleItem() {
      this.showDetail = !this.showDetail
    }
  }
})
</script>

<style lang="scss" scoped>
.component-log-item {
  display: flex;
  flex-direction: column;
  padding: 4px 4px;
  border: 1px solid black;
  border-radius: 5px;
  margin: 2px 0px;
  box-sizing: border-box;
  font-size: 14px;

  &__main-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    text-align: left;
  }

  &__detail-info {
    display: flex;
    justify-content: space-between;
    width: 100%;
    text-align: left;
    box-sizing: border-box;
  }

  &__parent {
    background-color: setColor(blue-1, 0.9);
    border-radius: 40px;
    font-size: 10px;
    padding: 2px 12px;
  }

  &__time {
    background-color: setColor(red-2);
    box-sizing: border-box;
    padding: 2px 8px;
    font-size: 10px;
    border-radius: 50px;
    color: white;
  }
}
</style>
