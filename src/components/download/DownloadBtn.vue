<template lang="pug">
  div(class="download-btn")
    btn(:hasIcon="true"
      :iconName="'download'"
      :iconWidth="'18px'"
      :type="'primary-sm'"
      :disabled="inprogress"
      class="btn-download rounded full-height full-width"
      @click.native="() => handleShowPopup(true)")
      span(v-if="!inprogress") {{$t('NN0010')}}
    popup-download(v-if="show"
      class="download-btn__modal"
      :page-index="lastSelectedPageIndex"
      @close="handleShowPopup"
      @inprogress="handleInprogress")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import PopupDownload from '@/components/popup/PopupDownload.vue'
import modalUtils from '@/utils/modalUtils'

export default Vue.extend({
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
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      isLogin: 'user/isLogin'
    })
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
        modalUtils.setIsModalOpen(true)
        modalUtils.setModalInfo('請註冊/登入後才能下載', [])
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.download-btn {
  position: relative;
  width: 90px;
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
