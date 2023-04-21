<template lang="pug">
div(class="panel-spacing")
  mobile-slider(:title="`${$t('NN0109')}`"
    :borderTouchArea="true"
    :value="fontSpacing"
    :min="fieldRange.fontSpacing.min"
    :max="fieldRange.fontSpacing.max"
    :step="1"
    name="fs"
    @update="updateValue")
  mobile-slider(:title="`${$t('NN0110')}`"
    :borderTouchArea="true"
    :value="lineHeight"
    :min="fieldRange.lineHeight.min"
    :max="fieldRange.lineHeight.max"
    :step="0.01"
    name="lh"
    @update="updateValue")
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import textUtils from '@/utils/textUtils'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    MobileSlider
  },
  data() {
    return {
      fieldRange: {
        lineHeight: { min: 0.5, max: 2.5 },
        fontSpacing: { min: -200, max: 800 },
      }
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    lineHeight(): number {
      return this.props.lineHeight === '--' ? this.props.lineHeight : parseFloat(this.props.lineHeight)
    },
    fontSpacing(): number {
      return this.props.fontSpacing === '--' ? this.props.fontSpacing : parseFloat(this.props.fontSpacing)
    }
  },
  methods: {
    updateValue(val: number, name: 'fs' | 'lh') {
      this.setParagraphProp(name === 'fs' ? 'fontSpacing' : 'lineHeight', val)
    },
    setParagraphProp(prop: 'lineHeight' | 'fontSpacing', value: number) {
      textUtils.setParagraphProp(prop, value)
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-spacing {
  width: 100%;
}
</style>
