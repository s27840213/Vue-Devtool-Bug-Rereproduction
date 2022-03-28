<template lang="pug">
  div(class="mobile-panel")
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
.mobile-panel {
  height: 100%;
  background-color: setColor(nav);
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  // box-shadow: 2px 0px 5px setColor(gray-4);
  z-index: setZindex(mobile-panel);
  -webkit-tap-highlight-color: transparent;
}
</style>
