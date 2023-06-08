<template lang="pug">
div(class="download-btn"
  v-hint="isHandlingShadow ? $t('NN0500') : ''")
  nubtn(theme="icon_text" icon="download"
      :disabled="inprogress || inBgRemoveMode || uploadingImgs.length !== 0 || isHandlingShadow || isFontLoading"
      @click="handleShowPopup(true)") {{$tc('NN0010', 2)}}
  popup-download(v-if="show"
    class="download-btn__modal"
    :page-index="currFocusPageIndex"
    @close="handleShowPopup"
    @inprogress="handleInprogress")
</template>

<script lang="ts">
import PopupDownload from '@/components/popup/PopupDownload.vue'
import { FunctionPanelType } from '@/store/types'
import modalUtils from '@/utils/modalUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    PopupDownload
  },
  data() {
    return {
      show: false,
      inprogress: false
    }
  },
  computed: {
    ...mapGetters({
      currFocusPageIndex: 'getCurrFocusPageIndex',
      isLogin: 'user/isLogin',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode',
      uploadingImgs: 'file/getUploadingImgs',
      isUploadShadowImg: 'shadow/isUploading',
      isProcessShadowImg: 'shadow/isProcessing',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType',
      isFontLoading: 'text/getIsFontLoading'
    }),
    isHandlingShadow(): boolean {
      return this.isUploadShadowImg || this.isProcessShadowImg || this.getCurrFunctionPanelType === FunctionPanelType.photoShadow
    }
  },
  methods: {
    handleInprogress(inprogress: boolean) {
      this.inprogress = inprogress
    },
    handleShowPopup(show: boolean) {
      if (this.isLogin) {
        this.show = show || false
        !show && (this.inprogress = false)
      } else {
        modalUtils.setModalInfo(this.$t('NN0323') as string, [])
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.download-btn {
  position: relative;
  // width: 90px;
  &__modal {
    position: absolute;
    top: 100%;
    margin-top: 12px;
    right: -50px;
    width: 210px;
    z-index: 1;
  }
}
</style>
