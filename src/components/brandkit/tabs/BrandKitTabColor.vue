<template lang="pug">
  div(class="brand-kit-tab-color")
    span color
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandColorPalette } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    logos(): IBrandColorPalette[] {
      return (this.currentBrand as IBrand).colorPalettes
    }
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-color {
}
</style>
