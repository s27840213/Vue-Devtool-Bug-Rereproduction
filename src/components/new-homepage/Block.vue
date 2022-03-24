<template lang="pug">
  div(class="block"
    :style="{ 'flex-direction': content.textRight ? 'row' : 'row-reverse' }")
    div(class="block-text")
      div(v-if="content.comingSoon"
        class="block-text__coming_soon overline-SM")
        span {{'COMING SOON'}}
      div(class="text-H2")
        span {{content.title}}
      div(class="body-XL")
        span {{content.description}}
      //- need v-if?
      div(v-if="content.link"
        class="text-H5")
        span {{content.link}}
    div(class="block-img")
      lottie-animation(
        :path="'@/assets/img/svg/newHomepage/' + content.img.name"
        :width="content.img.width"
        :height="content.img.height ? content.img.height : content.img.width")
    img(v-for="cb in content.colorBlock"
      class="block__colorBlock"
      :src="require('@/assets/img/svg/newHomepage/' + cb.name)"
      :style="{ 'top': `${cb.top}px`, 'left': `${cb.left}px` }")
</template>

<script lang="ts">
import Vue from 'vue'
// import i18n from '@/i18n'
import LottieAnimation from '@/components/LottieAnimation.vue'

export default Vue.extend({
  name: 'Block', // need rename
  components: {
    LottieAnimation
  },
  props: {
    content: {
      type: Object, // redefine
      required: true
    }
  },
  data() {
    return {
    }
  },
  computed: {
  },
  // async mounted() {
  // },
  methods: {
  }
})
</script>

<style lang="scss" scoped>
.block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  width: 1143.45px;
  height: 533.45px;
  &__colorBlock {
    position: absolute;
    z-index: -1;
  }
}
.block-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  // white-space: pre;
  &__coming_soon {
    padding: 4px;
    color: white;
    background: #FFBA49;
    border-radius: 4px;
  }
  div {
    margin: 10px;
  }
}
</style>
