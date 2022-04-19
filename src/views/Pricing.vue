<template lang="pug">
  div(class="pricing")
    nu-header(v-header-border)
    div(class="pricing-content")
      nu-footer
</template>

<script lang="ts">
import Vue from 'vue'
import NuHeader from '@/components/NuHeader.vue'
import NuFooter from '@/components/NuFooter.vue'

export default Vue.extend({
  name: 'Pricing',
  components: {
    NuHeader,
    NuFooter
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
.pricing {
  height: 100%;
}

.pricing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: scroll;
  height: calc(100% - #{$header-height});
}
</style>
