<template lang="pug">
  div(class="brand-kit-tab-logo")
    div(class="brand-kit-tab-logo__item pointer")
      svg-icon(iconName="plus-origin"
              iconWidth="26.67px"
              iconColor="gray-2")
    div(v-for="logo in logos" class="brand-kit-tab-logo__item")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'
import brandkitUtils from '@/utils/brandkitUtils'
import { IBrand, IBrandLogo } from '@/interfaces/brandkit'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters('brandkit', {
      currentBrand: 'getCurrentBrand'
    }),
    logos(): IBrandLogo[] {
      return (this.currentBrand as IBrand).logos
    }
  },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.brand-kit-tab-logo {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  &__item {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid setColor(gray-4);
    box-sizing: border-box;
    border-radius: 4px;
    &:hover {
      background-color: setColor(gray-5);
      border: 1px solid setColor(gray-5);
    }
  }
}
</style>
