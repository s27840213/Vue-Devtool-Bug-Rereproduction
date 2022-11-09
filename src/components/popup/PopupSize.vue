<template lang="pug">
  div(class="popup-size"
    v-click-outside="closePopup")
    div(class="popup-size__close")
      svg-icon(class="pointer"
        iconName="page-close"
        iconWidth="10px"
        iconColor="gray-0"
        @click.native="closePopup()")
    div(class="label-mid pb-20 text-center") {{$t('NN0072')}}
    PageSizeSelector(:isValidate="isConfirmClicked" defaultFormat="custom" ref="pageSizeSelector" @select="selectFormat")
    div(class="popup-size__body__button")
      btn(:type="'primary-sm'"
        class="rounded my-5 full-width pointer"
        @click.native="onConfirmClicked()") {{$tc('NN0164', 2)}}
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
  height: 466px;
  width: 440px;
  max-height: 90vh;
  display: grid;
  grid-template-columns: 1fr;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0px 4px 13px rgba(0, 0, 0, 0.25);
  background-color: setColor(white);
  padding: 20px 50px;
  &__body {
    &__button {
      margin: 0 auto;
      width: 60%;
      padding-top: 30px;
      font-family: 'SF Pro';
      font-weight: 400;
    }
  }
  &__close {
    position: absolute;
    top: 20px;
    right: 20px;
  }
}
</style>
