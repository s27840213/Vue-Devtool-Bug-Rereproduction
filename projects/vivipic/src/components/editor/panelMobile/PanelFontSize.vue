<template lang="pug">
div(class="panel-font-size")
  font-size-selector
  input(class="panel-font-size__range-input input__slider--range"
    v-progress
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
      fieldRange: {
        fontSize: { min: 1, max: 144 },
      }
    }
  },
  computed: {
    ...mapGetters({
      layerIndex: 'getCurrSelectedIndex'
    }),
    ...mapState('text', ['sel', 'props']),
    fontSize: {
      get(): number | string {
        return this.props.fontSize === '--' ? this.props.fontSize : _.round(this.props.fontSize, 2)
      },
      set(value: number): void {
        value = generalUtils.boundValue(value, this.fieldRange.fontSize.min, this.fieldRange.fontSize.max)
        textPropUtils.fontSizeHandler(value, false)
      }
    }
  },
  methods: {
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

  &__range-input-button {
    width: fit-content;
  }
}
</style>
