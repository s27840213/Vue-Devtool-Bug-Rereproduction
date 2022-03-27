<template lang="pug">
  div(class="header-bar")
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  components: {
  },
  props: {
  },
  data() {
    return {
    }
  }
})
</script>

<style lang="scss" scoped>
.header-bar {
  @include size(100%, 40px);
  background-color: setColor(nav);
}
</style>
