<template lang="pug">
  div(class="brand-kit-tab-text")
    span text
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandTextStyleSetting } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    textStyleSetting(): IBrandTextStyleSetting {
      return (this.currentBrand as IBrand).textStyleSetting
    }
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-text {
}
</style>
