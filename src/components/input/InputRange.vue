<template lang="pug">
div(class="circle-checkbox")
  input(:id="value" type="checkbox" name="cb" :value="value" v-model="myVm")
  label(:for="value")
    svg(fill="none", viewBox="0 0 12 12")
      circle(class="box" cx="6", cy="6", r="5.5", fill="#4EABE6", stroke="#fff")
      path(class="check" stroke="#fff", stroke-linecap="round", d="M4 5.333l1.087 1.933a.5.5 0 00.86.02L8 4")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    value: String,
    checkedValues: Array
  },
  data() {
    return {
      checked: false
    }
  },
  computed: {
    myVm: {
      get: function (): Array<any> | boolean {
        return this.checkedValues !== undefined ? this.checkedValues : this.checked
      },
      set(value: Array<any> | boolean): void {
        if (!this.checkedValues) {
        } else {
          this.$emit('update', value)
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.circle-checkbox {
  > input {
    display: none;
    pointer-events: none;
    & + label {
      cursor: pointer;
      font-size: 0.8em;
      display: grid;
      grid-template-columns: auto 3fr;
      filter: drop-shadow(0px 0px 2px setColor(blue-1));
      svg {
        width: 18px;
        .box {
          fill: white;
          transition: fill 0.1s linear, stroke-dashoffset 0.3s 0.2s linear;
        }
        .check {
          stroke-dasharray: 70;
          stroke-dashoffset: 70;
          // fill: none;
          transition: stroke-dashoffset 0.3s 0.2s linear;
        }
      }
    }

    &:checked + label {
      .box {
        fill: setColor(blue-1);
      }
      .check {
        stroke-dashoffset: 0;
      }
    }
  }
}
</style>
