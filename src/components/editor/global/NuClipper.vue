<template lang="pug">
  div(class="nu-clipper")
    slot
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    config: Object,
    index: Number
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  overflow: hidden;
}
</style>
