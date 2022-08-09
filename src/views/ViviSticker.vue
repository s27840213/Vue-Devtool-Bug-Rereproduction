<template lang="pug">
  div(class="vivisticker")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  components: {
  },
  data() {
    return {
    }
  },
  computed: {
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.panel-brand {
  @include size(100%, 100%);
  overflow: hidden;
}

.dim-background {
  @include size(100%, 100%);
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}
</style>
