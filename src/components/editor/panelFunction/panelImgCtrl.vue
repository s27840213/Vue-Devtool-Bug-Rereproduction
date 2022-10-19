<template lang="pug">
  div(class="panel-group mb-10")
    span(class="text-blue-1 subtitle-1") {{$t('NN0416') + $t('NN0036')}}
    div(class="panel-group__adjust")
      btn(class="btn-align full-width" :type="'gray-mid'"
        @click.native="handleCancel") {{$t('NN0203')}}
      btn(class="btn-flip full-width" :type="'primary-mid'"
        @click.native="handleFinish") {{$tc('NN0133', 1)}}
</template>

<script lang="ts">
import { LayerType } from '@/store/types'
import frameUtils from '@/utils/frameUtils'
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapMutations } from 'vuex'

export default Vue.extend({
  computed: {
  },
  methods: {
    ...mapMutations({ setImgConfig: 'imgControl/SET_CONFIG' }),
    handleCancel() {
      this.setImgConfig('reset')
      this.handleFinish()
    },
    handleFinish() {
      const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
      switch (currLayer.type) {
        case LayerType.image:
        case LayerType.group:
          layerUtils.updateLayerProps(pageIndex, layerIndex, { imgControl: false }, subLayerIdx)
          break
        case LayerType.frame:
          frameUtils.updateFrameLayerProps(pageIndex, layerIndex, subLayerIdx, { imgControl: false })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-group {
  display: flex;
  flex-direction: column;
  > div {
    margin-top: 15px;
    &:nth-child(1) {
      margin-top: 0px;
    }
  }

  &__adjust {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 1fr;
    row-gap: 10px;
    column-gap: 20px;
  }
}
</style>
