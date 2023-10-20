<template lang="pug">
Transition(name="fade")
  div(v-if="loadingOverlay.show" class="loading-overlay text-H6 text-white")
    div(class="loading-overlay__spinner")
      svg-icon(class="spinner" iconName="spiner" iconWidth="24px")
    div(v-for="(msg, idx) in loadingOverlay.msgs" :key="idx") {{ msg }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  computed: {
    ...mapGetters({
      loadingOverlay: 'vivisticker/getLoadingOverlay',
    })
  }
})
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  row-gap: 10px;
  z-index: setZindex(popup);
  &__spinner {
    @include size(120px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(46, 46, 46, 0.5);
    border-radius: 10px;
    .spinner {
      color: #D9D9D9;
      animation: rotate 0.5s infinite linear;
    }
  }
  &::before {
    content: "";
    @include size(100vw, 100vh);
    z-index: -1;
    position: absolute;
    background-color: rgba(24, 25, 31, 0.8);
  }
}

.fade {
  &-enter-active,
  &-leave-active {
    transition: 0.2s;
  }
  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
