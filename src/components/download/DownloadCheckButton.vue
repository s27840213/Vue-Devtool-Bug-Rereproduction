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
        v-tooltip(v-if="info" class="download-check-button__label__icon-info" theme="hint-menu")
          svg-icon(iconName="info"
            :iconWidth="'16px'"
            :iconColor="'gray-2'")
          template(v-slot:popper)
            span {{info}}
              a(v-if="infoUrl" class="text-white" :href="infoUrl" target="_blank") {{`${$t('NN0801')}`}}
    input(class="download-check-button__input"
      :type="type"
      :value="value"
      :name="groupName"
      :checked="checked"
      @change="handleChange")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    defaultChecked: {
      type: Boolean,
      default: false
    },
    iconSize: {
      type: String,
      default: '16px'
    },
    info: {
      type: String,
      default: ''
    },
    infoUrl: {
      type: String,
      default: ''
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
  &__label {
    display: flex;
    gap: 8px;
    &__icon-info {
      display: flex;
      align-items: center;
    }
  }
}
</style>
