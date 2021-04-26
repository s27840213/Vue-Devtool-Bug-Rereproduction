<template lang="pug">
  div(id="app" @mousemove="coordinateHandler($event)")
    div(class="coordinate" ref="coordinate")
      div(class="coordinate__val coordinate__width")
        span {{coordinateWidth}}px
      div(class="coordinate__val coordinate__height")
        span {{coordinateHeight}}px
    router-view
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  data() {
    return {
      coordinate: null as unknown as HTMLElement,
      coordinateWidth: 0,
      coordinateHeight: 0
    }
  },
  mounted() {
    this.coordinate = this.$refs.coordinate as HTMLElement
  },
  computed: {
    ...mapGetters({
      getLastSelectedPageIndex: 'getLastSelectedPageIndex'
    })
  },
  methods: {
    coordinateHandler(e: MouseEvent) {
      this.coordinateWidth = e.clientX
      this.coordinateHeight = e.clientY
      this.coordinate.style.width = `${this.coordinateWidth}px`
      this.coordinate.style.height = `${this.coordinateHeight}px`
    }
  }
})
</script>
<style lang="scss">
#app {
  @include size(100%, 100%);
  max-height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  overflow: hidden;
  user-select: none;
}

// Debug used class, won't be released in production
.coordinate {
  border-right: 1px solid red;
  border-bottom: 1px solid red;
  opacity: 0.5;
  box-sizing: border-box;
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  &__val {
    position: absolute;
    color: red;
  }

  &__width {
    top: 50%;
    right: 5px;
    transform: translate(0, -50%);
  }
  &__height {
    bottom: 5px;
    left: 50%;
    transform: translate(-50%, 0);
  }
}
</style>
