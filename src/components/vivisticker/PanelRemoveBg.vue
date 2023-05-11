<template lang="pug">
div(class="panel-remove-bg" ref="panelRemoveBg")
  div(v-if="inBgRemoveMode || isProcessing" class="panel-remove-bg__rm-section")
    div(v-if="isProcessing" class="panel-remove-bg__preview-section")
      img(:src="previewImage.src")
      div(class="gray-mask")
      img(class="loading" :src="require('@/assets/img/gif/gray-loading.gif')")
    bg-remove-area(v-else :editorViewCanvas="panelRemoveBg"
      :inVivisticker="true"
      :fitScaleRatio="scaleRatio")
  nubtn(v-else theme="primary" size="mid-center" @click="removeBg") {{ $t('NN0043') }}
</template>

<script lang="ts">
import BgRemoveArea from '@/components/editor/backgroundRemove/BgRemoveArea.vue'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import uploadUtils from '@/utils/uploadUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  components: {
    BgRemoveArea
  },
  data() {
    return {
      panelRemoveBg: null as unknown as HTMLElement,
      mobilePanelHeight: 0
    }
  },
  mounted() {
    this.panelRemoveBg = this.$refs.panelRemoveBg as HTMLElement
  },
  unmounted() {
    bgRemoveUtils.setInBgRemoveMode(false)
  },
  computed: {
    ...mapGetters({
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      isProcessing: 'bgRemove/getIsProcessing',
      autoRemoveResult: 'bgRemove/getAutoRemoveResult',
      previewImage: 'bgRemove/getPreviewImage',
      showMobilePanel: 'mobileEditor/getShowMobilePanel',
    }),
    containerWH() {
      return {
        width: this.panelRemoveBg ? this.panelRemoveBg.offsetWidth : 0,
        height: this.panelRemoveBg ? this.panelRemoveBg.offsetHeight : 0,
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    scaleRatio() {
      const { width, height } = this.containerWH
      const { width: imgWidth, height: imgHeight } = this.previewImage
      const ratio = Math.min(width / imgWidth, height / imgHeight)
      return ratio * 0.9
    },
    alignPos(): string {
      return this.inBgRemoveMode || this.isProcessing ? 'flex-start' : 'center'
    }
  },
  methods: {
    removeBg() {
      uploadUtils.chooseAssets('stk-bg-remove')
    }
  },
  watch: {
    inBgRemoveMode(val) {
      if (val) {
        this.$nextTick(() => {
          this.$emit('setBgRemoveMode', false)
        })
      }
    },
    showMobilePanel(val) {
      if (val) {
        this.$nextTick(() => {
          this.mobilePanelHeight = document.querySelector('.mobile-panel')?.clientHeight || 0
          console.log(this.mobilePanelHeight)
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-remove-bg {
  width: 100%;
  height: 100%;
  max-height: 100%;
  display: flex;
  align-items: v-bind(alignPos);

  justify-content: center;

  &__rm-section {
    width: 100%;
    height: calc(100% - v-bind(mobilePanelHeight)* 1px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__preview-section {
    transform: scale(v-bind(scaleRatio));
  }
}

.gray-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.2);
  z-index: 1;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
