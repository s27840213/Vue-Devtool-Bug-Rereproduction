<template lang="pug">
  div(class="block"
    :style="blockStyle")
    div(class="block-text"
      :style="blockTextStyle")
      div(v-if="content.comingSoon"
        class="block-text__coming_soon overline-SM")
        span {{'COMING SOON'}}
      div(class="block-text__title text-H2")
        span {{content.title}}
        img(v-for="cb in content.colorBlock"
          v-if="!cb.ref"
          class="block__colorBlock"
          :src="require('@/assets/img/svg/newHomepage/' + cb.name)"
          :style="{ 'top': `${cb.top}px`, 'left': `${cb.left}px` }")
      div(class="block-text__description body-XL")
        span {{content.description}}
      //- need v-if?
      div(v-if="content.link"
        class="block-text__link text-H5")
        router-link(:to="content.link.to")
          span {{content.link.text}}
    div(class="block-img")
      animation(
        :path="'@/assets/img/svg/newHomepage/' + content.img.name"
        :width="content.img.width"
        :height="content.img.height ? content.img.height : content.img.width")
      img(v-for="cb in content.colorBlock"
        v-if="cb.ref==='img'"
        class="block__colorBlock"
        :src="require('@/assets/img/svg/newHomepage/' + cb.name)"
        :style="{ 'top': `${cb.top}px`, 'left': `${cb.left}px` }")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
// import i18n from '@/i18n'
import Animation from '@/components/Animation.vue'

export default Vue.extend({
  name: 'Block', // need rename
  components: {
    Animation
  },
  props: {
    content: {
      type: Object, // redefine a interface
      required: true
    }
  },
  computed: {
    ...mapState({
      isMobile: 'isMobile'
    }),
    blockStyle(): Record<string, string> {
      return {
        'flex-direction': this.isMobile ? 'column' : this.content.align
      }
    },
    blockTextStyle(): Record<string, string> {
      return {
        'align-items': this.content.align === 'column' ? 'center' : 'flex-start',
        'text-align': this.content.align === 'column' ? 'center' : 'left'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 1200px;
  min-height: 500px;
  margin: 100px 0 100px;
  &__colorBlock {
    position: absolute;
    z-index: -1;
  }
}
.block-text {
  display: flex;
  flex-direction: column;
  &__coming_soon {
    padding: 4px;
    color: white;
    background: #FFBA49;
    border-radius: 4px;
  }
  &__title {
    position: relative;
  }
  &__link {
    a {
      color: setColor(blue-1);
      text-decoration: none;
    }
  }
  div {
    margin: 10px;
  }
}
.block-img {
  position: relative;
}
</style>
