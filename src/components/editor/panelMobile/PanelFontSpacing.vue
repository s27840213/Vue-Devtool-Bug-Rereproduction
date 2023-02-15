<template lang="pug">
div(class="panel-spacing")
  mobile-slider(class="panel-spacing__field"
    :title="`${$t('NN0109')}`"
    :borderTouchArea="true"
    :value="fontSpacing"
    :min="fieldRange.fontSpacing.min"
    :max="fieldRange.fontSpacing.max"
    :step="1"
    :propKey="'fs'"
    @update:fs="updateFontSpacing")
  mobile-slider(class="panel-spacing__field"
    :title="`${$t('NN0110')}`"
    :borderTouchArea="true"
    :value="lineHeight"
    :min="fieldRange.lineHeight.min"
    :max="fieldRange.lineHeight.max"
    :step="0.01"
    :propKey="'lh'"
    @update:lh="updateLineHeight")
</template>

<script lang="ts">
import Vue from 'vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import layerUtils from '@/utils/layerUtils'
import { mapState } from 'vuex'
import textUtils from '@/utils/textUtils'
import generalUtils from '@/utils/generalUtils'
export default Vue.extend({
  components: {
    MobileSlider
  },
  data() {
    return {
      fieldRange: {
        fontSize: { min: 6, max: 800 },
        lineHeight: { min: 0.5, max: 2.5 },
        fontSpacing: { min: -200, max: 800 },
        opacity: { min: 0, max: 100 }
      }
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    opacity(): number {
      return layerUtils.getCurrOpacity
    },
    lineHeight(): number {
      return this.props.lineHeight === '--' ? this.props.lineHeight : parseFloat(this.props.lineHeight)
    },
    fontSpacing(): number {
      return this.props.fontSpacing === '--' ? this.props.fontSpacing : parseFloat(this.props.fontSpacing)
    }
  },
  methods: {
    updateLineHeight(val: number) {
      this.setParagraphProp('lineHeight', val)
    },
    updateFontSpacing(val: number) {
      this.setParagraphProp('fontSpacing', val)
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
