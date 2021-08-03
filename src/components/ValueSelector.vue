<template lang="pug">
  div(class="value-selector")
    div(class="value-selector__wrapper")
      ul
        li(v-for="i in 88" :key="i" :style="liStyles(i)")
          button(@click="setValue(i)")
            div(class="value-selector__value")
              span {{ i }}

</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    value: String
  },
  data() {
    return {
      currentValue: NaN
    }
  },
  mounted() {
    if (typeof this.value !== 'undefined') {
      this.currentValue = parseInt(this.value)
    }
  },
  methods: {
    liStyles(i: number) {
      if (this.currentValue === i) {
        return {
          'background-color': 'rgba(15, 40, 71, 0.14)'
        }
      }
    },
    setValue(value: number) {
      this.currentValue = value
      this.$emit('update', value)
    }
  }
})
</script>

<style lang="scss" scoped>
.value-selector {
  background-color: #fff;
  box-shadow: 0 0 0 1px rgb(64 87 109 / 7%), 0 2px 12px rgb(53 71 90 / 20%);
  padding: 0;
  border-radius: 4px;
  margin: 8px 0;
  overflow: hidden;
  transition: opacity 150ms ease-in-out 0s;
  &__wrapper {
    position: relative;
    overflow-y: auto;
    max-height: 35vh;
    > ul {
      padding: 8px 0;
      width: 100%;
      margin: 0;
      > li {
        list-style: none;
        text-align: center;
        min-width: 40px;
        transition: background-color .1s linear;
        > button {
          padding: 0 6px;
          box-sizing: border-box;
          width: 100%;
          height: 30px;
        }
        &:hover {
          background-color: rgb(64, 84, 109, .07);
        }
      }
    }
  }
  &__value {
    text-align: center;
    height: 100%;
    line-height: 1.6;
    padding: 0;
    min-width: 0;
  }
}
</style>
