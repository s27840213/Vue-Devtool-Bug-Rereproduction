<template lang="pug">
  div(class="label-with-range")
    div(class="label-with-range__label flex-between")
      div(class="label-with-range__label__description")
        slot
          div placeholder
      div(class="label-with-range__label__value"
          :class="{ disabled: disabled }"
          @click="openCorRadSliderPopup")
        input(:value="Math.round(value)"
              @input="setValue"
              :disabled="disabled"
              @change="handleChangeStop")
        //- div(v-if="mode === 'open'"
        //-     class="label-with-range__range-input-wrapper"
        //-     v-click-outside="handleSliderModal")
        //-   input(class="label-with-range__range-input"
        //-     :value="value"
        //-     :max="max"
        //-     :min="min"
        //-     v-ratio-change
        //-     type="range"
        //-     @input="setValue")

</template>

<script lang="ts">
import Vue from 'vue'
import vClickOutside from 'v-click-outside'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    value: Number,
    max: Number,
    min: Number,
    event: String,
    disabled: Boolean
  },
  mounted() {
    popupUtils.on(this.event, (value: number) => {
      this.emitValue(value)
    })
  },
  methods: {
    openCorRadSliderPopup() {
      if (this.disabled) return
      popupUtils.setCurrEvent(this.event)
      popupUtils.setSliderConfig({ value: this.value, min: this.min, max: this.max, noText: true })
      popupUtils.openPopup('slider', {
        posX: 'right',
        target: '.label-with-range__label'
      })
    },
    setValue(e: Event) {
      const valueString = (e.target as HTMLInputElement).value
      const value = parseInt(valueString === '' ? '0' : valueString, 10)
      popupUtils.setSliderConfig({ value: value })
      this.emitValue(value)
    },
    emitValue(value: number) {
      this.$emit('update', value)
    },
    handleChangeStop() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.label-with-range {
  @include size(100%, 100%);
  text-align: center;
  // grid-template-rows: auto auto auto minmax(0, 1fr);
  // grid-template-columns: 1fr;
  &__label {
    display: flex;
    height: 100%;
    align-items: center;
    background: #FFFFFF;
    border: 1px solid map-get($colors, gray-4);
    border-radius: 3px;
    box-sizing: border-box;
    font-size: 14px;
    position: relative;

    &__description {
      width: 60%;
    }

    &__value {
      padding-right: 6%;
      width: 20%;
      cursor: pointer;

      &.disabled {
        color: map-get($colors, gray-4);
        cursor: not-allowed;
      }
    }
  }

  &__range-input-wrapper {
    position: absolute;
    z-index: 9;
    // top: -20px;
    // left: auto;
    right: auto;
    padding: auto;
    width: 155px;
    height: 35px;
    top: 42px;
    background-color: #ffffff;
    background-color: white;
    box-shadow: 0 0 0 1px rgb(64 87 109 / 7%), 0 2px 12px rgb(53 71 90 / 20%);
    border: 1px solid #d9dbe1;
    border-radius: 3px;
    display: flex;
    align-items: center;
    right: -2px;
  }
  &__range-input {
    display: block;
    margin: auto;
    width: 120px;
    height: 35px;
    appearance: none;
    outline: none;
    background: none;
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
      border: 2px solid #3c64b1;
      transition: 0.2s;
      margin-top: -6.5px;
      position: relative;
    }
  }
}
</style>
