<template lang="pug">
  div(class="popup-size"
    v-click-outside="closePopup")
    div(class="popup-size__close")
      svg-icon(class="pointer"
        iconName="page-close"
        iconWidth="10px"
        iconColor="gray-2"
        @click.native="closePopup()")
    div(class="popup-size__title label-mid mb-20")
      span {{$tc('NN0072', 2)}}
    PageSizeSelector(:isValidate="isConfirmClicked" defaultFormat="custom" ref="pageSizeSelector" @select="selectFormat")
    div(class="popup-size__body__button")
      button(class="btn-primary-sm rounded my-6 full-width pointer"
        @click="onConfirmClicked()")
        span {{$tc('NN0164', 2)}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import vClickOutside from 'v-click-outside'
import RadioBtn from '@/components/global/RadioBtn.vue'
import { ILayout } from '@/interfaces/layout'
import designUtils from '@/utils/designUtils'
import PageSizeSelector from '@/components/mydesign/PageSizeSelector.vue'

export default Vue.extend({
  components: {
    RadioBtn,
    PageSizeSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      selectedFormat: {} as ILayout,
      isConfirmClicked: false
    }
  },
  computed: {
    ...mapState('design', [
      'currLocation',
      'folders'
    ])
  },
  methods: {
    selectFormat(layout: ILayout) {
      this.selectedFormat = layout
    },
    closePopup() {
      this.$emit('close')
    },
    onConfirmClicked() {
      this.isConfirmClicked = true
      if (!(this.$refs.pageSizeSelector as any).isFormatApplicable) return // TODO: disable submit button
      const path = this.$route.name === 'MyDesign' ? this.currLocation.split('/').slice(1).join(',') : undefined
      const foldername = this.$route.name === 'MyDesign' ? designUtils.search(this.folders, designUtils.makePath(this.currLocation))?.name : undefined
      designUtils.newDesignWithLoginRedirect(this.selectedFormat.width, this.selectedFormat.height, undefined, path, foldername)
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-size {
  position: relative;
  width: 440px;
  height: 90%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  padding: 8px 67px 20px 67px;
  &__title {
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: setColor(gray-2);
    word-spacing: 0.255em;
  }
  &__body {
    &__button {
      height: 30px;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      width: 240px;
      padding-top: 20px;
      span{
        font-size: 12px;
        font-weight: 400;
        word-spacing: 1.21em;
        line-height: 18px;
      }
    }
  }
  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 11px;
    right: 13px;
    width: 20px;
    height: 20px;
  }
}

@media screen and (min-height: 768px) {
  .popup-size {
    height: 60%;
  }
}
</style>
