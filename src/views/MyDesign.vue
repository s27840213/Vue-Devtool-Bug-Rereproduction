<template lang="pug">
div(class="my-design")
  my-design-mobile(v-if="isMobile > 0" :view="view")
  my-design-pc(v-if="isMobile < 0" :view="view")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MyDesignPc from '@/components/mydesign/MyDesignPC.vue'
import MyDesignMobile from '@/components/mydesign/MyDesignMobile.vue'

export default defineComponent({
  name: 'MyDesign',
  data() {
    return {
      isMobile: 0
    }
  },
  props: {
    view: {
      type: String,
      required: true
    }
  },
  components: {
    MyDesignPc,
    MyDesignMobile
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)

    this.handleResize()
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      this.isMobile = window.matchMedia('screen and (max-width: 540px)').matches ? 1 : -1
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
