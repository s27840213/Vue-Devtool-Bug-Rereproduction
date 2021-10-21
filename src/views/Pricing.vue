<template lang="pug">
  div(class="pricing")
    nu-header
    div(class="pricing-content")
      img(class="pointer"
        @click="goToPage('Editor')"
        :src="require('@/assets/img/png/pricing/header.png')")
      img(class="pricing-case pointer"
        @click="goToPage('Editor')"
        :src="require('@/assets/img/png/pricing/content.png')")
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
    goToPage(pageName: string) {
      this.$router.push({ name: pageName })
    }
  }
})
</script>

<style lang="scss" scoped>
.pricing {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;

  &-case {
    padding: 100px 12vw 10vw 12vw;
  }
}
.pricing-content {
  display: flex;
  flex-direction: column;
  padding-bottom: 100px;
}
</style>
