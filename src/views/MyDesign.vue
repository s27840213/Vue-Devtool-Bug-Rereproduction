<template lang="pug">
  div(class="my-design")
    my-design-mobile(v-if="isMobile > 0" :view="view")
    my-design-pc(v-if="isMobile < 0" :view="view")
</template>

<script lang="ts">
import Vue from 'vue'
import MyDesignPc from '@/components/mydesign/MyDesignPC.vue'
import MyDesignMobile from '@/components/mydesign/MyDesignMobile.vue'
import generalUtils from '@/utils/generalUtils'

export default Vue.extend({
  name: 'MyDesign',
  data() {
    return {
      isMobile: 0
    }
  },
  props: {
    view: String
  },
  components: {
    MyDesignPc,
    MyDesignMobile
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)

    this.handleResize()
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      this.isMobile = generalUtils.getWidth() <= 540 ? 1 : -1
    }
  }
})
</script>

<style lang="scss" scoped>
.my-design {
  @include size(100%, 100%);
  max-height: 100%;
}

.non-tab-show {
  @media screen and (min-width: 541px) {
    display: none;
  }
}

.non-mobile-show {
  @media screen and (max-width: 540px) {
    display: none;
  }
}
</style>
