<template lang="pug">
 div(class="canvas-view")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations } from 'vuex'

export default Vue.extend({
  data() {
    return {
    }
  },
  methods: {
    ...mapMutations({
      SET_currPanelType: 'editor/SET_currPanelType'
    }),
    setPanelType(type: number) {
      this.SET_currPanelType(type)
    }
  }
})
</script>

<style lang="scss" scoped>
.canvas-view {
  @include size(100%, 100%);
  @include flexCenter;
  position: relative;
}

.test-nav {
  display: flex;
  position: absolute;
  top: 10px;
  left: 10px;
  > div {
    margin: 0px 5px;
    border: 1px solid setColor(gray-3);
    padding: 5px 10px;
    border-radius: 25px;
    cursor: pointer;
  }
}
</style>
