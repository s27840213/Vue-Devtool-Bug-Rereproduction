<template lang="pug">
  label(class="download-check-button")
    slot
      span(class="download-check-button__label") {{ label }}
    input(class="download-check-button__input"
      :type="type"
      :value="value"
      :name="groupName"
      :checked="checked"
      @change="handleChange")
    span(class="download-check-button__checkmark")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    defaultChecked: {
      type: Boolean,
      default: false
    },
    groupName: String,
    type: String,
    label: String,
    value: String
  },
  data () {
    return { checked: this.defaultChecked ? 'checked' : '' }
  },
  watch: {
    defaultChecked (checked) {
      this.checked = checked
    }
  },
  methods: {
    handleChange (event: Event) {
      const { value, checked } = event.target as HTMLInputElement
      this.$emit('change', { value, checked })
    }
  }
})
</script>

<style lang="scss" scoped>
.download-check-button {
  $this: &;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
  padding-left: 23px;
  &__checkmark {
    position: absolute;
    left: 0;
    height: 16px;
    width: 16px;
    border: 1px solid #C3CBCD;
    border-radius: 50%;
    background-color: setColor(white);
    box-sizing: border-box;
    &::after {
      content: '';
      position: absolute;
      background-color: transparent;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  &__input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
    &:checked + #{$this}__checkmark {
      border-color: #4EABE6;
      &::after {
        background-color: #4EABE6;
      }
    }
  }
}
</style>
