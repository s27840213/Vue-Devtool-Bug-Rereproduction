<template lang="pug">
div(class="btn-new-design")
  slot(:openPopup="openPopup")
    button(class="btn-primary-sm pointer" @click="openPopup()")
      span(class="header-sort") {{$tc('NN0072')}}
  div(v-if="isMobile < 0 && isShowPopup"
    class="popup-window")
    popup-size(@close="closePopup()")
  transition(name="panel-up")
    panel-size(v-if="isMobile > 0 && isShowPopup" @close="closePopup()")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PopupSize from '@/components/new-design/PopupSize.vue'
import PanelSize from '@/components/new-design/PanelSize.vue'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  components: {
    PopupSize,
    PanelSize
  },
  data() {
    return {
      isMobile: 0,
      isShowPopup: false
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)

    this.handleResize()
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      this.isMobile = generalUtils.getWidth() <= 540 ? 1 : -1
    },
    openPopup() {
      this.isShowPopup = true
    },
    closePopup() {
      this.isShowPopup = false
    }
  }
})
</script>

<style lang="scss" scoped>
.btn-primary-sm {
  height: 100%;
  width: 100%;
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
}
</style>
