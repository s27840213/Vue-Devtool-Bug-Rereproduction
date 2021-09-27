<template lang="pug">
  div(class="general-value-selector")
    div(class="general-value-selector__wrapper")
      ul
        template(v-for="(subArray, index) in valueArray")
          li(v-for="(i, index2) in subArray" :key="i"
            :class="{ 'general-value-selector__value-selected': values.includes(i) }"
            :style="{'min-width': `${itemMinWidth}px`}")
            div(class="general-value-selector__value" @click="setValue(index, i)" :style="{'height': `${buttonHeight}px`}")
              slot(:name="'g' + index + 'i' + index2") {{ 'g' + index + 'i' + index2 }}
          div(class="horizontal-rule" v-if="notLastSubArray(index)" :style="{'width': `${itemMinWidth * 2 / 3}px`}")

</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'

export default Vue.extend({
  props: {
    valueArray: Array,
    values: Array,
    itemMinWidth: {
      type: String,
      default: '40'
    },
    buttonHeight: {
      type: String,
      default: '30'
    }
  },
  data() {
    return {
    }
  },
  methods: {
    setValue(index: number, i: number | string) {
      this.$emit('update', index, i)
    },
    notLastSubArray(index: number): boolean {
      const length = (this.valueArray ?? []).length
      return index !== length - 1
    }
  }
})
</script>

<style lang="scss" scoped>
.general-value-selector {
  background-color: #fff;
  box-shadow: 0 0 0 1px rgb(64 87 109 / 7%), 0 2px 12px rgb(53 71 90 / 20%);
  padding: 0;
  border-radius: 4px;
  overflow: hidden;
  transition: opacity 150ms ease-in-out 0s;
  &__wrapper {
    position: relative;
    overflow-y: auto;
    max-height: 35vh;
    > ul {
      padding: 0;
      width: 100%;
      margin: 0;
      > li {
        list-style: none;
        text-align: center;
        min-width: 40px;
        transition: background-color .1s linear;
        > div {
          padding: 0 6px;
          box-sizing: border-box;
          width: 100%;
          height: 20px;
          display: flex;
          align-items: center;
          @extend .flex-evenly;
        }
        &:hover {
          background-color: map-get($colors, blue-4);
        }
      }
    }
  }
  &__value {
    text-align: center;
    padding: 0;
    min-width: 0;

    &-selected {
      background-color: map-get($colors, blue-4);
    }
  }
}
.horizontal-rule {
  @extend .bg-gray-4;
  height: 1px;
  margin: auto;
  margin-top: 0;
  margin-bottom: 0;
  padding: 0;
}
</style>
