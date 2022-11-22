<template lang="pug">
label(class="download-check-button")
  svg-icon(v-if="type === 'checkbox'"
    class="mr-5"
    :iconColor="checked ? 'blue-1' : 'light-gray'"
    :iconName="checked ? 'checkbox-checked' : 'checkbox'"
    :iconWidth="iconSize")
  svg-icon(v-else
    class="mr-5"
    :iconColor="checked ? 'blue-1' : 'light-gray'"
    :iconName="checked ? 'radio-checked' : 'radio'"
    :iconWidth="iconSize")
  slot
    span(class="download-check-button__label") {{ label }}
  input(class="download-check-button__input"
    :type="type"
    :value="value"
    :name="groupName"
    :checked="checked"
    @change="handleChange")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    defaultChecked: {
      type: Boolean,
      default: false
    },
    iconSize: {
      type: String,
      default: '16px'
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
      this.checked = checked ? 'checked' : ''
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
  &__input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }
}
</style>
