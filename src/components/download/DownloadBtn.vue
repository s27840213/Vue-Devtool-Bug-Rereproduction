<template lang="pug">
  div(class="download-btn")
    btn(:hasIcon="true"
      :iconName="'download'"
      :iconWidth="'18px'"
      :type="'primary-sm'"
      :disabled="inprogress"
      class="btn-download rounded full-height full-width"
      @click.native="() => handleShowPopup(true)")
      span(v-if="!inprogress"
        class="ml-20") 下 載
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
      lastSelectedPageIndex: 'getLastSelectedPageIndex'
    })
  },
  methods: {
    handleInprogress (inprogress: boolean) {
      this.inprogress = inprogress
    },
    handleShowPopup (show: boolean) {
      this.show = show || false
      !show && (this.inprogress = false)
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
      right: 0;
      width: 210px;
    }
  }
</style>
