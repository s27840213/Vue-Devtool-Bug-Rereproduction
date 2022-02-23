<template lang="pug">
  div(class="download-btn")
    btn(:hasIcon="true"
      :iconName="'download'"
      :iconWidth="'18px'"
      :type="'primary-sm'"
      :disabled="inprogress || inBgRemoveMode"
      class="btn-download rounded full-height full-width"
      @click.native="() => handleShowPopup(true)")
      span(v-if="!inprogress") {{$t('NN0010')}}
    popup-download(v-if="show"
      class="download-btn__modal"
      :page-index="middlemostPageIndex"
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
      middlemostPageIndex: 'getMiddlemostPageIndex',
      isLogin: 'user/isLogin',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode'
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
        modalUtils.setModalInfo(this.$t('NN0323') as string, [], '')
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
