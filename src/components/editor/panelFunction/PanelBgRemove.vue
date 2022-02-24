<template lang="pug">
  div(class="panel-background-remove")
    div(class="panel-background-remove__grid mb-5")
      btn( class="full-width"
        :type="clearMode ? 'gray-active-mid' :'gray-mid'"
        ref="btn"
        :hasIcon="true"
        :iconName="'clear'"
        :iconMargin="8"
        @click.native="setClearMode(true)") {{ $t('NN0385') }}
      btn(class="full-width"
        :type="clearMode ? 'gray-mid' :'gray-active-mid'"
        ref="btn"
        :hasIcon="true"
        :iconName="'preserve'"
        :iconMargin="8"
        @click.native="setClearMode(false)") {{ $t('NN0386') }}
      div(class="panel-background-remove__slider full")
        div(class="text-left")
          span(class="label-mid") {{ $t('NN0387') }}
        div(class="flex")
          input(class="input__slider--range"
            v-model.number="brushSize"
            :max="maxBrushSize"
            :min="minBrushSize"
            type="range")
          input(class="input__slider--text body-2 text-gray-2"
            type="number"
            v-model.number="brushSize")
      div(class="full flex items-center")
        svg-icon(class="mr-5"
          :iconColor="showInitImage ? 'blue-1' : 'light-gray'"
          :iconName="showInitImage ? 'checkbox-checked' : 'checkbox'"
          :iconWidth="'16px'"
          @click.native="toggleShowInitImage(showInitImage)")
        span(class="label-mid") {{$t('NN0388')}}
      btn(class="btn-recover full-width"
        type="gray-mid"
        ref="btn"
        @click.native="restoreInitState()") {{$t('NN0389')}}
      btn( class="full-width"
        type="gray-mid"
        ref="btn"
        @click.native="cancel()") {{ $t('NN0203') }}
      btn( class="full-width"
        type="primary-mid"
        ref="btn"
        @click.native="save()") {{ $tc('NN0133',1) }}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import PopupAdjust from '@/components/popup/PopupAdjust.vue'
import store from '@/store'
import layerUtils from '@/utils/layerUtils'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IImage } from '@/interfaces/layer'
import { IBgRemoveInfo } from '@/interfaces/image'
import uploadUtils from '@/utils/uploadUtils'
import { IUploadAssetResponse } from '@/interfaces/upload'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  data() {
    return {
      minBrushSize: 1,
      maxBrushSize: 300
    }
  },
  components: {
    PopupAdjust
  },
  computed: {
    ...mapGetters({
      clearMode: 'bgRemove/getClearMode',
      showInitImage: 'bgRemove/getShowInitImage',
      canvas: 'bgRemove/getCanvas',
      modifiedFlag: 'bgRemove/getModifiedFlag',
      currSelectedInfo: 'getCurrSelectedInfo',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      isAdmin: 'user/isAdmin',
      prevPageScaleRatio: 'bgRemove/getPrevPageScaleRatio'
    }),
    brushSize: {
      get: () => {
        return store.getters['bgRemove/getBrushSize']
      },
      set(val: number): void {
        this.setBrushSize(val)
      }
    }
  },
  methods: {
    ...mapMutations({
      setPageScaleRatio: 'SET_pageScaleRatio',
      setInBgRemoveMode: 'bgRemove/SET_inBgRemoveMode',
      setBrushSize: 'bgRemove/SET_brushSize',
      setRestoreInitState: 'bgRemove/SET_restoreInitState',
      setClearMode: 'bgRemove/SET_clearMode',
      setShowInitImage: 'bgRemove/SET_showInitImage',
      setLoading: 'bgRemove/SET_loading'
    }),
    toggleShowInitImage(val: boolean): void {
      this.setShowInitImage(!val)
    },
    restoreInitState() {
      this.setRestoreInitState(true)
    },
    save() {
      const { index, pageIndex, layers } = this.currSelectedInfo as ICurrSelectedInfo
      if (!this.modifiedFlag) {
        layerUtils.updateLayerProps(pageIndex, index, {
          srcObj: {
            type: this.isAdmin ? 'public' : 'private',
            userId: (this.autoRemoveResult as IBgRemoveInfo).teamId,
            assetId: this.isAdmin ? (this.autoRemoveResult as IBgRemoveInfo).id : (this.autoRemoveResult as IBgRemoveInfo).assetIndex
          },
          trace: 1
        })
        this.setInBgRemoveMode(false)
        this.setPageScaleRatio(this.prevPageScaleRatio)
        stepsUtils.record()
      } else {
        this.setLoading(true)
        uploadUtils.uploadAsset('image', [this.canvas.toDataURL('image/png;base64')], false, (json: IUploadAssetResponse) => {
          layerUtils.updateLayerProps(pageIndex, index, {
            srcObj: {
              type: this.isAdmin ? 'public' : 'private',
              userId: (this.autoRemoveResult as IBgRemoveInfo).teamId,
              assetId: this.isAdmin ? json.data.id : json.data.asset_index
            },
            trace: 1
          })
          this.setLoading(false)
          this.setInBgRemoveMode(false)
          this.setPageScaleRatio(this.prevPageScaleRatio)
          stepsUtils.record()
        })
      }
    },
    cancel() {
      this.setInBgRemoveMode(false)
      this.setPageScaleRatio(this.prevPageScaleRatio)
    }
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
      &.active {
        border: 2px solid setColor(blue-1);
        color: setColor(blue-1);
        padding: 8px 20px;
      }
    }
  }

  &__slider {
    font-size: 14px;
    font-weight: bold;
    > div:nth-child(2) {
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: 0.75fr 0.25fr;
      column-gap: 25px;
    }
  }
}

.full {
  grid-column: 1 / 3;
}

.btn-recover {
  grid-column: 1 / 3;
}
</style>
