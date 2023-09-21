<template lang="pug">
div(class="popup-size"
  v-click-outside="closePopup")
  div(class="popup-size__close")
    svg-icon(class="pointer"
      iconName="page-close"
      iconWidth="10px"
      iconColor="gray-2"
      @click="closePopup()")
  div(class="popup-size__title label-mid")
    span {{$tc('NN0072', 2)}}
  PageSizeSelector(:isValidate="isConfirmClicked" defaultFormat="custom" ref="pageSizeSelector" @select="selectFormat")
</template>

<script lang="ts">
import PageSizeSelector from '@/components/new-design/PageSizeSelector.vue'
import { ILayout } from '@/interfaces/layout'
import vClickOutside from 'click-outside-vue3'
import { defineComponent } from 'vue'
import { mapState } from 'vuex'

export default defineComponent({
  components: {
    PageSizeSelector
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  emits: ['close'],
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
  padding: 24px;
  &__title {
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: setColor(gray-2);
    word-spacing: 0.255em;
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
