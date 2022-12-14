<template lang="pug">
div(class="download-btn"
  v-hint="isHandlingShadow ? $t('NN0500') : ''")
  btn(:hasIcon="true"
    :iconName="'download'"
    :iconWidth="'18px'"
    :type="'primary-sm'"
    :disabled="inprogress || inBgRemoveMode || uploadingImgs.length !== 0 || isHandlingShadow || isFontLoading"
    class="btn-download rounded full-height full-width"
    @click="() => handleShowPopup(true)")
    span(v-if="!inprogress") {{$t('NN0010')}}
  popup-download(v-if="show"
    class="download-btn__modal"
    :page-index="currFocusPageIndex"
    @close="handleShowPopup"
    @inprogress="handleInprogress")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import PopupDownload from '@/components/popup/PopupDownload.vue'
import modalUtils from '@/utils/modalUtils'
import { FunctionPanelType } from '@/store/types'

export default defineComponent({
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
  > button {
    padding: 6px 20px;
  }
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
