<template lang="pug">
  div(class="popup-adjust p-10")
    div(class="popup-adjust__field"
      v-for="field in fields"
      :key="field.name")
      div(class="popup-adjust__label")
        div {{ field.label }}
        input(class="popup-adjust__range-input"
          :value="adjustTmp[field.name] || 0"
          :max="field.max"
          :min="field.min"
          :name="field.name"
          @input="handleField"
          @mouseup="handleChangeStop"
          type="range")
      input(class="popup-adjust__text body-2 text-gray-2 ml-10"
        type="text"
        :name="field.name"
        @input="handleField"
        @blur="handleChangeStop"
        :value="adjustTmp[field.name] || 0")
</template>

<script lang="ts">
import Vue from 'vue'
import stepsUtils from '@/utils/stepsUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'

export default Vue.extend({
  props: {
    imageAdjust: {
      type: Object,
      required: true
    }
  },
  data() {
    const fields = imageAdjustUtil.fields
    const adjustTmp = Object.assign(
      imageAdjustUtil.getDefaultProps(),
      this.imageAdjust
    )
    return {
      adjustTmp,
      fields
    }
  },
  watch: {
    imageAdjust(val) {
      Object.assign(this.adjustTmp, val)
    }
  },
  methods: {
    handleField(e: Event) {
      const { value, name } = e.target as HTMLInputElement
      const fieldVal = Number.isNaN(+value) ? 0 : +value
      this.adjustTmp[name] = fieldVal
      this.$emit('update', this.adjustTmp)
    },
    handleChangeStop() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-adjust {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 5px;
  box-sizing: border-box;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
  &__field {
    display: flex;
    flex-wrap: nowrap;
  }
  &__label {
    flex: 1;
    font-size: 14px;
    text-align: left;
    color: setColor(gray-2);
  }
  &__text {
    text-align: center;
    border: 1px solid setColor(gray-4);
    color: setColor(gray-2);
    border-radius: 0.25rem;
    width: 30px;
    height: 25px;
    align-self: flex-end;
  }

  &__range-input {
    display: block;
    appearance: none;
    outline: none;
    background: none;
    width: 100%;
    height: 20px;
    margin: 0;
    &::-webkit-slider-runnable-track {
      height: 2px;
      background-color: #d9dbe1;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 2px solid #4eabe6;
      transition: 0.2s;
      margin-top: -6.5px;
      position: relative;
    }
  }
}
</style>
