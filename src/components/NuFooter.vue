<template lang="pug">
  div(class="nu-footer text-white")
    div(class="nu-footer-feature label-lg")
      div 特色1
      div 特色2
      div 特色3
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-footer {
  width: 100%;
  height: 500px;
  background: #555;

  &-feature {
    display: grid;
    grid-template-columns: repeat(3, auto);
    padding: 100px 5vw;
  }
}
</style>
