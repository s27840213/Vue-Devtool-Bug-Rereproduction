<template lang="pug">
div(class="panel-font-size")
  font-size-selector
  input(class="panel-font-size__range-input"
    :style="progressStyles()"
    v-model.number="fontSize"
    :max="fieldRange.fontSize.max"
    :min="fieldRange.fontSize.min"
    step="1"
    type="range"
    :disabled="fontSize === '--'"
    @pointerup="handleChangeStop")
</template>

<script lang="ts">
import FontSizeSelector from '@/components/input/FontSizeSelector.vue'
import generalUtils from '@/utils/generalUtils'
import stepsUtils from '@/utils/stepsUtils'
import textPropUtils from '@/utils/textPropUtils'
import _ from 'lodash'
import { defineComponent } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    FontSizeSelector
  },
  data() {
    return {
      openValueSelector: false,
      fieldRange: {
        fontSize: { min: 1, max: 144 },
        lineHeight: { min: 0.5, max: 2.5 },
        fontSpacing: { min: -200, max: 800 },
        // fontSpacing: { min: -2, max: 8 },
        // lineHeight: { min: 0, max: 300 },
        opacity: { min: 0, max: 100 }
      }
    }
  },
  computed: {
    ...mapGetters({
      layerIndex: 'getCurrSelectedIndex'
    }),
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    fontSize: {
      get(): number | string {
        return this.props.fontSize === '--' ? this.props.fontSize : _.round(this.props.fontSize, 2)
      },
      set(value: number): void {
        value = generalUtils.boundValue(value, this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        textPropUtils.fontSizeHandler(value, false)
        // don't delete below, it's disabled temporarily only
        // textUtils.turnOffAutoRescaleMode()
      }
    }
  },
  methods: {
    progressStyles() {
      const finalFontSize = this.fontSize as number
      return {
        '--progress': (this.fontSize === '--') ? '50%' : `${(finalFontSize - 1) / (143) * 100}%`
      }
    },
    handleChangeStop() {
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-font-size {
  width: 100%;
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: 3fr 7fr;
  column-gap: 20px;
  align-items: center;

  &__range-input {
    margin: 0;
    --lower-color: #{setColor(black-5)};
    --upper-color: #{setColor(black-6)};
    @include progressSlider($height: 3px, $thumbSize: 16px, $marginTop: -7.5px);
    &::-webkit-slider-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
      position: relative;
    }
    &::-moz-range-thumb {
      box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
      position: relative;
    }
  }

  &__range-input-button {
    width: fit-content;
  }
}
</style>
