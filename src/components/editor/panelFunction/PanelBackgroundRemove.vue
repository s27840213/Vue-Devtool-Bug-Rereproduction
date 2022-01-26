<template lang="pug">
  div(class="panel-background-remove")
    div(class="panel-background-remove__grid mb-5")
      btn(v-for="btn in btns"
        class="full-width"
        :class="show === btn.show || (btn.name === 'crop' && isCropping) ? 'active' : ''"
        type="gray-mid"
        ref="btn"
        :key="btn.name"
        @click.native="handleShow(btn.show)") {{ btn.label }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'

export default Vue.extend({
  data() {
    return {
      show: '',
      btns: [
        { name: 'crop', label: `${this.$t('NN0040')}`, show: 'crop' },
        // { name: 'preset', label: `${this.$t('NN0041')}`, show: '' },
        { name: 'adjust', label: `${this.$t('NN0042')}`, show: 'popup-adjust' }
        // { name: 'remove-bg', label: `${this.$t('NN0043')}`, show: '' }
      ]
    }
  },
  components: {
    PopupAdjust
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      getLayer: 'getLayer',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedLayers: 'getCurrSelectedLayers'
    })
  }
})
</script>

<style lang="scss" scoped>
.panel-background-remove {
  position: relative;
  text-align: center;
  &__grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
    > button {
      border-radius: 4px;
      &.active {
        border: 2px solid setColor(blue-1);
        color: setColor(blue-1);
        padding: 8px 20px;
      }
    }
  }
}
</style>
