<template lang="pug">
div(class="label-with-range")
  div(class="label-with-range__label flex-between"
      :class="{ pointer: !disabled }"
      @click="openCorRadSliderPopup")
    div(class="label-with-range__label__description")
      slot
        div placeholder
    div(class="label-with-range__label__value"
        :class="{ disabled: disabled }")
      input(:value="Math.round(value)"
            @input="setValue"
            :disabled="disabled"
            @change="handleChangeStop")

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import vClickOutside from 'click-outside-vue3'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'

export default defineComponent({
  directives: {
    clickOutside: vClickOutside.directive
  },
  props: {
    value: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      required: true
    },
    event: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      required: true
    }
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
}
</style>
