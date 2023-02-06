<template lang="pug">
transition(name="fade-in-out")
  svg-icon(class="popup-icon"
          :iconName="iconName" iconColor="white" iconWidth="44px")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import popupUtils from '@/utils/popupUtils'

export default defineComponent({
  name: 'PopupIcon',
  props: {
    iconName: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      timeoutId: -1
    }
  },
  mounted() {
    this.timeoutId = setTimeout(() => {
      popupUtils.closePopup()
    }, 750)
  },
  updated() { // If another PopupIcon called, clear timer and create new one.
    clearTimeout(this.timeoutId)
    this.timeoutId = setTimeout(() => {
      popupUtils.closePopup()
    }, 750)
  }
})
</script>

<style lang="scss" scoped>
.popup-icon {
  position: absolute;
  padding: 18px;
  border-radius: 10px;
  background-color: rgba(white, 0.3);
  transform: translate(calc(50vw - 50%), calc(50vh - 50%));
  transition: all 0.25s;
}
</style>
