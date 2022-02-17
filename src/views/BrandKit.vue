<template lang="pug">
  div(class="brand-kit scrollbar-gray")
    nu-header
    div(class="brand-kit__main")
      div(class="brand-kit__header")
      div(class="brand-kit__tab")
      div(class="brand-kit__content")
    nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'

export default Vue.extend({
  name: 'BrandKit',
  components: {
    NuHeader,
    NuFooter
  },
  data() {
    return {
    }
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.brand-kit {
  @include size(100%, 100%);
  overflow-y: auto;
  &__main {
    height: calc(100vh - #{$header-height});
  }
}
</style>
