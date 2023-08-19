<template lang="pug">
div(class="toggle"
    :class="[modelValue ? 'bg-blue-1' : 'bg-gray-4']"
    :style="toggleStyles"
    @click="toggle")
  div(class="toggle__btn"
    :style="toggleBtnStyle")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    width: {
      type: Number,
      default: 60
    },
    modelValue: [Number, String, Boolean]
  },
  emits: ['update:modelValue'],
  computed: {
    toggleStyles(): { [index:string]: string } {
      return {
        width: `${this.width}px`,
        height: `${this.width / 2}px`
      }
    },
    toggleBtnStyle():{ [index:string]: string } {
      return {
        transform: `translateX(${this.modelValue ? this.width / 2 : 0}px) scale(0.8)`,
      }
    }
  },
  methods: {
    toggle() {
      this.$emit('update:modelValue', !(this.modelValue))
    }
  }
})
</script>

<style lang="scss" scoped>
.toggle {
  display: flex;
  position: relative;
  border-radius: 100px;
  transition: transform 0.3s ease-in-out, background-color 0.3s ease-in-out;
}

.toggle__btn {
  height: 100%;
  width: 50%;
  box-sizing: border-box;
  position: absolute;
  border-radius: 100px;
  transition: 0.3s;
  transform: translateX(0) scale(0.8);
  transition: transform 0.3s ease-in-out;
  background-color: setColor(white);
}
</style>
